'use strict';

const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const LAB_NET = /^192\.168\.56\.(\d{1,3})$/;

const ALLOWED_SHA256 = new Map([
  [1, '23240EF9F8B0A9A324110B1C2331DE31DC1B0E08F5359CB707E51A939AF56CD3'],
  [2, '22EC2260B5C32177F7D14A33975E1005988BBA0DF3427CC8B47CEC671D3F2A1F'],
  [4, '8A013C65FF778CF8341CD0B3404F6E323C5FF91B5059AC47F3BFE2CD6208F6A1']
]);

function allowedHost(host) {
  const match = LAB_NET.exec(String(host));

  if (!match) return false;

  const last = Number(match[1]);

  return Number.isInteger(last) &&
    last >= 1 &&
    last <= 254;
}

function sha256File(filename) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filename))
    .digest('hex')
    .toUpperCase();
}

function resolveSystemExecutable(name) {
  if (path.basename(name) !== name) {
    throw new Error('executable path rejected');
  }

  const root = path.join(
    process.env.WINDIR || 'C:\\Windows',
    'System32'
  );

  return path.join(root, name);
}

function runVerifiedExecutable(opcode, executable) {
  return new Promise((resolve, reject) => {
    const expected = ALLOWED_SHA256.get(opcode);

    if (!expected) {
      reject(new Error('opcode is not allowlisted'));
      return;
    }

    const target = resolveSystemExecutable(executable);

    if (!fs.existsSync(target)) {
      reject(new Error('executable not found'));
      return;
    }

    const actual = sha256File(target);

    if (actual !== expected) {
      reject(new Error('executable hash mismatch'));
      return;
    }

    execFile(
      target,
      [],
      {
        windowsHide: true,
        encoding: 'buffer',
        timeout: 10000,
        maxBuffer: 2 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        const parts = [];

        if (stdout && stdout.length) {
          parts.push(stdout);
        }

        if (stderr && stderr.length) {
          parts.push(stderr);
        }

        const output = Buffer.concat(parts);

        if (error && output.length === 0) {
          reject(error);
          return;
        }

        resolve(output);
      }
    );
  });
}

function executeSession(spec) {
  if (!allowedHost(spec.channel.host)) {
    throw new Error('host outside controlled lab network');
  }

  return new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;
    let queue = Promise.resolve();

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

    async function processLabel(label) {
      const opcode = spec.commands[label];

      if (!Number.isInteger(opcode)) {
        socket.write('[DENIED]\r\n');
        return;
      }

      if (opcode === 0) {
        complete({ status: 'closed' });
        return;
      }

      const executable =
        spec.executables[String(opcode)];

      try {
        const output =
          await runVerifiedExecutable(
            opcode,
            executable
          );

        socket.write(output);

        if (
          output.length > 0 &&
          output[output.length - 1] !== 0x0A
        ) {
          socket.write('\r\n');
        }
      } catch (error) {
        socket.write(
          `[ERROR] ${error.message}\r\n`
        );
      }
    }

    socket.setEncoding('utf8');
    socket.setTimeout(spec.channel.timeout_ms);

    socket.on('data', (chunk) => {
      buffer += chunk;

      let end;

      while ((end = buffer.indexOf('\n')) !== -1) {
        const label =
          buffer.slice(0, end).trim();

        buffer =
          buffer.slice(end + 1);

        if (!label) continue;

        queue = queue
          .then(() => processLabel(label))
          .catch(() => {});
      }
    });

    socket.on('timeout', () => {
      socket.destroy(
        new Error('session timeout')
      );
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
  sha256File,
  resolveSystemExecutable,
  runVerifiedExecutable
};