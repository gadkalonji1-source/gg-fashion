import type { CategoryId } from "./constants";

export type { CategoryId };

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  images: string[];
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  active: boolean;
  updatedAt: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PushToken = {
  token: string;
  platform: "ios" | "android" | "web";
  updatedAt: string;
};

export type StoreSnapshot = {
  products: Product[];
  announcements: Announcement[];
  reviews: Review[];
  pushTokens: PushToken[];
};
