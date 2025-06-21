import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ConnectEmbed } from "thirdweb/react"
import { client } from "@/lib/client"
import { toast } from "sonner"
import { Loader2, AlertCircle, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createWallet } from "thirdweb/wallets"

// Custom hooks
import { usePayment } from "@/hooks/usePayment"
import { useProcessFunds } from "@/hooks/useProcessFunds"
import { useWalletAuth } from "@/hooks/useWalletAuth"

// Components
import { PaymentDetails } from "@/components/payment/PaymentDetails"
import { SmartProgressIndicator } from "@/components/payment/SmartProgressIndicator"
import { ProcessActionButtons } from "@/components/payment/ProcessActionButtons"

export const Route = createFileRoute('/processfunds')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      paymentId: (search.paymentId as string) || undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { paymentId } = Route.useSearch()
  
  // Custom hooks for clean separation of concerns
  const { payment, isLoading, error, refetch } = usePayment(paymentId)
  const { activeAccount, handleLogout, handleAutoLogin } = useWalletAuth()
  const {
    isProcessing,
    processStage,
    setProcessStage,
    ccipMessageId,
    setCcipMessageId,
    ccipProgress,
    isCCIPPolling,
    startTracking,
    handleConfirmDelivery,
    handleRefund,
    handleManualComplete
  } = useProcessFunds(payment)

  // Combined effect for initialization and state management
  useEffect(() => {
    // Initialize payment data
    if (paymentId) {
      refetch()
    }

    // Handle auto-login
    handleAutoLogin()
  }, [paymentId, refetch, handleAutoLogin])

  // Combined effect for payment state management
  useEffect(() => {
    if (!payment) return

    // Set initial process stage based on payment status, but don't override active states
    const getInitialStage = () => {
      switch (payment.status) {
        case 'pending_delivery':
        case 'escrowed':
          return 'escrowed'
        case 'confirming':
          return 'confirming'
        case 'completed':
          return 'completed'
        case 'refunded':
          return 'refunded'
        default:
          return 'escrowed'
      }
    }

    // Only set initial stage if we're not already in an active state
    // This prevents overriding states set by user actions
    const currentIsActiveState = processStage === 'confirming' || processStage === 'completed' || processStage === 'refunded'
    if (!currentIsActiveState) {
      setProcessStage(getInitialStage())
    }

    // Resume CCIP tracking if there's an existing transaction
    // Check both delivery_tx_hash and tx_hash for backward compatibility
    const existingTxHash = payment.delivery_tx_hash || payment.tx_hash
    if (existingTxHash && payment.status === 'confirming' && !ccipMessageId) {
      setCcipMessageId(existingTxHash)
      startTracking(existingTxHash)
    }

    // Handle CCIP completion (moved from separate effect)
    if (ccipProgress.status === 'SUCCESS' && processStage === 'confirming') {
      setProcessStage('completed')
      toast.success("🎉 Cross-chain transfer completed successfully!")
    } else if (ccipProgress.status === 'FAILED' && processStage === 'confirming') {
      toast.error("❌ Cross-chain transfer failed.")
    }
  }, [payment, processStage, ccipProgress.status, setProcessStage, setCcipMessageId, startTracking, ccipMessageId])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading payment details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !payment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Payment not found"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Wallet connection required
  if (!activeAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to manage this payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ConnectEmbed 
                client={client} 
                theme="dark" 
                wallets={[
                  createWallet("io.metamask"),
                  createWallet("com.coinbase.wallet"),
                  createWallet("me.rainbow"),
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main component render
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="absolute top-4 right-4 h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          
          <CardTitle className="text-2xl font-bold">Process Payment</CardTitle>
          <CardDescription>
            Manage your escrowed payment and confirm delivery
          </CardDescription>
          
          <div className="text-xs text-muted-foreground mt-2">
            Connected: {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-4)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {payment.amount} {payment.currency}
              </div>
              <div className="text-sm text-muted-foreground">
                {payment.payment_links.title}
              </div>
            </div>

            <Separator />

            <PaymentDetails paymentLink={{
              amount: payment.amount,
              currency: payment.currency,
              creator_wallet: payment.payment_links.creator_wallet,
              chain_id: payment.chain_id,
              title: payment.payment_links.title,
              description: payment.payment_links.description
            }} />

            {payment.tx_hash && (
              <div className="text-sm">
                <span className="font-medium">Transaction:</span>
                <div className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1 flex items-center justify-between">
                  <span>{payment.tx_hash.slice(0, 10)}...{payment.tx_hash.slice(-6)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${payment.tx_hash}`, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Smart Progress Indicator */}
          <SmartProgressIndicator
            processStage={processStage}
            ccipProgress={ccipProgress}
            ccipMessageId={ccipMessageId}
            isCCIPPolling={isCCIPPolling}
            isProcessing={isProcessing}
            transactionHash={payment.tx_hash}
            onManualComplete={handleManualComplete}
            onRefund={handleRefund}
          />

          {/* Action Buttons */}
          <ProcessActionButtons
            processStage={processStage}
            isProcessing={isProcessing}
            onConfirmDelivery={handleConfirmDelivery}
            onRefund={handleRefund}
            ccipMessageId={ccipMessageId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
