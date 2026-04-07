import axios from 'axios';

console.log('Axios initialization');
console.log('VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
console.log('Using baseURL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`${config.method?.toUpperCase() || 'REQ'} -> ${fullUrl}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    console.log(`${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status,
      message,
      response: error.response?.data,
    });

    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default instance;
