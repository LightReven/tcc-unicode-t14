'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');

const {
  normalizeEndpoint,
  collectDiagnostics,
  isAllowedHost,
  executeMetadataAction
} = require('./telemetry');

test('isAllowedHost accepts canonical usable lab hosts', () => {
  assert.equal(isAllowedHost('192.168.56.1'), true);
  assert.equal(isAllowedHost('192.168.56.101'), true);
  assert.equal(isAllowedHost('192.168.56.254'), true);
});

test('isAllowedHost rejects network, broadcast and malformed addresses', () => {
  for (const host of [
    '192.168.56.0',
    '192.168.56.255',
    '192.168.56.256',
    '192.168.56.999',
    '192.168.56.abc',
    '192.168.57.1',
    '10.0.0.1',
    '127.0.0.1',
    ''
  ]) {
    assert.equal(isAllowedHost(host), false, host);
  }
});

test('normalizeEndpoint accepts HTTP lab URL', () => {
  assert.deepEqual(
    normalizeEndpoint('http://192.168.56.101:4444/collect'),
    {
      protocol: 'http:',
      hostname: '192.168.56.101',
      port: 4444,
      path: '/collect'
    }
  );
});

test('normalizeEndpoint accepts HTTPS lab URL', () => {
  assert.deepEqual(
    normalizeEndpoint('https://192.168.56.101:443/collect'),
    {
      protocol: 'https:',
      hostname: '192.168.56.101',
      port: 443,
      path: '/collect'
    }
  );
});

test('normalizeEndpoint rejects unsupported protocols', () => {
  assert.throws(
    () => normalizeEndpoint('ftp://192.168.56.101/file'),
    /unsupported endpoint protocol/
  );

  assert.throws(
    () => normalizeEndpoint('file:///C:/test'),
    /unsupported endpoint protocol|outside controlled lab/
  );
});

test('normalizeEndpoint rejects malformed URL', () => {
  assert.throws(
    () => normalizeEndpoint('not-a-url'),
    /not a valid URL/
  );
});

test('normalizeEndpoint rejects credentials', () => {
  assert.throws(
    () => normalizeEndpoint(
      'http://user:pass@192.168.56.101:4444/collect'
    ),
    /credentials/
  );
});

test('normalizeEndpoint rejects targets outside lab subnet', () => {
  assert.throws(
    () => normalizeEndpoint('http://10.0.0.1:4444/collect'),
    /outside controlled lab network/
  );
});

test('normalizeEndpoint rejects port zero', () => {
  assert.throws(
    () => normalizeEndpoint('http://192.168.56.101:0/collect'),
    /invalid endpoint port/
  );
});

test('normalizeEndpoint rejects invalid high port', () => {
  assert.throws(
    () => normalizeEndpoint('http://192.168.56.101:99999/collect'),
    /valid URL|invalid endpoint port/
  );
});

test('collectDiagnostics returns expected fields', () => {
  const d = collectDiagnostics();

  for (const key of [
    'host',
    'platform',
    'release',
    'arch',
    'user',
    'uptime',
    'timestamp'
  ]) {
    assert.ok(Object.hasOwn(d, key), key);
  }
});

test('system_diagnostics builds POST without real network', async () => {
  let captured;

  function fakeRequestFactory(protocol, options, onResponse) {
    const req = new EventEmitter();
    const chunks = [];

    req.write = (chunk) => {
      chunks.push(Buffer.from(chunk));
    };

    req.destroy = () => {
      req.emit('close');
    };

    req.end = () => {
      captured = {
        protocol,
        options,
        body: Buffer.concat(chunks).toString('utf8')
      };

      const res = new EventEmitter();
      res.statusCode = 200;

      process.nextTick(() => {
        onResponse(res);
        res.emit('data', Buffer.from('OK'));
        res.emit('end');
      });
    };

    return req;
  }

  const result = await executeMetadataAction(
    {
      operation: 'system_diagnostics',
      endpoint: 'http://192.168.56.101:4444/collect',
      marker: 'TCC-T14-TEST'
    },
    {
      requestFactory: fakeRequestFactory,

      collectDiagnostics: () => ({
        host: 'runner-test',
        platform: 'win32',
        release: 'test',
        arch: 'x64',
        user: 'lab-user',
        uptime: 1,
        timestamp: '2026-09-29T00:00:00.000Z'
      }),

      timeoutMs: 1000
    }
  );

  assert.equal(result.httpStatus, 200);
  assert.equal(captured.protocol, 'http:');
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.path, '/collect');

  const body = JSON.parse(captured.body);

  assert.equal(body.marker, 'TCC-T14-TEST');
  assert.equal(body.diagnostics.user, 'lab-user');
});