import { createContext } from "react";

export interface User {
    id: string;
    email: string;
    full_name?: string;
    user_type?: 'customer' | 'salon_owner' | 'admin' | string;
    salon_role?: 'owner' | 'manager' | 'staff' | null;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string, extraData?: any) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
