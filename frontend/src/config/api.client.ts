import axios from 'axios';

// TODO: restrict CORS before we go live - right now any origin can call this
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // console.log('[api] token attached:', !!token, config.url)
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    };
    return Promise.reject(normalized);
  }
);

export default apiClient;
