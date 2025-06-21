import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Clock, AlertCircle, ArrowRight, Package, RefreshCw } from "lucide-react"
import type { ProcessStage } from "@/hooks/useProcessFunds"

interface CCIPProgress {
  status: string
  currentStep: number
  totalSteps: number
  errorMessage?: string
}

interface ProcessStageIndicatorProps {
  processStage: ProcessStage
  ccipProgress: CCIPProgress
  ccipMessageId: string | null
  isCCIPPolling: boolean
  getStepInfo: (status: any) => { description: string; emoji: string }
  getProgressPercentage: () => number
  getTimeEstimate: (status: any) => string
  onRetry?: () => void
  onRefund?: () => void
  isProcessing: boolean
}

export function ProcessStageIndicator({
  processStage,
  ccipProgress,
  ccipMessageId,
  isCCIPPolling,
  getStepInfo,
  getProgressPercentage,
  getTimeEstimate,
  onRetry,
  onRefund,
  isProcessing
}: ProcessStageIndicatorProps) {
  const getStageIcon = (stage: ProcessStage) => {
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

  const getStageText = (stage: ProcessStage) => {
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

  return (
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
              {ccipProgress.status === 'SOURCE_FINALIZED' && ccipProgress.errorMessage && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (onRetry) onRetry()
                  }}
                  className="w-full"
                >
                  ✅ Mark as Completed (APIs Down)
                </Button>
              )}
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

      {/* Error State with Action Buttons */}
      {processStage === 'confirming' && ccipProgress.status === 'FAILED' && (
        <div className="space-y-4">
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              ❌ {ccipProgress.errorMessage || 'Cross-chain transfer failed'}
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {onRefund && (
              <Button
                onClick={onRefund}
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
            )}
          </div>
        </div>
      )}

      {/* Success/Refund States */}
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
    </div>
  )
}
