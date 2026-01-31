import { ReactNode, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth, User } from "@/hooks/useAuth";

interface RoleProtectedRouteProps {
    children: ReactNode;
    allowedRole: 'SUPER_ADMIN' | 'SALON_OWNER' | 'STAFF' | 'USER';
}

const getMappedRole = (user: User | null): string | null => {
    if (!user) return null;

    if (user.user_type === 'admin' || user.user_type === 'super_admin') return 'SUPER_ADMIN';
    if (user.user_type === 'salon_owner' || (user.salon_role && ['owner', 'manager'].includes(user.salon_role))) return 'SALON_OWNER';
    if (user.user_type === 'salon_staff' || user.salon_role === 'staff') return 'STAFF';
    if (user.user_type === 'customer') return 'USER';

    return null;
};

const getRoleDashboard = (role: string | null): string => {
    switch (role) {
        case 'SUPER_ADMIN': return '/super-admin/dashboard';
        case 'SALON_OWNER': return '/salon/dashboard';
        case 'STAFF': return '/staff/dashboard';
        case 'USER': return '/user/dashboard';
        default: return '/login';
    }
};

export const RoleProtectedRoute = ({ children, allowedRole }: RoleProtectedRouteProps) => {
    const { user, loading, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const currentRole = getMappedRole(user);

    useEffect(() => {
        // Failsafe: If role is missing or invalid -> logout user and redirect to /login
        if (!loading && user && !currentRole) {
            console.warn("Invalid or missing role detected. Logging out.");
            signOut().then(() => {
                navigate("/login");
            });
        }
    }, [user, loading, currentRole, signOut, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    // Authentication Rules: User must be logged in to access any dashboard.
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Strict access control and automatic redirection based on role
    if (currentRole !== allowedRole) {
        const correctDashboard = getRoleDashboard(currentRole);
        return <Navigate to={correctDashboard} replace />;
    }

    return <>{children}</>;
};
