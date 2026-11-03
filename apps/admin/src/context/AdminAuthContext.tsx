import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@ecommerce/shared';

interface AdminAuthContextType {
  adminUser: UserProfile | null;
  token: string | null;
  login: (email: string, role?: UserRole, displayName?: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dailyfresh_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('dailyfresh_admin_token') || null;
  });

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('dailyfresh_admin_user', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('dailyfresh_admin_user');
    }
  }, [adminUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('dailyfresh_admin_token', token);
    } else {
      localStorage.removeItem('dailyfresh_admin_token');
    }
  }, [token]);

  const login = async (email: string, role: UserRole = 'super_admin', displayName?: string): Promise<boolean> => {
    const profile: UserProfile = {
      id: `admin-${Date.now()}`,
      email,
      displayName: displayName || (email.split('@')[0].toUpperCase() + ' (Admin)'),
      role,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setAdminUser(profile);
    setToken(`jwt_admin_${Date.now()}`);
    return true;
  };

  const logout = () => {
    setAdminUser(null);
    setToken(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
