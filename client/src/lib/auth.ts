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

  constructor() {
    // Check for existing session in localStorage
    const storedToken = localStorage.getItem('aura_auth_token');
    const storedUser = localStorage.getItem('aura_user');
    
    if (storedToken && storedUser) {
      this.authToken = storedToken;
      this.currentUser = JSON.parse(storedUser);
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    // Mock authentication - in production this would call your auth API
    const mockUser: AuthUser = {
      id: 'user-1',
      email: email,
      name: email.split('@')[0],
      role: 'FOUNDER'
    };

    const mockToken = `mock_token_${Date.now()}`;
    
    this.currentUser = mockUser;
    this.authToken = mockToken;
    
    localStorage.setItem('aura_auth_token', mockToken);
    localStorage.setItem('aura_user', JSON.stringify(mockUser));
    
    this.notifyListeners();
    
    return mockUser;
  }

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    // Mock sign up - in production this would call your auth API
    const mockUser: AuthUser = {
      id: `user-${Date.now()}`,
      email: email,
      name: name,
      role: 'FOUNDER'
    };

    const mockToken = `mock_token_${Date.now()}`;
    
    this.currentUser = mockUser;
    this.authToken = mockToken;
    
    localStorage.setItem('aura_auth_token', mockToken);
    localStorage.setItem('aura_user', JSON.stringify(mockUser));
    
    this.notifyListeners();
    
    return mockUser;
  }

  signOut(): void {
    this.currentUser = null;
    this.authToken = null;
    
    localStorage.removeItem('aura_auth_token');
    localStorage.removeItem('aura_user');
    
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
