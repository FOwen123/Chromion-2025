import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/supabase-client"

interface Payment {
  id: string
  payment_link_id: string
  payer_wallet: string
  amount: number
  currency: string
  chain_id: number
  status: string
  tx_hash: string
  delivery_tx_hash?: string
  paid_at: string
  payment_links: {
    id: string
    title: string
    description: string
    creator_wallet: string
    short_id: string
  }
}

export function usePayment(paymentId?: string) {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayment = useCallback(async () => {
    if (!paymentId) {
      setError("No payment ID provided")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payment_links!inner(
            id,
            title,
            description,
            creator_wallet,
            short_id
          )
        `)
        .eq('id', paymentId)
        .single()

      if (error) throw error

      setPayment(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching payment:", error)
      setError("Payment not found or unable to load")
    } finally {
      setIsLoading(false)
    }
  }, [paymentId])

  return {
    payment,
    isLoading,
    error,
    refetch: fetchPayment
  }
} 