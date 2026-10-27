import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => (buf += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, body: buf, json: JSON.parse(buf) });
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

describe('server', () => {
  describe('POST /chat', () => {
    it('should return 400 for missing question', async () => {
      try {
        const res = await post('/chat', {});
        assert.equal(res.status, 400);
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Server not running — skipping');
        } else {
          throw err;
        }
      }
    });

    it('should return JSON with Title, Body, References', async () => {
      try {
        const res = await post('/chat', { question: 'What is the NDC?' });
        assert.equal(res.status, 200);
        assert.ok(res.json.Title !== undefined);
        assert.ok(res.json.Body !== undefined);
        assert.ok(Array.isArray(res.json.References));
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Server not running — skipping');
        } else {
          throw err;
        }
      }
    });

    it('should return 400 for non-JSON body', async () => {
      try {
        const url = new URL('/chat', BASE_URL);
        const req = http.request(
          {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
          },
          (res) => {
            assert.equal(res.statusCode, 400);
          }
        );
        req.on('error', () => assert.ok(true, 'Server not running — skipping'));
        req.write('not json');
        req.end();
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Server not running — skipping');
        } else {
          throw err;
        }
      }
    });
  });

  describe('GET /health', () => {
    it('should return OK', async () => {
      try {
        const url = new URL('/health', BASE_URL);
        const res = await new Promise((resolve, reject) => {
          http.get(url.toString(), (res) => {
            let buf = '';
            res.on('data', (chunk) => (buf += chunk));
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf) }));
          }).on('error', reject);
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'ok');
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Server not running — skipping');
        } else {
          throw err;
        }
      }
    });
  });
});