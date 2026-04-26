import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Screen } from "../../components/ui/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { checkoutCart, getCart, removeFromCart, type ShippingDetails } from "../../lib/api/cart";
import { formatInr } from "../../lib/format";
import { getImageUri } from "../../lib/product-image";
import type { ProductImage } from "../../lib/types";

type CartItem = {
  product: {
    _id: string;
    title: string;
    price: number;
    images?: ProductImage[];
  };
  quantity: number;
};

export default function CartScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: "",
    addressLine1: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      setShipping((s) => ({
        ...s,
        fullName: s.fullName || user.name || "",
      }));
    }
  }, [user]);

  const removeM = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const checkoutM = useMutation({
    mutationFn: checkoutCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setModalOpen(false);
      Alert.alert("Success", "Order placed.");
      router.push("/(tabs)/orders");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Checkout failed", e.response?.data?.message || "Try again.");
    },
  });

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

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
          title="Could not load cart"
          message="Please try again and we will fetch your items."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }

  const items: CartItem[] = data?.items || [];
  const total: number = data?.summary?.totalAmount ?? 0;

  const setShip = (key: keyof ShippingDetails, v: string) =>
    setShipping((p) => ({ ...p, [key]: v }));

  const validateShipping = () => {
    const required: (keyof ShippingDetails)[] = [
      "fullName",
      "addressLine1",
      "city",
      "state",
      "postalCode",
    ];
    const missing = required.filter((key) => !shipping[key].trim());

    if (missing.length > 0) {
      Alert.alert("Required", `Fill these fields: ${missing.join(", ")}`);
      return false;
    }

    return true;
  };

  return (
    <Screen>
      <PageHeader title="My Cart" subtitle="Review your items before checkout" />
      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          message="Add something you like, then come back here to checkout."
          actionLabel="Explore products"
          onAction={() => router.push("/")}
        />
      ) : (
        <ScrollView className="flex-1 px-4 pt-4">
          <Text className="text-xl font-outfit-b text-slate-800 dark:text-slate-200 mb-4 ml-1">Your Items</Text>
          {items.map((row) => {
            const uri = getImageUri(row.product.images?.[0]);
            return (
              <View
                key={row.product._id}
                className="mb-4 flex-row overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm shadow-slate-200/50 dark:shadow-none"
              >
                <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 16 }} transition={300} />
                <View className="p-3 flex-1 justify-between">
                  <View>
                    <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white" numberOfLines={2}>
                      {row.product.title}
                    </Text>
                    <Text className="mt-1 text-lg font-outfit-b text-primary-600 dark:text-primary-400">{formatInr(row.product.price)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Qty: {row.quantity}</Text>
                    <Pressable
                      onPress={() => removeM.mutate(row.product._id)}
                      className="p-1 px-2 rounded-lg bg-red-50 dark:bg-red-950/30"
                    >
                      <Text className="text-[13px] font-outfit-sb text-red-600 dark:text-red-400">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}

          <View className="mt-4 mb-4 rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-outfit-m text-slate-600 dark:text-slate-400">Total Amount</Text>
              <Text className="text-2xl font-outfit-bl text-slate-900 dark:text-white">{formatInr(total)}</Text>
            </View>
          </View>

          <Button title="Proceed to Checkout" onPress={() => setModalOpen(true)} className="mb-10" />
        </ScrollView>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="h-[90%] rounded-t-3xl bg-slate-50 dark:bg-slate-950 p-6 pt-4">
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </View>
            <Text className="text-2xl font-outfit-bl text-slate-900 dark:text-white mb-6">Shipping Details</Text>
            <ScrollView className="" keyboardShouldPersistTaps="handled">
              <Input label="Full Name" value={shipping.fullName} onChangeText={(t) => setShip("fullName", t)} />
              <Input label="Address Line 1" value={shipping.addressLine1} onChangeText={(t) => setShip("addressLine1", t)} />
              <Input label="Landmark (Optional)" value={shipping.landmark} onChangeText={(t) => setShip("landmark", t)} />

              <View className="flex-row gap-4">
                <View className="flex-1"><Input label="City" value={shipping.city} onChangeText={(t) => setShip("city", t)} /></View>
                <View className="flex-1"><Input label="State" value={shipping.state} onChangeText={(t) => setShip("state", t)} /></View>
              </View>
              <Input label="Postal Code" keyboardType="numeric" value={shipping.postalCode} onChangeText={(t) => setShip("postalCode", t)} />
              <View className="h-24" />
            </ScrollView>
            <View className="absolute bottom-6 left-6 right-6 flex-row gap-3 pt-4">
              <View className="flex-1">
                <Button title="Cancel" variant="outline" onPress={() => setModalOpen(false)} />
              </View>
              <View className="flex-1">
                <Button
                  title="Confirm & Pay"
                  loading={checkoutM.isPending}
                  onPress={() => {
                    if (!validateShipping()) return;
                    checkoutM.mutate(shipping);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
