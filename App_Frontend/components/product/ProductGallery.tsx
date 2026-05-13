import React, { useState, useRef } from "react";
import { View, Pressable, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { getImageUri } from "../../lib/product-image";
import { PRODUCT_FALLBACK_IMAGE } from "../../lib/fallbackImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  
  if (formattedImages.length === 0) {
    formattedImages.push(PRODUCT_FALLBACK_IMAGE);
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setImgIdx(viewableItems[0].index || 0);
    }
  }).current;

  return (
    <View className="relative">
      <FlatList
        data={formattedImages}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_WIDTH, aspectRatio: 1 }}
            contentFit="cover"
            transition={300}
          />
        )}
      />
      
      {formattedImages.length > 1 && (
        <View 
          className="absolute left-0 right-0 flex-row justify-center gap-2"
          style={{ bottom: 40 }} // Moved up to avoid overlap
        >
          {formattedImages.map((_: any, i: number) => (
            <View 
              key={i} 
              className={`h-1.5 rounded-full ${imgIdx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} 
            />
          ))}
        </View>
      )}

      <Pressable
        className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md items-center justify-center shadow-lg shadow-black/20"
        onPress={onWishlistToggle}
        style={{ zIndex: 20 }}
      >
        <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={26} color={isWishlisted ? "#ef4444" : "#1e293b"} />
      </Pressable>
    </View>
  );
}
