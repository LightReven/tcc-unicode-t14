'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const { readRuntimeMetadata } = require('@tcc/runtime-metadata');
const { executeMetadataAction } = require('./src/telemetry');

function canonical(metadata) {
  return JSON.stringify({
    operation: metadata.operation,
    endpoint: metadata.endpoint,
    marker: metadata.marker
  });
}

function fingerprint(metadata) {
  return crypto
    .createHash('sha256')
    .update(canonical(metadata), 'utf8')
    .digest('hex')
    .toUpperCase();
}

function writeEvidence(evidence) {
  fs.writeFileSync(
    't13_result.json',
    JSON.stringify(evidence, null, 2) + '\n',
    'utf8'
  );
}

async function main() {
  const target = path.join(__dirname, 'src', 'runtime-config.js');

  const decodeStart = performance.now();
  const metadata = readRuntimeMetadata(target);
  const decodeMs = performance.now() - decodeStart;

  console.log('=== T13 RUNTIME METADATA ===');

  if (!metadata) {
    console.log('No metadata present.');
    return;
  }

  const sha256 = fingerprint(metadata);

  console.log(JSON.stringify(metadata, null, 2));
  console.log('SHA256:', sha256);
  console.log('Decode ms:', decodeMs.toFixed(3));

  const evidence = {
    experiment: 'T13',
    status: 'pending',
    metadata,
    sha256,
    decode_ms: Number(decodeMs.toFixed(3)),
    started_at: new Date().toISOString()
  };

  writeEvidence(evidence);

  const execStart = performance.now();

  try {
    const result = await executeMetadataAction(metadata);
    const executionMs = performance.now() - execStart;

    evidence.status = 'success';
    evidence.execution_ms = Number(executionMs.toFixed(3));
    evidence.result = result;
    evidence.completed_at = new Date().toISOString();
    writeEvidence(evidence);

    console.log('=== T13 RESULT ===');
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    const executionMs = performance.now() - execStart;

    evidence.status = 'failed';
    evidence.execution_ms = Number(executionMs.toFixed(3));
    evidence.error = error.message;
    evidence.completed_at = new Date().toISOString();
    writeEvidence(evidence);

    throw error;
  }
}

main().catch((error) => {
  console.error('[T13-ERROR]', error.message);
  process.exit(1);
});