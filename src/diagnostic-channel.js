'use strict';

const net = require('net');
const os = require('os');

const LAB_NET = /^192\.168\.56\.(\d{1,3})$/;

function allowedHost(host) {
  const match = LAB_NET.exec(String(host));

  if (!match) return false;

  const last = Number(match[1]);

  return Number.isInteger(last) && last >= 1 && last <= 254;
}

function ipv4Summary() {
  const result = [];

  for (const [name, interfaces] of Object.entries(os.networkInterfaces())) {
    for (const item of interfaces || []) {
      if (item.family === 'IPv4' && !item.internal) {
        result.push(`${name}=${item.address}`);
      }
    }
  }

  return result.join('; ');
}

const handlers = new Map([
  [1, () => os.userInfo().username],
  [2, () => os.hostname()],
  [3, () => process.cwd()],
  [4, () => ipv4Summary()],
  [5, () => new Date().toISOString()]
]);

function executeSession(spec) {
  if (!allowedHost(spec.channel.host)) {
    throw new Error('host outside controlled lab network');
  }

  return new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;

    const socket = net.createConnection({
      host: spec.channel.host,
      port: spec.channel.port
    });

    function complete(result) {
      if (settled) return;

      settled = true;
      socket.end();
      resolve(result);
    }

    socket.setEncoding('utf8');
    socket.setTimeout(spec.channel.timeout_ms);

    socket.on('connect', () => {
      socket.write(`${spec.marker}\n`);
    });

    socket.on('data', (chunk) => {
      buffer += chunk;

      let end;

      while ((end = buffer.indexOf('\n')) !== -1) {
        const label = buffer.slice(0, end).trim();
        buffer = buffer.slice(end + 1);

        if (!label) continue;

        const opcode = spec.commands[label];

        if (!Number.isInteger(opcode)) {
          socket.write(`[DENIED] ${label}\n`);
          continue;
        }

        if (opcode === 0) {
          socket.write('[CLOSED]\n');
          complete({ status: 'closed' });
          return;
        }

        const handler = handlers.get(opcode);

        if (!handler) {
          socket.write(`[DENIED] ${label}\n`);
          continue;
        }

        try {
          const result = String(handler()).replace(/\r?\n/g, ' ');
          socket.write(`[RESULT] ${label}=${result}\n`);
        } catch (error) {
          socket.write(`[ERROR] ${label}\n`);
        }
      }
    });

    socket.on('timeout', () => {
      socket.destroy(new Error('session timeout'));
    });

    socket.on('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });

    socket.on('close', () => {
      if (settled) return;

      settled = true;
      resolve({ status: 'remote_closed' });
    });
  });
}

module.exports = {
  executeSession,
  allowedHost,
  ipv4Summary
};