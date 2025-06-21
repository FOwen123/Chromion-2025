import { ConnectButton, useActiveAccount, useSwitchActiveWalletChain, useActiveWalletChain } from "thirdweb/react"
import { sepolia } from "thirdweb/chains"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useEffect } from "react"

interface WalletConnectionProps {
  onDisconnect?: () => void
}

export function WalletConnection({ onDisconnect }: WalletConnectionProps) {
  const activeAccount = useActiveAccount()
  const activeChain = useActiveWalletChain()
  const switchChain = useSwitchActiveWalletChain()

  // Auto-switch to Sepolia when wallet connects
  useEffect(() => {
    if (activeAccount && activeChain) {
      // Check if we're on the right chain
      if (activeChain.id !== sepolia.id) {
        toast.info("Switching to Sepolia testnet...")
        switchChain(sepolia).catch((error) => {
          console.error("Failed to switch chain:", error)
          toast.error("Please manually switch to Sepolia testnet in your wallet")
        })
      }
    }
  }, [activeAccount, activeChain, switchChain])

  if (!activeAccount) {
    return (
      <div className="space-y-4">
        <div className="text-center text-sm text-gray-500 mb-4">
          Connect your wallet to continue with payment
        </div>
        <ConnectButton
          client={client}
          chain={sepolia}
          chains={[sepolia]}
          connectModal={{
            size: "wide",
            title: "Connect Wallet",
            titleIcon: "",
          }}
          switchButton={{
            label: "Switch to Sepolia",
            style: {
              backgroundColor: "#3b82f6",
              color: "white",
            }
          }}
        />
        <div className="text-xs text-center text-gray-400 mt-2">
          ⚠️ This payment uses Sepolia testnet
        </div>
      </div>
    )
  }

  // Show chain warning if not on Sepolia
  const isOnWrongChain = activeChain ? activeChain.id !== sepolia.id : false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <div className="text-sm font-medium">Connected</div>
          <div className="text-xs text-gray-500">
            {activeAccount.address?.slice(0, 6)}...{activeAccount.address?.slice(-4)}
          </div>
        </div>
        <div className="flex gap-2">
          {isOnWrongChain && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchChain(sepolia)}
              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
            >
              Switch to Sepolia
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </div>

      {isOnWrongChain && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Please switch to Sepolia testnet to make payments
          </div>
        </div>
      )}
    </div>
  )
} 