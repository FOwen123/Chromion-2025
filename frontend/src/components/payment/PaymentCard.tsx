import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentDetails } from "./PaymentDetails"
import { WalletConnection } from "./WalletConnection"

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

interface PaymentCardProps {
  paymentLink: PaymentLink
  isWalletConnected: boolean
  onPayment: () => void
  isPaying: boolean
}

export function PaymentCard({ paymentLink, isWalletConnected, onPayment, isPaying }: PaymentCardProps) {
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
              <PaymentDetails paymentLink={paymentLink} />
            )}

            {/* Wallet Connection & Payment Section */}
            <div className="space-y-4 sm:space-y-6">
              <WalletConnection 
                isConnected={isWalletConnected}
                onPayment={onPayment}
                isPaying={isPaying}
                paymentAmount={paymentLink.amount}
              />
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
} 