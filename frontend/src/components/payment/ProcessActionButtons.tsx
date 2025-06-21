import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, RefreshCw } from "lucide-react"
import type { ProcessStage } from "@/hooks/useProcessFunds"

interface ProcessActionButtonsProps {
  processStage: ProcessStage
  isProcessing: boolean
  onConfirmDelivery: () => void
  onRefund: () => void
  ccipMessageId?: string | null
}

export function ProcessActionButtons({
  processStage,
  isProcessing,
  onConfirmDelivery,
  onRefund,
  ccipMessageId
}: ProcessActionButtonsProps) {
  if (processStage === 'escrowed') {
    return (
      <div className="flex space-x-4">
        <Button
          onClick={onConfirmDelivery}
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
          onClick={onRefund}
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
    )
  }

  if (processStage === 'confirming' && !ccipMessageId) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Initializing cross-chain transfer...
        </AlertDescription>
      </Alert>
    )
  }

  return null
} 