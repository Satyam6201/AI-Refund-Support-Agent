import { getCustomerTool } from './customer-tool';
import { getOrderTool } from './order-tool';
import { checkRefundPolicyTool } from './policy-tool';
import { processRefundTool } from './refund-tool';

export {
  getCustomerTool,
  getOrderTool,
  checkRefundPolicyTool,
  processRefundTool,
};

export const agentTools = [
  getCustomerTool,
  getOrderTool,
  checkRefundPolicyTool,
  processRefundTool,
];
