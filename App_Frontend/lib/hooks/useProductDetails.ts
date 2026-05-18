import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { addToCart, getCart } from "../api/cart";
import {
  deleteProduct,
  getProduct,
  getRelatedProducts,
  reportProduct,
} from "../api/products";
import { getOrders } from "../api/orders";
import { toggleWishlist, submitSellerReview, getProfileCompletion } from "../api/users";
import { parseApiError, formatErrorForDisplay } from "../utils/errorHandler";
import { useToast } from "../../components/ui/AppToast";

export function useProductDetails(id: string) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [reportForm, setReportForm] = useState({ targetType: 'product', reason: '', details: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ["related", id],
    queryFn: () => getRelatedProducts(id),
    enabled: !!id,
  });

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

  const { data: completionData } = useQuery({
    queryKey: ["profile-completion"],
    queryFn: getProfileCompletion,
    enabled: !!user,
  });

  // ── Derived State ──────────────────────────────────────────────────────────
  const sellerId = useMemo(() => {
    if (!product?.seller) return "";
    return typeof product.seller === "object" ? String((product.seller as any)._id || "") : String(product.seller);
  }, [product]);

  const isOwner = user && sellerId && user.id === sellerId;
  const isWishlisted = Boolean(user?.wishlist?.includes(String(id)));
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

  const sellerReviews = useMemo(() => {
    if (product?.seller && typeof product.seller === "object") {
      return (product.seller as any).reviews || [];
    }
    return [];
  }, [product]);

  const existingReview = useMemo(() => {
    return sellerReviews.find((r: any) => r.user?._id === user?.id || r.user === user?.id);
  }, [sellerReviews, user]);

  useEffect(() => {
    if (existingReview) {
      setReviewForm({ rating: existingReview.rating || 5, comment: existingReview.comment || "" });
    }
  }, [existingReview]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addCartM = useMutation({
    mutationFn: () => {
      if (isOwner) return Promise.reject(new Error('You cannot add your own listing to your cart'));
      return addToCart(id, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      showToast("Item added to cart.");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Could not add to cart.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const wishM = useMutation({
    mutationFn: () => toggleWishlist(id),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      showToast(isWishlisted ? "Removed from wishlist." : "Saved to wishlist.");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Could not update wishlist.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const reportM = useMutation({
    mutationFn: (payload: { targetType: string; reason: string; details: string }) =>
      reportProduct(id, payload),
    onSuccess: () => {
      showToast("Report sent. Thank you for helping keep the marketplace safe.");
      setReportForm({ targetType: 'product', reason: '', details: '' });
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Report failed.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
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
      showToast("Review submitted successfully.");
      setReviewForm(prev => ({ ...prev, comment: "" }));
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Could not submit review.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const delM = useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showToast("Listing deleted.");
      router.back();
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Delete failed.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  return {
    product,
    isLoading,
    error,
    related: related?.products || [],
    user,
    isOwner,
    isWishlisted,
    isInCart,
    quantity,
    setQuantity,
    reportForm,
    setReportForm,
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
  };
}
