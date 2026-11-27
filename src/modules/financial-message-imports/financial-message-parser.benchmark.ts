import { performance } from 'node:perf_hooks';

import { FinancialMessageParseStatus } from '@prisma/client';

import { FinancialMessageParserService } from './financial-message-parser.service';
import { parserRegressionCases } from './financial-message-parser.regression-cases';

const parser = new FinancialMessageParserService();

const ITERATIONS = 10_000;
const WARMUP_ITERATIONS = 5_000;
const RUNS = 7;

const receivedAt = new Date('2026-10-30T12:00:00.000Z');

const workload = parserRegressionCases.map(({ message }) => ({
  message,
  messageSender: 'M-Money',
  messageReceivedAt: receivedAt,
}));

function evaluateAccuracy() {
  let correct = 0;
  let incorrectSuccessfulResults = 0;

  const failures: string[] = [];

  for (const testCase of parserRegressionCases) {
    const result = parser.parse({
      message: testCase.message,
      messageSender: 'M-Money',
      messageReceivedAt: receivedAt,
    });

    const expected = testCase.expected;

    const matches =
      result.amount === expected.amount &&
      result.fee === expected.fee &&
      result.direction === expected.direction &&
      result.parseStatus === expected.parseStatus;

    if (matches) {
      correct++;
    } else {
      failures.push(testCase.name);

      if (result.parseStatus === FinancialMessageParseStatus.PARSED) {
        incorrectSuccessfulResults++;
      }
    }
  }

  return {
    totalCases: parserRegressionCases.length,
    correctCases: correct,
    incorrectCases: parserRegressionCases.length - correct,
    accuracyPercentage: Number(
      ((correct / parserRegressionCases.length) * 100).toFixed(2),
    ),
    incorrectSuccessfulResults,
    failures,
  };
}

function runWorkload(iterations: number): number {
  let checksum = 0;

  for (let index = 0; index < iterations; index++) {
    const input = workload[index % workload.length];
    const result = parser.parse(input);

    checksum += result.amount ?? 0;
  }

  return checksum;
}

function benchmark() {
  const accuracy = evaluateAccuracy();

  runWorkload(WARMUP_ITERATIONS);

  const durations: number[] = [];
  let checksum = 0;

  for (let run = 0; run < RUNS; run++) {
    const start = performance.now();

    checksum = runWorkload(ITERATIONS);

    durations.push(performance.now() - start);
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const medianMs = sorted[Math.floor(sorted.length / 2)];

  const report = {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    workloadCases: workload.length,
    warmupIterations: WARMUP_ITERATIONS,
    iterationsPerRun: ITERATIONS,
    runs: RUNS,
    accuracy,
    performance: {
      durationsMs: durations.map((value) => Number(value.toFixed(4))),
      medianMs: Number(medianMs.toFixed(4)),
      messagesPerSecond: Math.round(ITERATIONS / (medianMs / 1000)),
      microsecondsPerMessage: Number(
        ((medianMs * 1000) / ITERATIONS).toFixed(4),
      ),
    },
    checksum,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

benchmark();
