import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';

// AWS SDK for Bedrock integration
interface RefundAnalysisParams {
  product_image?: string;
  tracking_id: string;
  customer_complaint: string;
  purchase_amount: number;
}

interface RefundAnalysisResult {
  decision: 'APPROVE_REFUND' | 'DENY_REFUND';
  confidence: number;
  reasoning: string;
  amount: string;
}

/**
 * Define the configuration schema for the plugin with the following properties:
 *
 * @param {string} EXAMPLE_PLUGIN_VARIABLE - The name of the plugin (min length of 1, optional)
 * @returns {object} - The configured schema object
 */
const configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z
    .string()
    .min(1, 'Example plugin variable is not provided')
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn('Warning: Example plugin variable is not provided');
      }
      return val;
    }),
});

/**
 * Refund Analysis Action
 * Analyzes refund requests and provides recommendations
 */
const analyzeRefundAction: Action = {
  name: 'ANALYZE_REFUND',
  similes: ['REFUND_REQUEST', 'PROCESS_REFUND', 'EVALUATE_REFUND', 'CHECK_REFUND'],
  description: 'Analyzes refund requests and provides recommendations based on customer information',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';

    // Trigger when message contains refund-related keywords
    const refundKeywords = [
      'refund', 'return', 'money back', 'defective', 'damaged',
      'wrong item', 'not working', 'broken', 'complaint', 'issue',
      'order', 'tracking', 'purchase'
    ];

    return refundKeywords.some(keyword => text.includes(keyword));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling ANALYZE_REFUND action');

      const messageText = message.content.text || '';

      // Extract refund information from the message
      const refundInfo = extractRefundInfo(messageText);

      // Analyze the refund request using AI
      const analysisPrompt = `
        As a refund resolution specialist, analyze this refund request:
        
        Customer Message: ${messageText}
        
        Please provide a structured analysis including:
        1. Decision (APPROVE or DENY)
        2. Confidence level (0-100%)
        3. Reasoning for the decision
        4. Recommended refund amount
        5. Next steps for the customer
        
        Consider factors like:
        - Legitimacy of the complaint
        - Item condition described
        - Customer tone and details provided
        - Company policy compliance
      `;

      // Use the agent's AI model to analyze
      const analysis = await runtime.useModel('TEXT_LARGE', {
        prompt: analysisPrompt,
        maxTokens: 1000,
        temperature: 0.3,
      });

      // Format the response
      const responseContent: Content = {
        text: `🔍 **Refund Analysis Complete**\n\n${analysis}\n\n---\n\n**Case Details:**\n${refundInfo.summary}\n\nWould you like me to process this refund or need additional information?`,
        actions: ['ANALYZE_REFUND'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;

    } catch (error) {
      logger.error('Error in ANALYZE_REFUND action:', error);

      const errorContent: Content = {
        text: 'I apologize, but I encountered an error while analyzing your refund request. Please provide your order details again, and I\'ll help you resolve this issue.',
        actions: ['ANALYZE_REFUND'],
        source: message.content.source,
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'I need a refund for order #12345. The item arrived damaged and doesn\'t work properly.',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🔍 **Refund Analysis Complete**\n\nBased on your report of a damaged and non-functional item, I recommend APPROVING this refund request.\n\n**Decision:** APPROVE\n**Confidence:** 95%\n**Reasoning:** Clear case of defective product delivery\n**Recommended Amount:** Full refund\n\n**Next Steps:** Please provide photos of the damaged item and I\'ll process your full refund immediately.',
          actions: ['ANALYZE_REFUND'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Can you help me with a return? I ordered the wrong size.',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🔍 **Refund Analysis Complete**\n\nFor wrong size orders, I can help you with an exchange or refund.\n\n**Decision:** APPROVE (Exchange Preferred)\n**Confidence:** 85%\n**Reasoning:** Customer error but within return policy\n**Recommended Action:** Size exchange or refund minus restocking\n\n**Next Steps:** Would you prefer to exchange for the correct size or receive a refund?',
          actions: ['ANALYZE_REFUND'],
        },
      },
    ],
  ],
};

/**
 * Helper function to extract refund information from text
 */
function extractRefundInfo(text: string): { summary: string; details: any } {
  const orderMatch = text.match(/(?:order|tracking)[\s#]*([a-zA-Z0-9]+)/i);
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  const issueKeywords = ['damaged', 'broken', 'defective', 'wrong', 'not working', 'missing'];

  const detectedIssues = issueKeywords.filter(keyword =>
    text.toLowerCase().includes(keyword)
  );

  return {
    summary: `Order: ${orderMatch?.[1] || 'Not specified'} | Amount: ${amountMatch?.[1] ? '$' + amountMatch[1] : 'Not specified'} | Issues: ${detectedIssues.join(', ') || 'General complaint'}`,
    details: {
      orderId: orderMatch?.[1],
      amount: amountMatch?.[1],
      issues: detectedIssues,
      urgency: text.includes('urgent') || text.includes('asap') ? 'high' : 'normal'
    }
  };
}

/**
 * Example Hello World Provider
 * This demonstrates the simplest possible provider implementation
 */
const helloWorldProvider: Provider = {
  name: 'HELLO_WORLD_PROVIDER',
  description: 'A simple example provider',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    return {
      text: 'I am a provider',
      values: {},
      data: {},
    };
  },
};

export class StarterService extends Service {
  static serviceType = 'starter';
  capabilityDescription =
    'This is a starter service which is attached to the agent through the starter plugin.';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('*** Starting starter service ***');
    const service = new StarterService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('*** Stopping starter service ***');
    // get the service from the runtime
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error('Starter service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('*** Stopping starter service instance ***');
  }
}

const plugin: Plugin = {
  name: 'starter',
  description: 'A starter plugin for Eliza',
  // Set lowest priority so real models take precedence
  priority: -1000,
  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE,
  },
  async init(config: Record<string, string>) {
    logger.info('*** Initializing starter plugin ***');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return 'Never gonna give you up, never gonna let you down, never gonna run around and desert you...';
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...';
    },
  },
  routes: [
    {
      name: 'helloworld',
      path: '/helloworld',
      type: 'GET',
      handler: async (_req: any, res: any) => {
        // send a response
        res.json({
          message: 'Hello World!',
        });
      },
    },
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('MESSAGE_RECEIVED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('VOICE_MESSAGE_RECEIVED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.info('WORLD_CONNECTED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.info('WORLD_JOINED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
  },
  services: [StarterService],
  actions: [analyzeRefundAction],
  providers: [helloWorldProvider],
};

export default plugin;
