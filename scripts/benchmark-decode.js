'use strict';

const fs = require('fs');
const { performance } = require('perf_hooks');
const {
  readRuntimeMetadata
} = require('@tcc/runtime-metadata');

const args = process.argv.slice(2);

const target =
  args.find(a => !a.startsWith('--')) ||
  'src/runtime-config.js';

const outIndex = args.indexOf('--out');

const output =
  outIndex >= 0 && args[outIndex + 1]
    ? args[outIndex + 1]
    : null;

const warmups = 5;
const runs = 30;

for (let i = 0; i < warmups; i++) {
  readRuntimeMetadata(target);
}

const values = [];

for (let i = 0; i < runs; i++) {
  const t0 = performance.now();

  readRuntimeMetadata(target);

  values.push(performance.now() - t0);
}

const sorted = [...values].sort(
  (a, b) => a - b
);

const mean =
  values.reduce((a, b) => a + b, 0) /
  values.length;

const median =
  sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (
        sorted[sorted.length / 2 - 1] +
        sorted[sorted.length / 2]
      ) / 2;

const variance =
  values.reduce(
    (sum, value) =>
      sum + Math.pow(value - mean, 2),
    0
  ) / values.length;

const p95Index =
  Math.min(
    sorted.length - 1,
    Math.ceil(sorted.length * 0.95) - 1
  );

const result = {
  file: target,
  warmups,
  runs,
  mean_ms: mean,
  median_ms: median,
  stddev_ms: Math.sqrt(variance),
  min_ms: sorted[0],
  max_ms: sorted[sorted.length - 1],
  p95_ms: sorted[p95Index]
};

const json =
  JSON.stringify(result, null, 2) + '\n';

process.stdout.write(json);

if (output) {
  fs.writeFileSync(output, json, 'utf8');
}