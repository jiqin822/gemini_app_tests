
export interface UserProfile {
  id: string;
  name: string;
  voicePrintId?: string;
  gender?: string;
  personalDescription?: string;
  interests?: string[];
  personalityType?: string; // e.g., MBTI or Big 5 summary
  attachmentStyle?: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  attachmentStats?: {
    anxiety: number; // 0-100
    avoidance: number; // 0-100
  };
  relationshipStatus: 'single' | 'dating' | 'married' | 'complicated';
  partnerName?: string; // Kept for backward compatibility/easy access
  lovedOnes: LovedOne[];
  preferences?: {
    notifications: boolean;
    hapticFeedback: boolean;
    privacyMode: boolean;
    shareData: boolean;
  };
  // Mock data container for the new analytics features
  stats?: {
    overallAffection: number; // 0-100
    communicationScore: number; // 0-100
    weeklyTrends: number[]; // Array of 7 days scores
  };
  economy?: EconomyConfig; // User's own economy settings (for others to earn)
}

export interface EconomyConfig {
  currencyName: string;
  currencySymbol: string;
}

export interface MarketItem {
  id: string;
  title: string;
  cost: number; // The value of the item (cost to buy, or reward for completing)
  icon: string;
  type: 'service' | 'product' | 'quest';
  category: 'earn' | 'spend'; // 'earn' = bounty/request, 'spend' = reward/offer
  description?: string;
}

export type TransactionStatus = 
  | 'purchased'        // Shop: Bought, in vault, waiting to be used
  | 'redeemed'         // Shop: Used/Consumed (Completed)
  | 'accepted'         // Bounty: Taken, in progress
  | 'pending_approval' // Bounty: Marked done, waiting for partner
  | 'approved'         // Bounty: Partner confirmed, currency paid
  | 'canceled';        // Bounty: Abandoned

export interface Transaction {
  id: string;
  itemId: string;
  title: string;
  cost: number;
  icon: string;
  category: 'earn' | 'spend';
  status: TransactionStatus;
  timestamp: number;
}

export interface LovedOne {
  id: string;
  name: string;
  relationship: string;
  economy?: EconomyConfig; // The currency used in this relationship (owned by the loved one)
  balance?: number; // The user's balance of this loved one's currency
  marketItems?: MarketItem[]; // Items available in this relationship context
  transactions?: Transaction[]; // History of interactions
  // Deprecated: inventory?: string[]; 
}

export enum AppMode {
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  LIVE_COACH = 'LIVE_COACH',
  THERAPIST = 'THERAPIST',
  ACTIVITIES = 'ACTIVITIES',
  LOVE_MAPS = 'LOVE_MAPS',
  PROFILE = 'PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
  REWARDS = 'REWARDS'
}

export interface ChatAction {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'danger';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  actions?: ChatAction[];
  isPartnerContext?: boolean; // If true, this message represents the partner's side
}

export interface ActivityCard {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'romantic' | 'fun' | 'deep' | 'active';
  xpReward: number;
}

export interface Memory {
  id: string;
  activityTitle: string;
  date: number;
  note: string;
  type: 'romantic' | 'fun' | 'deep' | 'active';
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
  redeemed: boolean;
}

export interface Nudge {
  type: 'warning' | 'encouragement' | 'insight';
  message: string;
  timestamp: number;
}
