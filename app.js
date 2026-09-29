'use strict';

const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { performance } = require('perf_hooks');
const { readRuntimeMetadata } = require('@tcc/runtime-metadata');
const { executeMetadataAction } = require('./src/executor');

const EXPECTED_SHA256 = '304ED4AE407FCA7018EEF1B941C32AB6374E2747F71E34E6F38383BAAA2E45F9';

function canonical(metadata) {
  return JSON.stringify({ operation: metadata.operation, endpoint: metadata.endpoint, marker: metadata.marker });
}

function fingerprint(metadata) {
  return crypto.createHash('sha256').update(canonical(metadata),'utf8').digest('hex').toUpperCase();
}

async function main() {
  const target = path.join(__dirname,'src','runtime-config.js');
  const t0 = performance.now();
  const metadata = readRuntimeMetadata(target);
  const decodeMs = performance.now() - t0;
  console.log('=== T12 RUNTIME METADATA ===');
  if (!metadata) { console.log('No metadata present.'); return; }
  console.log(JSON.stringify(metadata,null,2));
  const sha = fingerprint(metadata);
  console.log('SHA256:',sha);
  console.log('Decode ms:',decodeMs.toFixed(3));
  if (sha !== EXPECTED_SHA256) throw new Error('Metadata fingerprint mismatch');
  const t1 = performance.now();
  const result = await executeMetadataAction(metadata);
  const execMs = performance.now() - t1;
  fs.writeFileSync('t12_result.txt',['marker='+metadata.marker,'operation='+metadata.operation,'endpoint='+metadata.endpoint,'sha256='+sha,'decode_ms='+decodeMs.toFixed(3),'execution_ms='+execMs.toFixed(3),'identity='+(result?.identity || '')].join('\\n')+'\\n','utf8');
}

main().catch(e => { console.error(e); process.exit(1); });
