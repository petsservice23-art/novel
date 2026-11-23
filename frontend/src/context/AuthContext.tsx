'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Configure axios globally to always send cookies
axios.defaults.withCredentials = true;
const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
axios.defaults.baseURL = BACKEND_BASE;

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatar: string;
  coins: number;
  unlocked_chapters?: any[];
  library?: any[];
  reading_history?: any[];
  reading_streak?: any;
  is_vip?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  loginWithGoogle: (data: { accessToken?: string; credential?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string, rememberMe: boolean = true) => {
    try {
      const res = await axios.post('/api/auth/login', { identifier, email: identifier, password, rememberMe });
      setUser(res.data);
      toast.success('Successfully logged in!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/register', { username, email, password });
      setUser(res.data);
      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error('Failed to logout');
    }
  };

  const loginWithGoogle = async (data: { accessToken?: string; credential?: string }) => {
    try {
      const res = await axios.post('/api/auth/google', data);
      setUser(res.data);
      toast.success(`Welcome, ${res.data.username}!`);
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Google sign-in failed');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
