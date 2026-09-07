import apiClient from './client';

/**
 * Fetch the personalized or cold-start discovery feed.
 * The Bearer token (if set) is attached automatically by the request interceptor.
 */
export const fetchDiscoveryFeed = () => apiClient.get('/discovery/feed');

/**
 * Track a user interaction (view or search).
 * @param {{ type: 'view'|'search', productId?: string, query?: string, category?: string }} payload
 */
export const trackActivity = (payload) =>
  apiClient.post('/users/track-activity', payload);
