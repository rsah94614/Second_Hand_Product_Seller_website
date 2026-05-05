import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
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
} from "../../lib/api/orders";
import { formatInr } from "../../lib/format";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";

type OrderRow = {
  _id: string;
  status: string;
  total: number;
  items?: { product?: string; title?: string }[];
  meetupDetails?: {
    location?: string;
    scheduledAt?: string;
    notes?: string;
  };
  user?: { _id?: string };
  seller?: { _id?: string };
};

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  label,
  onPress,
  color,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  color: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      className={`rounded-xl px-3 py-2 ${color} ${loading || disabled ? "opacity-60" : ""}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#6366f1" />
      ) : (
        <Text className="text-[13px] font-outfit-sb text-slate-700 dark:text-slate-200">{label}</Text>
      )}
    </Pressable>
  );
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: !!user,
  });

  const orders: OrderRow[] = Array.isArray(data) ? data : data?.orders || [];

  // ── Schedule modal ──────────────────────────────────────────────────────────
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleOrderId, setScheduleOrderId] = useState<string>("");
  const [scheduleLocation, setScheduleLocation] = useState("");
  const [scheduleScheduledAt, setScheduleScheduledAt] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  // Fix B1: Dispute modal replaces Alert.prompt (iOS-only) ─────────────────────
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string>("");
  const [disputeReason, setDisputeReason] = useState("");

  const openSchedule = (orderId: string) => {
    setScheduleOrderId(orderId);
    setScheduleLocation("");
    setScheduleScheduledAt("");
    setScheduleNotes("");
    setScheduleModalOpen(true);
  };

  const openDispute = (orderId: string) => {
    setDisputeOrderId(orderId);
    setDisputeReason("");
    setDisputeModalOpen(true);
  };

  const cancelM = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to cancel order.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const acceptM = useMutation({
    mutationFn: (orderId: string) => acceptOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setScheduleModalOpen(false);
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to schedule meetup.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const completeM = useMutation({
    mutationFn: (orderId: string) => completeOrder(orderId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      const order = res?.order || res?.data?.order || null;
      const rawSeller = order?.seller;
      const sellerId =
        rawSeller && typeof rawSeller === "object" ? String(rawSeller._id || "") : String(rawSeller || "");
      const orderId = String(order?._id || "");
      if (sellerId && orderId) {
        Alert.alert("Completed", "Deal marked as completed.", [
          { text: "OK" },
          {
            text: "Rate seller",
            onPress: () => router.push((`/review/${sellerId}?orderId=${orderId}` as never)),
          },
        ]);
      } else {
        Alert.alert("Completed", "Deal marked as completed.");
      }
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to complete order.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const deliverM = useMutation({
    mutationFn: (orderId: string) => markOrderDelivered(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert("Handed Over", "Item marked as handed over. The buyer will now confirm receipt.");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to mark order as delivered.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const noShowM = useMutation({
    mutationFn: (payload: { orderId: string; noShowBy: "buyer" | "seller"; reason?: string }) =>
      reportNoShow(payload.orderId, {
        noShowBy: payload.noShowBy,
        reason: payload.reason || "",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to report no-show.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const disputeM = useMutation({
    mutationFn: (payload: { orderId: string; reason: string }) => {
      const fd = new FormData();
      fd.append("reason", payload.reason);
      return createDispute(payload.orderId, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setDisputeModalOpen(false);
      setDisputeReason("");
      Alert.alert("Dispute submitted", "Our team will review your dispute.");
    },
  });

  const confirmPhotoM = useMutation({
    mutationFn: (payload: { orderId: string; formData: FormData }) =>
      uploadConfirmationPhoto(payload.orderId, payload.formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to upload confirmation photo.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const handleConfirmPhoto = async (orderId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Photo access is required.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const fd = new FormData();
    if (Platform.OS === "web") {
      const blob = await fetch(asset.uri).then((r) => r.blob());
      fd.append("photo", blob, `confirm.${ext}`);
    } else {
      fd.append("photo", { uri: asset.uri, name: `confirm.${ext}`, type: mimeType } as unknown as Blob);
    }
    confirmPhotoM.mutate({ orderId, formData: fd });
  };

  const getId = (v?: { _id?: string }) => String(v?._id || "");
  const currentId = user?.id || "";

  const statusTone = (s: string) => {
    const st = s?.toLowerCase?.() || "";
    if (st === "requested") return { bg: "bg-yellow-100 dark:bg-amber-900/30", text: "text-yellow-700 dark:text-amber-200" };
    if (st === "accepted") return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-200" };
    if (st === "meetup_scheduled") return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-200" };
    if (st === "delivered") return { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-200" };
    if (st === "completed") return { bg: "bg-green-100 dark:bg-emerald-900/30", text: "text-green-700 dark:text-emerald-200" };
    if (st === "cancelled") return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-200" };
    if (st === "no_show") return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-200" };
    return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" };
  };

  if (!user) return <Redirect href="/(auth)/login" />;

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          title="Failed to load orders"
          message="Please try again and we will fetch your orders."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="My Orders" subtitle="Manage your purchases and sales" />

      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="No orders yet"
            message="When you buy something, your orders will appear here."
          />
        }
        renderItem={({ item: o }) => {
          const first = o.items?.[0];
          const buyerId = getId(o.user);
          const sellerId = getId(o.seller);
          const isBuyer = buyerId && buyerId === currentId;
          const isSeller = sellerId && sellerId === currentId;
          const status = String(o.status || "");

          const canCancel = (status === "requested" || status === "accepted") && (isBuyer || isSeller);
          const canAccept = status === "requested" && isSeller;
          const canSchedule = (status === "accepted") && (isBuyer || isSeller);
          const canDeliver = ["accepted", "meetup_scheduled"].includes(status) && isSeller;
          const canComplete = ["meetup_scheduled", "accepted", "delivered"].includes(status) && isBuyer;
          const canNoShow = status === "meetup_scheduled" && (isBuyer || isSeller);
          const canDispute = ["meetup_scheduled", "delivered", "completed", "no_show"].includes(status) && (isBuyer || isSeller);
          const canConfirmPhoto = status === "completed" && (isBuyer || isSeller);

          const tone = statusTone(status);

          return (
            <View className="mb-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-4">
                  <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white leading-tight">
                    {first?.title || "Order"}
                  </Text>
                  {/* Role badge */}
                  {(isBuyer || isSeller) && (
                    <View className="mt-1 self-start px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      <Text className="text-[10px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {isBuyer ? "You're buying" : "You're selling"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-lg font-outfit-b text-primary-600 dark:text-primary-400">
                  {formatInr(o.total || 0)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <View className={`px-2.5 py-1 rounded-lg ${tone.bg}`}>
                  <Text className={`text-[12px] font-outfit-sb uppercase tracking-wider ${tone.text}`}>
                    {status.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>

              {status === "meetup_scheduled" ? (
                <View className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">
                    Meetup Location
                  </Text>
                  <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white">
                    {o.meetupDetails?.location || "Location TBD"}
                  </Text>
                  {o.meetupDetails?.scheduledAt ? (
                    <Text className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
                      {new Date(o.meetupDetails.scheduledAt).toLocaleString()}
                    </Text>
                  ) : null}
                  {o.meetupDetails?.notes ? (
                    <Text className="mt-1 text-[12px] text-slate-600 dark:text-slate-300 italic">
                      {o.meetupDetails.notes}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {status === "delivered" ? (
                <View className="mt-3 p-3 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/40">
                  <Text className="text-[12px] font-outfit-sb text-teal-700 dark:text-teal-300">
                    📦 Item Handed Over
                  </Text>
                  <Text className="mt-0.5 text-[12px] font-outfit text-teal-600 dark:text-teal-400">
                    {isBuyer ? "The seller has marked the item as handed over. Please confirm receipt." : "Waiting for buyer to confirm receipt."}
                  </Text>
                </View>
              ) : null}

              {/* Fix U3: All action buttons now show loading spinners ───────────── */}
              <View className="mt-4 flex-row flex-wrap gap-2">
                {canCancel && (
                  <ActionBtn
                    label="Cancel"
                    color="bg-red-50 dark:bg-red-950/30"
                    loading={cancelM.isPending}
                    onPress={() => {
                      Alert.alert("Cancel order", "Are you sure you want to cancel?", [
                        { text: "No", style: "cancel" },
                        {
                          text: "Cancel order",
                          style: "destructive",
                          onPress: () => cancelM.mutate(o._id),
                        },
                      ]);
                    }}
                  />
                )}

                {canAccept && (
                  <ActionBtn
                    label="Accept"
                    color="bg-indigo-50 dark:bg-indigo-900/30"
                    loading={acceptM.isPending}
                    onPress={() => acceptM.mutate(o._id)}
                  />
                )}

                {canSchedule && (
                  <ActionBtn
                    label="Schedule Meetup"
                    color="bg-indigo-50 dark:bg-indigo-900/30"
                    onPress={() => openSchedule(o._id)}
                  />
                )}

                {canDeliver && (
                  <ActionBtn
                    label="Item Handed Over"
                    color="bg-teal-50 dark:bg-teal-900/30"
                    loading={deliverM.isPending}
                    onPress={() =>
                      Alert.alert("Confirm", "Mark this item as physically handed over to the buyer?", [
                        { text: "No", style: "cancel" },
                        { text: "Yes, Handed Over", onPress: () => deliverM.mutate(o._id) },
                      ])
                    }
                  />
                )}

                {canComplete && (
                  <ActionBtn
                    label="Confirm Receipt"
                    color="bg-emerald-50 dark:bg-emerald-900/30"
                    loading={completeM.isPending}
                    onPress={() =>
                      Alert.alert("Confirm Receipt", "Confirm that you have received the item and the deal is complete?", [
                        { text: "No", style: "cancel" },
                        { text: "Yes, Received", onPress: () => completeM.mutate(o._id) },
                      ])
                    }
                  />
                )}

                {/* Fix B8: isBuyer reports SELLER as no-show; isSeller reports BUYER ── */}
                {canNoShow && (
                  <ActionBtn
                    label="Report No-Show"
                    color="bg-orange-50 dark:bg-orange-900/30"
                    loading={noShowM.isPending}
                    onPress={() => {
                      // If I am the buyer, the other party (seller) didn't show up.
                      // If I am the seller, the other party (buyer) didn't show up.
                      const noShowBy: "buyer" | "seller" = isBuyer ? "seller" : "buyer";
                      Alert.alert(
                        "Report no-show",
                        `Report that the ${noShowBy} did not show up?`,
                        [
                          { text: "No", style: "cancel" },
                          {
                            text: "Report",
                            style: "destructive",
                            onPress: () => noShowM.mutate({ orderId: o._id, noShowBy }),
                          },
                        ]
                      );
                    }}
                  />
                )}

                {canConfirmPhoto && (
                  <ActionBtn
                    label="Add Photo"
                    color="bg-blue-50 dark:bg-blue-900/30"
                    loading={confirmPhotoM.isPending}
                    onPress={() => handleConfirmPhoto(o._id)}
                  />
                )}

                {/* Fix B1: opens cross-platform modal instead of Alert.prompt ───── */}
                {canDispute && (
                  <ActionBtn
                    label="Dispute"
                    color="bg-red-50 dark:bg-red-900/30"
                    loading={disputeM.isPending}
                    onPress={() => openDispute(o._id)}
                  />
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ── Schedule Meetup Modal ─────────────────────────────────────────────── */}
      <Modal visible={scheduleModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-white dark:bg-slate-950 p-6 pt-4">
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </View>
            <Text className="text-2xl font-outfit-bl text-slate-900 dark:text-white mb-4">
              Schedule Meetup
            </Text>

            <View className="mb-3">
              <Text className="text-sm font-outfit-m text-slate-600 dark:text-slate-300 mb-1">
                Location *
              </Text>
              <TextInput
                value={scheduleLocation}
                onChangeText={setScheduleLocation}
                placeholder="e.g. Main Gate, Library"
                placeholderTextColor="#94a3b8"
                className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-sm font-outfit-m text-slate-600 dark:text-slate-300 mb-1">
                Date & Time (optional)
              </Text>
              <TextInput
                value={scheduleScheduledAt}
                onChangeText={setScheduleScheduledAt}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor="#94a3b8"
                className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-outfit-m text-slate-600 dark:text-slate-300 mb-1">
                Notes (optional)
              </Text>
              <TextInput
                value={scheduleNotes}
                onChangeText={setScheduleNotes}
                placeholder="Any extra details"
                placeholderTextColor="#94a3b8"
                className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
                multiline
                numberOfLines={2}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Pressable
                  onPress={() => setScheduleModalOpen(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 items-center"
                >
                  <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">
                    Cancel
                  </Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Pressable
                  disabled={scheduleM.isPending || !scheduleLocation.trim()}
                  onPress={() => {
                    if (!scheduleLocation.trim()) return;
                    scheduleM.mutate({
                      orderId: scheduleOrderId,
                      location: scheduleLocation.trim(),
                      scheduledAt: scheduleScheduledAt.trim() || undefined,
                      notes: scheduleNotes.trim() || undefined,
                    });
                  }}
                  className={`rounded-xl bg-indigo-600 px-4 py-3 items-center ${
                    scheduleM.isPending || !scheduleLocation.trim() ? "opacity-60" : ""
                  }`}
                >
                  {scheduleM.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-[15px] font-outfit-sb text-white">Confirm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fix B1: Cross-platform dispute modal (replaces Alert.prompt) ─────────── */}
      <Modal visible={disputeModalOpen} animationType="slide" transparent onRequestClose={() => setDisputeModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-white dark:bg-slate-950 p-6 pt-4">
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </View>
            <Text className="text-2xl font-outfit-bl text-slate-900 dark:text-white mb-2">
              File a Dispute
            </Text>
            <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400 mb-4">
              Briefly describe the issue. Our team will review it within 24 hours.
            </Text>

            <TextInput
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Describe the problem..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white mb-4 min-h-[100px]"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Pressable
                  onPress={() => { setDisputeModalOpen(false); setDisputeReason(""); }}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 items-center"
                >
                  <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">
                    Cancel
                  </Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Pressable
                  disabled={disputeM.isPending || !disputeReason.trim()}
                  onPress={() => {
                    if (!disputeReason.trim()) return;
                    disputeM.mutate({ orderId: disputeOrderId, reason: disputeReason.trim() });
                  }}
                  className={`rounded-xl bg-red-600 px-4 py-3 items-center ${
                    disputeM.isPending || !disputeReason.trim() ? "opacity-60" : ""
                  }`}
                >
                  {disputeM.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-[15px] font-outfit-sb text-white">Submit</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
