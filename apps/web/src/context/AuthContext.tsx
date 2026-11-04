import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Address, UserRole, dataStore } from '@ecommerce/shared';

interface AuthContextType {
  user: UserProfile | null;
  addresses: Address[];
  login: (emailOrPhone: string, displayName?: string, role?: UserRole) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
  addAddress: (addr: Omit<Address, 'id' | 'userId'>) => Address;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  defaultAddress: Address | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dailyfresh_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [addresses, setAddresses] = useState<Address[]>(() => {
    try {
      const saved = localStorage.getItem('dailyfresh_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((a: any) => a.fullName !== 'Rahul Sharma' && a.id !== 'addr-default');
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('dailyfresh_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dailyfresh_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('dailyfresh_addresses', JSON.stringify(addresses));
  }, [addresses]);

  const login = async (emailOrPhone: string, displayName?: string, role: UserRole = 'customer') => {
    const isEmail = emailOrPhone.includes('@');
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: isEmail ? emailOrPhone : undefined,
      phone: !isEmail ? emailOrPhone : undefined,
      displayName: displayName || (isEmail ? emailOrPhone.split('@')[0] : `Customer ${emailOrPhone.slice(-4)}`),
      role,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    setUser(newUser);
    // Sync customer login to Firestore in real time
    dataStore.syncUser(newUser).catch(() => {});
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUser(updated);
    dataStore.syncUser(updated).catch(() => {});
  };

  const logout = () => {
    setUser(null);
  };

  const addAddress = (addr: Omit<Address, 'id' | 'userId'>) => {
    const newAddress: Address = {
      ...addr,
      id: `addr-${Date.now()}`,
      userId: user?.id || 'guest',
      isDefault: addresses.length === 0 || addr.isDefault,
    };

    let updated = [...addresses];
    if (newAddress.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: false }));
    }
    updated.push(newAddress);
    setAddresses(updated);
    return newAddress;
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        addresses,
        login,
        updateUserProfile,
        logout,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        defaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
