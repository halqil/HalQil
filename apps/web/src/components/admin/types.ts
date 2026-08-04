import type { LucideIcon } from 'lucide-react';

// ─── User ────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  walletId: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  status: string;
  avatar: string | null;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  completedOrders: number;
  cancelledOrders: number;
  totalOrders: number;
  averageRating: number;
  lastActive: string | null;
}

// ─── Application ─────────────────────────────────────────────────
export interface ApplicationSkill {
  id: string;
  name: string;
  serviceType: string;
  experience: number;
  priceMin: number;
  priceMax: number;
  description: string;
  portfolio: string[];
}

export interface Application {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    walletId: string;
    avatar: string | null;
    phone: string | null;
  };
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  skills: ApplicationSkill[];
  districts: string[];
  motivation: string;
  documents: string[];
  status: string;
  rejectionNote: string | null;
  adminMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Organization Application ────────────────────────────────────
export interface OrgApplication {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    walletId: string;
    avatar: string | null;
  };
  organizationName: string;
  description: string;
  status: string;
  rejectionNote: string | null;
  createdAt: string;
}

// ─── Category & Skill ────────────────────────────────────────────
export interface ServiceType {
  id: string;
  skillId: string;
  name: string;
  description: string | null;
  pricingType: 'FIXED' | 'NEGOTIABLE' | 'MIN_MAX';
  fixedFee: number;
  providerTimeoutMinutes: number;
  isActive: boolean;
  providersCount: number;
  createdAt: string;
}

export interface Skill {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  serviceTypes?: ServiceType[];
  providersCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  skills: Skill[];
  providersCount: number;
  createdAt: string;
}

// ─── Dispute ─────────────────────────────────────────────────────
export interface DisputedOrder {
  id: string;
  skillName: string;
  status: string;
  disputeReason: string;
  unsuccessCategory: string | null;
  unsuccessReason: string | null;
  resolvedDecision: string | null;
  resolvedNote: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolver: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
    walletId: string;
    avatar: string | null;
  };
  provider: {
    id: string;
    name: string;
    walletId: string;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Chat ────────────────────────────────────────────────────────
export interface AdminChatItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────────
export type NotificationType = 'ANNOUNCEMENT' | 'WARNING' | 'NEWS' | 'SYSTEM';
export type TargetRole = 'ALL' | 'USER' | 'PROVIDER';

// ─── Pagination ──────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Shared Props ────────────────────────────────────────────────
export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
  exact?: boolean;
}
