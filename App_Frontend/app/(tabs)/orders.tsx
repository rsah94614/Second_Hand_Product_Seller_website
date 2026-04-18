import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { Alert, FlatList, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import {
  acceptOrder,
  cancelOrder,
  completeOrder,
  createDispute,
  getOrders,
  reportNoShow,
  scheduleMeetup,
  uploadConfirmationPhoto,
} from "../../lib/api/orders";
import { formatInr } from "../../lib/format";

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

export default function OrdersScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: !!user,
  });

  const orders: OrderRow[] = Array.isArray(data) ? data : data?.orders || [];

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleOrderId, setScheduleOrderId] = useState<string>("");
  const [scheduleLocation, setScheduleLocation] = useState("");
  const [scheduleScheduledAt, setScheduleScheduledAt] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  const openSchedule = (orderId: string) => {
    setScheduleOrderId(orderId);
    setScheduleLocation("");
    setScheduleScheduledAt("");
    setScheduleNotes("");
    setScheduleModalOpen(true);
  };

  const cancelM = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const acceptM = useMutation({
    mutationFn: (orderId: string) => acceptOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const scheduleM = useMutation({
    mutationFn: (payload: { orderId: string; location: string; scheduledAt?: string; notes?: string }) =>
      scheduleMeetup(payload.orderId, {
        location: payload.location,
        scheduledAt: payload.scheduledAt || undefined,
        notes: payload.notes || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
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
          { text: "Rate seller", onPress: () => router.push((`/review/${sellerId}?orderId=${orderId}` as never)) },
        ]);
      } else {
        Alert.alert("Completed", "Deal marked as completed.");
      }
    },
  });

  const noShowM = useMutation({
    mutationFn: (payload: { orderId: string; noShowBy: "buyer" | "seller"; reason?: string }) =>
      reportNoShow(payload.orderId, {
        noShowBy: payload.noShowBy,
        reason: payload.reason || "",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const disputeM = useMutation({
    mutationFn: (payload: { orderId: string; reason: string }) =>
      createDispute(payload.orderId, { reason: payload.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert("Dispute submitted", "Our team will review your dispute.");
    },
  });

  const confirmPhotoM = useMutation({
    mutationFn: (payload: { orderId: string; formData: FormData }) =>
      uploadConfirmationPhoto(payload.orderId, payload.formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const handleDispute = (orderId: string) => {
    Alert.prompt(
      "File a Dispute",
      "Briefly describe the issue:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: (reason) => {
            if (!reason?.trim()) return;
            disputeM.mutate({ orderId, reason: reason.trim() });
          },
        },
      ],
      "plain-text"
    );
  };

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
          const canSchedule = status === "accepted" && (isBuyer || isSeller);
          const canComplete = status === "meetup_scheduled" && isBuyer;
          const canNoShow = status === "meetup_scheduled" && (isBuyer || isSeller);
          const canDispute = ["meetup_scheduled", "completed", "no_show"].includes(status) && (isBuyer || isSeller);
          const canConfirmPhoto = status === "completed" && (isBuyer || isSeller);

          const tone = statusTone(status);

          return (
            <View className="mb-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row justify-between items-start mb-3">
                 <View className="flex-1 pr-4">
                    <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white leading-tight">
                       {first?.title || "Order"}
                    </Text>
                 </View>
                 <Text className="text-lg font-outfit-b text-primary-600 dark:text-primary-400">{formatInr(o.total || 0)}</Text>
              </View>
              
              <View className="flex-row justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                 <View className={`px-2.5 py-1 rounded-lg ${tone.bg}`}>
                    <Text className={`text-[12px] font-outfit-sb uppercase tracking-wider ${tone.text}`}>{status}</Text>
                 </View>
              </View>

              {status === "meetup_scheduled" ? (
                <View className="mt-3">
                  <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">Meetup</Text>
                  <Text className="mt-1 text-[14px] font-outfit-sb text-slate-900 dark:text-white">
                    {o.meetupDetails?.location || "Location TBD"}
                  </Text>
                  {o.meetupDetails?.scheduledAt ? (
                    <Text className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
                      {new Date(o.meetupDetails.scheduledAt).toLocaleString()}
                    </Text>
                  ) : null}
                  {o.meetupDetails?.notes ? (
                    <Text className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">{o.meetupDetails.notes}</Text>
                  ) : null}
                </View>
              ) : null}

              <View className="mt-4 flex-row flex-wrap gap-2">
                {canCancel ? (
                  <Pressable
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
                    className="rounded-xl bg-red-50 dark:bg-red-950/30 px-3 py-2"
                  >
                    <Text className="text-[13px] font-outfit-sb text-red-600 dark:text-red-300">Cancel</Text>
                  </Pressable>
                ) : null}

                {canAccept ? (
                  <Pressable
                    onPress={() => acceptM.mutate(o._id)}
                    className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2"
                    disabled={acceptM.isPending}
                  >
                    <Text className="text-[13px] font-outfit-sb text-indigo-700 dark:text-indigo-200">Accept</Text>
                  </Pressable>
                ) : null}

                {canSchedule ? (
                  <Pressable
                    onPress={() => openSchedule(o._id)}
                    className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2"
                  >
                    <Text className="text-[13px] font-outfit-sb text-indigo-700 dark:text-indigo-200">Schedule</Text>
                  </Pressable>
                ) : null}

                {canComplete ? (
                  <Pressable
                    onPress={() =>
                      Alert.alert("Complete deal", "Mark this meetup as completed?", [
                        { text: "No", style: "cancel" },
                        { text: "Complete", onPress: () => completeM.mutate(o._id) },
                      ])
                    }
                    className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2"
                  >
                    <Text className="text-[13px] font-outfit-sb text-emerald-700 dark:text-emerald-200">Complete</Text>
                  </Pressable>
                ) : null}

                {canNoShow ? (
                  <Pressable
                    onPress={() => {
                      const noShowBy: "buyer" | "seller" = isBuyer ? "buyer" : "seller";
                      Alert.alert("Report no-show", "Report no-show for this meetup?", [
                        { text: "No", style: "cancel" },
                        { text: "Report", style: "destructive", onPress: () => noShowM.mutate({ orderId: o._id, noShowBy }) },
                      ]);
                    }}
                    className="rounded-xl bg-orange-50 dark:bg-orange-900/30 px-3 py-2"
                  >
                    <Text className="text-[13px] font-outfit-sb text-orange-700 dark:text-orange-200">No-Show</Text>
                  </Pressable>
                ) : null}

                {canConfirmPhoto ? (
                  <Pressable
                    onPress={() => handleConfirmPhoto(o._id)}
                    disabled={confirmPhotoM.isPending}
                    className="rounded-xl bg-blue-50 dark:bg-blue-900/30 px-3 py-2"
                  >
                    <Text className="text-[13px] font-outfit-sb text-blue-700 dark:text-blue-200">Add Photo</Text>
                  </Pressable>
                ) : null}

                {canDispute ? (
                  <Pressable
                    onPress={() => handleDispute(o._id)}
                    disabled={disputeM.isPending}
                    className="rounded-xl bg-red-50 dark:bg-red-900/30 px-3 py-2"
                  >
                    <Text className="text-[13px] font-outfit-sb text-red-700 dark:text-red-200">Dispute</Text>
                  </Pressable>
                ) : null}
              </View>            </View>
          );
        }}
      />

      <Modal visible={scheduleModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="h-[90%] rounded-t-3xl bg-white dark:bg-slate-950 p-6 pt-4">
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </View>
            <Text className="text-2xl font-outfit-bl text-slate-900 dark:text-white mb-4">Schedule meetup</Text>

            <View className="flex-1">
              <View className="mb-3">
                <Text className="text-sm font-outfit-m text-slate-600 dark:text-slate-300 mb-1">Location</Text>
                <TextInput
                  value={scheduleLocation}
                  onChangeText={setScheduleLocation}
                  placeholder="e.g. Main Gate"
                  placeholderTextColor="#94a3b8"
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm font-outfit-m text-slate-600 dark:text-slate-300 mb-1">Scheduled at (optional)</Text>
                <TextInput
                  value={scheduleScheduledAt}
                  onChangeText={setScheduleScheduledAt}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor="#94a3b8"
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm font-outfit-m text-slate-600 dark:text-slate-300 mb-1">Notes (optional)</Text>
                <TextInput
                  value={scheduleNotes}
                  onChangeText={setScheduleNotes}
                  placeholder="Extra details"
                  placeholderTextColor="#94a3b8"
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
                  multiline
                />
              </View>
            </View>

            <View className="flex-row gap-3 pt-3">
              <View className="flex-1">
                <Pressable
                  onPress={() => setScheduleModalOpen(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 items-center"
                >
                  <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">Cancel</Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Pressable
                  disabled={scheduleM.isPending || !scheduleLocation.trim()}
                  onPress={() => {
                    if (!scheduleLocation.trim()) return;
                    scheduleM.mutate(
                      {
                        orderId: scheduleOrderId,
                        location: scheduleLocation.trim(),
                        scheduledAt: scheduleScheduledAt.trim() || undefined,
                        notes: scheduleNotes.trim() || undefined,
                      },
                      {
                        onSuccess: () => setScheduleModalOpen(false),
                      }
                    );
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-3 items-center"
                >
                  <Text className="text-[15px] font-outfit-sb text-white">
                    {scheduleM.isPending ? "Scheduling..." : "Schedule"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
