'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { decodeRuntimeMetadata } = require('../src');

function encodeForFixture(obj) {
  const bytes = Buffer.from(JSON.stringify(obj), 'utf8');
  let out = 'A';

  for (const byte of bytes) {
    if (byte < 16) out += String.fromCodePoint(0xFE00 + byte);
    else out += String.fromCodePoint(0xE0100 + byte - 16);
  }

  return out;
}

test('decodes structured runtime metadata', () => {
  const expected = {
    operation: 'system_diagnostics',
    endpoint: 'http://192.168.56.101:4444/collect',
    marker: 'TCC-T13-TEST'
  };

  const decoded = decodeRuntimeMetadata(
    '// metadata: ' + encodeForFixture(expected)
  );

  assert.deepEqual(decoded, expected);
});

test('returns null when selectors are absent', () => {
  assert.equal(decodeRuntimeMetadata('// build: v3.0.0 ðŸ”§'), null);
});

test('rejects malformed JSON metadata', () => {
  const bad = 'A' + String.fromCodePoint(0xE0100 + ('{'.charCodeAt(0) - 16));
  assert.throws(() => decodeRuntimeMetadata(bad));
});