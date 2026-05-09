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
};

export type ProductImage = string | { url?: string };

export type Msg = {
  _id: string;
  content?: string;
  image?: string;
  sender: unknown;
  receiver: unknown;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
  delivered?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
};

export type OrderRow = {
  _id: string;
  status: string;
  total: number;
  items?: { product?: string; title?: string }[];
  meetupDetails?: {
    location?: string;
    scheduledAt?: string;
    notes?: string;
  };
  user?: { _id?: string };
  seller?: { _id?: string };
};
