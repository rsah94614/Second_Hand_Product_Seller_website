import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import {
  Alert,
  ScrollView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { addToCart, getCart } from "../../lib/api/cart";
import {
  deleteProduct,
  getProduct,
  getRelatedProducts,
  reportProduct,
} from "../../lib/api/products";
import { getOrders } from "../../lib/api/orders";
import { toggleWishlist, submitSellerReview } from "../../lib/api/users";
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
  const [quantity, setQuantity] = useState(1);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ targetType: 'product', reason: '', details: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

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

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
  });
  
  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: !!user,
  });

  const isInCart = cartData?.items?.some((item: any) => item.product?._id === id);

  const completedOrder = useMemo(() => {
    if (!ordersData) return null;
    const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
    return orders.find((o: any) => 
      o.status === "completed" && 
      o.items?.some((item: any) => 
        (typeof item.product === "string" ? item.product : item.product?._id) === id
      )
    );
  }, [ordersData, id]);

  const addCartM = useMutation({
    mutationFn: () => addToCart(String(id), quantity),
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

  const reportM = useMutation({
    mutationFn: () =>
      reportProduct(String(id), {
        targetType: reportForm.targetType,
        reason: reportForm.reason.trim(),
        details: reportForm.details.trim(),
      }),
    onSuccess: () => {
      Alert.alert("Report sent", "Thank you for reporting this listing.");
      setReportModalOpen(false);
      setReportForm({ targetType: 'product', reason: '', details: '' });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Error", e.response?.data?.message || "Report failed.");
    },
  });

  const reviewM = useMutation({
    mutationFn: () => submitSellerReview(sellerId, {
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      orderId: String(completedOrder?._id || ""),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      Alert.alert("Success", "Review submitted successfully.");
      setReviewForm(prev => ({ ...prev, comment: "" }));
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert("Error", e.response?.data?.message || "Could not submit review.");
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
  const sellerVerified =
    product.seller && typeof product.seller === "object"
      ? Boolean((product.seller as { sellerVerified?: boolean }).sellerVerified)
      : false;
  const daysRemaining = product.daysRemaining ?? null;
  const isExpiringSoon = Boolean(product.isExpiringSoon);

  const existingReview = sellerReviews.find((r: any) => r.user?._id === user?.id || r.user === user?.id);

  useEffect(() => {
    if (existingReview) {
      setReviewForm({ rating: existingReview.rating || 5, comment: existingReview.comment || "" });
    }
  }, [existingReview?.rating, existingReview?.comment]);

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
            {daysRemaining !== null && daysRemaining !== undefined && available && (
              <View className={`px-3 py-1.5 rounded-full ${isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Text className={`text-[12px] font-outfit-m ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {daysRemaining > 0 ? `${daysRemaining}d left` : "Expired"}
                </Text>
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
                <View className="flex-row items-center gap-1.5 flex-wrap">
                  <Text className="text-[16px] font-outfit-b text-slate-900 dark:text-white">{sellerName}</Text>
                  {sellerVerified && (
                    <View className="bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">
                      <Text className="text-[10px] font-outfit-b text-emerald-600 dark:text-emerald-400">✓ Verified</Text>
                    </View>
                  )}
                </View>
                <View className="mt-1 flex-row items-center gap-1">
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text className="text-[13px] font-outfit-m text-slate-600 dark:text-slate-300">
                    {sellerReviewCount > 0 ? `${sellerAverageRating.toFixed(1)} (${sellerReviewCount} review${sellerReviewCount === 1 ? "" : "s"})` : "No seller reviews yet"}
                  </Text>
                </View>
              </View>
              {user && sellerId && sellerId !== user.id && (
                <Pressable
                  onPress={() =>
                    router.push(
                      (`/chat/${sellerId}?name=${encodeURIComponent(String(sellerName || "Chat"))}` as never)
                    )
                  }
                  className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/40 items-center justify-center active:scale-95"
                >
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


          {user && (
            <View className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
              <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white mb-4">Seller Reviews</Text>
              
              {completedOrder ? (
                <View className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                  <Text className="text-[15px] font-outfit-sb text-slate-900 dark:text-white mb-3">Rate your experience</Text>
                  <View className="flex-row gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Pressable key={s} onPress={() => setReviewForm((f) => ({ ...f, rating: s }))} className="p-1">
                        <Ionicons name={reviewForm.rating >= s ? "star" : "star-outline"} size={28} color="#fbbf24" />
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    value={reviewForm.comment}
                    onChangeText={(t) => setReviewForm((f) => ({ ...f, comment: t }))}
                    placeholder="Write your review..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    className="min-h-[80px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-[15px] font-outfit text-slate-900 dark:text-white mb-4"
                    textAlignVertical="top"
                  />
                  <Button title="Submit Review" loading={reviewM.isPending} onPress={() => reviewM.mutate()} />
                </View>
              ) : (
                <View className="mb-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400 text-center">
                    You can only review a seller after completing a deal with them.
                  </Text>
                </View>
              )}

              {sellerReviews.length > 0 && (
                <View className="gap-3">
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
              onPress={() => setReportModalOpen(true)}
              className="py-2 active:opacity-60"
            >
              <Text className="text-sm font-outfit-m text-red-500 text-center">Report this listing</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {user && available && !isOwner && (
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 pb-8">
          <View className="flex-row items-center justify-between mb-4 bg-slate-50 dark:bg-slate-950 p-2 px-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300">Quantity</Text>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                className="h-9 w-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center shadow-sm"
              >
                <Ionicons name="remove" size={18} color="#64748b" />
              </Pressable>
              <Text className="text-lg font-outfit-bl text-slate-900 dark:text-white min-w-[24px] text-center">{quantity}</Text>
              <Pressable
                onPress={() => setQuantity(q => Math.min(product.stock || 1, q + 1))}
                className="h-9 w-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center shadow-sm"
              >
                <Ionicons name="add" size={18} color="#64748b" />
              </Pressable>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                variant={isInCart ? "outline" : "outline"}
                title={isInCart ? "In Cart" : "Add to Cart"}
                onPress={() => { if (!isInCart) addCartM.mutate(); }}
                loading={addCartM.isPending}
                disabled={isInCart || addCartM.isPending || product.stock === 0}
              />
            </View>
            <View className="flex-1">
              <Button title="Buy Now" onPress={() => router.push(`/order/${id}` as never)} disabled={product.stock === 0} />
            </View>
          </View>
        </View>
      )}

      <Modal visible={reportModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-slate-50 dark:bg-slate-950 p-6 pt-4 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-outfit-bl text-slate-900 dark:text-white">Report Issue</Text>
              <Pressable onPress={() => setReportModalOpen(false)} className="p-1">
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>
            <View className="flex-row gap-3 mb-6">
              <Pressable 
                onPress={() => setReportForm(prev => ({ ...prev, targetType: "product" }))}
                className={`flex-1 py-3 rounded-xl border ${reportForm.targetType === "product" ? "bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800" : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"}`}
              >
                <Text className={`text-center font-outfit-sb ${reportForm.targetType === "product" ? "text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400"}`}>Report Listing</Text>
              </Pressable>
              {sellerId && (
                <Pressable 
                  onPress={() => setReportForm(prev => ({ ...prev, targetType: "user" }))}
                  className={`flex-1 py-3 rounded-xl border ${reportForm.targetType === "user" ? "bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800" : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"}`}
                >
                  <Text className={`text-center font-outfit-sb ${reportForm.targetType === "user" ? "text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400"}`}>Report Owner</Text>
                </Pressable>
              )}
            </View>
            <Input
              label="Reason"
              value={reportForm.reason}
              onChangeText={(t) => setReportForm(prev => ({ ...prev, reason: t }))}
              placeholder="E.g. spam, fake photos, abusive"
            />
            <TextInput
              value={reportForm.details}
              onChangeText={(t) => setReportForm(prev => ({ ...prev, details: t }))}
              placeholder="Additional details (optional)"
              placeholderTextColor="#94a3b8"
              multiline
              className="min-h-[100px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-[16px] font-outfit text-slate-900 dark:text-white mb-6"
              textAlignVertical="top"
            />
            <Button
              title="Submit Report"
              variant="danger"
              loading={reportM.isPending}
              onPress={() => {
                if (!reportForm.reason.trim()) {
                  Alert.alert("Required", "Please provide a reason.");
                  return;
                }
                reportM.mutate();
              }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
