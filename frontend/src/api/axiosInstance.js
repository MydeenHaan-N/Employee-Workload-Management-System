import axios from 'axios';

// ──────────────────────────────────────────────
// Debug env at startup (very useful when baseURL is undefined)
// ──────────────────────────────────────────────
console.log('🚀 Axios initialization');
console.log('VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
console.log('Using baseURL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – attach token + debug log
instance.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + config.url;
    console.log(`📡 ${config.method?.toUpperCase() || 'REQ'} → ${fullUrl}`);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token attached');
    } else {
      console.log('⚠️ No token found in localStorage');
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor – handle 401 + better error logging
instance.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status,
      message,
      response: error.response?.data,
    });

    if (status === 401) {
      console.warn('401 Unauthorized → clearing token & redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Show backend message in toast (if you have toastService)
    // toast.error(message || 'Request failed');

    return Promise.reject(error);
  }
);

export default instance;