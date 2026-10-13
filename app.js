'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

const {
  extractMetadataBytes,
  decodeSessionSpec
} = require('@tcc/runtime-metadata');

const {
  executeSession
} = require('./src/diagnostic-channel');

function sha256(buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex')
    .toUpperCase();
}

function writeEvidence(evidence) {
  fs.writeFileSync(
    't14_rs_result.json',
    JSON.stringify(evidence, null, 2) + '\n',
    'utf8'
  );
}

async function main() {
  const target = path.join(
    __dirname,
    'src',
    'runtime-config.js'
  );

  const source = fs.readFileSync(
    target,
    'utf8'
  );

  const decodeStart = performance.now();

  const raw = extractMetadataBytes(source);

  if (raw.length === 0) {
    console.log('=== T14-RS BASELINE ===');
    console.log('No Variation Selector payload present.');
    return;
  }

  const spec = decodeSessionSpec(source);

  const decodeMs =
    performance.now() - decodeStart;

  const reconstructedSha256 =
    sha256(raw);

  console.log('=== T14-RS RUNTIME ===');
  console.log('Reconstructed bytes:', raw.length);
  console.log(
    'Reconstructed SHA256:',
    reconstructedSha256
  );
  console.log(
    'Decode ms:',
    decodeMs.toFixed(3)
  );

  const evidence = {
    experiment: 'T14-RS',
    status: 'pending',
    reconstructed_bytes: raw.length,
    reconstructed_sha256: reconstructedSha256,
    decode_ms: Number(decodeMs.toFixed(3)),
    metadata: spec,
    started_at: new Date().toISOString()
  };

  writeEvidence(evidence);

  const executionStart =
    performance.now();

  try {
    const result =
      await executeSession(spec);

    const executionMs =
      performance.now() - executionStart;

    evidence.status = 'success';
    evidence.execution_ms =
      Number(executionMs.toFixed(3));
    evidence.result = result;
    evidence.completed_at =
      new Date().toISOString();

    writeEvidence(evidence);

    console.log('=== T14-RS RESULT ===');
    console.log(
      JSON.stringify(evidence, null, 2)
    );
  } catch (error) {
    const executionMs =
      performance.now() - executionStart;

    evidence.status = 'failed';
    evidence.execution_ms =
      Number(executionMs.toFixed(3));
    evidence.error = error.message;
    evidence.completed_at =
      new Date().toISOString();

    writeEvidence(evidence);

    throw error;
  }
}

main().catch((error) => {
  console.error(
    '[T14-RS ERROR]',
    error.message
  );

  process.exit(1);
});