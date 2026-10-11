// CSS/translation contracts complement, but do not replace, native wheel/layout QA.
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';
const artifact = fs.readFileSync(process.env.APP_HTML || new URL('../src/index.template.html', import.meta.url), 'utf8');
const payload = artifact.match(/<script id="self-extract-payload"[^>]*>([A-Za-z0-9+/=\r\n]+)<\/script>/);
const html = payload ? gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8') : artifact;
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');

test('native modal state locks both document scroll containers', () => {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const target of ['html:has(dialog:modal)', 'body:has(dialog:modal)']) {
    const body = rules.filter(([, selectors]) => selectors.split(',').some(s => s.trim() === target)).map(([, , declarations]) => declarations).join(';');
    assert.match(body, /(?:^|;)\s*overflow\s*:\s*hidden\s*(?:;|$)/, target);
  }
});

test('Japanese and English Help explain modal background scrolling', () => {
  const help = html.match(/function renderHelp\(\)\{([\s\S]*?)\n  function buildInfoHtml/)[1];
  assert.match(help, /ダイアログを開いている間は背景のスクロールを止め/);
  assert.match(help, /While a dialog is open, background scrolling is locked/);
});

test('existing shield and native Help/Settings dismissal wiring remain present', () => {
  assert.match(html, /class="local-badge"><svg[^>]*>[\s\S]*?<path d="M12 3 5 6v5c0 4\.6 2\.8 8 7 10 4\.2-2 7-5\.4 7-10V6z"\/>/);
  assert.match(html, /id="helpDialog" aria-labelledby="helpTitle"/);
  assert.match(html, /id="settingsDialog" aria-labelledby="settingsTitle"/);
  assert.match(html, /help\.showModal\(\)/);
  assert.match(html, /settings\.showModal\(\)/);
});

test('Help allocates scroll to its body while the header stays fixed', () => {
  assert.match(css, /#helpDialog\[open\]\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*overflow:\s*hidden/);
  assert.match(css, /#helpDialog\s+\.dialog-head\s*\{[^}]*flex:\s*0\s+0\s+auto/);
  assert.match(css, /#helpDialog\s+\.dialog-body\s*\{[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto/);
});
