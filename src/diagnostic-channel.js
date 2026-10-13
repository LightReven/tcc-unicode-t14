'use strict';

const net = require('net');
const os = require('os');

const LAB_NET = /^192\.168\.56\.(\d{1,3})$/;

function allowedHost(host) {
  const match = LAB_NET.exec(String(host));
  if (!match) return false;

  const last = Number(match[1]);

  return Number.isInteger(last) &&
    last >= 1 &&
    last <= 254;
}

function windowsIpConfig() {
  const lines = [
    '',
    'Windows IP Configuration',
    ''
  ];

  for (const [name, interfaces] of Object.entries(os.networkInterfaces())) {
    const ipv4 = (interfaces || []).filter(
      item => item.family === 'IPv4' && !item.internal
    );

    if (ipv4.length === 0) continue;

    lines.push(`${name}:`);
    lines.push('');

    for (const item of ipv4) {
      lines.push(
        `   IPv4 Address. . . . . . . . . . . : ${item.address}`
      );

      if (item.netmask) {
        lines.push(
          `   Subnet Mask . . . . . . . . . . . : ${item.netmask}`
        );
      }
    }

    lines.push('');
  }

  return lines.join('\r\n');
}

const handlers = new Map([
  [1, () => os.userInfo().username],
  [2, () => os.hostname()],
  [3, () => process.cwd()],
  [4, () => windowsIpConfig()],
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

    socket.on('data', (chunk) => {
      buffer += chunk;

      let end;

      while ((end = buffer.indexOf('\n')) !== -1) {
        const label = buffer.slice(0, end).trim();
        buffer = buffer.slice(end + 1);

        if (!label) continue;

        const opcode = spec.commands[label];

        if (!Number.isInteger(opcode)) {
          socket.write(
            `'${label}' is not recognized as an internal or external command,\r\n` +
            'operable program or batch file.\r\n'
          );
          continue;
        }

        if (opcode === 0) {
          complete({ status: 'closed' });
          return;
        }

        const handler = handlers.get(opcode);

        if (!handler) {
          socket.write(
            `'${label}' is not recognized as an internal or external command,\r\n` +
            'operable program or batch file.\r\n'
          );
          continue;
        }

        try {
          const result = String(handler());
          socket.write(result + '\r\n');
        } catch {
          socket.write('The command could not be completed.\r\n');
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
  windowsIpConfig
};