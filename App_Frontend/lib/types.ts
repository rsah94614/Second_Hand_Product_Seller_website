export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: "user" | "admin";
  isVerified?: boolean;
  campus?: Record<string, string>;
  wishlist?: string[];
  wishlistCount?: number;
};

export type ProductImage = string | { url?: string };
