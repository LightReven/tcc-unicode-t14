'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRuntimeMetadata, validateRuntimeMetadata } = require('../src/validation');

test('accepts valid metadata', () => {
  const n = normalizeRuntimeMetadata({ operation:'health_check', marker:'TCC-T12' });
  assert.equal(validateRuntimeMetadata(n), true);
});

test('rejects missing operation', () => {
  const n = normalizeRuntimeMetadata({ marker:'TCC-T12' });
  assert.throws(() => validateRuntimeMetadata(n), /Missing operation/);
});

test('rejects missing marker', () => {
  const n = normalizeRuntimeMetadata({ operation:'health_check' });
  assert.throws(() => validateRuntimeMetadata(n), /Missing marker/);
});
