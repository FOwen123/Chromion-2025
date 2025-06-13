import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL!
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserProfile {
  id: string
  wallet_address: string
  first_login: string
  last_login: string
  login_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaymentLink {
  id: string
  short_id: string
  creator_wallet: string
  title: string
  description?: string
  amount: number
  currency: string
  chain_id: number
  status: 'active' | 'paused' | 'expired'
  expires_at?: string
  max_uses?: number
  current_uses: number
  total_collected: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  payment_link_id: string
  payer_wallet: string
  amount: number
  currency: string
  chain_id: number
  tx_hash?: string
  status: 'pending' | 'completed' | 'failed'
  paid_at?: string
  created_at: string
  updated_at: string
}