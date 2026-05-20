import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  View,
  Pressable,
  InteractionManager,
} from "react-native";
import { Screen } from "../../components/ui/Screen";
import { KeyboardShiftView } from "../../components/ui/KeyboardShiftView";
import { Button } from "../../components/ui/Button";
import { useProductDetails } from "../../lib/hooks/useProductDetails";
import { ProductGallery } from "../../components/product/ProductGallery";
import { SellerSection } from "../../components/product/SellerSection";
import { ReviewSection } from "../../components/product/ReviewSection";
import { BottomActions } from "../../components/product/BottomActions";
import { ReportModal } from "../../components/product/ReportModal";
import { ProductCard } from "../../components/ProductCard";
import { formatInr } from "../../lib/format";
import { Ionicons } from "@expo/vector-icons";

const openEditProduct = (productId: string) => {
  setTimeout(() => {
    router.push(`/edit-product/${productId}` as never);
  }, 80);
};

export default function ProductDetailScreen() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <ProductDetailContent />;
}

function ProductDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    product,
    isLoading,
    error,
    related,
    user,
    isOwner,
    isWishlisted,
    isInCart,
    quantity,
    setQuantity,
    reviewForm,
    setReviewForm,
    completionData,
    completedOrder,
    sellerReviews,
    addCartM,
    wishM,
    reportM,
    reviewM,
    delM,
  } = useProductDetails(String(id));

  const [reportModalOpen, setReportModalOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <Text style={{ color: "white", fontSize: 18 }}>Product not found.</Text>
      </View>
    );
  }

  const available = !product.isSold && product.isActive !== false;
  const daysRemaining = product.daysRemaining ?? null;
  const isExpiringSoon = Boolean(product.isExpiringSoon);

  return (
    <Screen className="bg-white dark:bg-slate-950" safeAreaTop={false} safeAreaBottom={false}>
      <KeyboardShiftView>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
          <ProductGallery
            images={product.images || []}
            isWishlisted={isWishlisted}
            onWishlistToggle={() => wishM.mutate()}
          />

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
              {daysRemaining !== null && available && (
                <View className={`px-3 py-1.5 rounded-full ${isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Text className={`text-[12px] font-outfit-m ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {daysRemaining > 0 ? `${daysRemaining}d left` : "Expired"}
                  </Text>
                </View>
              )}
            </View>

            <SellerSection
              seller={product.seller}
              currentUserId={user?.id}
              canTrade={completionData?.canTrade ?? false}
            />

            <View className="mt-8">
              <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white mb-3 tracking-wide">Description</Text>
              <Text className="text-[15px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed">
                {product.description || "No description provided."}
              </Text>
            </View>

            {isOwner && (
              <View className="mt-8 flex-row gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <View className="flex-1">
                  <Button title="Edit Listing" variant="outline" onPress={() => openEditProduct(String(id))} />
                </View>
                <View className="flex-1">
                  <Button
                    title="Delete"
                    variant="danger"
                    loading={delM.isPending}
                    onPress={() => {
                      Alert.alert("Delete listing?", "This cannot be undone.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => delM.mutate() },
                      ]);
                    }}
                  />
                </View>
              </View>
            )}

            {user && (
              <ReviewSection
                reviews={sellerReviews}
                canReview={!!completedOrder}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                onSubmitReview={() => reviewM.mutate()}
                isSubmitting={reviewM.isPending}
                currentUserId={user.id}
              />
            )}

            {related.length > 0 && (
              <View className="mt-8 mb-4">
                <Text className="mb-4 text-[18px] font-outfit-b text-slate-900 dark:text-white tracking-wide">You Might Also Like</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 40, gap: 12 }}
                  className="-mx-5 px-5 pb-2"
                >
                  {related.map((p: any) => (
                    <View key={p._id} style={{ width: 160 }}>
                      <ProductCard product={p} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="mt-6 mb-10 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Text className="font-outfit-sb text-slate-900 dark:text-white mb-3 text-sm tracking-wider uppercase text-center">Report Issue</Text>
              <Pressable onPress={() => setReportModalOpen(true)} className="py-2 active:opacity-60">
                <Text className="text-sm font-outfit-m text-red-500 text-center">Report this listing</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardShiftView>

      {user && available && !isOwner && (
        <BottomActions
          productId={String(id)}
          stock={product.stock || 1}
          quantity={quantity}
          setQuantity={setQuantity}
          isInCart={isInCart}
          onAddToCart={() => addCartM.mutate()}
          isAddingToCart={addCartM.isPending}
        />
      )}

      <ReportModal
        visible={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(data) => {
          reportM.mutate(data);
          setReportModalOpen(false);
        }}
        loading={reportM.isPending}
        hasSeller={!!product.seller}
      />
    </Screen>
  );
}
