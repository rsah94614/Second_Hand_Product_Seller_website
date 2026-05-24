import React from "react";
import { View } from "react-native";
import { Button } from "../ui/Button";
import { router } from "expo-router";

type Props = {
  productId: string;
  stock: number;
  isInCart: boolean;
  onAddToCart: () => void;
  isAddingToCart: boolean;
};

export function BottomActions({
  productId,
  stock,
  isInCart,
  onAddToCart,
  isAddingToCart,
}: Props) {
  if (stock === 0) {
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 pb-8">
        <Button title="Sold Out" disabled variant="outline" onPress={() => { }} />
      </View>
    );
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 pb-8">


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
