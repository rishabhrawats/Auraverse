import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import type { Express } from 'express';
import { storage } from '../storage';
import { generateToken } from './auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const BASE_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : 'http://localhost:5000';

export function setupOAuth(app: Express) {
  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/google/callback`,
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Check if user exists
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Create new user
          user = await storage.createUser({
            email,
            passwordHash: '', // OAuth users don't have password
            name: profile.displayName || email.split('@')[0],
            role: 'FOUNDER'
          });
        }

        done(null, { user, token: generateToken(user.id, user.email, user.role || 'FOUNDER') });
      } catch (error) {
        done(error as Error);
      }
    }));
  }

  // LinkedIn OAuth Strategy
  if (LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy({
      clientID: LINKEDIN_CLIENT_ID,
      clientSecret: LINKEDIN_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/linkedin/callback`,
      scope: ['r_emailaddress', 'r_liteprofile']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in LinkedIn profile'));
        }

        // Check if user exists
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Create new user
          user = await storage.createUser({
            email,
            passwordHash: '', // OAuth users don't have password
            name: profile.displayName || email.split('@')[0],
            role: 'FOUNDER'
          });
        }

        done(null, { user, token: generateToken(user.id, user.email, user.role || 'FOUNDER') });
      } catch (error) {
        done(error as Error);
      }
    }));
  }

  // Google OAuth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { session: false })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/signup?error=oauth_failed' }),
    (req: any, res) => {
      const { user, token } = req.user;
      // Redirect to frontend with token
      res.redirect(`/signup?token=${token}&oauth=success`);
    }
  );

  // LinkedIn OAuth routes
  app.get('/api/auth/linkedin',
    passport.authenticate('linkedin', { session: false })
  );

  app.get('/api/auth/linkedin/callback',
    passport.authenticate('linkedin', { session: false, failureRedirect: '/signup?error=oauth_failed' }),
    (req: any, res) => {
      const { user, token } = req.user;
      // Redirect to frontend with token
      res.redirect(`/signup?token=${token}&oauth=success`);
    }
  );
}
