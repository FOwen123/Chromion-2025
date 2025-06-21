import { useState, useCallback } from "react"
import { useActiveAccount } from "thirdweb/react"
import { sendTransaction, prepareContractCall, getContract, waitForReceipt } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { client } from "@/lib/client"
import { Transfer } from "@/lib/contract"
import { supabase } from "@/lib/supabase/supabase-client"
import { toast } from "sonner"
import { useCCIPTracking } from "./useCCIPTracking"

const DESTINATION_ESCROW_CONTRACT = "0x435F8F1dd271Ce2741CCb859cf588705a99929A8"

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

export type ProcessStage = 'escrowed' | 'confirming' | 'completed' | 'refunded'

export function useProcessFunds(payment: Payment | null) {
  const activeAccount = useActiveAccount()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStage, setProcessStage] = useState<ProcessStage>('escrowed')
  const [ccipMessageId, setCcipMessageId] = useState<string | null>(null)

  const { 
    progress: ccipProgress, 
    isPolling: isCCIPPolling, 
    getStepInfo, 
    getProgressPercentage, 
    getTimeEstimate,
    startTracking 
  } = useCCIPTracking(ccipMessageId || undefined)

  const updatePaymentStatus = useCallback(async (newStatus: string, additionalData: Record<string, any> = {}) => {
    if (!payment) return

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...additionalData
        })
        .eq('id', payment.id)
      
      if (error) throw error
    } catch (error) {
      console.error("Failed to update payment status:", error)
      throw error
    }
  }, [payment])

  const handleConfirmDelivery = useCallback(async () => {
    if (!payment || !activeAccount) {
      toast.error("Missing payment details or wallet connection")
      return
    }
    
    const isAuthorized = activeAccount.address.toLowerCase() === payment.payer_wallet.toLowerCase() || 
                        activeAccount.address.toLowerCase() === payment.payment_links.creator_wallet.toLowerCase()
    
    if (!isAuthorized) {
      toast.error("Only the payer or seller can confirm delivery")
      return
    }

    setIsProcessing(true)
    setProcessStage('confirming')

    try {
      toast.info("🚀 Initiating cross-chain delivery...")
      
      await updatePaymentStatus('confirming')

      const contract = getContract({
        client,
        chain: sepolia,
        address: Transfer.smartContractAddress
      })

      const transaction = prepareContractCall({
        contract,
        method: "function transferTokensPayLINK(uint64 _destinationChainSelector, address _receiver, uint256 _amount, address _seller) returns (bytes32 messageId)",
        params: [
          BigInt("14767482510784806043"),
          DESTINATION_ESCROW_CONTRACT as `0x${string}`,
          BigInt(Math.floor(payment.amount * 1000000)),
          payment.payment_links.creator_wallet as `0x${string}`
        ]
      })

      const result = await sendTransaction({ transaction, account: activeAccount })
      
      try {
        const receipt = await waitForReceipt({
          client,
          chain: sepolia,
          transactionHash: result.transactionHash
        })
        
        console.log("📄 All receipt logs:", receipt.logs)
        
        const contractLogs = receipt.logs.filter(log => 
          log.address.toLowerCase() === Transfer.smartContractAddress.toLowerCase()
        )
        
        console.log("📄 Contract logs:", contractLogs)
        
        // Look for TokensTransferred event (first topic should be event signature)
        const tokensTransferredLog = contractLogs.find(log => 
          log.topics.length >= 2 && log.topics[0] // Has event signature and message ID
        )
        
        let messageId = result.transactionHash // Default fallback
        
        if (tokensTransferredLog && tokensTransferredLog.topics[1]) {
          messageId = tokensTransferredLog.topics[1]
          console.log("✅ Extracted CCIP Message ID:", messageId)
        } else {
          console.log("⚠️ Could not extract CCIP message ID, using transaction hash:", messageId)
        }
        setCcipMessageId(messageId)
        
        await updatePaymentStatus('confirming', { tx_hash: result.transactionHash })
        startTracking(messageId)
      } catch (error) {
        console.error("Error extracting message ID:", error)
        setCcipMessageId(result.transactionHash)
        await updatePaymentStatus('confirming', { tx_hash: result.transactionHash })
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
  }, [payment, activeAccount, updatePaymentStatus, startTracking])

  const handleRefund = useCallback(async () => {
    if (!payment || !activeAccount) {
      toast.error("Missing payment details or wallet connection")
      return
    }
    
    const isAuthorized = activeAccount.address.toLowerCase() === payment.payer_wallet.toLowerCase() || 
                        activeAccount.address.toLowerCase() === payment.payment_links.creator_wallet.toLowerCase()
    
    if (!isAuthorized) {
      toast.error("Only the payer or seller can process refunds")
      return
    }

    setIsProcessing(true)

    try {
      toast.info("Processing refund...")
      
      const contract = getContract({
        client,
        chain: sepolia,
        address: Transfer.smartContractAddress
      })

      const transaction = prepareContractCall({
        contract,
        method: "function withdrawUsdcToken(address _beneficiary)",
        params: [payment.payer_wallet as `0x${string}`]
      })

      const result = await sendTransaction({ transaction, account: activeAccount })
      
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
      
      toast.success(`Refund Transaction: ${result.transactionHash.slice(0, 10)}...`, {
        action: {
          label: "View on Etherscan",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${result.transactionHash}`, '_blank')
        }
      })
      
    } catch (error) {
      console.error("Refund failed:", error)
      toast.error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [payment, activeAccount])

  const handleManualComplete = useCallback(async () => {
    if (!payment) {
      toast.error("Missing payment details")
      return
    }

    try {
      await updatePaymentStatus('completed', { 
        completed_at: new Date().toISOString(),
        manual_completion: true 
      })
      setProcessStage('completed')
      toast.success("✅ Delivery marked as complete!")
    } catch (error) {
      console.error("Failed to mark as complete:", error)
      toast.error("Failed to mark delivery as complete")
    }
  }, [payment, updatePaymentStatus])

  return {
    isProcessing,
    processStage,
    setProcessStage,
    ccipMessageId,
    setCcipMessageId,
    ccipProgress,
    isCCIPPolling,
    getStepInfo,
    getProgressPercentage,
    getTimeEstimate,
    startTracking,
    handleConfirmDelivery,
    handleRefund,
    handleManualComplete
  }
} 