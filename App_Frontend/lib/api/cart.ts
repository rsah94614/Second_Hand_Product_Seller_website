import { api } from "./client";

export const getCart = () => api.get(`/api/cart`).then((r) => r.data);

export const addToCart = (productId: string, quantity: number) =>
  api.post(`/api/cart`, { productId, quantity }).then((r) => r.data);

export const removeFromCart = (productId: string) =>
  api.delete(`/api/cart/${productId}`).then((r) => r.data);

export const updateCartItem = (productId: string, quantity: number) =>
  api.put(`/api/cart/${productId}`, { quantity }).then((r) => r.data);

export type ShippingDetails = {
  fullName: string;
  addressLine1: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
};

export const checkoutCart = (shippingDetails: ShippingDetails) =>
  api.post(`/api/cart/checkout`, { shippingDetails }).then((r) => r.data);
