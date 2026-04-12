import { api } from "./client";

export const getOrders = () => api.get(`/api/orders`).then((r) => r.data);

export type PlaceOrderPayload = {
  productId: string;
  quantity: number;
  shippingDetails: Record<string, unknown>;
};

export const placeOrder = (payload: PlaceOrderPayload) =>
  api.post(`/api/orders`, payload).then((r) => r.data);

export const cancelOrder = (orderId: string) =>
  api.patch(`/api/orders/${orderId}/cancel`).then((r) => r.data);
