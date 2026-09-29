'use strict';

function normalizeRuntimeMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Runtime metadata must be an object');
  }

  return {
    operation: String(input.operation ?? ''),
    endpoint: String(input.endpoint ?? ''),
    marker: String(input.marker ?? '')
  };
}

function validateRuntimeMetadata(metadata) {
  if (!/^[a-z0-9_]{1,64}$/.test(metadata.operation)) {
    throw new Error('Invalid operation');
  }

  if (!metadata.endpoint || metadata.endpoint.length > 320) {
    throw new Error('Invalid endpoint');
  }

  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(metadata.marker)) {
    throw new Error('Invalid marker');
  }

  return true;
}

module.exports = {
  normalizeRuntimeMetadata,
  validateRuntimeMetadata
};