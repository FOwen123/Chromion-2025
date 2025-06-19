import { useState, useCallback } from "react"
import { useActiveAccount } from "thirdweb/react"
import { sendTransaction, prepareContractCall, readContract } from "thirdweb"
import { getContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { client } from "@/lib/client"
import { Transfer } from "@/lib/contract"
import { supabase } from "@/lib/supabase/supabase-client"
import { toast } from "sonner"

interface PaymentLink {
  id: string
  amount: number
  currency: string
  chain_id: number
  creator_wallet: string
  current_uses: number
  total_collected?: number
}

export function usePaymentFlow() {
  const [isPaying, setIsPaying] = useState(false)
  const activeAccount = useActiveAccount()

  // Verify chain whitelisting status
  const verifyChainWhitelisting = useCallback(async (contract: any, chainSelector: string) => {
    try {
      console.log(`🔍 Checking if chain selector ${chainSelector} is whitelisted...`);
      
      const isWhitelisted = await readContract({
        contract,
        method: "function whitelistedDestinationChains(uint64) view returns (bool)",
        params: [BigInt(chainSelector)]
      });
      
      console.log(`Chain ${chainSelector} whitelisted status:`, isWhitelisted);
      
      if (isWhitelisted) {
        toast.success(`✅ Chain selector ${chainSelector} is properly whitelisted!`);
        return true;
      } else {
        toast.error(`❌ Chain selector ${chainSelector} is NOT whitelisted!`);
        return false;
      }
    } catch (error) {
      console.error("Error checking chain whitelisting:", error);
      toast.warning("⚠️ Could not verify chain whitelisting status");
      return false;
    }
  }, []);

  const handlePayment = useCallback(async (paymentLink: PaymentLink) => {
    if (!activeAccount || !paymentLink) return

    setIsPaying(true)
    let payment: any = null

    try {
      // First, ensure user profile exists (create if not exists)
      const { data: existingUser, error: userError } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('wallet_address', activeAccount.address)
        .maybeSingle()

      if (!existingUser && !userError) {
        // Create user profile if doesn't exist
        await supabase
          .from('user_profiles')
          .insert({
            wallet_address: activeAccount.address,
            first_login: new Date().toISOString(),
            last_login: new Date().toISOString(),
            login_count: 1,
            is_active: true
          })
      } else if (existingUser) {
        // Update last login if user exists
        await supabase
          .from('user_profiles')
          .update({
            last_login: new Date().toISOString(),
            login_count: (existingUser as any).login_count + 1
          })
          .eq('wallet_address', activeAccount.address)
      }

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_link_id: paymentLink.id,
          payer_wallet: activeAccount.address,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          chain_id: paymentLink.chain_id,
          status: 'pending'
        })
        .select()
        .single()

      if (paymentError) {
        console.error("Payment creation error:", paymentError);
        throw new Error(`Failed to create payment record: ${paymentError.message}`);
      }
      
      payment = paymentData;

      // Check if the payment is on Sepolia network
      if (paymentLink.chain_id !== 11155111) {
        throw new Error("Only Sepolia network is currently supported")
      }

      const contract = getContract({
        client,
        chain: sepolia,
        address: Transfer.smartContractAddress,
        abi: Transfer.abi[0] as any // Type assertion for the ABI
      });

      console.log("Preparing smart contract call...");
      
      // Convert amount to proper decimals (USDC uses 6 decimals)
      const amountInWei = BigInt(Math.floor(paymentLink.amount * 1e6));
      
      console.log("💰 Amount Conversion Debug:", {
        originalAmount: paymentLink.amount,
        amountAfterMultiply: paymentLink.amount * 1e6,
        amountAfterFloor: Math.floor(paymentLink.amount * 1e6),
        finalAmountInWei: amountInWei.toString()
      });
      
      // Escrow contract address for payments
      const escrowContractAddress = "0xd17997e2306301c9e0ca47d6ee6d3e67f9a3a712";
      
      console.log(`🏦 Sending payment to escrow contract: ${escrowContractAddress}`);

      // Note: If you get "NotEnoughBalance" error, you may need to approve USDC spending first
      console.log("💡 Tip: If payment fails with 'NotEnoughBalance', you may need to approve USDC spending manually");

      // Prepare the contract call to send to escrow
      const transaction = prepareContractCall({
        contract,
        method: "transferTokensPayLINK",
        params: [
          BigInt("14767482510784806043"), // _destinationChainSelector (using your whitelisted selector)
          escrowContractAddress, // _receiver (escrow contract)
          amountInWei, // _amount (in USDC decimals)
          paymentLink.creator_wallet // _seller (original recipient for tracking)
        ]
      } as any);

      console.log("🚀 Sending transaction to ESCROW with params:", {
        destinationChainSelector: "14767482510784806043",
        receiver: escrowContractAddress,
        amount: amountInWei.toString(),
        seller: paymentLink.creator_wallet
      });

      toast.info("Please confirm the transaction in your wallet...");

      // Send the transaction
      const result = await sendTransaction({
        account: activeAccount,
        transaction,
      });

      console.log("✅ Transaction sent successfully:", result);

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

      toast.success("🎉 Payment completed successfully!");
      
      // Show transaction details
      toast.success(`Transaction Hash: ${result.transactionHash.slice(0, 10)}...`, {
        action: {
          label: "View on Etherscan",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${result.transactionHash}`, '_blank')
        }
      });
      
    } catch (error) {
      console.error("Payment failed:", error);
      
      // Update payment status to failed
      if (payment) {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', payment.id);
      }
      
      // Show specific error messages
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes("DestinationChainNotWhitelisted")) {
        toast.error("❌ Chain not whitelisted! Please contact support.");
      } else if (errorMessage.includes("AccessControlUnauthorizedAccount")) {
        toast.error("❌ Insufficient permissions. Please check your wallet has the required role.");
      } else {
        toast.error(`❌ Payment failed: ${errorMessage}`);
      }
      
    } finally {
      setIsPaying(false)
    }
  }, [activeAccount, verifyChainWhitelisting])

  return {
    handlePayment,
    isPaying
  }
}