// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut, refreshToken as apirefreshToken } from '../services/api';
import React from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('refresh_token').then(async refreshToken => {  // leer refresh_token
      if (refreshToken) {
        try {
          const res = await apirefreshToken(refreshToken);
          if (res.ok) {
            const data = await res.json();
            await AsyncStorage.setItem('access_token', data.access_token);
            await AsyncStorage.setItem('refresh_token', data.refresh_token); // guardar nuevo refresh
            setIsAuthenticated(true);
          } else {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
            setIsAuthenticated(false);
          }
        } catch {
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    await apiSignIn(email, password);
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string) => {
    await apiSignUp(email, password);
    await apiSignIn(email, password);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await apiSignOut();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
