// Firebase Authentication Service
// Handles all authentication using Firebase Auth

import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  logOut, 
  onAuthChange,
  getIdToken,
  User as FirebaseUser 
} from './firebase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'FOUNDER' | 'THERAPIST' | 'ADMIN';
  emailVerified?: boolean;
  photoURL?: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private firebaseUser: FirebaseUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];
  private initPromise: Promise<void>;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.initPromise = new Promise((resolve) => {
      this.unsubscribe = onAuthChange(async (firebaseUser) => {
        if (firebaseUser) {
          this.firebaseUser = firebaseUser;
          this.currentUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'FOUNDER',
            emailVerified: firebaseUser.emailVerified,
            photoURL: firebaseUser.photoURL || undefined
          };
          
          // Sync with backend
          try {
            await this.syncWithBackend();
          } catch (error) {
            console.error('Failed to sync with backend:', error);
          }
        } else {
          this.firebaseUser = null;
          this.currentUser = null;
        }
        
        this.notifyListeners();
        resolve();
      });
    });
  }

  private async syncWithBackend() {
    const token = await getIdToken();
    if (!token) return;

    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: this.currentUser?.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && this.currentUser) {
          this.currentUser.role = data.user.role || 'FOUNDER';
          this.currentUser.name = data.user.name || this.currentUser.name;
        }
      }
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  }

  async waitForInit() {
    await this.initPromise;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    const firebaseUser = await signInWithGoogle();
    
    this.firebaseUser = firebaseUser;
    this.currentUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role: 'FOUNDER',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || undefined
    };

    await this.syncWithBackend();
    this.notifyListeners();
    
    return this.currentUser;
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const firebaseUser = await signInWithEmail(email, password);
    
    this.firebaseUser = firebaseUser;
    this.currentUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role: 'FOUNDER',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || undefined
    };

    await this.syncWithBackend();
    this.notifyListeners();
    
    return this.currentUser;
  }

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    const firebaseUser = await signUpWithEmail(email, password);
    
    this.firebaseUser = firebaseUser;
    this.currentUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: name || firebaseUser.email?.split('@')[0] || 'User',
      role: 'FOUNDER',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || undefined
    };

    // Sync with backend to create user record
    const token = await getIdToken();
    if (token) {
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, fullName: name })
        });
      } catch (error) {
        console.error('Failed to create user record:', error);
      }
    }

    this.notifyListeners();
    
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    await logOut();
    this.currentUser = null;
    this.firebaseUser = null;
    this.notifyListeners();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  async getAuthToken(): Promise<string | null> {
    return getIdToken();
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.firebaseUser !== null;
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Helper to get auth headers for API requests
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getIdToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  }

  // Cleanup
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export const authService = new AuthService();
