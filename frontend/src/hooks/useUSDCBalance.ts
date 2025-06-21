import { useState, useEffect, useCallback } from "react"
import { useActiveAccount } from "thirdweb/react"
import { getContract, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { client } from "@/lib/client"

// USDC contract address on Sepolia testnet
const USDC_CONTRACT_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

export function useUSDCBalance() {
  const [balance, setBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeAccount = useActiveAccount()

  const fetchBalance = useCallback(async () => {
    if (!activeAccount?.address) {
      setBalance("0")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const usdcContract = getContract({
        client,
        chain: sepolia,
        address: USDC_CONTRACT_ADDRESS,
        abi: [
          {
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "decimals",
            "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
            "stateMutability": "view",
            "type": "function"
          }
        ]
      })

      // Get balance in wei (6 decimals for USDC)
      const balanceWei = await readContract({
        contract: usdcContract,
        method: "balanceOf",
        params: [activeAccount.address]
      })

      // Convert from wei to USDC (6 decimals)
      const balanceFormatted = (Number(balanceWei) / 1e6).toFixed(2)
      setBalance(balanceFormatted)

    } catch (err) {
      console.error("Error fetching USDC balance:", err)
      setError("Failed to fetch balance")
      setBalance("0")
    } finally {
      setIsLoading(false)
    }
  }, [activeAccount?.address])

  // Fetch balance when account changes
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!activeAccount?.address) return

    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [activeAccount?.address, fetchBalance])

  const hasSufficientBalance = useCallback((requiredAmount: number) => {
    const currentBalance = parseFloat(balance)
    const sufficient = currentBalance >= requiredAmount
    
    console.log("🔍 Balance Check:", {
      currentBalance,
      requiredAmount,
      sufficient,
      balanceString: balance
    })
    
    return sufficient
  }, [balance])

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
    hasBalance: parseFloat(balance) > 0,
    hasSufficientBalance
  }
} 