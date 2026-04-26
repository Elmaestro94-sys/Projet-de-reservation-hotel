import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: object) => api.post('/auth/register', data),
  login: (data: object) => api.post('/auth/login', data),
  loginWith2FA: (data: object) => api.post('/auth/login/2fa', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: object) => api.put('/auth/profile', data),
  changePassword: (data: object) => api.put('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: object) => api.post('/auth/reset-password', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token: string) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (token: string) => api.post('/auth/2fa/disable', { token }),
};

// Properties
export const propertyApi = {
  list: (params?: object) => api.get('/properties', { params }),
  get: (slug: string) => api.get(`/properties/${slug}`),
  create: (data: object) => api.post('/properties', data),
  update: (id: string, data: object) => api.put(`/properties/${id}`, data),
  submit: (id: string) => api.post(`/properties/${id}/submit`),
  delete: (id: string) => api.delete(`/properties/${id}`),
  myProperties: () => api.get('/properties/my'),
  myStats: () => api.get('/properties/my/stats'),
  myRevenueStats: (year?: number) => api.get('/properties/my/stats/revenue', { params: year ? { year } : {} }),
  exportBookings: (params?: object) => api.get('/properties/my/export', { params, responseType: 'blob' }),
  toggleFavorite: (id: string) => api.post(`/properties/${id}/favorite`),
  favorites: () => api.get('/properties/favorites'),
  manageAvailability: (propertyId: string, data: object) => api.put(`/properties/${propertyId}/availability`, data),
  uploadPhoto: (propertyId: string, file: File, isCover: boolean) => {
    const form = new FormData();
    form.append('photo', file);
    form.append('propertyId', propertyId);
    form.append('isCover', String(isCover));
    return api.post('/upload/property-photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePhoto: (id: string) => api.delete(`/upload/property-photo/${id}`),
};

// Bookings
export const bookingApi = {
  checkAvailability: (data: object) => api.post('/bookings/check-availability', data),
  create: (data: object) => api.post('/bookings', data),
  myBookings: (status?: string) => api.get('/bookings/my', { params: status ? { status } : {} }),
  ownerBookings: (status?: string) => api.get('/bookings/owner', { params: status ? { status } : {} }),
  get: (id: string) => api.get(`/bookings/${id}`),
  confirm: (id: string) => api.post(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) => api.post(`/bookings/${id}/cancel`, { reason }),
};

// Payments
export const paymentApi = {
  createStripeSession: (bookingId: string) => api.post('/payments/stripe/create-session', { bookingId }),
  createPaytechSession: (bookingId: string) => api.post('/payments/paytech/create-session', { bookingId }),
  myPayments: () => api.get('/payments/my'),
};

// Reviews
export const reviewApi = {
  create: (data: object) => api.post('/reviews', data),
  reply: (id: string, reply: string) => api.post(`/reviews/${id}/reply`, { reply }),
  report: (id: string) => api.post(`/reviews/${id}/report`),
  byProperty: (propertyId: string) => api.get(`/reviews/property/${propertyId}`),
};

// Promotions
export const promotionApi = {
  list: (propertyId?: string) => api.get('/promotions', { params: propertyId ? { propertyId } : {} }),
  create: (data: object) => api.post('/promotions', data),
  update: (id: string, data: object) => api.put(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
  validate: (data: object) => api.post('/promotions/validate', data),
};

// Messages
export const messageApi = {
  conversations: () => api.get('/messages'),
  conversation: (userId: string) => api.get(`/messages/${userId}`),
  send: (data: object) => api.post('/messages', data),
  delete: (id: string) => api.delete(`/messages/${id}`),
};

// Notifications
export const notificationApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Destinations
export const destinationApi = {
  list: () => api.get('/destinations'),
};

// Admin
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (params?: object) => api.get('/admin/users', { params }),
  banUser: (id: string, reason: string) => api.post(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),
  properties: (params?: object) => api.get('/admin/properties', { params }),
  approveProperty: (id: string) => api.post(`/admin/properties/${id}/approve`),
  rejectProperty: (id: string, reason: string) => api.post(`/admin/properties/${id}/reject`, { reason }),
  bookings: (params?: object) => api.get('/admin/bookings', { params }),
  payments: (params?: object) => api.get('/admin/payments', { params }),
  auditLogs: (params?: object) => api.get('/admin/audit-logs', { params }),
};
