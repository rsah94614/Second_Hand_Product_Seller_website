import { router } from "expo-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  Pressable,
  InteractionManager,
  Appearance,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../lib/hooks/useOrders";
import { OrderCard } from "../../components/orders/OrderCard";
import { ScheduleModal } from "../../components/orders/ScheduleModal";
import { DisputeModal } from "../../components/orders/DisputeModal";
import { OrderFlowInfoModal } from "../../components/orders/OrderFlowInfoModal";

export default function OrdersScreen() {
  const { user, loading: authLoading } = useAuth();
  const currentId = user?.id || "";

  const {
    orders,
    isLoading,
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
  } = useOrders();

  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");

  // Modal states
  const [scheduleOrderId, setScheduleOrderId] = useState<string | null>(null);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const buyerId = typeof o.user === 'object' && o.user ? (o.user as any)._id : o.user;
      const sellerId = typeof o.seller === 'object' && o.seller ? (o.seller as any)._id : o.seller;
      if (activeTab === "buying") return buyerId === currentId;
      return sellerId === currentId;
    });
  }, [orders, activeTab, currentId]);

  const handlePickPhoto = useCallback(async (orderId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const { uri, type } = result.assets[0];
      const formData = new FormData();
      const ext = uri.split('.').pop();
      formData.append("photo", {
        uri,
        name: `proof.${ext}`,
        type: type || "image/jpeg",
      } as any);

      photoM.mutate({ orderId, formData });
    }
  }, [photoM]);

  const handleTabChange = useCallback((tab: "buying" | "selling") => {
    InteractionManager.runAfterInteractions(() => {
      setActiveTab(tab);
    });
  }, []);

  const renderOrder = useCallback(({ item }: { item: any }) => (
    <OrderCard
      order={item}
      currentId={currentId}
      onAccept={(id) => acceptM.mutate(id)}
      onCancel={(id) => cancelM.mutate(id)}
      onSchedule={(id) => setScheduleOrderId(id)}
      onDeliver={(id) => deliverM.mutate(id)}
      onComplete={(id) => completeM.mutate(id)}
      onNoShow={(id) => noShowM.mutate({ orderId: id, noShowBy: activeTab === "buying" ? "seller" : "buyer" })}
      onDispute={(id) => setDisputeOrderId(id)}
      onPhoto={handlePickPhoto}
      isAccepting={acceptM.variables === item._id && acceptM.isPending}
      isCancelling={cancelM.variables === item._id && cancelM.isPending}
      isDelivering={deliverM.variables === item._id && deliverM.isPending}
      isCompleting={completeM.variables === item._id && completeM.isPending}
      isNoShow={noShowM.variables?.orderId === item._id && noShowM.isPending}
    />
  ), [currentId, activeTab, acceptM, cancelM, deliverM, completeM, noShowM, handlePickPhoto]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const isDark = Appearance.getColorScheme() === "dark";

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-[28px] font-outfit-bl text-slate-900 dark:text-white mb-6">My Orders</Text>

        {/* Tab bar + Info button row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              padding: 6,
              borderRadius: 16,
            }}
          >
            {(["buying", "selling"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => handleTabChange(tab)}
                  style={{
                    flex: 1,
                    backgroundColor: isActive ? (isDark ? "#334155" : "#ffffff") : "transparent",
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                    ...(isActive ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    } : {}),
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Outfit-SemiBold",
                      textTransform: "capitalize",
                      color: isActive ? (isDark ? "#c7d2fe" : "#4f46e5") : (isDark ? "#94a3b8" : "#64748b"),
                    }}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Info Button */}
          <Pressable
            onPress={() => setIsInfoModalOpen(true)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: isDark ? "#1e293b" : "#eef2ff",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#c7d2fe",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={isDark ? "#818cf8" : "#4f46e5"}
            />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title={activeTab === "buying" ? "No purchases yet" : "No incoming requests yet"}
            message={
              activeTab === "buying"
                ? "You haven't placed any orders yet. Start browsing the campus marketplace!"
                : "You don't have any active sales yet. List an item to start selling!"
            }
            actionLabel={activeTab === "buying" ? "Browse Products" : "Create Listing"}
            onAction={() =>
              activeTab === "buying"
                ? router.push("/(tabs)/products" as never)
                : router.push("/create-product" as never)
            }
          />
        }
        renderItem={renderOrder}
      />

      <ScheduleModal
        visible={!!scheduleOrderId}
        onClose={() => setScheduleOrderId(null)}
        loading={scheduleM.isPending}
        onSubmit={(data) => {
          if (scheduleOrderId) {
            scheduleM.mutate({ orderId: scheduleOrderId, ...data });
          }
        }}
      />

      <DisputeModal
        visible={!!disputeOrderId}
        onClose={() => setDisputeOrderId(null)}
        loading={disputeM.isPending}
        onSubmit={(reason) => {
          if (disputeOrderId) {
            disputeM.mutate({ orderId: disputeOrderId, reason });
            setDisputeOrderId(null);
          }
        }}
      />

      <OrderFlowInfoModal
        visible={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        activeTab={activeTab}
      />
    </Screen>
  );
}
