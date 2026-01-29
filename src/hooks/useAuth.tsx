import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import api from "@/services/api";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type?: 'customer' | 'salon_owner' | 'admin' | string;
  salon_role?: 'owner' | 'manager' | 'staff' | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, extraData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error("Auth initialization error:", error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.auth.login(email, password);
      // api.auth.login already sets the token in localStorage
      await fetchUser();
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, extraData: any = {}) => {
    try {
      const data = await api.auth.signup(email, password, fullName, extraData);
      // api.auth.signup already sets the token in localStorage
      await fetchUser();
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, signOut, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
