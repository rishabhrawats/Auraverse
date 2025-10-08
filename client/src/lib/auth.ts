// Mock authentication for development
// In production, this would integrate with NextAuth or similar
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'FOUNDER' | 'THERAPIST' | 'ADMIN';
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private authToken: string | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Check for existing session in localStorage
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedToken) {
      this.authToken = storedToken;
      // Fetch user data from /api/me
      this.initPromise = this.fetchCurrentUser();
    } else {
      this.initPromise = Promise.resolve();
    }
  }

  private async fetchCurrentUser() {
    try {
      const response = await fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.currentUser = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'FOUNDER'
        };
        this.notifyListeners();
      } else {
        // Invalid token, clear auth
        this.signOut();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      this.signOut();
    }
  }

  async waitForInit() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Sign in failed');
    }

    const data = await response.json();
    const { token, user } = data;
    
    this.authToken = token;
    this.currentUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'FOUNDER'
    };
    
    localStorage.setItem('auth_token', token);
    
    this.notifyListeners();
    
    return this.currentUser;
  }

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName: name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign up failed');
    }

    const data = await response.json();
    const { token, user } = data;
    
    this.authToken = token;
    this.currentUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'FOUNDER'
    };
    
    localStorage.setItem('auth_token', token);
    
    this.notifyListeners();
    
    return this.currentUser;
  }

  signOut(): void {
    this.currentUser = null;
    this.authToken = null;
    
    localStorage.removeItem('auth_token');
    
    this.notifyListeners();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
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

  // Helper to add auth headers to requests
  getAuthHeaders(): Record<string, string> {
    if (this.authToken) {
      return {
        'Authorization': `Bearer ${this.authToken}`
      };
    }
    return {};
  }
}

export const authService = new AuthService();
