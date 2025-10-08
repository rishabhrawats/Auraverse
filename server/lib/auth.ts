import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-session-secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// JWT token generation and validation
export function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid token' });
  }

  // Verify user still exists
  const user = await storage.getUser(decoded.userId);
  if (!user) {
    return res.status(403).json({ message: 'User not found' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role || 'FOUNDER'
  };

  next();
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await storage.getUser(decoded.userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'FOUNDER'
        };
      }
    }
  }

  next();
}

// Check subscription tier
export async function requireSubscription(tier: 'STARTER' | 'PRO') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const subscription = await storage.getUserSubscription(req.user.id);
    
    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(402).json({ 
        message: 'Active subscription required',
        requiredTier: tier 
      });
    }

    // PRO tier check
    if (tier === 'PRO' && subscription.planType === 'STARTER_5') {
      return res.status(402).json({ 
        message: 'Pro subscription required',
        currentTier: 'STARTER',
        requiredTier: 'PRO'
      });
    }

    next();
  };
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const current = rateLimitMap.get(key);
    
    if (!current || now > current.resetTime) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (current.count >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
    
    current.count++;
    next();
  };
}
