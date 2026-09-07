import apiClient from './client';

/**
 * Fetch a single product by its MongoDB ObjectId.
 * @param {string} id
 */
export const fetchProductById = (id) => apiClient.get(`/products/${id}`);

/**
 * Fetch products with optional filters.
 *
 * @param {{
 *   category?:  string,   // comma-separated slugs e.g. "electronics,footwear"
 *   exclude?:   string,   // comma-separated IDs
 *   sort?:      'newest' | 'trending' | 'rating' | 'price-asc' | 'price-desc',
 *   search?:    string,   // keyword search
 *   minPrice?:  number,   // USD
 *   maxPrice?:  number,   // USD
 *   minRating?: number,   // 1-5
 *   page?:      number,
 *   limit?:     number,
 * }} params
 *
 * Response shape:
 *   { success, count, total, page, totalPages, bounds: { minPrice, maxPrice }, data[] }
 */
export const fetchProducts = (params = {}) =>
  apiClient.get('/products', { params });
