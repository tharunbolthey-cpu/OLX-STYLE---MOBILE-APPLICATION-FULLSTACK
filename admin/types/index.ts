export type User = {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location?: string;
  role: "user" | "admin";
  status?: "active" | "suspended";
};

export type Category = {
  _id: string;
  name: string;
  icon?: string;
};

export type Listing = {
  _id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  location: string;
  status: "pending" | "active" | "sold" | "rejected" | "expired";
  images: string[];
  createdAt: string;
  expiresAt?: string;
  views?: number;

  category?: Category;

  seller?: {
    _id: string;
    name: string;
    email: string;
  };
};

export type Stats = {
  users: number;
  listings: number;
  active: number;
  pending: number;
  sold: number;
  reports: number;
};