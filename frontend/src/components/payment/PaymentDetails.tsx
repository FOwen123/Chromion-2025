import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PaymentDetailsProps {
  paymentLink: {
    amount: number
    currency: string
    creator_wallet: string
    chain_id: number
    title?: string
    description?: string
  }
}

export function PaymentDetails({ paymentLink }: PaymentDetailsProps) {
  return (
    <>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="font-medium">Recipient:</span>
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all max-w-[120px] sm:max-w-none">
              <span className="hidden sm:inline">{paymentLink.creator_wallet.slice(0, 6)}...{paymentLink.creator_wallet.slice(-4)}</span>
              <span className="sm:hidden">{paymentLink.creator_wallet.slice(0, 4)}...{paymentLink.creator_wallet.slice(-4)}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="font-medium">Network:</span>
            <Badge variant="secondary" className="text-xs">
              {paymentLink.chain_id === 11155111 ? 'Sepolia' : 
               paymentLink.chain_id === 1 ? 'Ethereum' : 
               paymentLink.chain_id === 137 ? 'Polygon' :
               paymentLink.chain_id === 56 ? 'BSC' : 
               paymentLink.chain_id === 42161 ? 'Arbitrum' :
               paymentLink.chain_id === 42220 ? 'Celo' :
               paymentLink.chain_id === 8453 ? 'Base' :
               paymentLink.chain_id === 43114 ? 'Avalanche' : 'Other'}
            </Badge>
          </div>

          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="font-medium">Currency:</span>
            <span>{paymentLink.currency}</span>
          </div>
        </div>
    </>
  )
} 