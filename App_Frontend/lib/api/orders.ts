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

export const acceptOrder = (orderId: string) =>
  api.patch(`/api/orders/${orderId}/accept`).then((r) => r.data);

export type ScheduleMeetupPayload = {
  location: string;
  scheduledAt?: string | Date;
  notes?: string;
};

export const scheduleMeetup = (orderId: string, payload: ScheduleMeetupPayload) =>
  api.patch(`/api/orders/${orderId}/meetup`, payload).then((r) => r.data);

export const completeOrder = (orderId: string) =>
  api.patch(`/api/orders/${orderId}/complete`).then((r) => r.data);

export type NoShowPayload = {
  noShowBy: "buyer" | "seller";
  reason?: string;
};

export const reportNoShow = (orderId: string, payload: NoShowPayload) =>
  api.patch(`/api/orders/${orderId}/no-show`, payload).then((r) => r.data);
