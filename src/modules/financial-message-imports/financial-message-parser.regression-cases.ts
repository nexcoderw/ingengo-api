import {
  FinancialMessageDirection as Direction,
  FinancialMessageParseStatus as Status,
} from '@prisma/client';

import type { FinancialMessageParserResult } from './financial-message-parser.types';

type ExpectedResult = Pick<
  FinancialMessageParserResult,
  'amount' | 'fee' | 'direction' | 'parseStatus'
>;

interface RegressionCase {
  name: string;
  message: string;
  expected: ExpectedResult;
}

export const parserRegressionCases: RegressionCase[] = [
  {
    name: 'extracts transaction amount when fee appears first',
    message: 'MTN MoMo: Fee RWF 100. You received RWF 5,000. Ref: DEMO001.',
    expected: {
      amount: 5000,
      fee: 100,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'ignores balance when balance appears first',
    message:
      'MTN MoMo: Balance RWF 50,000. You received RWF 5,000. Ref: DEMO002.',
    expected: {
      amount: 5000,
      fee: null,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'supports mixed currency positions',
    message: 'MTN MoMo: You received 5,000 FRW. Fee RWF 100. Ref: DEMO003.',
    expected: {
      amount: 5000,
      fee: 100,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'distinguishes amount, fee and balance',
    message:
      'MTN MoMo: You received RWF 5,000; fee 100 FRW; balance RWF 40,000.',
    expected: {
      amount: 5000,
      fee: 100,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'requires review when only a fee is present',
    message: 'MTN MoMo: You received a payment. Fee RWF 100. Ref: DEMO005.',
    expected: {
      amount: null,
      fee: 100,
      direction: Direction.CREDIT,
      parseStatus: Status.NEEDS_DETAILS,
    },
  },
  {
    name: 'requires review when only a balance is present',
    message: 'MTN MoMo: You received a payment. Balance RWF 50,000.',
    expected: {
      amount: null,
      fee: null,
      direction: Direction.CREDIT,
      parseStatus: Status.NEEDS_DETAILS,
    },
  },
  {
    name: 'requires review for multiple transaction amounts',
    message: 'MTN MoMo: You received RWF 5,000 and RWF 7,000.',
    expected: {
      amount: null,
      fee: null,
      direction: Direction.CREDIT,
      parseStatus: Status.NEEDS_DETAILS,
    },
  },
  {
    name: 'rejects malformed numeric grouping',
    message: 'MTN MoMo: You received RWF 5,00.',
    expected: {
      amount: null,
      fee: null,
      direction: Direction.CREDIT,
      parseStatus: Status.NEEDS_DETAILS,
    },
  },
  {
    name: 'supports integer decimals and zero fees',
    message: 'MTN MoMo: You received RWF 5,000.00. Fee RWF 0.',
    expected: {
      amount: 5000,
      fee: 0,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'supports space-separated monetary values',
    message: 'MTN MoMo: You received 5 000 FRW.',
    expected: {
      amount: 5000,
      fee: null,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'requires review for negative transaction amounts',
    message: 'MTN MoMo: You received RWF -5000.',
    expected: {
      amount: null,
      fee: null,
      direction: Direction.CREDIT,
      parseStatus: Status.NEEDS_DETAILS,
    },
  },
  {
    name: 'rejects outgoing payments received by a recipient',
    message: 'MTN MoMo: You sent RWF 5,000. The recipient received the funds.',
    expected: {
      amount: 5000,
      fee: null,
      direction: Direction.DEBIT,
      parseStatus: Status.REJECTED,
    },
  },
  {
    name: 'recognizes incoming payments sent by a third party',
    message: 'MTN MoMo: You received RWF 5,000. The sender sent the funds.',
    expected: {
      amount: 5000,
      fee: null,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'requires review for conflicting account-owner directions',
    message: 'MTN MoMo: You received RWF 5,000. You sent funds.',
    expected: {
      amount: 5000,
      fee: null,
      direction: Direction.UNKNOWN,
      parseStatus: Status.NEEDS_DETAILS,
    },
  },
  {
    name: 'requires review for conflicting generic direction indicators',
    message: 'MTN MoMo: Credit alert and debit alert: RWF 5,000.',
    expected: {
      amount: 5000,
      fee: null,
      direction: Direction.UNKNOWN,
      parseStatus: Status.NEEDS_DETAILS,
    },
  },
  {
    name: 'preserves reversal classification',
    message: 'MTN MoMo: Your transaction of RWF 5,000 has been reversed.',
    expected: {
      amount: 5000,
      fee: null,
      direction: Direction.REVERSAL,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'recognizes a fee label after its monetary value',
    message: 'MTN MoMo: You received RWF 5,000. RWF 100 fee.',
    expected: {
      amount: 5000,
      fee: 100,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
  {
    name: 'recognizes a fee without sentence separators',
    message: 'MTN MoMo: You received RWF 5,000 fee RWF 100.',
    expected: {
      amount: 5000,
      fee: 100,
      direction: Direction.CREDIT,
      parseStatus: Status.PARSED,
    },
  },
];
