export type PolicyViolationCode =
  | 'CUSTOMER_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'CUSTOMER_MISMATCH'
  | 'DELIVERY_WINDOW_EXCEEDED'
  | 'PRODUCT_CONDITION_USED'
  | 'FINAL_SALE_PRODUCT'
  | 'ALREADY_REFUNDED'
  | 'AMOUNT_EXCEEDS_ORDER'
  | 'HIGH_VALUE_HUMAN_APPROVAL_REQUIRED';

export interface PolicyCheckResult {
  rule: string;
  passed: boolean;
  explanation: string;
  code?: PolicyViolationCode;
}

export interface PolicyValidationResult {
  eligible: boolean;
  requiresHumanApproval: boolean;
  violations: PolicyViolationCode[];
  checks: PolicyCheckResult[];
}
