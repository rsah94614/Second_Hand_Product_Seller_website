import { PRODUCT_FALLBACK_IMAGE } from "./fallbackImage";
import type { ProductImage } from "./types";

export const getImageUri = (image?: ProductImage | null) => {
  if (!image) return PRODUCT_FALLBACK_IMAGE;
  if (typeof image === "string") return image || PRODUCT_FALLBACK_IMAGE;
  return image.url || PRODUCT_FALLBACK_IMAGE;
};
