import axios from 'axios';

/** Backend API base URL. In the browser use Next.js rewrite proxy (/api). */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // Don't set Content-Type for FormData - let axios set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const res = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // Refresh failed — clear stale credentials and update auth store state,
        // but only redirect to /login if the user is on a protected page.
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          const { useAuthStore } = await import('./store/authStore');
          useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
          const protectedPaths = ['/checkout', '/account', '/orders', '/admin'];
          const isProtected = protectedPaths.some((p) => window.location.pathname.startsWith(p));
          if (isProtected) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
