import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../lib/api/cart";
import {
  deleteProduct,
  getProduct,
  getRelatedProducts,
  reportProduct,
} from "../../lib/api/products";
import { submitSellerReview, toggleWishlist } from "../../lib/api/users";
import { PRODUCT_FALLBACK_IMAGE } from "../../lib/fallbackImage";
import { formatInr } from "../../lib/format";
import { getImageUri } from "../../lib/product-image";
import { ProductCard, type ProductListItem } from "../../components/ProductCard";
import { Ionicons } from "@expo/vector-icons";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [imgIdx, setImgIdx] = useState(0);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ["related", id],
    queryFn: () => getRelatedProducts(id!),
    enabled: !!id,
  });

  const sellerId =
    product?.seller && typeof product.seller === "object"
      ? String((product.seller as { _id?: string })._id || "")
      : product?.seller
        ? String(product.seller)
        : "";

  const isOwner = user && sellerId && user.id === sellerId;
  const isWishlisted = Boolean(user?.wishlist?.includes(String(id)));

  const addCartM = useMutation({
    mutationFn: () => addToCart(String(id), 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      Alert.alert("Added", "Item added to cart.");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Error", e.response?.data?.message || "Could not add to cart.");
    },
  });

  const wishM = useMutation({
    mutationFn: () => toggleWishlist(String(id)),
    onSuccess: async (res: { message?: string }) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const reviewM = useMutation({
    mutationFn: () =>
      submitSellerReview(String(sellerId), {
        rating: Math.min(5, Math.max(1, parseInt(reviewRating, 10) || 5)),
        comment: reviewComment.trim(),
        productId: String(id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      setReviewComment("");
      Alert.alert("Thanks", "Seller review submitted.");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Error", e.response?.data?.message || "Review failed.");
    },
  });

  const reportM = useMutation({
    mutationFn: () =>
      reportProduct(String(id), {
        targetType: "product",
        reason: reportReason.trim(),
        details: reportDetails.trim(),
      }),
    onSuccess: () => {
      setReportReason("");
      setReportDetails("");
      Alert.alert("Report sent", "Thank you.");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Error", e.response?.data?.message || "Report failed.");
    },
  });

  const delM = useMutation({
    mutationFn: () => deleteProduct(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.back();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Error", e.response?.data?.message || "Delete failed.");
    },
  });

  if (!id || isLoading) return <Screen><Loading /></Screen>;
  if (error || !product) return <Screen><View className="flex-1 justify-center items-center"><Text className="text-xl font-outfit-sb">Product not found.</Text></View></Screen>;

  const images = (product.images || [])
    .map((im: string | { url?: string }) => getImageUri(im))
    .filter(Boolean);
  const mainUri = images[imgIdx] || PRODUCT_FALLBACK_IMAGE;
  const available = !product.isSold && product.isActive !== false;
  const relatedProducts: ProductListItem[] = related?.products || [];

  const sellerName = product.seller && typeof product.seller === "object" ? (product.seller as { name?: string }).name : "";
  const sellerAverageRating =
    product.seller && typeof product.seller === "object"
      ? Number((product.seller as { averageRating?: number }).averageRating || 0)
      : 0;
  const sellerReviewCount =
    product.seller && typeof product.seller === "object"
      ? Number((product.seller as { reviewCount?: number }).reviewCount || 0)
      : 0;
  const sellerReviews =
    product.seller && typeof product.seller === "object"
      ? ((product.seller as {
          reviews?: {
            _id: string;
            rating?: number;
            comment?: string;
            user?: { name?: string };
          }[];
        }).reviews || [])
      : [];

  return (
    <Screen className="bg-white dark:bg-slate-950" safeAreaTop={false}>
      <Stack.Screen options={{ title: product?.title || "Product Details" }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="relative">
          <Pressable onPress={() => images.length && setImgIdx((i) => (i + 1) % Math.max(images.length, 1))}>
            <Image source={{ uri: mainUri }} style={{ width: "100%", aspectRatio: 1 }} contentFit="cover" transition={300} />
          </Pressable>
          {images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
               {images.map((_: any, i: number) => (
                 <View key={i} className={`h-2 rounded-full ${imgIdx === i ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
               ))}
            </View>
          )}
          {user && (
             <Pressable 
               className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md items-center justify-center shadow-lg shadow-black/20"
               onPress={() => wishM.mutate()}
             >
               <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={26} color={isWishlisted ? "#ef4444" : "#1e293b"} />
             </Pressable>
          )}
        </View>

        <View className="px-5 pt-6 bg-white dark:bg-slate-950 -mt-6 rounded-t-3xl relative z-10">
          <View className="flex-row items-start justify-between">
             <View className="flex-1 pr-4">
                <Text className="text-[24px] font-outfit-b text-slate-900 dark:text-white leading-tight">{product.title}</Text>
             </View>
             <Text className="text-[26px] font-outfit-bl text-primary-600 dark:text-primary-400">{formatInr(product.price)}</Text>
          </View>
          
          <View className="flex-row items-center mt-3 gap-4">
            {product.location ? (
              <View className="flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <Ionicons name="location" size={14} color="#64748b" />
                <Text className="text-[13px] font-outfit-m text-slate-600 dark:text-slate-300">{product.location}</Text>
              </View>
            ) : null}
            {!available && (
               <View className="bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full">
                  <Text className="text-[13px] font-outfit-m text-red-600 dark:text-red-400 uppercase tracking-widest">Sold Out</Text>
               </View>
            )}
          </View>

          {sellerName && (
             <View className="flex-row items-center gap-3 mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
               <View className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center">
                  <Text className="text-lg font-outfit-sb text-primary-600 dark:text-primary-400">{sellerName.charAt(0).toUpperCase()}</Text>
               </View>
               <View className="flex-1">
                 <Text className="text-[12px] font-outfit-m text-slate-500 uppercase tracking-widest">Sold By</Text>
                 <Text className="text-[16px] font-outfit-b text-slate-900 dark:text-white">{sellerName}</Text>
                 <View className="mt-1 flex-row items-center gap-1">
                   <Ionicons name="star" size={14} color="#fbbf24" />
                   <Text className="text-[13px] font-outfit-m text-slate-600 dark:text-slate-300">
                     {sellerReviewCount > 0 ? `${sellerAverageRating.toFixed(1)} (${sellerReviewCount} review${sellerReviewCount === 1 ? "" : "s"})` : "No seller reviews yet"}
                   </Text>
                 </View>
               </View>
               {user && sellerId && sellerId !== user.id && (
                  <Pressable onPress={() => router.push(`/chat/${sellerId}` as never)} className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/40 items-center justify-center active:scale-95">
                    <Ionicons name="chatbubbles" size={20} color="#6366f1" />
                  </Pressable>
               )}
             </View>
          )}

          <View className="mt-8">
            <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white mb-3 tracking-wide">Description</Text>
            <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed">{product.description || "No description provided."}</Text>
          </View>

          {isOwner && (
            <View className="mt-8 flex-row gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
               <View className="flex-1"><Button title="Edit Listing" variant="outline" onPress={() => router.push(`/edit-product/${id}` as never)} /></View>
               <View className="flex-1"><Button title="Delete" variant="danger" loading={delM.isPending} onPress={() => {
                   Alert.alert("Delete listing?", "This cannot be undone.", [
                     { text: "Cancel", style: "cancel" },
                     { text: "Delete", style: "destructive", onPress: () => delM.mutate() },
                   ]);
               }} /></View>
            </View>
          )}

          {user && sellerId && sellerId !== user.id && (
             <View className="mt-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none">
               <Text className="font-outfit-sb text-slate-900 dark:text-white mb-4">Review this seller</Text>
               <TextInput
                 value={reviewRating}
                 onChangeText={setReviewRating}
                 keyboardType="numeric"
                 placeholder="Rating (1-5)"
                 className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-outfit text-slate-900 dark:text-white mb-3"
                 placeholderTextColor="#94a3b8"
               />
               <TextInput
                 value={reviewComment}
                 onChangeText={setReviewComment}
                 placeholder="Share your experience with the seller..."
                 multiline
                 className="min-h-[100px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-outfit text-slate-900 dark:text-white mb-4"
                 placeholderTextColor="#94a3b8"
                 textAlignVertical="top"
               />
               <Button title="Submit Seller Review" onPress={() => reviewM.mutate()} loading={reviewM.isPending} />
             </View>
          )}

          {sellerReviews.length > 0 && (
            <View className="mt-8">
              <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white mb-4">Seller Reviews</Text>
              {sellerReviews.map((r) => (
                <View key={r._id} className="mb-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <View className="flex-row items-center mb-1">
                     <Ionicons name="star" size={16} color="#fbbf24" />
                     <Text className="ml-1 font-outfit-sb text-slate-700 dark:text-slate-300">{r.rating}</Text>
                  </View>
                  {r.user?.name ? (
                    <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">{r.user.name}</Text>
                  ) : null}
                  <Text className="mt-1 text-[14px] font-outfit text-slate-600 dark:text-slate-400 leading-snug">{r.comment}</Text>
                </View>
              ))}
            </View>
          )}

          {relatedProducts.length > 0 && (
            <View className="mt-8 mb-4">
              <Text className="mb-4 text-[18px] font-outfit-b text-slate-900 dark:text-white tracking-wide">You Might Also Like</Text>
              <View className="flex-row flex-wrap gap-[10px]">
                {relatedProducts.slice(0, 4).map((p) => (
                  <View key={p._id} className="w-[48%]">
                    <ProductCard product={p} />
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View className="mt-6 mb-10 pt-4 border-t border-slate-100 dark:border-slate-800">
             <Text className="font-outfit-sb text-slate-900 dark:text-white mb-3 text-sm tracking-wider uppercase text-center">Report Issue</Text>
             <Pressable 
               onPress={() => {
                 Alert.alert(
                   "Report Listing",
                   "Why are you reporting this listing?",
                   [
                     { text: "Cancel", style: "cancel" },
                     { text: "Spam", onPress: () => { setReportReason("Spam"); reportM.mutate(); } },
                     { text: "Misleading", onPress: () => { setReportReason("Misleading"); reportM.mutate(); } },
                     { text: "Inappropriate", onPress: () => { setReportReason("Inappropriate"); reportM.mutate(); } },
                   ]
                 );
               }}
               className="py-2 active:opacity-60"
             >
               <Text className="text-sm font-outfit-m text-red-500 text-center">Report this listing</Text>
             </Pressable>
          </View>
        </View>
      </ScrollView>

      {user && available && !isOwner && (
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 pb-8 flex-row gap-3">
          <View className="flex-1">
             <Button variant="outline" title="Add to Cart" onPress={() => addCartM.mutate()} loading={addCartM.isPending} />
          </View>
          <View className="flex-1">
             <Button title="Buy Now" onPress={() => router.push(`/order/${id}` as never)} />
          </View>
        </View>
      )}
    </Screen>
  );
}
