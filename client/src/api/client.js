import axios from 'axios';

/**
 * Base axios instance.
 * All requests go through /api — Vite's dev proxy forwards them to
 * http://localhost:5000, so no CORS issues during development.
 */
const rawBaseURL = import.meta.env.VITE_API_URL || 'https://ekart-07yj.onrender.com';
const baseURL = rawBaseURL.endsWith('/api')
  ? rawBaseURL
  : `${rawBaseURL.replace(/\/$/, '')}/api`;

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Request interceptor — attach Bearer token from localStorage if present.
 * The token key is 'ekart_token'.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ekart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — unwrap the data envelope and surface errors cleanly.
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
