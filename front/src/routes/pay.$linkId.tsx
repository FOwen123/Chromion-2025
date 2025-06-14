import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConnectEmbed, useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react"
import { client } from "@/lib/client"
import { supabase } from "@/lib/supabase/supabase-client"
import { useAccountStore } from "@/stores/accounts"
import { toast } from "sonner"
import { sendTransaction, prepareTransaction } from "thirdweb"
import { defineChain } from "thirdweb/chains"
import { createWallet } from "thirdweb/wallets"

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
  expires_at: string
  max_uses: number
  current_uses: number
  total_collected: number
}

export const Route = createFileRoute('/pay/$linkId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { linkId } = Route.useParams()
  const { account, isLoggedIn, logout } = useAccountStore()
  const activeAccount = useActiveAccount()
  const activeWallet = useActiveWallet()
  const { disconnect } = useDisconnect()
  
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
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

      setPaymentLink(data)
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

  const handlePayment = async () => {
    if (!activeAccount || !paymentLink) return

    setIsPaying(true)
    try {
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_link_id: paymentLink.id,
          payer_wallet: account?.address,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          chain_id: paymentLink.chain_id,
          status: 'pending'
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Prepare the transaction based on currency
      let transaction
      const chain = defineChain(paymentLink.chain_id)
      
      if (paymentLink.currency === 'ETH') {
        // Native ETH transfer
        transaction = prepareTransaction({
          to: paymentLink.creator_wallet,
          value: BigInt(Math.floor(paymentLink.amount * 1e18)), // Convert to Wei
          chain,
          client,
        })
      } else {
        // For now, just ETH payments (can add ERC-20 later)
        transaction = prepareTransaction({
          to: paymentLink.creator_wallet,
          value: BigInt(Math.floor(paymentLink.amount * 1e18)),
          chain,
          client,
        })
      }

      // Send the transaction
      const result = await sendTransaction({
        account: activeAccount,
        transaction,
      })

      // Update payment record with transaction hash
      await supabase
        .from('payments')
        .update({
          tx_hash: result.transactionHash,
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      // Update payment link usage count
      await supabase
        .from('payment_links')
        .update({
          current_uses: paymentLink.current_uses + 1,
          total_collected: paymentLink.amount + (paymentLink.total_collected || 0)
        })
        .eq('id', paymentLink.id)

      toast.success("Payment completed successfully!")
      window.location.href = '/dashboard'
      
    } catch (error) {
      console.error("Payment failed:", error)
      toast.error("Payment failed. Please try again.")
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Link Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Single Unified Payment Card */}
        <Card className="w-full mx-2 sm:mx-0">
          {/* Only show header/title AFTER wallet is connected */}
          {isWalletConnected && (
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">{paymentLink?.title}</CardTitle>
              {paymentLink?.description && (
                <CardDescription className="text-sm sm:text-base">{paymentLink.description}</CardDescription>
              )}
            </CardHeader>
          )}
          
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Only show payment details AFTER wallet is connected */}
            {isWalletConnected && (
              <>
                {/* Payment Details Section */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
                      {paymentLink?.amount} {paymentLink?.currency}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Payment Amount
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium">Recipient:</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all max-w-[120px] sm:max-w-none">
                        <span className="hidden sm:inline">{paymentLink?.creator_wallet.slice(0, 6)}...{paymentLink?.creator_wallet.slice(-4)}</span>
                        <span className="sm:hidden">{paymentLink?.creator_wallet.slice(0, 4)}...{paymentLink?.creator_wallet.slice(-4)}</span>
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium">Network:</span>
                      <Badge variant="secondary" className="text-xs">
                        {paymentLink?.chain_id === 1 ? 'Ethereum' : 
                         paymentLink?.chain_id === 137 ? 'Polygon' :
                         paymentLink?.chain_id === 56 ? 'BSC' : 'Other'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium">Currency:</span>
                      <span>{paymentLink?.currency}</span>
                    </div>

                    {paymentLink?.expires_at && (
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="font-medium">Expires:</span>
                        <span className="text-right">{new Date(paymentLink.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}

                    {paymentLink?.max_uses && (
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="font-medium">Uses:</span>
                        <span>{paymentLink.current_uses} / {paymentLink.max_uses}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Wallet Connection & Payment Section */}
            <div className="space-y-4 sm:space-y-6">
              {!isWalletConnected ? (
                <div className="text-center space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      To continue with the payment, please login first
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground px-2">
                      Connect your wallet to securely complete this payment
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <ConnectEmbed client={client} 
                    theme="dark" 
                    wallets={[
                      createWallet("io.metamask"),
                      createWallet("com.coinbase.wallet"),
                      createWallet("me.rainbow"),
      ]}/>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-muted rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">Connected Wallet</div>
                        <div className="font-mono text-xs sm:text-sm break-all">
                          <span className="hidden sm:inline">{activeAccount?.address.slice(0, 6)}...{activeAccount?.address.slice(-4)}</span>
                          <span className="sm:hidden">{activeAccount?.address.slice(0, 4)}...{activeAccount?.address.slice(-4)}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 self-end sm:self-auto"
                        onClick={async () => {
                          try {
                            // Clear the store state first
                            logout()
                            
                            // Then disconnect the wallet if connected
                            if (activeWallet) {
                              await disconnect(activeWallet)
                            }
                          } catch (error) {
                            console.error("Error during logout:", error)
                          }
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                  
                  {/* Pay Now Button at bottom */}
                  <Button 
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="w-full text-sm sm:text-base py-3 sm:py-4"
                    size="lg"
                  >
                    {isPaying ? "Processing Payment..." : "Pay Now"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}
