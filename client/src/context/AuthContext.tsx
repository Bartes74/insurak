import axios from 'axios';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../hooks/useApi';

interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  canEdit?: boolean;
  mustChangePassword?: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed.user);
      setToken(parsed.token);
      axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
      setAuthToken(parsed.token);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const resp = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const authData = { user: resp.data.user, token: resp.data.token };
    setUser(authData.user);
    setToken(authData.token);
    localStorage.setItem('auth', JSON.stringify(authData));
    axios.defaults.headers.common.Authorization = `Bearer ${authData.token}`;
    setAuthToken(authData.token);
    return authData.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
    delete axios.defaults.headers.common.Authorization;
    setAuthToken(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
