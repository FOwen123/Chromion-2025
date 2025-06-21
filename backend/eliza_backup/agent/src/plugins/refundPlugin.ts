import type { Plugin } from '@elizaos/core';
import { analyzeRefundAction } from '../actions/analyzeRefund.ts';
import { resolveDisputeAction } from '../actions/resolveRefund.ts';

export const refundPlugin: Plugin = {
  name: 'refund',
  description: 'Refund plugin',
  providers: [],
  evaluators: [],
  services: [],
  actions: [analyzeRefundAction, resolveDisputeAction],
};

export default refundPlugin;