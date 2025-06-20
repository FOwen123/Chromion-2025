import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from "react"
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react"
import { sendTransaction, prepareContractCall, getContract, waitForReceipt } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { client } from "@/lib/client"
import { Transfer } from "@/lib/contract"
import { supabase } from "@/lib/supabase/supabase-client"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, Clock, AlertCircle, ArrowRight, Package, RefreshCw, LogOut } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCCIPTracking, type CCIPStatus } from "@/hooks/useCCIPTracking"
import { useAccountStore } from "@/stores/accounts"
import { ConnectEmbed } from "thirdweb/react"
import { createWallet } from "thirdweb/wallets"

// Destination escrow contract address on the destination chain
const DESTINATION_ESCROW_CONTRACT = "0xd17997e2306301c9E0Ca47d6ee6D3E67f9A3a712"

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
  const activeAccount = useActiveAccount()
  const activeWallet = useActiveWallet()
  const { disconnect } = useDisconnect()
  const { logout, login, isLoggedIn } = useAccountStore()
  
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processStage, setProcessStage] = useState<'escrowed' | 'confirming' | 'completed' | 'refunded'>('escrowed')
  const [ccipMessageId, setCcipMessageId] = useState<string | null>(null)
  const [returnToProcessFunds, setReturnToProcessFunds] = useState(false)
  
  // Use real CCIP tracking
  const { 
    progress: ccipProgress, 
    isPolling: isCCIPPolling, 
    getStepInfo, 
    getProgressPercentage, 
    getTimeEstimate,
    startTracking 
  } = useCCIPTracking(ccipMessageId || undefined)

  // Update payment status when CCIP completes
  useEffect(() => {
    const updatePaymentStatus = async () => {
      console.log("🔄 Checking payment status update:", {
        ccipStatus: ccipProgress.status,
        processStage,
        hasPayment: !!payment,
        messageId: ccipMessageId
      })
      
      if (ccipProgress.status === 'SUCCESS' && payment && (processStage === 'confirming' || (payment.status === 'confirming' && processStage !== 'completed'))) {
        try {
          console.log("🎉 CCIP completed successfully, updating payment status...")
          
          // Update payment to completed when CCIP succeeds
          const { error } = await supabase
            .from('payments')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
          
          if (error) throw error
          
          setProcessStage('completed')
          toast.success("🎉 Cross-chain transfer completed successfully!")
        } catch (error) {
          console.error("Failed to update payment status:", error)
        }
      } else if (ccipProgress.status === 'FAILED' && payment && processStage === 'confirming') {
        console.log("❌ CCIP failed, showing error state...")
        // Don't revert to escrowed, let the user see the error and choose action
        toast.error("❌ Cross-chain transfer failed.")
      } else {
        console.log("ℹ️ No status update needed:", {
          reason: ccipProgress.status !== 'SUCCESS' && ccipProgress.status !== 'FAILED' 
            ? `Status is ${ccipProgress.status}, waiting for completion`
            : `Process stage is ${processStage}, not confirming`
        })
      }
    }

    updatePaymentStatus()
  }, [ccipProgress.status, payment, processStage, ccipMessageId])

  // Removed automatic timeout - let real CCIP tracking determine completion
  // The CCIP polling system will handle timeouts appropriately

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

      console.log("Payment data:", data)
      setPayment(data)
      
      // Check if there's an existing CCIP message ID (from delivery_tx_hash field)
      if (data.delivery_tx_hash && data.status === 'confirming') {
        console.log("🔄 Found existing CCIP transaction, resuming tracking:", data.delivery_tx_hash)
        setCcipMessageId(data.delivery_tx_hash)
        
        // Start tracking the existing CCIP transaction immediately
        // This will check the current CCIP status and update accordingly
        startTracking(data.delivery_tx_hash)
        
        // Also force a status check after a brief moment to ensure immediate update
        setTimeout(() => {
          if (ccipProgress.status === 'SUCCESS') {
            console.log("🔄 Forcing immediate status update - CCIP already completed")
            setProcessStage('completed')
          }
        }, 1000)
      } else if (data.status === 'completed') {
        // If the payment is already completed, no need to track CCIP
        console.log("✅ Payment already completed, no CCIP tracking needed")
      }
      
      // Map database statuses to process stages, but check CCIP status for confirming payments
      let stage: 'escrowed' | 'confirming' | 'completed' | 'refunded' = 'escrowed'
      switch (data.status) {
        case 'pending_delivery':
        case 'escrowed':
          stage = 'escrowed'
          break
        case 'confirming':
          // If we have a CCIP message ID, the CCIP tracker will determine the real status
          stage = 'confirming'
          break
        case 'completed':
          stage = 'completed'
          break
        case 'refunded':
          stage = 'refunded'
          break
        default:
          stage = 'escrowed' // Default to escrowed for unknown statuses
      }
      setProcessStage(stage)
    } catch (error) {
      console.error("Error fetching payment:", error)
      setError("Payment not found or unable to load")
    } finally {
      setIsLoading(false)
    }
  }, [paymentId])

  useEffect(() => {
    fetchPayment()
  }, [fetchPayment])

  // Auto-login when wallet connects and we're returning to process funds
  useEffect(() => {
    if (activeAccount && (!isLoggedIn || returnToProcessFunds)) {
      login(activeAccount)
      setReturnToProcessFunds(false)
    }
  }, [activeAccount, isLoggedIn, login, returnToProcessFunds])

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log("🚪 Logging out...")
      
      // Set flag to return to process funds after re-login
      setReturnToProcessFunds(true)
      
      // Clear the store state first
      logout()
      
      // Then disconnect the wallet if connected
      if (activeWallet) {
        await disconnect(activeWallet)
      }
      
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Error during logout:", error)
      toast.error("Error during logout")
    }
  }

  const handleConfirmDelivery = async () => {
    console.log("🔄 handleConfirmDelivery called", { payment, activeAccount })
    
    if (!payment) {
      console.log("❌ Missing payment", { payment: !!payment })
      toast.error("Missing payment details")
      return
    }
    
    if (!activeAccount) {
      console.log("❌ No active account")
      toast.error("Please connect your wallet to confirm delivery")
      return
    }
    
    // Check if the connected account is the payer or seller (either can confirm delivery)
    const isAuthorized = activeAccount.address.toLowerCase() === payment.payer_wallet.toLowerCase() || 
                        activeAccount.address.toLowerCase() === payment.payment_links.creator_wallet.toLowerCase()
    
    if (!isAuthorized) {
      toast.error("Only the payer or seller can confirm delivery")
      return
    }
    
    console.log("✅ Authorized user:", activeAccount.address)

    setIsProcessing(true)
    setProcessStage('confirming')

    try {
      toast.info("🚀 Initiating cross-chain delivery...")
      console.log("📝 Updating payment status to confirming...")
      
      // Update payment status to confirming
      await supabase
        .from('payments')
        .update({
          status: 'confirming',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      console.log("🔗 Preparing contract call...")
      
      // Call the actual contract to transfer tokens via CCIP
      const contract = getContract({
        client,
        chain: sepolia,
        address: Transfer.smartContractAddress
      })

      console.log("📄 Contract created:", { address: Transfer.smartContractAddress })

      // STEP 2: Use transferTokensPayLINK to send funds FROM the source escrow contract TO the destination escrow contract
      // (Funds were sent TO the source contract in STEP 1 during payment)
      const transaction = prepareContractCall({
        contract,
        method: "function transferTokensPayLINK(uint64 _destinationChainSelector, address _receiver, uint256 _amount, address _seller) returns (bytes32 messageId)",
        params: [
          BigInt("14767482510784806043"), // Chain selector for destination
          DESTINATION_ESCROW_CONTRACT as `0x${string}`, // Receiver: destination escrow contract
          BigInt(Math.floor(payment.amount * 1000000)), // Amount in USDC (6 decimals) 
          payment.payment_links.creator_wallet as `0x${string}` // Seller: the original seller/creator
        ]
      })

      console.log("📋 Transaction prepared:", { 
        chainSelector: "14767482510784806043",
        receiver: DESTINATION_ESCROW_CONTRACT, // Funds will go TO destination escrow contract
        amount: Math.floor(payment.amount * 1000000),
        seller: payment.payment_links.creator_wallet, // Original seller for tracking
        note: "Transferring FROM source escrow contract TO destination escrow contract"
      })

      console.log("🚀 Sending transaction...")
      const result = await sendTransaction({ transaction, account: activeAccount })
      console.log("✅ CCIP Transfer transaction sent:", result)

      // Wait for transaction receipt to extract the real CCIP message ID
      console.log("📄 Getting transaction receipt to extract real CCIP message ID...")
      
      try {
        const receipt = await waitForReceipt({
          client,
          chain: sepolia,
          transactionHash: result.transactionHash
        })
        
        console.log("📄 Transaction receipt:", receipt)
        
        // Look for TokensTransferred event from our contract
        const contractLogs = receipt.logs.filter(log => 
          log.address.toLowerCase() === Transfer.smartContractAddress.toLowerCase()
        )
        
        console.log("📄 Contract logs:", contractLogs)
        
        // The TokensTransferred event has messageId as the first indexed parameter
        const tokensTransferredLog = contractLogs.find(log => 
          log.topics.length >= 2 // Should have messageId and destinationChainSelector as indexed params
        )
        
        if (tokensTransferredLog && tokensTransferredLog.topics[1]) {
          const realMessageId = tokensTransferredLog.topics[1]
          console.log("✅ Extracted real CCIP Message ID:", realMessageId)
          setCcipMessageId(realMessageId)
          
          // Save CCIP message ID to database for future tracking
          await supabase
            .from('payments')
            .update({
              delivery_tx_hash: realMessageId,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
          
          startTracking(realMessageId)
        } else {
          console.log("⚠️ Could not extract CCIP message ID from logs, using transaction hash as fallback")
          setCcipMessageId(result.transactionHash)
          
          // Save transaction hash to database as fallback
          await supabase
            .from('payments')
            .update({
              delivery_tx_hash: result.transactionHash,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
          
          startTracking(result.transactionHash)
        }
      } catch (error) {
        console.error("Error extracting message ID:", error)
        console.log("⚠️ Using transaction hash as fallback")
        setCcipMessageId(result.transactionHash)
        
        // Save transaction hash to database as fallback
        await supabase
          .from('payments')
          .update({
            delivery_tx_hash: result.transactionHash,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id)
        
        startTracking(result.transactionHash)
      }
      
      toast.success("✅ CCIP transfer initiated! Tracking cross-chain progress...")
      
    } catch (error) {
      console.error("Delivery confirmation failed:", error)
      toast.error(`Failed to confirm delivery: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setProcessStage('escrowed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefund = async () => {
    console.log("🔄 handleRefund called", { payment, activeAccount })
    
    if (!payment) {
      console.log("❌ Missing payment")
      toast.error("Missing payment details")
      return
    }
    
    if (!activeAccount) {
      console.log("❌ No active account")
      toast.error("Please connect your wallet to request refund")
      return
    }
    
    // Check if the connected account is the payer or seller (either can process refund)
    const isAuthorized = activeAccount.address.toLowerCase() === payment.payer_wallet.toLowerCase() || 
                        activeAccount.address.toLowerCase() === payment.payment_links.creator_wallet.toLowerCase()
    
    if (!isAuthorized) {
      toast.error("Only the payer or seller can process refunds")
      return
    }
    
    console.log("✅ Authorized user for refund:", activeAccount.address)

    setIsProcessing(true)

    try {
      toast.info("Processing refund...")
      
      // Call the contract to withdraw USDC tokens back to the payer
      const contract = getContract({
        client,
        chain: sepolia,
        address: Transfer.smartContractAddress
      })

      // Use the withdrawUsdcToken function to refund to the payer
      const transaction = prepareContractCall({
        contract,
        method: "function withdrawUsdcToken(address _beneficiary)",
        params: [payment.payer_wallet as `0x${string}`]
      })

      const result = await sendTransaction({ transaction, account: activeAccount })
      console.log("✅ Refund transaction sent:", result)
      
      // Update payment status to refunded
      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_tx_hash: result.transactionHash
        })
        .eq('id', payment.id)

      setProcessStage('refunded')
      toast.success("💰 Refund processed successfully!")
      
      // Show transaction details
      toast.success(`Refund Transaction: ${result.transactionHash.slice(0, 10)}...`, {
        action: {
          label: "View on Etherscan",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${result.transactionHash}`, '_blank')
        }
      });
      
    } catch (error) {
      console.error("Refund failed:", error)
      toast.error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'escrowed':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'confirming':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'refunded':
        return <RefreshCw className="h-5 w-5 text-orange-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStageText = (stage: string) => {
    switch (stage) {
      case 'escrowed':
        return 'Funds in Escrow'
      case 'confirming':
        return 'Confirming Delivery'
      case 'completed':
        return 'Delivery Completed'
      case 'refunded':
        return 'Refunded'
      default:
        return 'Unknown Status'
    }
  }

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

  // Show wallet connection if user is not connected
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center relative">
          {/* Logout button positioned at top right */}
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
          
          {/* Show connected wallet info */}
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

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">From:</span>
                <div className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1">
                  {payment.payer_wallet.slice(0, 6)}...{payment.payer_wallet.slice(-4)}
                </div>
              </div>
              <div>
                <span className="font-medium">To:</span>
                <div className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1">
                  {payment.payment_links.creator_wallet.slice(0, 6)}...{payment.payment_links.creator_wallet.slice(-4)}
                </div>
              </div>
            </div>

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

          {/* Process Stage Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {getStageIcon(processStage)}
              <Badge variant={processStage === 'completed' ? 'default' : processStage === 'refunded' ? 'destructive' : 'secondary'}>
                {getStageText(processStage)}
              </Badge>
            </div>

            {/* Real-time CCIP Progress Tracking */}
            {(processStage === 'confirming' || isCCIPPolling) && ccipMessageId && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Cross-Chain Transfer in Progress</h3>
                  <p className="text-sm text-muted-foreground">{getStepInfo(ccipProgress.status).description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated time: {getTimeEstimate(ccipProgress.status)}
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Step {ccipProgress.currentStep} of {ccipProgress.totalSteps}</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>

                {/* CCIP Status Badge and Description */}
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Badge 
                      variant={
                        ccipProgress.status === 'SUCCESS' ? 'default' : 
                        ccipProgress.status === 'FAILED' ? 'destructive' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {getStepInfo(ccipProgress.status).emoji} {ccipProgress.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      {getStepInfo(ccipProgress.status).description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTimeEstimate(ccipProgress.status)}
                    </p>
                  </div>
                </div>

                {/* Message ID for tracking */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">CCIP Message ID:</p>
                  <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {ccipMessageId.slice(0, 10)}...{ccipMessageId.slice(-8)}
                  </p>
                  
                  {/* Debug info */}
                  <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <p>Real CCIP Status: <span className="font-mono">{ccipProgress.status}</span></p>
                    <p>Process Stage: <span className="font-mono">{processStage}</span></p>
                    <p>Step: {ccipProgress.currentStep}/{ccipProgress.totalSteps}</p>
                    {ccipProgress.errorMessage && (
                      <p className="text-red-500">Error: {ccipProgress.errorMessage}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://ccip.chain.link/msg/${ccipMessageId}`, '_blank')}
                      className="w-full"
                    >
                      View on CCIP Explorer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://sepolia.etherscan.io/tx/${ccipMessageId}`, '_blank')}
                      className="w-full"
                    >
                      View on Etherscan
                    </Button>
                  </div>
                </div>

                {/* Error Message */}
                {ccipProgress.errorMessage && (
                  <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      {ccipProgress.errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Simple Progress Steps for Non-Confirming States */}
            {processStage !== 'confirming' && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className={`flex items-center space-x-1 ${processStage !== 'refunded' ? 'text-green-500' : ''}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>Escrowed</span>
                </div>
                <ArrowRight className="h-3 w-3" />
                <div className={`flex items-center space-x-1 ${processStage === 'completed' ? 'text-green-500' : ''}`}>
                  <Package className="h-3 w-3" />
                  <span>Delivery</span>
                </div>
                <ArrowRight className="h-3 w-3" />
                <div className={`flex items-center space-x-1 ${processStage === 'completed' ? 'text-green-500' : ''}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>Completed</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {processStage === 'escrowed' && (
            <div className="flex space-x-4">
              <Button
                onClick={handleConfirmDelivery}
                disabled={isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Confirm Delivery
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleRefund}
                disabled={isProcessing}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Request Refund
                  </>
                )}
              </Button>
            </div>
          )}

          {processStage === 'confirming' && !ccipMessageId && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Initializing cross-chain transfer...
              </AlertDescription>
            </Alert>
          )}

          {processStage === 'confirming' && ccipProgress.status === 'FAILED' && (
            <div className="space-y-4">
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  ❌ {ccipProgress.errorMessage || 'Cross-chain transfer failed'}
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setProcessStage('escrowed')
                    setCcipMessageId(null)
                    toast.info("You can try confirming delivery again")
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button
                  onClick={handleRefund}
                  disabled={isProcessing}
                  variant="destructive"
                  size="sm" 
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Request Refund
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {processStage === 'completed' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Payment has been successfully delivered to the recipient!
              </AlertDescription>
            </Alert>
          )}

          {processStage === 'refunded' && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <RefreshCw className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                Payment has been refunded to your wallet.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
