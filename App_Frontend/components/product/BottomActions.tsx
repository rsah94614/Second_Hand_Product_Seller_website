import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../ui/Button";
import { router } from "expo-router";

type Props = {
  productId: string;
  stock: number;
  quantity: number;
  setQuantity: (q: number) => void;
  isInCart: boolean;
  onAddToCart: () => void;
  isAddingToCart: boolean;
};

export function BottomActions({
  productId,
  stock,
  quantity,
  setQuantity,
  isInCart,
  onAddToCart,
  isAddingToCart,
}: Props) {
  if (stock === 0) {
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 pb-8">
        <Button title="Sold Out" disabled variant="outline" onPress={() => {}} />
      </View>
    );
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 pb-8">
      <View className="flex-row items-center justify-between mb-4 bg-slate-50 dark:bg-slate-950 p-2 px-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300">Quantity</Text>
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            className="h-9 w-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center shadow-sm"
          >
            <Ionicons name="remove" size={18} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-outfit-bl text-slate-900 dark:text-white min-w-[24px] text-center">{quantity}</Text>
          <Pressable
            onPress={() => setQuantity(Math.min(stock, quantity + 1))}
            className="h-9 w-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center shadow-sm"
          >
            <Ionicons name="add" size={18} color="#64748b" />
          </Pressable>
        </View>
      </View>
      
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button
            variant="outline"
            title={isInCart ? "In Cart" : "Add to Cart"}
            onPress={onAddToCart}
            loading={isAddingToCart}
            disabled={isInCart || isAddingToCart}
          />
        </View>
        <View className="flex-1">
          <Button title="Buy Now" onPress={() => router.push(`/order/${productId}` as never)} />
        </View>
      </View>
    </View>
  );
}
