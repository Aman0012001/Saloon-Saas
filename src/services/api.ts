// API Service for PHP/MySQL Backend
// This replaces Supabase client calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://localhost:8000/backend/api`;

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

    console.log(`[API Fetch] ${options.method || 'GET'} ${API_BASE_URL}${url}`);

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const resJson = await response.json().catch(() => ({ error: 'Request failed' }));
            const errorData = resJson.data || resJson;
            console.error(`[API Error] Status: ${response.status}`, errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const json = await response.json();
        return json.data !== undefined ? json.data : json;
    } catch (err: any) {
        console.error(`[API Network Error] ${err.message}`);
        throw err;
    }
};

const fetchWithFileUpload = async (url: string, formData: FormData) => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            const resJson = await response.json().catch(() => ({ error: 'Upload failed' }));
            const errorData = resJson.data || resJson;
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const json = await response.json();
        return json.data !== undefined ? json.data : json;
    } catch (err: any) {
        console.error(`[API Upload Error] ${err.message}`);
        throw err;
    }
};

// Authentication API
export const authAPI = {
    async signup(email: string, password: string, full_name: string, extraData: any = {}) {
        const data = await fetchWithAuth('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name, ...extraData }),
        });
        if (data && data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        return data;
    },

    async login(email: string, password: string) {
        const data = await fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data && data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        return data;
    },

    async logout() {
        // Optional: notify backend
        localStorage.removeItem('auth_token');
    },

    async getCurrentUser() {
        return await fetchWithAuth('/auth/me');
    },
};

// Salons API
export const salonsAPI = {
    async getAll() {
        const data = await fetchWithAuth('/salons');
        return data?.salons || data || [];
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/salons/${id}`);
        return data?.salon || data;
    },

    async getMySalons() {
        const data = await fetchWithAuth('/salons/my');
        return data?.salons || data || [];
    },

    async create(salonData: any) {
        const data = await fetchWithAuth('/salons', {
            method: 'POST',
            body: JSON.stringify(salonData),
        });
        return data?.salon || data;
    },

    async update(id: string, salonData: any) {
        const data = await fetchWithAuth(`/salons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(salonData),
        });
        return data?.salon || data;
    },

    async getAnalytics(id: string) {
        return await fetchWithAuth(`/salons/${id}/analytics`);
    },
};

// Services API
export const servicesAPI = {
    async getAll() {
        const data = await fetchWithAuth('/services');
        return data?.services || data || [];
    },

    async getBySalon(salonId: string, includeInactive: boolean = false) {
        const url = `/services?salon_id=${salonId}${includeInactive ? '&include_inactive=1' : ''}`;
        const data = await fetchWithAuth(url);
        return data?.services || data || [];
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/services/${id}`);
        return data?.service || data;
    },

    async create(serviceData: any) {
        return await fetchWithAuth('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });
    },

    async update(id: string, serviceData: any) {
        return await fetchWithAuth(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData),
        });
    },

    async delete(id: string) {
        await fetchWithAuth(`/services/${id}`, { method: 'DELETE' });
    },
};

// Bookings API
export const bookingsAPI = {
    async getAll(filters?: { user_id?: string; salon_id?: string; date?: string; start_date?: string; end_date?: string }) {
        const params = new URLSearchParams(filters as any);
        const data = await fetchWithAuth(`/bookings?${params}`);
        return data?.bookings || data || [];
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/bookings/${id}`);
        return data?.booking || data;
    },

    async create(bookingData: any) {
        return await fetchWithAuth('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    },

    async updateStatus(id: string, status: string) {
        return await fetchWithAuth(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async update(id: string, bookingData: any) {
        return await fetchWithAuth(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookingData),
        });
    },

    async getReview(bookingId: string) {
        return await fetchWithAuth(`/bookings/${bookingId}/review`);
    },

    async submitReview(bookingId: string, rating: number, comment: string) {
        return await fetchWithAuth(`/bookings/${bookingId}/review`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment }),
        });
    },

    async updateReview(bookingId: string, rating: number, comment: string) {
        return await fetchWithAuth(`/bookings/${bookingId}/review`, {
            method: 'PUT',
            body: JSON.stringify({ rating, comment }),
        });
    }
};

// Admin API
export const adminAPI = {
    async getStats() {
        return await fetchWithAuth('/admin/stats');
    },

    async getAllSalons() {
        const data = await fetchWithAuth('/admin/salons');
        return data?.salons || data || [];
    },

    async approveSalon(salonId: string) {
        return await fetchWithAuth(`/admin/salons/${salonId}/approve`, {
            method: 'PUT',
        });
    },

    async rejectSalon(salonId: string, reason: string) {
        return await fetchWithAuth(`/admin/salons/${salonId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    },

    async getAllBookings() {
        const data = await fetchWithAuth('/admin/bookings');
        return data?.bookings || data || [];
    },

    async getAllUsers() {
        const data = await fetchWithAuth('/admin/users');
        return data?.users || data || [];
    },

    async getReports(range: string = '30') {
        const data = await fetchWithAuth(`/admin/reports?range=${range}`);
        return data?.reports || data || [];
    },

    async getAllPayments() {
        const data = await fetchWithAuth('/admin/payments');
        return data?.payments || data || [];
    },

    async getSettings() {
        return await fetchWithAuth('/admin/settings');
    },

    async updateSettings(settings: any) {
        return await fetchWithAuth('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    },
};

// User Roles API
export const userRolesAPI = {
    async getByUser(userId: string) {
        const data = await fetchWithAuth(`/users/roles?user_id=${userId}`);
        return data?.roles || data || [];
    },

    async getBySalon(salonId: string) {
        const data = await fetchWithAuth(`/users/roles?salon_id=${salonId}`);
        return data?.roles || data || [];
    },
};

// Subscriptions API
export const subscriptionsAPI = {
    async getPlans() {
        const data = await fetchWithAuth('/subscriptions/plans');
        return data?.plans || data || [];
    },

    async getMySalonSubscriptions(salonId: string) {
        const data = await fetchWithAuth(`/subscriptions/my?salon_id=${salonId}`);
        return data?.subscriptions || data || [];
    },
};

// Profiles API
export const profilesAPI = {
    async getMe() {
        const data = await fetchWithAuth('/users/me');
        return data?.user || data;
    },

    async updateMe(profileData: any) {
        const data = await fetchWithAuth('/users/me', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        return data?.user || data;
    },

    async getById(userId: string) {
        const data = await fetchWithAuth(`/profiles/${userId}`);
        return data?.profile || data;
    },
};

// Staff Profiles API
export const staffProfilesAPI = {
    async getBySalon(salonId: string) {
        const data = await fetchWithAuth(`/staff?salon_id=${salonId}`);
        return data?.staff || data || [];
    },

    async create(staffData: any) {
        return await fetchWithAuth('/staff', {
            method: 'POST',
            body: JSON.stringify(staffData),
        });
    },

    async update(id: string, staffData: any) {
        return await fetchWithAuth(`/staff/${id}`, {
            method: 'PUT',
            body: JSON.stringify(staffData),
        });
    },

    async delete(id: string) {
        await fetchWithAuth(`/staff/${id}`, { method: 'DELETE' });
    },
};

// Notifications API
export const notificationsAPI = {
    async getAll(filters?: { salon_id?: string; unread_only?: string }) {
        const params = new URLSearchParams(filters as any);
        const data = await fetchWithAuth(`/notifications?${params}`);
        return data?.notifications || data || [];
    },

    async markAsRead(id: string) {
        return await fetchWithAuth(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    },

    async markAllAsRead(salonId?: string) {
        const url = `/notifications/read-all${salonId ? `?salon_id=${salonId}` : ''}`;
        return await fetchWithAuth(url, {
            method: 'PUT',
        });
    },
};

// Uploads API
export const uploadAPI = {
    async upload(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return await fetchWithFileUpload('/uploads', formData);
    },
};

// Export all APIs
export const api = {
    auth: authAPI,
    salons: salonsAPI,
    services: servicesAPI,
    bookings: bookingsAPI,
    staff: staffProfilesAPI,
    userRoles: userRolesAPI,
    admin: adminAPI,
    subscriptions: subscriptionsAPI,
    profiles: profilesAPI,
    notifications: notificationsAPI,
    uploads: uploadAPI,
    reviews: {
        getByService: (serviceId: string) => fetchWithAuth(`/reviews?service_id=${serviceId}`),
        getBySalon: (salonId: string) => fetchWithAuth(`/reviews?salon_id=${salonId}`),
        create: (data: any) => fetchWithAuth('/reviews', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
};

export default api;
