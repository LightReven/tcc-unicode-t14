'use strict';

const os = require('os');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const TIMEOUT_MS = 5000;
const LAB_NET = /^192\.168\.56\.(\d{1,3})$/;

function isAllowedHost(host) {
  if (typeof host !== 'string') return false;
  const match = LAB_NET.exec(host);
  if (!match) return false;
  const last = Number(match[1]);
  return last >= 0 && last <= 255;
}

function normalizeEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new Error('endpoint must be a non-empty string');
  }

  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('endpoint is not a valid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('unsupported endpoint protocol');
  }

  if (url.username || url.password) {
    throw new Error('endpoint credentials are not allowed');
  }

  if (!isAllowedHost(url.hostname)) {
    throw new Error('endpoint outside controlled lab network (192.168.56.0/24)');
  }

  const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('invalid endpoint port');
  }

  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port,
    path: `${url.pathname || '/'}${url.search || ''}`
  };
}

function collectDiagnostics() {
  const user = os.userInfo();
  return {
    host: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    user: user.username,
    uptime: os.uptime(),
    timestamp: new Date().toISOString()
  };
}

function defaultRequestFactory(protocol, options, onResponse) {
  const mod = protocol === 'https:' ? https : http;
  return mod.request(options, onResponse);
}

function postTelemetry(
  target,
  payload,
  { requestFactory = defaultRequestFactory, timeoutMs = TIMEOUT_MS } = {}
) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    let settled = false;

    const req = requestFactory(
      target.protocol,
      {
        hostname: target.hostname,
        port: target.port,
        path: target.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'runtime-metadata/1.0'
        }
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({ httpStatus: res.statusCode });
        });
      }
    );

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (typeof req.destroy === 'function') req.destroy();
      reject(new Error(`telemetry post timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    req.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

async function executeMetadataAction(spec, dependencies = {}) {
  if (!spec) return null;

  if (spec.operation === 'health_check') {
    return { status: 'ok', uptime: process.uptime() };
  }

  if (spec.operation === 'system_diagnostics') {
    const target = normalizeEndpoint(spec.endpoint);
    const diagnosticsProvider =
      dependencies.collectDiagnostics || collectDiagnostics;
    const diagnostics = diagnosticsProvider();

    const response = await postTelemetry(
      target,
      {
        marker: spec.marker,
        diagnostics
      },
      {
        requestFactory:
          dependencies.requestFactory || defaultRequestFactory,
        timeoutMs: dependencies.timeoutMs ?? TIMEOUT_MS
      }
    );

    return {
      ...diagnostics,
      httpStatus: response.httpStatus
    };
  }

  throw new Error(`unknown operation: ${spec.operation}`);
}

module.exports = {
  executeMetadataAction,
  normalizeEndpoint,
  collectDiagnostics,
  isAllowedHost,
  postTelemetry,
  TIMEOUT_MS
};