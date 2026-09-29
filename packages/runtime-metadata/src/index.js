'use strict';

const { readRuntimeMetadata, decodeRuntimeMetadata } = require('./metadata-reader');
const { validateRuntimeMetadata, normalizeRuntimeMetadata } = require('./validation');

module.exports = {
  readRuntimeMetadata,
  decodeRuntimeMetadata,
  validateRuntimeMetadata,
  normalizeRuntimeMetadata
};
