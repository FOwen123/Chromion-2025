export interface PaymentLink {
  id: string; // UUID
  title: string;
  description?: string;
  amount: string; // in ETH
  currency: string; // 'ETH' for now, expandable later
  slug: string; // custom URL slug
  creator_wallet: string; // wallet address of creator
  is_active: boolean;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string; // UUID
  payment_link_id: string; // FK to PaymentLink
  payer_wallet: string;
  amount_paid: string;
  transaction_hash: string;
  status: 'pending' | 'completed' | 'failed';
  paid_at: string;
  created_at: string;
}

export interface PaymentLinkFormData {
  title: string;
  description: string;
  amount: string;
  customSlug: string;
  expiryDate: string;
} 