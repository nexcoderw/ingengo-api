import { Injectable } from '@nestjs/common';
import {
  Currency,
  FinancialMessageDirection,
  FinancialMessageParseStatus,
} from '@prisma/client';

import {
  FinancialMessageParserInput,
  FinancialMessageParserResult,
} from './financial-message-parser.types';
import { identifyFinancialMessageProvider } from './financial-message-provider.registry';

const PARSER_VERSION = 'rw-financial-message-v2';

@Injectable()
export class FinancialMessageParserService {
  parse(input: FinancialMessageParserInput): FinancialMessageParserResult {
    const message = input.message.normalize('NFKC').replace(/\s+/g, ' ').trim();

    const providerCode = this.providerCode(message, input.messageSender);

    const direction = this.direction(message);

    const { amount, fee, feeAmbiguous } = this.extractMonetaryValues(message);

    const providerReference = this.providerReference(message);
    const senderIdentifier = this.senderIdentifier(message);
    const senderName = this.senderName(message);
    const accountLastFour = this.accountLastFour(message);

    const parseStatus = this.parseStatus(
      direction,
      amount,
      providerCode,
      feeAmbiguous,
    );

    const parseConfidence = this.confidence({
      providerCode,
      direction,
      amount,
      providerReference,
      parseStatus,
    });

    return {
      providerCode,
      direction,
      parseStatus,
      currency: amount === null ? null : Currency.RWF,
      amount,
      fee,
      occurredAt:
        direction === FinancialMessageDirection.UNKNOWN
          ? null
          : input.messageReceivedAt,
      senderName,
      senderIdentifier,
      accountLastFour,
      providerReference,
      parserVersion: PARSER_VERSION,
      parseConfidence,
    };
  }

  private providerCode(
    message: string,
    messageSender: string | undefined,
  ): string | null {
    return identifyFinancialMessageProvider(message, messageSender);
  }

  private direction(message: string): FinancialMessageDirection {
    if (
      /\b(?:reversal|reversed|reversal completed|has been reversed)\b/i.test(
        message,
      )
    ) {
      return FinancialMessageDirection.REVERSAL;
    }

    let accountEvidence = message;

    if (/\b(?:recipient|beneficiary|sender|payer)\b/i.test(message)) {
      accountEvidence = message.replace(
        /\b(?:(?:recipient|beneficiary)\s+(?:(?:has|have|just)\s+)*(?:received|credited)|(?:sender|payer)\s+(?:(?:has|have|just)\s+)*(?:sent|paid))\b/gi,
        '',
      );
    }

    const hasCredit =
      /\b(?:received|credited|credit alert|deposit(?:ed)?|incoming)\b/i.test(
        accountEvidence,
      );

    const hasDebit =
      /\b(?:sent|debited|debit alert|paid|withdrawn|purchase)\b/i.test(
        accountEvidence,
      );

    if (hasCredit === hasDebit) {
      return FinancialMessageDirection.UNKNOWN;
    }

    return hasCredit
      ? FinancialMessageDirection.CREDIT
      : FinancialMessageDirection.DEBIT;
  }

  private extractMonetaryValues(message: string): {
    amount: number | null;
    fee: number | null;
    feeAmbiguous: boolean;
  } {
    const moneyPattern =
      /\b(?:RWF|FRW)\s*([+-]?\d+(?:[,.]+\d+| \d+)*)(?!\w|[,.]\d)|(?<![\w.,+-])([+-]?\d+(?:[,.]+\d+| \d+)*)\s*(?:RWF|FRW)\b/gi;

    let amount: number | null = null;
    let fee: number | null = null;

    let amountCount = 0;
    let feeCount = 0;
    let previousEnd = 0;

    let match: RegExpExecArray | null;

    while ((match = moneyPattern.exec(message)) !== null) {
      const start = match.index;
      const end = moneyPattern.lastIndex;

      const before = message.slice(Math.max(previousEnd, start - 80), start);

      const after = message.slice(end, end + 60);

      previousEnd = end;

      const isBalance =
        /\bbalance(?:\s+(?:is|was|of))?\s*[:=]?\s*$/i.test(before) ||
        /^\s+(?:(?:available|remaining|current|new)\s+)?balance\b(?=\s*(?:[.;,]|$))/i.test(
          after,
        );

      if (isBalance) {
        continue;
      }

      const isFee =
        /\b(?:fees?|charges?|commission)(?:\s+(?:is|was|of|charged))?\s*[:=]?\s*$/i.test(
          before,
        ) ||
        /^\s+(?:fees?|charges?|commission)\b(?=\s*(?:[.;,]|$))/i.test(after);

      const rawValue = match[1] ?? match[2];

      if (rawValue === undefined) {
        continue;
      }

      if (isFee) {
        feeCount++;

        if (feeCount === 1) {
          fee = this.normalizeMonetaryValue(rawValue);
        }
      } else {
        amountCount++;

        if (amountCount === 1) {
          amount = this.normalizeMonetaryValue(rawValue);
        }
      }
    }

    return {
      amount: amountCount === 1 ? amount : null,
      fee: feeCount === 1 ? fee : null,
      feeAmbiguous: feeCount > 1 || (feeCount === 1 && fee === null),
    };
  }

  private normalizeMonetaryValue(rawValue: string): number | null {
    const validFormat =
      /^\+?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,3}(?: \d{3})+)(?:\.0+)?$/;

    if (!validFormat.test(rawValue)) {
      return null;
    }

    const normalized = rawValue.replace(/[ ,]/g, '');
    const value = Number(normalized);

    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  private providerReference(message: string): string | null {
    const match = message.match(
      /\b(?:financial transaction id|transaction id|transaction reference|tx(?:n)?\s*id|reference|ref)\s*[:#-]?\s*([A-Z0-9][A-Z0-9._:/-]{2,127})/i,
    );

    return match?.[1]?.replace(/[.,;:]+$/, '') ?? null;
  }

  private senderIdentifier(message: string): string | null {
    const afterFrom = message.match(
      /\bfrom\b[^+\d]{0,80}(\+?250\d{9}|0(?:72|73|78|79)\d{7})\b/i,
    );
    const anyRwandaNumber = message.match(
      /(?:\+250\d{9}|\b250\d{9}|\b0(?:72|73|78|79)\d{7})\b/,
    );

    return (
      (afterFrom?.[1] ?? anyRwandaNumber?.[0] ?? null)?.replace(
        /[\s()-]/g,
        '',
      ) ?? null
    );
  }

  private senderName(message: string): string | null {
    const match = message.match(
      /\bfrom\s+([\p{L}][\p{L}' -]{1,118}?)(?=\s*(?:\(|on\b|with\b|\.\s|,\s|$))/iu,
    );

    return match?.[1]?.trim() ?? null;
  }

  private accountLastFour(message: string): string | null {
    const match = message.match(
      /\b(?:account|a\/c|acct)(?:\s+(?:ending|ending in|number|no\.?))?[^\d*]{0,8}(?:\*+|x+)?(\d{4})\b/i,
    );

    return match?.[1] ?? null;
  }

  private parseStatus(
    direction: FinancialMessageDirection,
    amount: number | null,
    providerCode: string | null,
    feeAmbiguous: boolean,
  ): FinancialMessageParseStatus {
    if (direction === FinancialMessageDirection.DEBIT) {
      return FinancialMessageParseStatus.REJECTED;
    }

    if (feeAmbiguous) {
      return FinancialMessageParseStatus.NEEDS_DETAILS;
    }

    if (
      amount !== null &&
      providerCode !== null &&
      direction !== FinancialMessageDirection.UNKNOWN
    ) {
      return FinancialMessageParseStatus.PARSED;
    }

    return FinancialMessageParseStatus.NEEDS_DETAILS;
  }

  private confidence(values: {
    providerCode: string | null;
    direction: FinancialMessageDirection;
    amount: number | null;
    providerReference: string | null;
    parseStatus: FinancialMessageParseStatus;
  }): number {
    let confidence = 0;

    confidence += values.providerCode === null ? 0 : 0.25;

    confidence +=
      values.direction === FinancialMessageDirection.UNKNOWN ? 0 : 0.3;

    confidence += values.amount === null ? 0 : 0.35;

    confidence += values.providerReference === null ? 0 : 0.1;

    if (values.parseStatus === FinancialMessageParseStatus.NEEDS_DETAILS) {
      return Math.min(confidence, 0.5);
    }

    return confidence;
  }
}
