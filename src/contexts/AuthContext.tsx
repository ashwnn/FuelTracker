'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth-token');
    if (storedToken) {
      api.auth.me(storedToken)
        .then(({ user }) => {
          setUser(user);
          setToken(storedToken);
        })
        .catch(() => {
          localStorage.removeItem('auth-token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('auth-token', response.token);
    } catch (err) {
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await api.auth.register(email, password);
      // After registration, log in automatically
      await login(email, password);
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      // Ignore logout errors
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth-token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
