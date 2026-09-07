import apiClient from './client';

/**
 * POST /api/orders
 *
 * @param {{
 *   items: Array<{
 *     productId: string,
 *     name: string,
 *     image: string,
 *     category: string,
 *     brand: string,
 *     price: number,
 *     qty: number,
 *   }>,
 *   shippingAddress: {
 *     fullName: string,
 *     street:   string,
 *     city:     string,
 *     pincode:  string,
 *     phone:    string,
 *   },
 *   paymentMethod:  'cod' | 'online',
 *   deliveryOption: 'standard' | 'express',
 *   mockPaymentId?: string,
 * }} payload
 *
 * Returns: { success, message, data: Order }
 */
export const placeOrder = (payload) => apiClient.post('/orders', payload);

/**
 * GET /api/orders/my  — authenticated user's order list
 */
export const fetchMyOrders = () => apiClient.get('/orders/my');

/**
 * GET /api/orders/:id
 */
export const fetchOrderById = (id) => apiClient.get(`/orders/${id}`);
