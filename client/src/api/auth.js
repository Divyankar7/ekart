import apiClient from './client';

/**
 * POST /api/auth/register
 * @param {{ name: string, email: string, password: string }} data
 */
export const apiRegister = (data) => apiClient.post('/auth/register', data);

/**
 * POST /api/auth/login
 * @param {{ email: string, password: string }} data
 */
export const apiLogin = (data) => apiClient.post('/auth/login', data);

/**
 * GET /api/auth/me  — verify stored token and return fresh user profile
 * Bearer token is attached automatically by the request interceptor.
 */
export const apiGetMe = () => apiClient.get('/auth/me');
