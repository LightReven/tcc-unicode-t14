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
    operation: 'metadata_probe',
    endpoint: '',
    marker: 'TCC-T12',
    value: ''
  };
  assert.deepEqual(decodeRuntimeMetadata('// metadata: ' + encodeForFixture(expected)), expected);
});

test('returns null when selectors are absent', () => {
  assert.equal(decodeRuntimeMetadata('// build: v2.4.0'), null);
});
