'use strict';

function normalizeRuntimeMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Runtime metadata must be an object');
  }

  return {
    operation: String(input.operation || ''),
    transport: String(input.transport || ''),
    host: String(input.host || ''),
    port: Number(input.port || 0),
    request: String(input.request || ''),
    marker: String(input.marker || '')
  };
}

function validateRuntimeMetadata(metadata) {
  if (!metadata.operation) throw new Error('Missing operation');
  if (!metadata.transport) throw new Error('Missing transport');
  if (!metadata.marker) throw new Error('Missing marker');
  if (metadata.host && metadata.host.length > 255) throw new Error('Invalid host');
  if (metadata.port && (!Number.isInteger(metadata.port) || metadata.port < 1 || metadata.port > 65535)) {
    throw new Error('Invalid port');
  }
  return true;
}

module.exports = { normalizeRuntimeMetadata, validateRuntimeMetadata };
