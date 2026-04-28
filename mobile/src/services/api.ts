import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = await SecureStore.getItemAsync('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: refresh });
          await SecureStore.setItemAsync('accessToken', data.data.accessToken);
          await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register:          (d: object) => api.post('/auth/register', d),
  login:             (d: object) => api.post('/auth/login', d),
  loginWith2FA:      (d: object) => api.post('/auth/login/2fa', d),
  me:                ()         => api.get('/auth/me'),
  updateProfile:     (d: object) => api.put('/auth/profile', d),
  changePassword:    (d: object) => api.put('/auth/change-password', d),
  forgotPassword:    (email: string) => api.post('/auth/forgot-password', { email }),
  verifyEmail:       (token: string) => api.post('/auth/verify-email', { token }),
};

// Properties
export const propertyApi = {
  list:    (params?: object) => api.get('/properties', { params }),
  get:     (slug: string)    => api.get(`/properties/${slug}`),
  favorites:               () => api.get('/properties/favorites'),
  toggleFavorite: (id: string) => api.post(`/properties/${id}/favorite`),
};

// Bookings
export const bookingApi = {
  checkAvailability: (d: object)    => api.post('/bookings/check-availability', d),
  create:            (d: object)    => api.post('/bookings', d),
  myBookings:        (status?: string) => api.get('/bookings/my', { params: status ? { status } : {} }),
  get:               (id: string)   => api.get(`/bookings/${id}`),
  cancel:            (id: string, reason?: string) => api.post(`/bookings/${id}/cancel`, { reason }),
};

// Payments
export const paymentApi = {
  createStripeSession:  (bookingId: string) => api.post('/payments/stripe/create-session', { bookingId }),
  createPaytechSession: (bookingId: string) => api.post('/payments/paytech/create-session', { bookingId }),
  myPayments:           ()                  => api.get('/payments/my'),
};

// Reviews
export const reviewApi = {
  create:     (d: object)    => api.post('/reviews', d),
  byProperty: (id: string)   => api.get(`/reviews/property/${id}`),
};

// Messages
export const messageApi = {
  conversations: () => api.get('/messages'),
  conversation:  (userId: string) => api.get(`/messages/${userId}`),
  send:          (d: object)      => api.post('/messages', d),
};

// Notifications
export const notificationApi = {
  list:        () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead:    (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Destinations
export const destinationApi = {
  list: () => api.get('/destinations'),
};
