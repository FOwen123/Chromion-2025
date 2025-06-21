import { Button } from "@/components/ui/button"
import { ConnectEmbed, useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react"
import { client } from "@/lib/client"
import { createWallet } from "thirdweb/wallets"
import { useAccountStore } from "@/stores/accounts"
import { useUSDCBalance } from "@/hooks/useUSDCBalance"
import { Loader2, Wallet } from "lucide-react"

interface WalletConnectionProps {
  isConnected: boolean
  onPayment: () => void
  isPaying: boolean
  paymentAmount?: number
}

export function WalletConnection({ isConnected, onPayment, isPaying, paymentAmount = 0 }: WalletConnectionProps) {
  const { logout } = useAccountStore()
  const activeAccount = useActiveAccount()
  const activeWallet = useActiveWallet()
  const { disconnect } = useDisconnect()
  const { balance, isLoading, hasSufficientBalance } = useUSDCBalance()
  
  const hasEnoughFunds = hasSufficientBalance(paymentAmount)
  
  // Debug logging
  console.log("💰 Payment Amount Check:", {
    paymentAmount,
    balance,
    hasEnoughFunds,
    isLoading
  })

  if (!isConnected) {
    return (
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
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="p-3 sm:p-4 bg-muted rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Connected Wallet</div>
              <div className="font-mono text-xs sm:text-sm break-all">
                <span className="hidden sm:inline">{activeAccount?.address.slice(0, 6)}...{activeAccount?.address.slice(-4)}</span>
                <span className="sm:hidden">{activeAccount?.address.slice(0, 4)}...{activeAccount?.address.slice(-4)}</span>
              </div>
            </div>
            
            {/* USDC Balance inside wallet card */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                <Wallet size={14} />
                USDC Balance
              </div>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className={`text-sm sm:text-base font-bold ${hasEnoughFunds ? 'text-green-600' : 'text-red-600'}`}>
                    {balance} USDC
                  </div>
                )}
              </div>
              {!isLoading && !hasEnoughFunds && parseFloat(balance) > 0 && paymentAmount > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  ⚠️ Insufficient balance for this payment
                </div>
              )}
              {!isLoading && parseFloat(balance) === 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  💡 Get testnet USDC from a faucet
                </div>
              )}
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
        onClick={onPayment}
        disabled={isPaying || (!hasEnoughFunds && paymentAmount > 0)}
        className="w-full text-sm sm:text-base py-3 sm:py-4"
        size="lg"
      >
        {isPaying ? "Processing Payment..." : "Pay Now"}
      </Button>
    </div>
  )
} 