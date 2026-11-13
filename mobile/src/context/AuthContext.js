import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { storage } from '../services/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (e) {
      console.error('Failed to restore auth', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    await storage.saveToken(receivedToken);
    await storage.saveUser(receivedUser);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, phone, password, store_name) => {
    const res = await api.post('/auth/register', { name, phone, password, store_name });
    const { token: receivedToken, user: receivedUser } = res.data;
    await storage.saveToken(receivedToken);
    await storage.saveUser(receivedUser);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async () => {
    await storage.clearAuth();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

