import { Action } from '@elizaos/core';
import { createWalletClient, createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { isHex } from 'viem';
import { escrowAbi, escrowAddress } from '../escrowAbi.ts';

interface AnalysisData {
    orderId?: string;
    decision?: string;
    reasoning?: string;
    approved?: boolean;
}

export const resolveDisputeAction: Action = {
    name: 'RESOLVE_DISPUTE',
    similes: ['resolve', 'fix dispute', 'handle complaint', 'execute refund'],
    description: 'Resolve a dispute on an escrow order using the on-chain orderId (bytes32 hex). Calls resolveDisputeForBuyer if refund approved, or resolveDisputeForSeller if refund refused.',

    validate: async (_runtime, message) => {
        const text = message.content.text.toLowerCase();
        // Check if this is a resolve request with order ID
        const hasResolve = text.includes('resolve') && text.includes('order');
        // Check if message has analysis results (coming from analyzeRefund)
        const hasAnalysis = message.content.analysis !== undefined;
        // Check for valid order ID pattern
        const hasOrderId = /0x[0-9a-f]{64}/i.test(text);

        return hasResolve && (hasAnalysis || hasOrderId);
    },

    handler: async (_runtime, message, state, _options, callback) => {
        try {
            const text = message.content.text.toLowerCase();

            // Get analysis from message content or state
            const analysis = (message.content.analysis || state?.lastAnalysis) as AnalysisData;

            // Extract order ID from message or analysis
            const match = text.match(/(0x[0-9a-f]{64})/i);
            const orderId = match?.[1] || analysis?.orderId;

            if (!orderId || !isHex(orderId) || orderId.length !== 66) {
                throw new Error('Invalid or missing bytes32 orderId');
            }

            // Determine which function to call based on analysis
            let refundApproved: boolean;
            let functionName: string;

            if (analysis?.decision) {
                refundApproved = analysis.decision === "APPROVE";
                functionName = refundApproved ? 'resolveDisputeForBuyer' : 'resolveDisputeForSeller';
            } else {
                // Fallback to text parsing
                refundApproved = text.includes('buyer') || !text.includes('seller');
                functionName = refundApproved ? 'resolveDisputeForBuyer' : 'resolveDisputeForSeller';
            }

            // Check if private key is available
            if (!process.env.EVM_PRIVATE_KEY) {
                throw new Error('EVM_PRIVATE_KEY environment variable is required');
            }

            // Create account from private key
            const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

            // Create clients
            const publicClient = createPublicClient({
                chain: avalancheFuji,
                transport: http()
            });

            const walletClient = createWalletClient({
                account,
                chain: avalancheFuji,
                transport: http(),
            });

            // Execute the appropriate transaction
            const txHash = await walletClient.writeContract({
                address: escrowAddress as `0x${string}`,
                abi: escrowAbi,
                functionName,
                args: [orderId as `0x${string}`, refundApproved],
                account,
                chain: avalancheFuji
            });

            // Wait for transaction confirmation
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash
            });

            // Build comprehensive response
            let responseText = `✅ **Dispute Resolved Successfully!**

🔗 **Transaction Details:**
- Order ID: ${orderId}
- Decision: ${refundApproved ? 'REFUND APPROVED - Buyer Supported' : 'REFUND DENIED - Seller Supported'}
- Function Called: ${functionName}
- Transaction Hash: ${txHash}
- Block: ${receipt.blockNumber}
- Gas Used: ${receipt.gasUsed}

💫 **What this means:**
${refundApproved
                    ? "The refund has been approved and funds have been released to the buyer! 🎉"
                    : "The seller's position has been upheld and they keep the funds. 💼"
                }`;

            // Add analysis context if available
            if (analysis?.reasoning) {
                responseText += `\n\n🧠 **AI Analysis:** ${analysis.reasoning}`;
            }

            responseText += `\n\n🔍 **Verify on Explorer:** https://testnet.snowtrace.io/tx/${txHash}`;

            await callback?.({
                text: responseText,
                actions: ['RESOLVE_DISPUTE'],
                thought: `${functionName}(orderId: ${orderId}) executed successfully with tx hash: ${txHash}. Analysis: ${analysis ? 'AI-driven' : 'Manual'}`
            });

            return true;
        } catch (err: any) {
            let errorMessage = `❌ **Failed to resolve dispute**

💥 **Error:** ${err.message}`;

            // Add specific error guidance
            if (err.message.includes('EVM_PRIVATE_KEY')) {
                errorMessage += `\n\n🔑 **Solution:** Please ensure the EVM_PRIVATE_KEY environment variable is set.`;
            } else if (err.message.includes('orderId')) {
                errorMessage += `\n\n🆔 **Solution:** Please provide a valid 64-character order ID (bytes32 hex string).`;
            } else if (err.message.includes('insufficient funds')) {
                errorMessage += `\n\n💰 **Solution:** Insufficient gas fees. Please top up your wallet.`;
            } else if (err.message.includes('revert')) {
                errorMessage += `\n\n⚠️ **Contract Error:** The escrow contract rejected this transaction. The order may already be resolved or you may not have the required permissions.`;
            }

            await callback?.({
                text: errorMessage,
                actions: ['REPLY'],
                thought: `Dispute resolution failed: ${err.message}`
            });
            return false;
        }
    },

    examples: [
        [
            {
                user: '{{user1}}',
                content: {
                    text: 'resolve order 0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd for the buyer',
                    analysis: {
                        orderId: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                        decision: 'APPROVE',
                        reasoning: 'Valid damage claim with photo evidence'
                    }
                }
            },
            {
                user: '{{user2}}',
                content: {
                    text: '✅ **Dispute Resolved Successfully!**\n\n🔗 **Transaction Details:**\n- Order ID: 0xabcdef...abcd\n- Decision: REFUND APPROVED - Buyer Supported\n- Function Called: resolveDisputeForBuyer\n\n💫 The refund has been approved and funds have been released to the buyer! 🎉',
                    actions: ['RESOLVE_DISPUTE']
                }
            }
        ]
    ]
};

