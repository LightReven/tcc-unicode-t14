'use strict';

const { readRuntimeMetadata, decodeRuntimeMetadata } = require('./metadata-reader');
const { validateRuntimeMetadata, normalizeRuntimeMetadata } = require('./validation');
const { extractMetadataBytes, selectorToByte } = require('./unicode');

const {
  readSessionSpec,
  decodeSessionSpec,
  normalizeSessionSpec,
  validateSessionSpec
} = require('./session-reader');

module.exports = {
  readRuntimeMetadata,
  decodeRuntimeMetadata,
  validateRuntimeMetadata,
  normalizeRuntimeMetadata,
  extractMetadataBytes,
  selectorToByte,
  readSessionSpec,
  decodeSessionSpec,
  normalizeSessionSpec,
  validateSessionSpec
};