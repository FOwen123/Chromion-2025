import { useState, useEffect, useCallback } from 'react'
import { readContract } from 'thirdweb'
import { getContract } from 'thirdweb'
import { sepolia, avalancheFuji } from 'thirdweb/chains'
import { client } from '@/lib/client'

export type CCIPStatus = 
  | 'NOT_STARTED'
  | 'SOURCE_FINALIZED' 
  | 'COMMITTING'
  | 'COMMITTED'
  | 'BLESSING'
  | 'BLESSED'
  | 'EXECUTING'
  | 'SUCCESS'
  | 'FAILED'

export interface CCIPProgress {
  status: CCIPStatus
  currentStep: number
  totalSteps: number
  estimatedTimeRemaining?: number
  errorMessage?: string
}

// CCIP OffRamp contract ABI for status checking
const OFFRAMP_ABI = [
  {
    "inputs": [{"name": "messageId", "type": "bytes32"}],
    "name": "getExecutionState",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// OffRamp addresses for different chains
const SEPOLIA_OFFRAMP_ADDRESS = "0x000b26f604eAadC3D874a4404bde6D64a97d95ca"
const FUJI_OFFRAMP_ADDRESS = "0x0477cA0a35eE05D3f9f424d88bC0977ceCf339D4" // Avalanche Fuji OffRamp

export function useCCIPTracking(messageId?: string, sourceChain = 'sepolia', destinationChain = 'sepolia') {
  const [progress, setProgress] = useState<CCIPProgress>({
    status: 'NOT_STARTED',
    currentStep: 0,
    totalSteps: 7,
  })
  const [isPolling, setIsPolling] = useState(false)

  const getStepInfo = useCallback((status: CCIPStatus) => {
    const steps = {
      'NOT_STARTED': { step: 0, description: 'Transaction not yet initiated', emoji: '⏳' },
      'SOURCE_FINALIZED': { step: 1, description: 'Source transaction finalized', emoji: '✅' },
      'COMMITTING': { step: 2, description: 'CCIP committing to destination chain', emoji: '📝' },
      'COMMITTED': { step: 3, description: 'Message committed to destination', emoji: '📋' },
      'BLESSING': { step: 4, description: 'Risk Management Network verification', emoji: '🛡️' },
      'BLESSED': { step: 5, description: 'Message verified and blessed', emoji: '✨' },
      'EXECUTING': { step: 6, description: 'Executing on destination chain', emoji: '⚡' },
      'SUCCESS': { step: 7, description: 'Cross-chain transfer complete!', emoji: '🎉' },
      'FAILED': { step: -1, description: 'Transfer failed', emoji: '❌' },
    }
    return steps[status] || steps['NOT_STARTED']
  }, [])

  const checkCCIPStatus = useCallback(async (msgId: string): Promise<CCIPStatus> => {
    try {
      // Create contract instance for the OffRamp on destination chain (Avalanche Fuji)
      const offRampContract = getContract({
        client,
        chain: avalancheFuji, // Using Fuji since that's our destination chain
        address: FUJI_OFFRAMP_ADDRESS,
        abi: OFFRAMP_ABI
      })

      // Query the execution state from the OffRamp contract
      const executionState = await readContract({
        contract: offRampContract,
        method: "getExecutionState",
        params: [msgId as `0x${string}`]
      })

      // Convert Solidity enum to our status
      // MessageExecutionState enum: Untouched=0, InProgress=1, Success=2, Failure=3
      switch (Number(executionState)) {
        case 0: // Untouched - message hasn't reached destination yet
          return 'COMMITTING'
        case 1: // InProgress - currently being executed
          return 'EXECUTING'
        case 2: // Success - completed successfully
          return 'SUCCESS'
        case 3: // Failure - execution failed
          return 'FAILED'
        default:
          return 'COMMITTING'
      }
    } catch (error) {
      console.error('Error checking CCIP status:', error)
      // If we can't read from contract (execution reverted), 
      // it likely means the message doesn't exist yet or there's an error
      // Return null to indicate we should stop polling
      throw error
    }
  }, [])

  // Fetch real CCIP status from the CCIP API
  const fetchCCIPStatus = useCallback(async (msgId: string) => {
    try {
      // Try multiple API endpoints for CCIP status
      const endpoints = [
        `https://ccip.chain.link/api/v1/messages/${msgId}`,
        `https://ccip.chain.link/api/lane/messages/${msgId}`,
        `https://api.ccip.chain.link/v1/messages/${msgId}`
      ]
      
      let lastError = null
      
      for (const endpoint of endpoints) {
        try {
          console.log("📡 Trying CCIP API endpoint:", endpoint)
          const response = await fetch(endpoint)
          
          if (!response.ok) {
            console.log(`❌ API endpoint failed: ${endpoint} - Status: ${response.status}`)
            continue
          }
          
          const data = await response.json()
          console.log("📡 CCIP API response:", data)
          
          // Extract status from different possible response formats
          let statusText = ''
          if (data.status) {
            statusText = data.status.toLowerCase()
          } else if (data.state) {
            statusText = data.state.toLowerCase()
          } else if (data.messageState) {
            statusText = data.messageState.toLowerCase()
          } else if (data.executionState) {
            statusText = data.executionState.toLowerCase()
          }
          
          // Handle "waiting for finality" status specifically
          if (statusText.includes('waiting') || statusText.includes('finality')) {
            return 'SOURCE_FINALIZED'
          }
          
          // Map CCIP API status to our internal status
          switch (statusText) {
            case 'success':
            case 'executed':
            case 'complete':
            case 'completed':
              return 'SUCCESS'
            case 'executing':
            case 'execution':
              return 'EXECUTING'
            case 'blessed':
              return 'BLESSED'
            case 'blessing':
              return 'BLESSING'
            case 'committed':
              return 'COMMITTED'
            case 'committing':
              return 'COMMITTING'
            case 'finalized':
            case 'source_finalized':
            case 'source finalized':
              return 'SOURCE_FINALIZED'
            case 'failed':
            case 'error':
            case 'reverted':
              return 'FAILED'
            default:
              // If we got a response but status is unclear, assume it's still processing
              return 'SOURCE_FINALIZED'
          }
        } catch (error) {
          console.log(`❌ Error with endpoint ${endpoint}:`, error)
          lastError = error
          continue
        }
      }
      
      // If all API endpoints failed, try to check the on-chain contract status as fallback
      console.log("⚠️ All API endpoints failed, checking on-chain contract status as fallback...")
      
      try {
        const onChainStatus = await checkCCIPStatus(msgId)
        console.log("✅ Got on-chain status:", onChainStatus)
        return onChainStatus
      } catch (contractError) {
        console.error("❌ On-chain status check also failed:", contractError)
        
        // Since we can't get status from API or contract, check if the message ID looks valid
        if (msgId && msgId.startsWith('0x') && msgId.length >= 42) {
          // For now, if we can't get status from anywhere, assume it's still processing
          // This prevents showing false "success" when the transaction is still pending
          return 'SOURCE_FINALIZED'
        }
        
        // If everything failed, throw the original API error
        throw lastError || new Error('All CCIP API endpoints and on-chain contract check failed')
      }
      
    } catch (error) {
      console.error("Error fetching CCIP status:", error)
      throw error
    }
  }, [])

  const pollCCIPStatus = useCallback(async (msgId: string) => {
    if (!msgId || isPolling) return

    setIsPolling(true)
    let pollCount = 0
    const maxPolls = 60 // Poll for up to 5 minutes (60 * 5 seconds)
    
    try {
      console.log("🔄 Starting real CCIP tracking for message:", msgId)
      
      const pollInterval = setInterval(async () => {
        try {
          pollCount++
          console.log(`📡 Polling CCIP status... (${pollCount}/${maxPolls})`)
          
          const status = await fetchCCIPStatus(msgId)
          const stepInfo = getStepInfo(status)
          
          setProgress(prev => ({
            ...prev,
            status,
            currentStep: stepInfo.step,
            estimatedTimeRemaining: status === 'SUCCESS' || status === 'FAILED' ? 0 : undefined
          }))
          
          console.log(`📊 Real CCIP Status: ${status} (Step ${stepInfo.step}/7)`)
          
          // Stop polling if transaction is complete or failed
          if (status === 'SUCCESS' || status === 'FAILED') {
            clearInterval(pollInterval)
            setIsPolling(false)
            return
          }
          
          // Stop polling if we've exceeded max attempts
          if (pollCount >= maxPolls) {
            console.log("⏰ CCIP polling timeout - stopping")
            clearInterval(pollInterval)
            setProgress(prev => ({
              ...prev,
              status: 'FAILED',
              currentStep: -1,
              estimatedTimeRemaining: 0,
              errorMessage: 'CCIP tracking timeout'
            }))
            setIsPolling(false)
          }
          
                 } catch (error) {
           console.error("Error in polling cycle:", error)
           
           // If API consistently fails, don't show false success
           // Keep the current status or set to a safe processing state
           if (pollCount > 3) { // After 3 failed attempts
             console.log("⚠️ Multiple API failures detected, showing processing state")
             setProgress(prev => ({
               ...prev,
               status: 'SOURCE_FINALIZED',
               errorMessage: 'Unable to verify status - transaction may still be processing'
             }))
           }
         }
      }, 5000) // Poll every 5 seconds
      
      // Initial status check
      try {
        const initialStatus = await fetchCCIPStatus(msgId)
        const stepInfo = getStepInfo(initialStatus)
        
        setProgress({
          status: initialStatus,
          currentStep: stepInfo.step,
          totalSteps: 7,
          estimatedTimeRemaining: initialStatus === 'SUCCESS' || initialStatus === 'FAILED' ? 0 : undefined
        })
        
        // If already complete, no need to poll
        if (initialStatus === 'SUCCESS' || initialStatus === 'FAILED') {
          clearInterval(pollInterval)
          setIsPolling(false)
        }
      } catch (error) {
        console.log("⚠️ Initial status check failed, will continue polling")
      }

    } catch (error) {
      console.error('Error during CCIP polling setup:', error)
      const failStepInfo = getStepInfo('FAILED')
      setProgress(prev => ({
        ...prev,
        status: 'FAILED',
        currentStep: failStepInfo.step,
        estimatedTimeRemaining: 0,
        errorMessage: 'Error setting up CCIP tracking'
      }))
      setIsPolling(false)
    }
  }, [fetchCCIPStatus, getStepInfo, isPolling])

  // Start tracking when messageId is provided
  useEffect(() => {
    if (messageId && !isPolling) {
      pollCCIPStatus(messageId)
    }
  }, [messageId, pollCCIPStatus, isPolling])

  const getProgressPercentage = useCallback(() => {
    return Math.round((progress.currentStep / progress.totalSteps) * 100)
  }, [progress.currentStep, progress.totalSteps])

  const getTimeEstimate = useCallback((status: CCIPStatus) => {
    // Realistic time estimates based on CCIP documentation
    const estimates = {
      'SOURCE_FINALIZED': '~20 minutes (waiting for finality)',
      'COMMITTING': '~2-5 minutes (committing to destination)',
      'COMMITTED': '~1-2 minutes (committed)', 
      'BLESSING': '~30 seconds (risk management review)',
      'BLESSED': '~10 seconds (blessed)',
      'EXECUTING': '~30 seconds (executing on destination)',
      'SUCCESS': 'Complete',
      'FAILED': 'Failed',
      'NOT_STARTED': 'Not started'
    }
    return estimates[status] || 'Unknown'
  }, [])

  return {
    progress,
    isPolling,
    getStepInfo,
    getProgressPercentage,
    getTimeEstimate,
    startTracking: (msgId: string) => pollCCIPStatus(msgId)
  }
} 