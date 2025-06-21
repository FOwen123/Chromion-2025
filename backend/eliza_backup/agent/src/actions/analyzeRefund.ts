import type {
    ActionExample,
    IAgentRuntime,
    Memory,
    Action,
    State,
    HandlerCallback,
    Content,
} from "@elizaos/core";
import { elizaLogger, generateText, ModelClass, composeContext } from "@elizaos/core";

export const analyzeRefundAction: Action = {
    name: "ANALYZE_REFUND",
    similes: [
        "PROCESS_REFUND",
        "REVIEW_REFUND",
        "CHECK_REFUND",
        "EVALUATE_REFUND",
        "ASSESS_REFUND"
    ],
    description: "Analyzes refund requests for damaged products by evaluating complaint details, tracking information, purchase amount, and optional product images to make fair refund decisions while protecting against fraud. If order ID is provided, triggers blockchain resolution.",

    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const text = message.content.text?.toLowerCase() || "";

        // Check if message contains refund-related keywords
        const refundKeywords = [
            "refund", "return", "damaged", "broken", "defective",
            "money back", "reimburse", "compensation", "faulty"
        ];

        const hasRefundKeyword = refundKeywords.some(keyword =>
            text.includes(keyword)
        );

        // Check if it contains enough information for analysis
        const hasComplaint = text.length > 10;

        return hasRefundKeyword && hasComplaint;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            elizaLogger.info("🔍 Analyzing refund request...");

            const messageText = message.content.text || "";

            // Extract order ID (bytes32 hex string) if present
            const orderIdMatch = messageText.match(/(0x[0-9a-f]{64})/i);
            const orderId = orderIdMatch?.[1];

            // Use the agent's AI model to analyze the refund request
            const analysisPrompt = `
As ReLink, a cheeky and fun refund specialist, analyze this refund request:

Customer Message: ${messageText}

Please provide a structured analysis in the following JSON format:
{
    "decision": "APPROVE" or "DENY",
    "confidence": 0-100,
    "reasoning": "clear explanation for the decision",
    "refundAmount": "amount to refund (e.g., $100.00)",
    "orderId": "extracted order/tracking ID if found",
    "detectedIssues": ["list", "of", "issues", "found"],
    "summary": "brief case summary"
}

Consider factors like:
- Legitimacy of the complaint
- Item condition described  
- Order/tracking information provided
- Purchase amount mentioned
- Customer tone and details provided
- Company policy compliance

For amounts under $100 with valid issues and tracking, generally approve.
For amounts $100-500 with valid issues, approve with medium confidence.
For amounts over $500, require additional verification and generally deny unless exceptional circumstances.
Look for fraud indicators like "perfect condition" or "just changed mind".
Require tracking/order ID for approval.
`;

            // Use the runtime's model to analyze
            const analysis = await generateText({
                runtime,
                context: analysisPrompt,
                modelClass: ModelClass.LARGE,
            });

            elizaLogger.info("📋 AI Analysis result:", analysis);

            let analysisData;
            try {
                // Try to parse JSON response
                const jsonMatch = analysis.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysisData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("No JSON found in response");
                }
            } catch (parseError) {
                elizaLogger.warn("Could not parse JSON analysis, using fallback");
                // Fallback to text parsing
                analysisData = {
                    decision: analysis.toLowerCase().includes("approve") ? "APPROVE" : "DENY",
                    confidence: 75,
                    reasoning: "AI analysis completed",
                    refundAmount: "$0.00",
                    orderId: orderId || "Not specified",
                    detectedIssues: ["General complaint"],
                    summary: "Standard refund request analysis"
                };
            }

            // Use extracted orderId if found in original message
            if (orderId) {
                analysisData.orderId = orderId;
            }

            // Format response with ReLink's cheeky personality
            let responseText = `Hey there! 💖 Just analyzed your refund request and here's what I found:

🔍 **Refund Analysis Complete**

**Decision:** ${analysisData.decision === "APPROVE" ? "✅ APPROVED" : "❌ DENIED"}
**Confidence:** ${analysisData.confidence}%
**Reasoning:** ${analysisData.reasoning}
**Refund Amount:** ${analysisData.refundAmount}

**Case Details:**
Order: ${analysisData.orderId} | Issues: ${analysisData.detectedIssues.join(', ')}

${analysisData.decision === "APPROVE"
                    ? "Your refund got the green light! 🎉"
                    : "Sorry babe, but this one's not going through. 😔 Got more evidence? Hit me up and we'll take another look!"
                }`;

            // If we have a valid order ID (bytes32), trigger blockchain resolution
            if (orderId && orderId.length === 66 && /^0x[0-9a-f]{64}$/i.test(orderId)) {
                responseText += `\n\n🔗 **Blockchain Resolution**\nDetected valid order ID! Proceeding to resolve on-chain...`;

                // Store analysis result in state for resolveRefund action
                const newState = {
                    ...state,
                    lastAnalysis: {
                        orderId,
                        decision: analysisData.decision,
                        approved: analysisData.decision === "APPROVE",
                        reasoning: analysisData.reasoning
                    }
                };

                // Trigger the resolve refund action
                const resolveMessage: Memory = {
                    ...message,
                    content: {
                        ...message.content,
                        text: `resolve order ${orderId} for ${analysisData.decision === "APPROVE" ? "buyer" : "seller"}`,
                        analysis: {
                            orderId,
                            decision: analysisData.decision,
                            approved: analysisData.decision === "APPROVE",
                            reasoning: analysisData.reasoning
                        }
                    }
                };

                // Import and execute resolveRefund action
                try {
                    const { resolveDisputeAction } = await import('./resolveRefund.ts');
                    const resolveResult = await resolveDisputeAction.handler(
                        runtime,
                        resolveMessage,
                        newState,
                        options,
                        callback
                    );

                    if (resolveResult) {
                        return true; // Let resolveRefund handle the callback
                    }
                } catch (importError) {
                    elizaLogger.error("Failed to import or execute resolveRefund:", importError);
                    responseText += `\n\n❌ Failed to execute blockchain resolution. Please try manual resolution.`;
                }
            } else if (messageText.toLowerCase().includes('order') && !orderId) {
                responseText += `\n\n💡 **Tip:** To automatically process this on the blockchain, please provide a valid order ID (64-character hex string starting with 0x).`;
            }

            // Create the response content
            const responseContent: Content = {
                text: responseText,
                action: "ANALYZE_REFUND",
                source: message.content.source,
            };

            // Only call the callback, don't create memory separately
            if (callback) {
                await callback(responseContent);
            }

            return true;

        } catch (error) {
            elizaLogger.error("Error in refund analysis:", error);

            const errorContent: Content = {
                text: "Oops! I hit a snag while analyzing your refund request. 😅 Can you try again? I promise I'll get it right this time!",
                action: "ANALYZE_REFUND",
                source: message.content.source,
            };

            if (callback) {
                await callback(errorContent);
            }

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I need a refund for my order 0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd. The item arrived damaged and I have tracking ID: TRK123456. I paid $45.99 for it.",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "🔍 **Refund Analysis Complete**\n\n**Decision:** ✅ APPROVED\n**Confidence:** 85.0%\n**Reasoning:** Product damage reported with valid tracking ID, low-risk amount\n**Refund Amount:** $45.99\n\n🔗 **Blockchain Resolution**\nDetected valid order ID! Proceeding to resolve on-chain...",
                    action: "ANALYZE_REFUND"
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "My product is completely broken! Here's the image: https://example.com/damage.jpg. Tracking: ABC789XYZ. Cost me $89.50"
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "🔍 **Refund Analysis Complete**\n\n**Decision:** ✅ APPROVED\n**Confidence:** 80.0%\n**Reasoning:** Product damage reported with valid tracking ID, medium amount requires review (image provided for verification)\n**Refund Amount:** $89.50\n\n💡 **Tip:** To automatically process this on the blockchain, please provide a valid order ID (64-character hex string starting with 0x).",
                    action: "ANALYZE_REFUND"
                },
            },
        ]
    ]
};