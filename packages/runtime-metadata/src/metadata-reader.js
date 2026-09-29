'use strict';

const fs = require('fs');
const { extractMetadataBytes } = require('./unicode');
const { normalizeRuntimeMetadata, validateRuntimeMetadata } = require('./validation');

function decodeRuntimeMetadata(sourceText) {
  const raw = extractMetadataBytes(sourceText);
  if (raw.length === 0) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw.toString('utf8'));
  } catch (error) {
    throw new Error(`Invalid runtime metadata: ${error.message}`);
  }

  const normalized = normalizeRuntimeMetadata(parsed);
  validateRuntimeMetadata(normalized);
  return normalized;
}

function readRuntimeMetadata(filename) {
  return decodeRuntimeMetadata(fs.readFileSync(filename, 'utf8'));
}

module.exports = { readRuntimeMetadata, decodeRuntimeMetadata };
