'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Configure axios globally to always send cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatar: string;
  coins: number;
  library?: any[];
  reading_history?: any[];
  reading_streak?: any;
  is_vip?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
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

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
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

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
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
