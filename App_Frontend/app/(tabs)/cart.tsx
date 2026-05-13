import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Screen } from "../../components/ui/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { checkoutCart, getCart, removeFromCart, updateCartItem, type ShippingDetails } from "../../lib/api/cart";
import { formatInr } from "../../lib/format";
import { getImageUri } from "../../lib/product-image";
import type { ProductImage } from "../../lib/types";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";
import { useToast } from "../../components/ui/AppToast";

type CartItem = {
  _id?: string;
  product: {
    _id: string;
    title: string;
    price: number;
    images?: ProductImage[];
    isSold?: boolean;
    isActive?: boolean;
    stock?: number;
  };
  quantity: number;
};

export default function CartScreen() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "Guwahati",
    state: "Assam",
    postalCode: "781014",
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
      showToast("Item removed from cart.");
    },
  });

  const updateQuantityM = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => updateCartItem(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to update quantity.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const checkoutM = useMutation({
    mutationFn: checkoutCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setModalOpen(false);
      showToast("Order placed successfully.");
      router.push("/orders");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Checkout failed. Try again.");
      Alert.alert("Checkout failed", formatErrorForDisplay(parsed));
    },
  });

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

  const hasUnavailableItems = items.some(
    (item) => !item.product || item.product.isSold || item.product.isActive === false
  );

  const setShip = (key: keyof ShippingDetails, v: string) =>
    setShipping((p) => ({ ...p, [key]: v }));

  const validateShipping = () => {
    const required: (keyof ShippingDetails)[] = [
      "fullName",
      "addressLine1",
    ];
    const missing = required.filter((key) => !shipping[key]?.trim());

    if (missing.length > 0) {
      Alert.alert("Required", "Please fill in your name and location details.");
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
            const isItemUnavailable = !row.product || row.product.isSold || row.product.isActive === false;
            const uri = getImageUri(row.product?.images?.[0]);
            return (
              <View
                key={row._id || row.product?._id || Math.random().toString()}
                className={`mb-4 flex-row overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm shadow-slate-200/50 dark:shadow-none ${isItemUnavailable ? 'opacity-60 bg-slate-50 dark:bg-slate-950' : ''}`}
              >
                <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 16 }} transition={300} />
                <View className="p-3 flex-1 justify-between">
                  <View>
                    <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white" numberOfLines={2}>
                      {row.product?.title || "Product removed"}
                    </Text>
                    {isItemUnavailable && (
                      <View className="self-start mt-1 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/50">
                        <Text className="text-[10px] font-outfit-b text-red-600 dark:text-red-400 uppercase tracking-widest">Currently Unavailable</Text>
                      </View>
                    )}
                    <Text className={`mt-1 text-lg font-outfit-b ${isItemUnavailable ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-primary-600 dark:text-primary-400'}`}>
                      {formatInr(row.product?.price || 0)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    {!isItemUnavailable ? (
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Pressable
                            onPress={() => updateQuantityM.mutate({ productId: row.product._id, quantity: Math.max(1, row.quantity - 1) })}
                            disabled={updateQuantityM.isPending || row.quantity <= 1}
                            className={`p-1.5 px-2 active:bg-slate-200 dark:active:bg-slate-700 rounded-l-lg ${(updateQuantityM.isPending || row.quantity <= 1) ? 'opacity-30' : 'opacity-100'}`}
                          >
                            <Ionicons name="remove" size={18} color="#64748b" />
                          </Pressable>
                          <Text className="text-[14px] font-outfit-sb text-slate-800 dark:text-slate-200 min-w-[20px] text-center">{row.quantity}</Text>
                          <Pressable
                            onPress={() => updateQuantityM.mutate({ productId: row.product._id, quantity: row.quantity + 1 })}
                            disabled={updateQuantityM.isPending || row.quantity >= (row.product?.stock || 1)}
                            className={`p-1.5 px-2 active:bg-slate-200 dark:active:bg-slate-700 rounded-r-lg ${(updateQuantityM.isPending || row.quantity >= (row.product?.stock || 1)) ? 'opacity-30' : 'opacity-100'}`}
                          >
                            <Ionicons name="add" size={18} color="#64748b" />
                          </Pressable>
                        </View>
                        {(row.product?.stock ?? 1) <= 5 && (row.product?.stock ?? 1) > 0 && (
                          <Text className="text-[10px] font-outfit-sb text-amber-600 dark:text-amber-500">Only {row.product.stock} left</Text>
                        )}
                      </View>
                    ) : (
                      <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
                        <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400">Qty: {row.quantity}</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => removeM.mutate(row.product?._id)}
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

          <View className="mb-10">
            <Button 
              title="Proceed to Checkout" 
              onPress={() => setModalOpen(true)} 
              disabled={hasUnavailableItems}
            />
            {hasUnavailableItems && (
              <Text className="text-center text-[13px] font-outfit-m text-red-500 mt-3 bg-red-50 dark:bg-red-950/30 p-2 rounded-xl">
                Remove unavailable items from your cart to proceed.
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="h-[90%] rounded-t-3xl bg-slate-50 dark:bg-slate-950 p-6 pt-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-outfit-bl text-slate-900 dark:text-white">Campus Checkout</Text>
              <Pressable onPress={() => setModalOpen(false)} className="p-1">
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Input 
                label="Full Name" 
                value={shipping.fullName} 
                onChangeText={(t) => setShip("fullName", t)} 
                placeholder="Broken" 
              />
              <Input 
                label="Hostel / Department / Meetup Spot" 
                value={shipping.addressLine1} 
                onChangeText={(t) => setShip("addressLine1", t)} 
                placeholder="Girls Hostel, Admin Block, Library gate..." 
              />
              <Input 
                label="Additional Note" 
                value={shipping.addressLine2 || ""} 
                onChangeText={(t) => setShip("addressLine2", t)} 
                placeholder="Preferred time, block, floor, or extra directions" 
              />
              <Input 
                label="Nearby Landmark" 
                value={shipping.landmark} 
                onChangeText={(t) => setShip("landmark", t)} 
                placeholder="Near canteen, hostel gate, admin block" 
              />

              <View className="mt-2 mb-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20 px-4 py-4">
                <Text className="text-[13px] font-outfit text-blue-800 dark:text-blue-300 leading-relaxed">
                  Checkout is campus-specific, so location will be recorded under Gauhati University, Guwahati, Assam.
                </Text>
              </View>
              
              <View className="h-32" />
            </ScrollView>

            <View className="absolute bottom-6 left-6 right-6 flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <View className="flex-1">
                <Button title="Cancel" variant="outline" onPress={() => setModalOpen(false)} />
              </View>
              <View className="flex-1">
                <Button
                  title="Place Order"
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
