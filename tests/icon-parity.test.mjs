import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const canonical = fs.readFileSync(path.join(root, 'assets/favicon.svg'), 'utf8');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const loader = read('dist/index.self-extract.html');
const payload = loader.match(/<script id="self-extract-payload" type="application\/octet-stream">([A-Za-z0-9+/=\r\n]+)<\/script>/);
assert.ok(payload, 'self-extract payload exists');
const restored = gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8');
const pages = [
  ['source', read('src/index.template.html')],
  ['readable', read('dist/index.html')],
  ['root download', read('engineering-calculator.html')],
  ['restored self-extract', restored]
];

// Pin the supplied artwork so a coordinated replacement cannot silently pass parity checks.
test('canonical icon preserves the supplied SVG bytes and rounded green tile', () => {
  assert.equal(createHash('sha256').update(canonical).digest('hex'), '40eb14cb10fd696f138817975c564b2f84bb8529b9723f9329768234a61374dd');
  assert.match(canonical, /viewBox="0 0 64 64"/);
  assert.match(canonical, /<rect width="64" height="64" rx="16" fill="#16624f"\/>/);
});

test('every embedded favicon, including the loader, matches the canonical SVG', () => {
  for (const [name, html] of [...pages, ['self-extract loader', loader]]) {
    const link = html.match(/<link\b[^>]*rel="icon"[^>]*href="data:image\/svg\+xml(?:;charset=UTF-8)?,([^"]+)"[^>]*>/i);
    assert.ok(link, `${name}: embedded favicon exists`);
    assert.equal(decodeURIComponent(link[1]), canonical, name);
  }
});

test('every application header uses the exact canonical SVG artwork', () => {
  for (const [name, html] of pages) {
    const mark = html.match(/<div class="brand-mark" aria-hidden="true">\s*(<svg\b[\s\S]*?<\/svg>)\s*<\/div>/);
    assert.ok(mark, `${name}: decorative header icon exists`);
    assert.equal(mark[1], canonical.trim(), name);
  }
});

test('the full tile fills the existing responsive header icon box', () => {
  for (const [name, html] of pages) {
    const rule = html.match(/\.brand-mark\s*\{([^}]+)\}/)?.[1];
    assert.match(rule || '', /border-radius:\s*25%/, name);
    assert.match(rule || '', /background:\s*transparent/, name);
    const svgRule = html.match(/\.brand-mark svg\s*\{([^}]+)\}/)?.[1];
    assert.match(svgRule || '', /width:\s*100%/, name);
    assert.match(svgRule || '', /height:\s*100%/, name);
    assert.match(svgRule || '', /display:\s*block/, name);
  }
});

test('self-extract restores the complete readable release byte-for-byte', () => {
  assert.deepEqual(gunzipSync(Buffer.from(payload[1], 'base64')), fs.readFileSync(path.join(root, 'dist/index.html')));
});
