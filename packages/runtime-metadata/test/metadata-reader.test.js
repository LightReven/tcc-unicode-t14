'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { decodeRuntimeMetadata } = require('../src');

function encodeForFixture(obj) {
  const bytes = Buffer.from(JSON.stringify(obj), 'utf8');
  let out = 'A';
  for (const byte of bytes) {
    out += byte < 16
      ? String.fromCodePoint(0xFE00 + byte)
      : String.fromCodePoint(0xE0100 + byte - 16);
  }
  return out;
}

test('decodes structured runtime metadata', () => {
  const expected = {
    operation: 'metadata_probe',
    transport: 'none',
    host: '',
    port: 0,
    request: '',
    marker: 'TCC-T11'
  };
  const decoded = decodeRuntimeMetadata(`// build-tag: ${encodeForFixture(expected)}`);
  assert.deepEqual(decoded, expected);
});

test('returns null when no supported metadata is present', () => {
  assert.equal(decodeRuntimeMetadata('// build-tag: A'), null);
});
