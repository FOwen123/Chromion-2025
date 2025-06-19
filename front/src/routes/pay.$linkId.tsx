import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from "react"
import { useActiveAccount } from "thirdweb/react"
import { supabase } from "@/lib/supabase/supabase-client"
import { PaymentLoadingState } from "@/components/payment/PaymentLoadingState"
import { PaymentCard } from "@/components/payment/PaymentCard"
import { usePaymentFlow } from "@/hooks/usePaymentFlow"

interface PaymentLink {
  id: string
  short_id: string
  creator_wallet: string
  title: string
  description: string
  amount: number
  currency: string
  chain_id: number
  status: string
  current_uses: number
  total_collected: number
}


export const Route = createFileRoute('/pay/$linkId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { linkId } = Route.useParams()
  const activeAccount = useActiveAccount()
  const { handlePayment, isPaying } = usePaymentFlow()
  
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use activeAccount as primary indicator of wallet connection
  const isWalletConnected = !!activeAccount

  const fetchPaymentLink = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('short_id', linkId)
        .eq('status', 'active')
        .single()

      if (error) throw error

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This payment link has expired")
        return
      }

      // Check if max uses reached
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setError("This payment link has reached its maximum number of uses")
        return
      }

      // Debug log to see what we're getting from the database
      console.log("Payment link data from database:", data);
      
      // Ensure currency defaults to USDC if not set
      const processedData = {
        ...data,
        currency: data.currency || 'USDC', // Default to USDC if currency is null/undefined
        chain_id: data.chain_id || 11155111 // Default to Sepolia if chain_id is null/undefined
      };

      console.log("Processed payment link data:", processedData);
      setPaymentLink(processedData)
    } catch (error) {
      console.error("Error fetching payment link:", error)
      setError("Payment link not found or is no longer active")
    } finally {
      setIsLoading(false)
    }
  }, [linkId])

  useEffect(() => {
    fetchPaymentLink()
  }, [fetchPaymentLink])

  // Handle payment using the custom hook
  const onPayment = () => {
    if (paymentLink) {
      handlePayment(paymentLink)
    }
  }

  // Show loading or error states
  if (isLoading || error) {
    return <PaymentLoadingState isLoading={isLoading} error={error} />
  }

  // Show payment card
  if (paymentLink) {
    return (
      <PaymentCard
        paymentLink={paymentLink}
        isWalletConnected={isWalletConnected}
        onPayment={onPayment}
        isPaying={isPaying}
      />
    )
  }

  return null
}
