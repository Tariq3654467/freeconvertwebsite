"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;        // user id (string)
  username: string;   // additional claim
  email: string;      // additional claim
  exp: number;
  iat: number;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function tokenToUser(token: string): User | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return {
      id: parseInt(decoded.sub, 10),
      username: decoded.username,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem('token');
    if (saved) {
      const u = tokenToUser(saved);
      if (u) {
        setToken(saved);
        setUser(u);
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = useCallback((newToken: string) => {
    const u = tokenToUser(newToken);
    if (u) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(u);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
