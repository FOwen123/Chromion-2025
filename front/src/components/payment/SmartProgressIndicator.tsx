import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Package, 
  RefreshCw,
  ExternalLink,
  Timer,
  Zap
} from "lucide-react"
import type { ProcessStage } from "@/hooks/useProcessFunds"

interface SmartProgressIndicatorProps {
  processStage: ProcessStage
  ccipProgress: any
  ccipMessageId: string | null
  isCCIPPolling: boolean
  isProcessing: boolean
  transactionHash?: string | null
  onManualComplete?: () => void
  onRefund?: () => void
}

export function SmartProgressIndicator({
  processStage,
  ccipProgress,
  ccipMessageId,
  isCCIPPolling,
  isProcessing,
  transactionHash,
  onManualComplete,
  onRefund
}: SmartProgressIndicatorProps) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showManualOption, setShowManualOption] = useState(false)

  // Timer for elapsed time since transaction started
  useEffect(() => {
    if (processStage === 'confirming') {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      
      // Show manual completion option after 3 minutes
      const manualTimer = setTimeout(() => {
        setShowManualOption(true)
      }, 180000) // 3 minutes

      return () => {
        clearInterval(interval)
        clearTimeout(manualTimer)
      }
    }
  }, [processStage])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSmartStatus = () => {
    if (processStage === 'completed') {
      return {
        title: "✅ Delivery Confirmed!",
        description: "Cross-chain transfer completed successfully",
        color: "green",
        progress: 100
      }
    }

    if (processStage === 'refunded') {
      return {
        title: "💰 Refund Processed",
        description: "Funds have been returned to your wallet",
        color: "orange", 
        progress: 100
      }
    }

    if (processStage === 'confirming') {
      // Smart progress based on time elapsed and CCIP status
      const baseProgress = Math.min((timeElapsed / 300) * 70, 70) // 70% over 5 minutes
      
      if (ccipProgress?.status === 'SUCCESS') {
        return {
          title: "🎉 Cross-Chain Transfer Complete!",
          description: "Finalizing delivery confirmation...",
          color: "green",
          progress: 95
        }
      }

      if (ccipProgress?.status === 'FAILED') {
        return {
          title: "❌ Transfer Failed",
          description: "The cross-chain transfer encountered an error",
          color: "red",
          progress: 0
        }
      }

      // Handle API unavailability gracefully
      if (ccipProgress?.errorMessage?.includes('APIs unavailable')) {
        return {
          title: "⏳ Processing Transaction",
          description: "Cross-chain transfer in progress (tracking temporarily unavailable)",
          color: "blue",
          progress: baseProgress + 20 // More optimistic when APIs are down
        }
      }

      // Different stages with smart progress
      const stageProgress = {
        'SOURCE_FINALIZED': 25,
        'COMMITTING': 40,
        'COMMITTED': 55,
        'BLESSING': 70,
        'BLESSED': 80,
        'EXECUTING': 90
      }

      const ccipStageProgress = stageProgress[ccipProgress?.status as keyof typeof stageProgress] || 0
      const finalProgress = Math.max(baseProgress, ccipStageProgress)

      return {
        title: "🔄 Confirming Cross-Chain Delivery",
        description: getStageDescription(ccipProgress?.status, timeElapsed),
        color: "blue",
        progress: finalProgress
      }
    }

    return {
      title: "💎 Funds in Escrow",
      description: "Ready for delivery confirmation",
      color: "yellow",
      progress: 0
    }
  }

  const getStageDescription = (status: string, elapsed: number) => {
    if (elapsed > 180) { // 3+ minutes
      return "Cross-chain transfers can take 5-20 minutes. Your transaction is processing normally."
    }

    switch (status) {
      case 'SOURCE_FINALIZED':
        return "Transaction confirmed on source chain, initiating cross-chain transfer..."
      case 'COMMITTING':
        return "Committing transaction to destination chain..."
      case 'COMMITTED':
        return "Transaction committed, awaiting security verification..."
      case 'BLESSING':
        return "Security verification in progress..."
      case 'BLESSED':
        return "Verification complete, executing on destination..."
      case 'EXECUTING':
        return "Final execution in progress..."
      default:
        return "Initiating cross-chain transfer..."
    }
  }

  const smartStatus = getSmartStatus()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{smartStatus.title}</span>
          {processStage === 'confirming' && (
            <Badge variant="outline" className="text-xs">
              <Timer className="h-3 w-3 mr-1" />
              {formatTime(timeElapsed)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{smartStatus.description}</span>
            <span className="font-medium">{Math.round(smartStatus.progress)}%</span>
          </div>
          <Progress 
            value={smartStatus.progress} 
            className="h-2"
            style={{
              '--progress-background': smartStatus.color === 'green' ? '#10b981' :
                                     smartStatus.color === 'blue' ? '#3b82f6' :
                                     smartStatus.color === 'orange' ? '#f59e0b' :
                                     smartStatus.color === 'red' ? '#ef4444' : '#eab308'
            } as any}
          />
        </div>

        {/* CCIP Details (when confirming) */}
        {processStage === 'confirming' && ccipMessageId && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cross-Chain Status:</span>
              <Badge variant={
                ccipProgress?.status === 'SUCCESS' ? 'default' :
                ccipProgress?.status === 'FAILED' ? 'destructive' : 'secondary'
              }>
                {ccipProgress?.status?.replace('_', ' ') || 'Processing'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://ccip.chain.link/msg/${ccipMessageId}`, '_blank')}
                className="flex-1"
                disabled={!ccipMessageId}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                CCIP Explorer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash || ccipMessageId}`, '_blank')}
                className="flex-1"
                disabled={!transactionHash && !ccipMessageId}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Etherscan
              </Button>
            </div>
          </div>
        )}

        {/* Smart Action Buttons */}
        {processStage === 'confirming' && (
          <div className="space-y-2">
            {/* Manual completion option after 3 minutes */}
            {showManualOption && ccipProgress?.status !== 'SUCCESS' && ccipProgress?.status !== 'FAILED' && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <Zap className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <div className="space-y-2">
                    <p>Taking longer than expected? This is normal for cross-chain transactions.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onManualComplete}
                      className="w-full"
                    >
                      ✅ Mark as Complete (I've verified delivery)
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error state */}
            {ccipProgress?.status === 'FAILED' && (
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  <div className="space-y-2">
                    <p>Cross-chain transfer failed. You can request a refund.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefund}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Request Refund
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Simple visual progress for non-confirming states */}
        {processStage !== 'confirming' && (
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center space-x-2 ${
              processStage !== 'refunded' ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              <CheckCircle className="h-4 w-4" />
              <span>Escrowed</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center space-x-2 ${
              processStage === 'completed' ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              <Package className="h-4 w-4" />
              <span>Delivery</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center space-x-2 ${
              processStage === 'completed' ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              <CheckCircle className="h-4 w-4" />
              <span>Complete</span>
            </div>
          </div>
        )}

        {/* Educational info */}
        {processStage === 'confirming' && timeElapsed < 60 && (
          <div className="text-xs text-muted-foreground text-center p-2 bg-muted/20 rounded">
            💡 Cross-chain transfers typically take 5-20 minutes to complete securely
          </div>
        )}
      </CardContent>
    </Card>
  )
} 