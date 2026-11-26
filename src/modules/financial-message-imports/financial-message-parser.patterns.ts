// Shared matching patterns for financial-message parsing.
// The caller decides how to classify and validate the matches.

export function createMoneyPattern(): RegExp {
  return /\b(?:RWF|FRW)\s*([+-]?\d+(?:[,.]+\d+| \d+)*)(?!\w|[,.]\d)|(?<![\w.,+-])([+-]?\d+(?:[,.]+\d+| \d+)*)\s*(?:RWF|FRW)\b/gi;
}

export const FEE_BEFORE =
  /\b(?:fees?|charges?|commission)(?:\s+(?:is|was|of|charged))?\s*[:=]?\s*$/i;
export const FEE_AFTER =
  /^\s+(?:fees?|charges?|commission)\b(?=\s*(?:[.;,]|$))/i;

export const BALANCE_BEFORE = /\bbalance(?:\s+(?:is|was|of))?\s*[:=]?\s*$/i;
export const BALANCE_AFTER =
  /^\s+(?:(?:available|remaining|current|new)\s+)?balance\b(?=\s*(?:[.;,]|$))/i;

export const VALID_MONEY_FORMAT =
  /^\+?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,3}(?: \d{3})+)(?:\.0+)?$/;

export const REVERSAL_PATTERN =
  /\b(?:reversal|reversed|reversal completed|has been reversed)\b/i;
export const CREDIT_PATTERN =
  /\b(?:received|credited|credit alert|deposit(?:ed)?|incoming)\b/i;
export const DEBIT_PATTERN =
  /\b(?:sent|debited|debit alert|paid|withdrawn|purchase)\b/i;

export const THIRD_PARTY_INDICATOR =
  /\b(?:recipient|beneficiary|sender|payer)\b/i;
export const THIRD_PARTY_ACTION =
  /\b(?:(?:recipient|beneficiary)\s+(?:(?:has|have|just)\s+)*(?:received|credited)|(?:sender|payer)\s+(?:(?:has|have|just)\s+)*(?:sent|paid))\b/gi;
