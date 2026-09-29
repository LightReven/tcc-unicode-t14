'use strict';

function normalizeRuntimeMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Runtime metadata must be an object');
  }

  return {
    operation: String(input.operation ?? ''),
    endpoint: String(input.endpoint ?? ''),
    marker: String(input.marker ?? ''),
    value: String(input.value ?? '')
  };
}

function validateRuntimeMetadata(metadata) {
  if (!metadata.operation) throw new Error('Missing operation');
  if (!metadata.marker) throw new Error('Missing marker');

  if (metadata.endpoint && metadata.endpoint.length > 320) {
    throw new Error('Invalid endpoint');
  }

  return true;
}

module.exports = { normalizeRuntimeMetadata, validateRuntimeMetadata };
