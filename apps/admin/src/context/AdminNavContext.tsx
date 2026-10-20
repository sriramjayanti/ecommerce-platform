import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AdminNavContextType {
  isMobileDrawerOpen: boolean;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
}

const AdminNavContext = createContext<AdminNavContextType | undefined>(undefined);

export const AdminNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Automatically close drawer when route changes
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  const openMobileDrawer = () => setIsMobileDrawerOpen(true);
  const closeMobileDrawer = () => setIsMobileDrawerOpen(false);
  const toggleMobileDrawer = () => setIsMobileDrawerOpen((prev) => !prev);

  return (
    <AdminNavContext.Provider
      value={{
        isMobileDrawerOpen,
        openMobileDrawer,
        closeMobileDrawer,
        toggleMobileDrawer,
      }}
    >
      {children}
    </AdminNavContext.Provider>
  );
};

export const useAdminNav = (): AdminNavContextType => {
  const context = useContext(AdminNavContext);
  if (!context) {
    throw new Error('useAdminNav must be used within an AdminNavProvider');
  }
  return context;
};
