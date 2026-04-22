import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { formatInr } from "../lib/format";
import { getImageUri } from "../lib/product-image";
import type { ProductImage } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toggleWishlist } from "../lib/api/users";
import { addToCart, getCart } from "../lib/api/cart";

export type ProductListItem = {
  _id: string;
  title: string;
  price: number;
  images?: ProductImage[];
  location?: string;
  isSold?: boolean;
  isActive?: boolean;
  createdAt?: string;
};

export function ProductCard({ product }: { product: ProductListItem }) {
  const uri = getImageUri(product.images?.[0]);
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const isWishlisted = Boolean(user?.wishlist?.includes(product._id));

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
  });

  const isInCart = cartData?.items?.some((item: any) => item.product?._id === product._id);

  const wishM = useMutation({
    mutationFn: () => toggleWishlist(product._id),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const cartM = useMutation({
    mutationFn: () => addToCart(product._id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const handleWishlist = () => {
    if (user) {
      wishM.mutate();
    }
  };

  return (
    <Link href={`/product/${product._id}` as never} asChild>
      <Pressable className="flex-1 overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-transform duration-200">
        <View className="relative">
          <Image
            source={{ uri }}
            style={{ width: "100%", aspectRatio: 1 }}
            contentFit="cover"
            transition={300}
          />
          {product.isSold && (
            <View className="absolute top-2 left-2 bg-red-500/90 rounded-full px-2.5 py-1 backdrop-blur-md">
              <Text className="text-[10px] font-outfit-b uppercase text-white tracking-wider">
                Sold Out
              </Text>
            </View>
          )}

          {user && (
            <Pressable
              className="absolute top-2 right-2 h-8 w-8 bg-white/90 dark:bg-slate-900/90 rounded-full items-center justify-center backdrop-blur-md shadow-sm"
              onPress={handleWishlist}
              disabled={wishM.isPending}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={16}
                color={isWishlisted ? "#ef4444" : "#64748b"}
              />
            </Pressable>
          )}

          <View className="absolute bottom-2 left-2 right-2 flex-row justify-between items-center">
            <View className="bg-white/90 dark:bg-slate-900/90 rounded-full px-2.5 py-1 backdrop-blur-sm shadow-sm">
              <Text className="text-[13px] font-outfit-b text-primary-600 dark:text-primary-400">
                {formatInr(product.price)}
              </Text>
            </View>
          </View>
        </View>
        <View className="p-3">
          <Text className="text-[15px] font-outfit-sb text-slate-900 dark:text-white leading-tight mb-1.5" numberOfLines={2}>
            {product.title}
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1 flex-row items-center gap-1">
              {product.location ? (
                <Text className="text-[11px] font-outfit-m text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  {product.location}
                </Text>
              ) : null}
            </View>
            {product.createdAt && (
              <Text className="text-[10px] font-outfit-m text-slate-400 dark:text-slate-500">
                {new Date(product.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>

          {!product.isSold && user && (
            <Pressable
              className={`mt-auto py-2 rounded-xl items-center flex-row justify-center gap-1 transition-colors ${isInCart ? "bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"}`}
              onPress={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isInCart) cartM.mutate();
              }}
              disabled={cartM.isPending || isInCart}
            >
              <Ionicons name={isInCart ? "checkmark-circle" : "cart-outline"} size={14} color={isInCart ? "#10b981" : "#6366f1"} />
              <Text className={`text-[12px] font-outfit-sb ${isInCart ? "text-emerald-600 dark:text-emerald-400" : "text-primary-600 dark:text-primary-400"}`}>
                {cartM.isPending ? "Adding..." : isInCart ? "In Cart" : "Add to Cart"}
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Link>
  );
}
