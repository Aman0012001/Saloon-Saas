// API Service for PHP/MySQL Backend
// This replaces Supabase client calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/backend/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
};

// Authentication API
export const authAPI = {
    async signup(email: string, password: string, full_name: string) {
        const data = await fetchWithAuth('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name }),
        });
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        return data;
    },

    async login(email: string, password: string) {
        const data = await fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        return data;
    },

    async logout() {
        await fetchWithAuth('/auth/logout', { method: 'POST' });
        localStorage.removeItem('auth_token');
    },

    async getCurrentUser() {
        return fetchWithAuth('/auth/me');
    },
};

// Salons API
export const salonsAPI = {
    async getAll() {
        const data = await fetchWithAuth('/salons');
        return data.data || [];
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/salons/${id}`);
        return data.data;
    },

    async getMySalons() {
        const data = await fetchWithAuth('/salons/my');
        return data.data || [];
    },

    async create(salonData: any) {
        const data = await fetchWithAuth('/salons', {
            method: 'POST',
            body: JSON.stringify(salonData),
        });
        return data.data;
    },

    async update(id: string, salonData: any) {
        const data = await fetchWithAuth(`/salons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(salonData),
        });
        return data.data;
    },
};

// Services API
export const servicesAPI = {
    async getBySalon(salonId: string) {
        const data = await fetchWithAuth(`/services?salon_id=${salonId}`);
        return data.data || [];
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/services/${id}`);
        return data.data;
    },

    async create(serviceData: any) {
        const data = await fetchWithAuth('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });
        return data.data;
    },

    async update(id: string, serviceData: any) {
        const data = await fetchWithAuth(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData),
        });
        return data.data;
    },

    async delete(id: string) {
        await fetchWithAuth(`/services/${id}`, { method: 'DELETE' });
    },
};

// Bookings API
export const bookingsAPI = {
    async getAll(filters?: { user_id?: string; salon_id?: string }) {
        const params = new URLSearchParams(filters as any);
        const data = await fetchWithAuth(`/bookings?${params}`);
        return data.data || [];
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/bookings/${id}`);
        return data.data;
    },

    async create(bookingData: any) {
        const data = await fetchWithAuth('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
        return data.data;
    },

    async updateStatus(id: string, status: string) {
        const data = await fetchWithAuth(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        return data.data;
    },
};

// User Roles API
export const userRolesAPI = {
    async getByUser(userId: string) {
        const data = await fetchWithAuth(`/users/roles?user_id=${userId}`);
        return data.data || [];
    },

    async getBySalon(salonId: string) {
        const data = await fetchWithAuth(`/users/roles?salon_id=${salonId}`);
        return data.data || [];
    },
};

// Admin API
export const adminAPI = {
    async getStats() {
        const data = await fetchWithAuth('/admin/stats');
        return data.data;
    },

    async getAllSalons() {
        const data = await fetchWithAuth('/admin/salons');
        return data.data || [];
    },

    async approveSalon(salonId: string) {
        const data = await fetchWithAuth(`/admin/salons/${salonId}/approve`, {
            method: 'PUT',
        });
        return data.data;
    },

    async rejectSalon(salonId: string, reason: string) {
        const data = await fetchWithAuth(`/admin/salons/${salonId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
        return data.data;
    },

    async getAllBookings() {
        const data = await fetchWithAuth('/admin/bookings');
        return data.data || [];
    },

    async getAllUsers() {
        const data = await fetchWithAuth('/admin/users');
        return data.data || [];
    },

    async getAllPayments() {
        const data = await fetchWithAuth('/admin/payments');
        return data.data || [];
    },
};

// Subscriptions API
export const subscriptionsAPI = {
    async getPlans() {
        const data = await fetchWithAuth('/subscriptions/plans');
        return data.data || [];
    },

    async getMySalonSubscriptions(salonId: string) {
        const data = await fetchWithAuth(`/subscriptions/my?salon_id=${salonId}`);
        return data.data || [];
    },
};

// Profiles API
export const profilesAPI = {
    async getMe() {
        const data = await fetchWithAuth('/users/me');
        return data.data;
    },

    async updateMe(profileData: any) {
        const data = await fetchWithAuth('/users/me', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        return data.data;
    },

    async getById(userId: string) {
        const data = await fetchWithAuth(`/profiles/${userId}`);
        return data.data;
    },
};

// Export all APIs
export const api = {
    auth: authAPI,
    salons: salonsAPI,
    services: servicesAPI,
    bookings: bookingsAPI,
    userRoles: userRolesAPI,
    admin: adminAPI,
    subscriptions: subscriptionsAPI,
    profiles: profilesAPI,
};

export default api;
