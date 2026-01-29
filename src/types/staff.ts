export interface StaffMember {
    id: string;
    user_id: string;
    salon_id: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    specializations: string[] | string;
    commission_percentage: number;
    is_active: boolean;

    assigned_services?: string[];
    role?: 'owner' | 'manager' | 'staff' | 'super_admin';
    created_at?: string;
    updated_at?: string;
}

export type StaffRole = 'owner' | 'manager' | 'staff' | 'super_admin';
