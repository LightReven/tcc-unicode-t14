'use strict';

const crypto = require('crypto');
const { readRuntimeMetadata } = require('@tcc/runtime-metadata');

const target = process.argv[2] || 'src/runtime-config.js';
const metadata = readRuntimeMetadata(target);

if (!metadata) {
  console.error('No metadata found in', target);
  process.exit(1);
}

const canonical = JSON.stringify({
  operation: metadata.operation,
  endpoint: metadata.endpoint,
  marker: metadata.marker
});

console.log(
  crypto
    .createHash('sha256')
    .update(canonical, 'utf8')
    .digest('hex')
    .toUpperCase()
);