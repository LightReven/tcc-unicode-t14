'use strict';

/*
 * Metadata representation supported by this research package:
 *   U+FE00..U+FE0F
 *   U+E0100..U+E01EF
 *
 * The module converts supported code points back to bytes. It does not execute
 * dynamic code and contains no networking functionality.
 */

function selectorToByte(codePoint) {
  if (codePoint >= 0xFE00 && codePoint <= 0xFE0F) return codePoint - 0xFE00;
  if (codePoint >= 0xE0100 && codePoint <= 0xE01EF) return codePoint - 0xE0100 + 16;
  return null;
}

function extractMetadataBytes(text) {
  const bytes = [];
  for (const ch of text) {
    const value = selectorToByte(ch.codePointAt(0));
    if (value !== null) bytes.push(value);
  }
  return Buffer.from(bytes);
}

module.exports = { selectorToByte, extractMetadataBytes };
