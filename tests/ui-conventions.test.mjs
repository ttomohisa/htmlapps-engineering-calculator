import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/app-harness.mjs';
const states='engineering-calculator:states', precision='engineering-calculator:precision';
test('shared language precedence reads JSON legacy and does not write on initialization',()=>{
 const storage=new Map([['engineering-calculator:language','"ja"'],['browser-kitty:ui-language:v1','en']]);
 const h=harness(storage,'fr',{shell:true,url:'https://example.test/?lang=en',languages:['fr','ja']});
 h.app.applyLanguage();assert.equal(h.document.documentElement.lang,'en');assert.equal(storage.size,2);
 const legacy=harness(new Map([['engineering-calculator:language','"ja"']]),'en',{shell:true});legacy.app.applyLanguage();assert.equal(legacy.document.documentElement.lang,'ja');
});
test('failed save retains current raw input and retries exact current values',()=>{
 const h=harness(new Map(),'en',{shell:true,writeFails:new Set([states])});h.app.applyLanguage();h.open('convert-temperature');h.input('[data-field="value"]','12.');
 assert.equal(h.node('#saveStatus').getAttribute('data-bk-save-status'),'error');assert.equal(h.node('[data-field="value"]').value,'12.');
 h.platform.writeFails.clear();h.node('#retrySaveButton').click();assert.equal(h.node('#saveStatus').getAttribute('data-bk-save-status'),'saved');
 assert.equal(JSON.parse(h.storage.get(states))['convert-temperature'].values.value,'12.');
});
test('invalid persisted input remains untouched until a scoped recovery confirmation',()=>{
 const storage=new Map([[states,'{broken']]);const h=harness(storage,'en',{shell:true});h.app.applyLanguage();h.open('convert-temperature');h.input('[data-field="value"]','47');assert.equal(storage.get(states),'{broken');
 h.node('#retrySaveButton').click();assert.equal(h.node('#storageRecoveryDialog').open,true);assert.equal(h.document.activeElement.id,'storageRecoveryCancel');h.node('#storageRecoveryCancel').click();assert.equal(storage.get(states),'{broken');
 h.node('#retrySaveButton').click();h.node('#storageRecoveryApply').click();assert.equal(JSON.parse(storage.get(states))['convert-temperature'].values.value,'47');
});
test('language switch preserves invalid input, filename, open details and independent save error',()=>{
 const h=harness(new Map(),'en',{shell:true,writeFails:new Set([states])});h.app.applyLanguage();h.open('convert-temperature');h.input('[data-field="value"]','');h.input('#noteFilename','my-draft');h.node('.formula-box').open=true;
 h.node('#languageButton').click();assert.equal(h.node('[data-field="value"]').value,'');assert.equal(h.node('#noteFilename').value,'my-draft');assert.equal(h.node('.formula-box').open,true);assert.match(h.node('#saveStatus').textContent,/保存できません/);assert.equal(h.storage.has('engineering-calculator:language'),false);
});
test('reset Undo never overwrites later edits and focus pauses its lifetime',()=>{
 const h=harness(new Map(),'en',{shell:true});h.app.applyLanguage();h.open('convert-temperature');h.input('[data-field="value"]','78');h.node('#resetButton').click();
 const undo=h.node('#appToastAction');undo.focus();undo.emit('focusin');h.flushTimers();assert.equal(h.node('#appToast').classList.contains('show'),true);undo.click();assert.equal(h.node('[data-field="value"]').value,'78');assert.equal(h.document.activeElement.id,'resetButton');assert.equal(h.node('#appToastAction').hidden,true);
 h.node('#resetButton').click();h.input('[data-field="value"]','99');h.node('#appToastAction').click();assert.equal(h.node('[data-field="value"]').value,'99');
});
test('download failure persists and translates until successful retry',()=>{
 const h=harness(new Map(),'en',{shell:true,clickThrows:true});h.app.applyLanguage();h.open('convert-temperature');h.node('#downloadNoteButton').click();h.flushTimers();assert.match(h.node('#deliveryStatus').textContent,/download/i);
 h.node('#languageButton').click();assert.match(h.node('#deliveryStatus').textContent,/ダウンロード/);h.platform.clickThrows=false;h.node('#downloadNoteButton').click();assert.equal(h.node('#deliveryStatus').hidden,true);assert.equal(h.downloads.length,1);
});
test('pending copy rejects duplicate invocation and does not lose the captured text',async()=>{
 let resolve;const values=[];const h=harness(new Map(),'en',{shell:true,writeText:text=>{values.push(text);return new Promise(r=>resolve=r)}});h.app.applyLanguage();h.open('convert-temperature');
 const first=h.app.copyText('snapshot');const second=h.app.copyText('duplicate');assert.equal(values.length,1);assert.equal(await second,false);assert.equal(h.node('#copyAllButton').getAttribute('data-bk-state'),'busy');h.node('#languageButton').click();resolve();assert.equal(await first,true);assert.equal(h.node('#copyAllButton').disabled,false);
});

test('a successful input save cannot mask a failed precision save',()=>{
 const h=harness(new Map(),'en',{shell:true,writeFails:new Set([precision])});h.app.applyLanguage();h.open('convert-temperature');h.node('#precisionSelect').value='4';h.node('#precisionSelect').emit('change');h.input('[data-field="value"]','27');
 assert.equal(h.node('#saveStatus').getAttribute('data-bk-save-status'),'error');assert.equal(h.storage.has(precision),false);assert.equal(JSON.parse(h.storage.get(states))['convert-temperature'].values.value,'27');
 h.platform.writeFails.clear();h.node('#retrySaveButton').click();assert.equal(h.storage.get(precision),'"4"');assert.equal(h.node('#saveStatus').getAttribute('data-bk-save-status'),'saved');
});
test('denied common language storage leaves explicit notice without touching legacy values',()=>{
 const key='browser-kitty:ui-language:v1',legacy='engineering-calculator:language';const storage=new Map([[legacy,'"en"']]);const h=harness(storage,'en',{shell:true,writeFails:new Set([key])});h.app.applyLanguage();h.node('#languageButton').click();assert.equal(h.document.documentElement.lang,'ja');assert.equal(h.node('#languageNotice').hidden,false);assert.equal(storage.get(legacy),'"en"');
});
