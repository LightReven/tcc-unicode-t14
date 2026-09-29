'use strict';

const fs = require('fs');

const target = process.argv[2] || 'src/runtime-config.js';
const text = fs.readFileSync(target, 'utf8');

const selectors = [];

for (const ch of text) {
  const cp = ch.codePointAt(0);

  if (
    (cp >= 0xFE00 && cp <= 0xFE0F) ||
    (cp >= 0xE0100 && cp <= 0xE01EF)
  ) {
    selectors.push(cp);
  }
}

const bmp = selectors.filter(
  cp => cp >= 0xFE00 && cp <= 0xFE0F
);

const supplementary = selectors.filter(
  cp => cp >= 0xE0100 && cp <= 0xE01EF
);

console.log(JSON.stringify({
  file: target,
  total_vs: selectors.length,
  bmp_vs: bmp.length,
  supplementary_vs: supplementary.length,
  codepoints: selectors.map(
    cp => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')
  )
}, null, 2));