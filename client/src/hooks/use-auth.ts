import { useState, useEffect } from 'react';
import { authService, type AuthUser } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authService.signIn(email, password);
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const user = await authService.signUp(email, password, name);
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = () => {
    authService.signOut();
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: authService.isAuthenticated(),
  };
}
