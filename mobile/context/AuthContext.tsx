import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';
import { User } from '@/types';

type AvatarFile = {
  uri: string;
  name?: string;
  type?: string;
};

type RegisterValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  avatar?: AvatarFile;
};

type UpdateUserValues = {
  name?: string;
  phone?: string;
  location?: string;
  avatar?: AvatarFile;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (values: RegisterValues) => Promise<void>;
  updateUser: (values: UpdateUserValues) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const response = await api('/auth/me');
      setUser(response.data.user);
    } catch {
      await SecureStore.deleteItemAsync('marketly_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    await SecureStore.setItemAsync(
      'marketly_token',
      response.data.token
    );

    setUser(response.data.user);
  };

  const register = async (values: RegisterValues) => {
  const form = new FormData();

  form.append('name', values.name);
  form.append('email', values.email);
  form.append('phone', values.phone);
  form.append('password', values.password);
  form.append('confirmPassword', values.confirmPassword);

  if (values.avatar?.uri) {
    form.append('avatar', {
      uri: values.avatar.uri,
      name: values.avatar.name || 'avatar.jpg',
      type: values.avatar.type || 'image/jpeg',
    } as any);
  }

  const response = await api('/auth/register', {
    method: 'POST',
    body: form,
  });

  await SecureStore.setItemAsync(
    'marketly_token',
    response.data.token
  );

  setUser(response.data.user);
};

  const updateUser = async (values: UpdateUserValues) => {
  const form = new FormData();

  if (values.name !== undefined) {
    form.append('name', values.name);
  }

  if (values.phone !== undefined) {
    form.append('phone', values.phone);
  }

  if (values.location !== undefined) {
    form.append('location', values.location);
  }

  if (values.avatar?.uri) {
    form.append('avatar', {
      uri: values.avatar.uri,
      name: values.avatar.name || 'avatar.jpg',
      type: values.avatar.type || 'image/jpeg',
    } as any);
  }

  const response = await api('/users/profile', {
    method: 'PUT',
    body: form,
  });

  setUser(response.data.user);
};

  const logout = async () => {
    try {
      await api('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Mobile auth is token based.
    } finally {
      await SecureStore.deleteItemAsync('marketly_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateUser,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);