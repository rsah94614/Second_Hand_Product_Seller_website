export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  role: "user" | "admin";
  isVerified?: boolean;
  profileRole?: string;
  campus?: Record<string, string>;
  wishlist?: string[];
  wishlistCount?: number;
  blocked?: string[];
};

export type ProductImage = string | { url?: string };

export type Msg = {
  _id: string;
  content?: string;
  image?: string;
  sender: unknown;
  receiver: unknown;
  createdAt?: string;   // primary — set by Mongoose timestamps
  timestamp?: string;   // legacy fallback for old messages
  read?: boolean;
  delivered?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  idempotencyKey?: string;
};

export type OrderRow = {
  _id: string;
  status: string;
  total: number;
  reviewUnlocked?: boolean;
  items?: { product?: string; title?: string; image?: string; price?: number }[];
  meetupDetails?: {
    location?: string;
    scheduledAt?: string;
    notes?: string;
  };
  user?: { _id?: string; name?: string; avatar?: string };
  seller?: { _id?: string; name?: string };
};
