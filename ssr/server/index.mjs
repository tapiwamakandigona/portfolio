// SSR wrapper for the tapiwa.me static build.
//
// The static Appwrite adapter cannot send custom response headers and cannot
// 301 www to the apex, so this thin server does exactly those two jobs and
// otherwise serves the byte-identical static build from ./site.
//
// Design notes:
// - The per-page hash-based CSP stays in each page's <meta> tag (it is
//   page-specific). The CSP *header* below carries only `frame-ancestors`,
//   the one directive meta CSP is forbidden to express. Multiple policies
//   combine by intersection, and a policy containing only frame-ancestors
//   restricts nothing else, so the meta policies keep full effect.
// - Host redirect is an exact match on www.tapiwa.me: preview hosts,
//   localhost and the apex itself must never redirect.
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Works both as ESM source (node server/index.mjs) and inside the esbuild CJS
// bundle, where import.meta.url is undefined but __dirname is real.
const HERE = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
// Bundle layout puts site/ next to server.js; the source tree keeps it one up.
const SITE_DIR = process.env.SITE_DIR
  ? path.resolve(process.env.SITE_DIR)
  : [path.join(HERE, 'site'), path.join(HERE, '../site')]
      .find(p => fs.existsSync(path.join(p, '404.html')));
if (!SITE_DIR) throw new Error('site directory with 404.html not found');
const APEX = process.env.APEX_HOST || 'tapiwa.me';
const WWW = `www.${APEX}`;

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

// Headers the static adapter could never send. Set before any route so they
// apply to pages, assets, redirects and the 404 alike.
app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  next();
});

// True 301, path and query preserved. Placed before everything else so even
// asset requests under www collapse onto the apex.
app.use((req, res, next) => {
  const host = (req.headers.host || '').toLowerCase().replace(/:\d+$/, '');
  if (host === WWW) {
    return res.redirect(301, `https://${APEX}${req.originalUrl}`);
  }
  next();
});

// Long-lived caching for fingerprint-stable folders, revalidation for HTML.
app.use((req, res, next) => {
  if (/^\/(assets|media)\//.test(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  next();
});

app.use(express.static(SITE_DIR, { extensions: [], redirect: true }));

// Anything unmatched gets the site's own 404 page with a real 404 status.
app.use((_req, res) => {
  res.status(404).sendFile(path.join(SITE_DIR, '404.html'));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`portfolio-ssr listening on :${port}, serving ${SITE_DIR}`));
