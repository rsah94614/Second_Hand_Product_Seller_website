import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  acceptOrder,
  cancelOrder,
  completeOrder,
  createDispute,
  getOrders,
  markOrderDelivered,
  reportNoShow,
  scheduleMeetup,
  uploadConfirmationPhoto,
} from "../api/orders";
import { parseApiError, formatErrorForDisplay } from "../utils/errorHandler";
import type { OrderRow } from "../types";

export function useOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: !!user,
  });

  const orders: OrderRow[] = Array.isArray(data) ? data : data?.orders || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders"] });

  const cancelM = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to cancel order.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const acceptM = useMutation({
    mutationFn: (orderId: string) => acceptOrder(orderId),
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to accept order.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const scheduleM = useMutation({
    mutationFn: (payload: { orderId: string; location: string; scheduledAt?: string; notes?: string }) =>
      scheduleMeetup(payload.orderId, {
        location: payload.location,
        scheduledAt: payload.scheduledAt || undefined,
        notes: payload.notes || undefined,
      }),
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to schedule meetup.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const deliverM = useMutation({
    mutationFn: (orderId: string) => markOrderDelivered(orderId),
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to mark as delivered.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const noShowM = useMutation({
    mutationFn: (payload: { orderId: string; noShowBy: "buyer" | "seller" }) => 
      reportNoShow(payload.orderId, { noShowBy: payload.noShowBy }),
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to report no-show.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const completeM = useMutation({
    mutationFn: (orderId: string) => completeOrder(orderId),
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to complete order.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const disputeM = useMutation({
    mutationFn: (payload: { orderId: string; reason: string }) => {
      const formData = new FormData();
      formData.append("reason", payload.reason);
      return createDispute(payload.orderId, formData);
    },
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to submit dispute.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const photoM = useMutation({
    mutationFn: (payload: { orderId: string; formData: FormData }) => uploadConfirmationPhoto(payload.orderId, payload.formData),
    onSuccess: invalidate,
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to upload photo.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  return {
    orders,
    isLoading,
    isError,
    refetch,
    isRefetching,
    cancelM,
    acceptM,
    scheduleM,
    deliverM,
    noShowM,
    completeM,
    disputeM,
    photoM,
  };
}
