// Firebase Authentication Middleware
// Verifies Firebase ID tokens for protected API routes

import { Request, Response, NextFunction } from "express";
import { verifyIdToken, getFirebaseUser } from "./firebase-admin";

// Extend Express Request to include Firebase user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        uid: string;
        email: string;
        name?: string;
        picture?: string;
        emailVerified: boolean;
      };
    }
  }
}

// Middleware to require Firebase authentication
export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }
    
    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    
    // Get additional user info
    const firebaseUser = await getFirebaseUser(decodedToken.uid);
    
    // Attach user info to request
    req.user = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email || firebaseUser.email || '',
      name: decodedToken.name || firebaseUser.displayName || undefined,
      picture: decodedToken.picture || firebaseUser.photoURL || undefined,
      emailVerified: decodedToken.email_verified || firebaseUser.emailVerified || false
    };
    
    next();
  } catch (error: any) {
    console.error('Firebase auth error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked', code: 'TOKEN_REVOKED' });
    }
    
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Optional authentication - doesn't fail if no token, just doesn't attach user
export async function optionalFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return next();
    }
    
    const decodedToken = await verifyIdToken(idToken);
    const firebaseUser = await getFirebaseUser(decodedToken.uid);
    
    req.user = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email || firebaseUser.email || '',
      name: decodedToken.name || firebaseUser.displayName || undefined,
      picture: decodedToken.picture || firebaseUser.photoURL || undefined,
      emailVerified: decodedToken.email_verified || firebaseUser.emailVerified || false
    };
    
    next();
  } catch (error) {
    // Silently continue without user for optional auth
    next();
  }
}
