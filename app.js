'use strict';

const path = require('path');

const {
  readRuntimeMetadata
} = require('@tcc/runtime-metadata');

const {
  executeMetadataAction
} = require('./src/executor');

async function main() {
  const target = path.join(
    __dirname,
    'src',
    'runtime-config.js'
  );

  const metadata =
    readRuntimeMetadata(target);

  console.log(
    '=== RUNTIME METADATA ==='
  );

  if (metadata === null) {
    console.log(
      'No metadata present.'
    );

    return;
  }

  console.log(
    JSON.stringify(
      metadata,
      null,
      2
    )
  );

  await executeMetadataAction(
    metadata
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});