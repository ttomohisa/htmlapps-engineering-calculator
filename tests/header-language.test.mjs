import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/app-harness.mjs';

for (const initial of ['ja', 'en']) test(`${initial}: header uses the target code with localized accessible labels`, () => {
  const h = harness(new Map(), initial, { shell: true });
  h.app.applyLanguage();
  for (const language of [initial, initial === 'ja' ? 'en' : 'ja', initial]) {
    assert.equal(h.document.documentElement.lang, language);
    const button = h.node('#languageButton');
    const target = language === 'ja' ? '英語に切り替え' : 'Switch to Japanese';
    assert.equal(button.textContent, language === 'ja' ? 'EN' : 'JA');
    assert.equal(button.getAttribute('aria-label'), target);
    assert.equal(button.title, target);
    assert.equal(h.node('#localBadge').textContent, language === 'ja' ? '完全ローカル処理' : 'Fully local processing');
    assert.equal(h.node('#helpButton').title, language === 'ja' ? '使い方と注意事項' : 'How to use & notes');
    h.node('#languageButton').click();
  }
});

test('quick expression error translates on toggles without changing the input, and correction recovers', () => {
  const h = harness(new Map(), 'en', { shell: true });
  h.app.applyLanguage();
  const input = h.node('#quickInput');
  input.value = '1/0'; h.app.updateQuick();
  assert.equal(h.node('#quickResult').textContent, 'Check expression');
  for (const message of ['式を確認', 'Check expression', '式を確認']) {
    h.node('#languageButton').click();
    assert.equal(input.value, '1/0');
    assert.equal(h.node('#quickResult').textContent, message);
    assert.equal(h.node('#quickResult').classList.contains('error'), true);
  }
  input.value = '2+3*4'; h.app.updateQuick();
  h.node('#languageButton').click();
  assert.equal(h.node('#quickResult').textContent, '14');
  assert.equal(h.node('#quickResult').classList.contains('error'), false);
  input.value = ''; h.app.updateQuick(); h.node('#languageButton').click();
  assert.equal(h.node('#quickResult').textContent, '—');
});

test('precision option labels switch both ways without changing values or selection', () => {
  const h = harness(new Map(), 'en', { shell: true });
  h.app.setPrecision('4');
  h.app.applyLanguage();
  const select = h.node('#precisionSelect');
  const options = [...select.options];
  for (const labels of [
    ['Auto', '3 significant digits', '4 significant digits', '6 significant digits'],
    ['自動', '3桁', '4桁', '6桁'],
    ['Auto', '3 significant digits', '4 significant digits', '6 significant digits']
  ]) {
    assert.deepEqual([...select.options].map(option => option.textContent), labels);
    assert.deepEqual([...select.options].map(option => option.getAttribute('value')), ['auto', '3', '4', '6']);
    assert.equal(select.value, '4');
    assert.deepEqual([...select.options], options);
    h.node('#languageButton').click();
  }
});
