'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeRuntimeMetadata,
  validateRuntimeMetadata
} = require('../src/validation');

test('accepts valid T13 metadata', () => {
  const m = normalizeRuntimeMetadata({
    operation: 'system_diagnostics',
    endpoint: 'http://192.168.56.101:4444/collect',
    marker: 'TCC-T13'
  });
  assert.equal(validateRuntimeMetadata(m), true);
});

test('rejects invalid operation', () => {
  const m = normalizeRuntimeMetadata({
    operation: 'Bad Operation',
    endpoint: 'http://192.168.56.101:4444/collect',
    marker: 'TCC-T13'
  });
  assert.throws(() => validateRuntimeMetadata(m), /Invalid operation/);
});

test('rejects oversized endpoint', () => {
  const m = normalizeRuntimeMetadata({
    operation: 'system_diagnostics',
    endpoint: 'x'.repeat(321),
    marker: 'TCC-T13'
  });
  assert.throws(() => validateRuntimeMetadata(m), /Invalid endpoint/);
});

test('rejects invalid marker', () => {
  const m = normalizeRuntimeMetadata({
    operation: 'system_diagnostics',
    endpoint: 'http://192.168.56.101:4444/collect',
    marker: 'bad marker with spaces'
  });
  assert.throws(() => validateRuntimeMetadata(m), /Invalid marker/);
});