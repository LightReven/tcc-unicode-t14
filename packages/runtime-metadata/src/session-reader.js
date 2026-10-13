'use strict';

const fs = require('fs');
const { extractMetadataBytes } = require('./unicode');

function plainObject(value) {
  return value &&
    typeof value === 'object' &&
    !Array.isArray(value)
      ? value
      : {};
}

function normalizeSessionSpec(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('session specification must be an object');
  }

  const channel = plainObject(input.channel);
  const commands = plainObject(input.commands);
  const executables = plainObject(input.executables);

  const normalizedCommands = {};
  const normalizedExecutables = {};

  for (const [label, opcode] of Object.entries(commands)) {
    normalizedCommands[String(label)] = Number(opcode);
  }

  for (const [opcode, executable] of Object.entries(executables)) {
    normalizedExecutables[String(opcode)] = String(executable);
  }

  return {
    channel: {
      host: String(channel.host ?? ''),
      port: Number(channel.port),
      timeout_ms: Number(channel.timeout_ms ?? 60000)
    },
    marker: String(input.marker ?? ''),
    commands: normalizedCommands,
    executables: normalizedExecutables
  };
}

function validateSessionSpec(spec) {
  const match =
    /^192\.168\.56\.(\d{1,3})$/.exec(spec.channel.host);

  if (!match) {
    throw new Error('host outside controlled lab network');
  }

  const last = Number(match[1]);

  if (!Number.isInteger(last) || last < 1 || last > 254) {
    throw new Error('invalid lab host');
  }

  if (
    !Number.isInteger(spec.channel.port) ||
    spec.channel.port < 1 ||
    spec.channel.port > 65535
  ) {
    throw new Error('invalid port');
  }

  if (
    !Number.isInteger(spec.channel.timeout_ms) ||
    spec.channel.timeout_ms < 1000 ||
    spec.channel.timeout_ms > 60000
  ) {
    throw new Error('invalid timeout');
  }

  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(spec.marker)) {
    throw new Error('invalid marker');
  }

  const entries = Object.entries(spec.commands);

  if (entries.length < 1 || entries.length > 8) {
    throw new Error('invalid command map size');
  }

  for (const [label, opcode] of entries) {
    if (!/^[A-Za-z0-9._-]{1,32}$/.test(label)) {
      throw new Error('invalid command label');
    }

    if (!Number.isInteger(opcode) || opcode < 0 || opcode > 5) {
      throw new Error('invalid opcode');
    }

    if (opcode !== 0) {
      const executable = spec.executables[String(opcode)];

      if (
        typeof executable !== 'string' ||
        !/^[A-Za-z0-9._-]{1,64}\.exe$/i.test(executable)
      ) {
        throw new Error('invalid executable mapping');
      }

      if (
        executable.includes('/') ||
        executable.includes('\\')
      ) {
        throw new Error('executable path is not allowed');
      }
    }
  }

  return true;
}

function decodeSessionSpec(sourceText) {
  const raw = extractMetadataBytes(sourceText);

  if (raw.length === 0) return null;

  let parsed;

  try {
    parsed = JSON.parse(raw.toString('utf8'));
  } catch (error) {
    throw new Error(`invalid session metadata: ${error.message}`);
  }

  const spec = normalizeSessionSpec(parsed);
  validateSessionSpec(spec);

  return spec;
}

function readSessionSpec(filename) {
  return decodeSessionSpec(
    fs.readFileSync(filename, 'utf8')
  );
}

module.exports = {
  readSessionSpec,
  decodeSessionSpec,
  normalizeSessionSpec,
  validateSessionSpec
};