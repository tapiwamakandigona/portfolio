// End-to-end tests against a real listening instance of the wrapper.
import { spawn } from 'child_process';
import assert from 'assert';

const PORT = 4177;
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn('node', ['server/index.mjs'], {
  env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((ok, no) => {
  srv.stdout.on('data', d => d.toString().includes('listening') && ok());
  srv.stderr.on('data', d => process.stderr.write(d));
  setTimeout(() => no(new Error('server did not start')), 8000);
});

let pass = 0, fail = 0;
async function check(name, fn) {
  try { await fn(); pass++; console.log('PASS ', name); }
  catch (e) { fail++; console.log('FAIL ', name, '-', e.message); }
}
// fetch/undici refuses to send a custom Host header, so host-spoofed requests
// must go through node:http directly.
import http from 'http';
function get(path, host) {
  return new Promise((ok, no) => {
    const req = http.request({
      host: '127.0.0.1', port: PORT, path,
      headers: host ? { Host: host } : {},
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => ok({
        status: res.statusCode,
        headers: { get: n => res.headers[n.toLowerCase()] ?? null },
        text: async () => Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', no); req.end();
  });
}

const HEADERS = ['content-security-policy', 'x-frame-options', 'x-content-type-options',
  'referrer-policy', 'cross-origin-opener-policy', 'cross-origin-resource-policy',
  'permissions-policy', 'strict-transport-security'];

// --- canonical host 301
for (const p of ['/', '/zldc/', '/lanlink/downloads/', '/assets/home/fps.webp', '/zldc/?q=1&x=2']) {
  await check(`www ${p} -> 301 apex, path+query kept`, async () => {
    const r = await get(p, 'www.tapiwa.me');
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), `https://tapiwa.me${p}`);
  });
}
await check('www 301 also carries security headers', async () => {
  const r = await get('/', 'www.tapiwa.me');
  for (const h of HEADERS) assert.ok(r.headers.get(h), `missing ${h}`);
});
for (const host of ['tapiwa.me', 'localhost:4177', 'x.appwrite.network', 'wwwtapiwa.me']) {
  await check(`no redirect for host ${host}`, async () => {
    const r = await get('/', host);
    assert.equal(r.status, 200);
  });
}

// --- headers on every response class
for (const p of ['/', '/zldc/', '/site.css', '/analytics.js', '/definitely-not-a-page']) {
  await check(`headers on ${p}`, async () => {
    const r = await get(p);
    for (const h of HEADERS) assert.ok(r.headers.get(h), `missing ${h}`);
    assert.equal(r.headers.get('content-security-policy'), "frame-ancestors 'none'");
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
  });
}

// --- pages still intact (meta CSP survives, content served)
for (const p of ['/', '/zldc/', '/emberdelve/', '/lanlink/downloads/']) {
  await check(`page ${p} 200 + meta CSP intact`, async () => {
    const r = await get(p);
    assert.equal(r.status, 200);
    const t = await r.text();
    assert.ok(t.includes('http-equiv="Content-Security-Policy"'), 'meta CSP lost');
    assert.ok(t.includes('</html>'), 'truncated page');
  });
}

// --- directory redirect (/zldc -> /zldc/) still works
await check('/zldc -> /zldc/ redirect', async () => {
  const r = await get('/zldc');
  assert.ok([301, 302].includes(r.status));
  assert.ok(r.headers.get('location').endsWith('/zldc/'));
});

// --- custom 404 with real status
await check('custom 404 body + status + noindex', async () => {
  const r = await get('/zldc/nope.html');
  assert.equal(r.status, 404);
  const t = await r.text();
  assert.ok(/noindex/.test(t), 'no noindex on 404');
});

// --- caching split
await check('assets get long cache, HTML must-revalidate', async () => {
  const a = await get('/assets/home/fps.webp');
  const h = await get('/');
  assert.ok(a.headers.get('cache-control').includes('max-age=86400'));
  assert.ok(h.headers.get('cache-control').includes('must-revalidate'));
});

srv.kill();
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
