import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { getImageUri } from "../../lib/product-image";
import { PRODUCT_FALLBACK_IMAGE } from "../../lib/fallbackImage";

type Props = {
  images: any[];
  isWishlisted: boolean;
  onWishlistToggle: () => void;
};

export function ProductGallery({ images, isWishlisted, onWishlistToggle }: Props) {
  const [imgIdx, setImgIdx] = useState(0);

  const formattedImages = images
    .map((im) => getImageUri(im))
    .filter(Boolean);
  
  const mainUri = formattedImages[imgIdx] || PRODUCT_FALLBACK_IMAGE;

  return (
    <View className="relative">
      <Pressable onPress={() => formattedImages.length && setImgIdx((i) => (i + 1) % Math.max(formattedImages.length, 1))}>
        <Image source={{ uri: mainUri }} style={{ width: "100%", aspectRatio: 1 }} contentFit="cover" transition={300} />
      </Pressable>
      
      {formattedImages.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
          {formattedImages.map((_: any, i: number) => (
            <View key={i} className={`h-2 rounded-full ${imgIdx === i ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
          ))}
        </View>
      )}

      <Pressable
        className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md items-center justify-center shadow-lg shadow-black/20"
        onPress={onWishlistToggle}
      >
        <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={26} color={isWishlisted ? "#ef4444" : "#1e293b"} />
      </Pressable>
    </View>
  );
}
