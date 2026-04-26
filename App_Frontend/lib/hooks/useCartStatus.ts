import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { addToCart, getCart } from "../api/cart";

/**
 * Shared hook for cart status of a single product.
 * Lifts cart queries out of ProductCard so we don't create N independent
 * subscribers — they all share the same ["cart"] cache entry.
 *
 * Usage:
 *   const { isInCart, addToCart: add, isPending } = useCartStatus(product._id);
 */
export function useCartStatus(productId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const isInCart = Boolean(
    cartData?.items?.some((item: { product?: { _id?: string } }) => item.product?._id === productId)
  );

  const cartMutation = useMutation({
    mutationFn: () => addToCart(productId, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const handleAddToCart = useCallback(() => {
    if (!isInCart && !cartMutation.isPending) {
      cartMutation.mutate();
    }
  }, [isInCart, cartMutation]);

  return {
    isInCart,
    addToCart: handleAddToCart,
    isPending: cartMutation.isPending,
  };
}
