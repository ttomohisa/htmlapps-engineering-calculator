import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/app-harness.mjs';

function download(h) { const button=h.node('#downloadNoteButton'); assert.ok(button,'Download calculation note action exists'); button.click(); return h.downloads.at(-1); }
async function note(h) { const file=download(h); assert.ok(file,'A current calculation is downloadable'); assert.equal(file.blob.type,'text/plain;charset=utf-8'); return {file,text:await file.blob.text()}; }
const flush=async()=>{await Promise.resolve();await Promise.resolve();};

for(const language of ['en','ja']) test(`${language}: download current torque, units, formula and cautions as UTF-8 text`,async()=>{
  const h=harness(new Map(),language);const {calc}=h.open('power-torque-rpm',{power:'1',rpm:'60'});
  const filename=h.node('#noteFilename');assert.ok(filename,'Editable filename exists');assert.equal(filename.value,'engineering-calculator-power-torque-rpm');assert.ok(h.node('label[for="noteFilename"]'));assert.match(h.node('.note-export').textContent,/\.txt/);
  h.input('#noteFilename','設計メモ');let {file,text}=await note(h);assert.equal(file.filename,'設計メモ.txt');assert.ok(text.includes('Engineering Calculator 1.0.0'));assert.ok(text.includes(calc.id));assert.ok(text.includes(h.app.label(calc)));assert.match(text,/159\.15 N·m/);assert.match(text,/1 kW/);assert.ok(text.includes(language==='ja'?calc.formulaJa:calc.formulaEn));assert.ok(text.includes(h.app.tr('resultNote')));if(calc.noteEn)assert.ok(text.includes(language==='ja'?calc.noteJa:calc.noteEn));assert.ok(!text.includes('#share='));assert.match(text,language==='ja'?/有効数字: 自動/:/Significant digits: Auto/);
  h.input('#field-power','1000');const unit=h.node('[data-unit-for="power"]');unit.value='W';unit.emit('change');({text}=await note(h));assert.match(text,/1000 W/);assert.match(text,/159\.15 N·m/);assert.equal(h.downloads.length,2);assert.equal(h.node('#noteFilename').value,'設計メモ');
});

test('all 80 calculators include each displayed result, active input and full localized assumptions',async()=>{
  for(const language of ['en','ja']){const h=harness(new Map(),language);assert.equal(h.app.calculators.length,80);let customDisplays=0;
    for(const calc of h.app.calculators){const {state,results}=h.open(calc.id);const {text}=await note(h);for(const r of results){assert.ok(text.includes(`${h.app.label(r)}: ${h.app.displayResult(r,state)}`),calc.id+' '+r.id);if(r.display)customDisplays++}for(const field of calc.fields){if(calc.solveFields?.includes(field.id)&&state.values[calc.solveTarget]===field.id)continue;assert.ok(text.includes(h.app.label(field)+':'),calc.id+' '+field.id)}const formula=language==='ja'?calc.formulaJa:calc.formulaEn,assumption=language==='ja'?calc.noteJa:calc.noteEn;assert.ok(text.includes(formula||'—'),calc.id);if(assumption)assert.ok(text.includes(assumption),calc.id);h.flushTimers();assert.equal(h.urls.size,0)}assert.ok(customDisplays>0,'Descriptive results exercised');
  }
});

test('download reflects current precision, language and output units without losing edited name',async()=>{
  const h=harness();const {calc}=h.open('power-torque-rpm',{power:'1',rpm:'60'});h.input('#noteFilename','my torque');
  for(const precision of ['auto','3','4','6']){h.app.setPrecision(precision);h.app.renderWorkbench(calc);const unit=h.node('[data-result-unit="torque"]');assert.ok(unit);unit.value='Nmm';unit.emit('change');const {text}=await note(h);assert.ok(text.includes(h.node('[data-result-value="torque"]').textContent));assert.match(text,new RegExp('Significant digits: '+(precision==='auto'?'Auto':precision)));assert.equal(h.node('#noteFilename').value,'my torque')}
  h.app.setLanguage('ja');h.app.renderWorkbench(calc);const {text}=await note(h);assert.match(text,/有効数字: 6/);assert.ok(text.includes(calc.ja));assert.equal(h.node('#noteFilename').value,'my torque');assert.equal(h.node('#downloadNoteButton').textContent,'計算メモを保存');
});

test('solve-target inputs are excluded; selected options use their visible labels',async()=>{
  const h=harness();const calc=h.app.calculators.find(c=>c.solveTarget);assert.ok(calc);const {state}=h.open(calc.id);const hidden=calc.fields.find(f=>f.id===state.values[calc.solveTarget]);state.values[hidden.id]='999999999';h.app.recompute(calc,state);const {text}=await note(h);const inputs=text.split('\nResults\n')[0];assert.ok(!inputs.includes(h.app.label(hidden)+':'));assert.ok(!text.includes('999999999'));const selector=calc.fields.find(f=>f.id===calc.solveTarget);const option=selector.options.find(o=>o[0]===state.values[selector.id]);assert.ok(inputs.includes(`${h.app.label(selector)}: ${option[2]}`));
});

test('invalid input prevents old-action downloads and correction keeps the edited input and filename',async()=>{
  const h=harness();h.open('power-torque-rpm',{power:'1',rpm:'60'});h.input('#noteFilename','keep me');const old=h.node('#downloadNoteButton');assert.ok(old);
  for(const value of ['',' ','Infinity','1e999']){const input=h.input('#field-rpm',value);assert.equal(h.node('#downloadNoteButton').disabled,true);old.click();assert.equal(h.downloads.length,0);assert.equal(h.document.activeElement,input);h.input('#field-rpm','60');assert.equal(h.node('#field-rpm'),input);assert.equal(h.node('#downloadNoteButton').disabled,false)}
  const {file}=await note(h);assert.equal(file.filename,'keep me.txt');
});

test('overflow and invalid saved input block download until recovery',async()=>{
  const h=harness();h.open('circle');h.input('#field-d','1e156');assert.equal(h.node('#downloadNoteButton')?.disabled,true);download(h);assert.equal(h.downloads.length,0);
  h.open('power-torque-rpm',{power:'1',rpm:''});const restored=harness(h.storage);restored.open('power-torque-rpm');assert.equal(restored.node('#downloadNoteButton')?.disabled,true);restored.input('#field-rpm','60');assert.match((await note(restored)).text,/159\.15 N·m/);
});

test('detached actions cannot export a stale calculation after navigation or redraw',async()=>{
  const h=harness();const {calc}=h.open('power-torque-rpm');h.input('#noteFilename','torque');const old=h.node('#downloadNoteButton');assert.ok(old);h.open('convert-temperature');old.click();assert.equal(h.downloads.length,0);const {text,file}=await note(h);assert.ok(text.includes('convert-temperature'));assert.equal(file.filename,'engineering-calculator-convert-temperature.txt');h.open(calc.id);assert.equal(h.node('#noteFilename').value,'torque');const stale=h.node('#downloadNoteButton');h.app.renderWorkbench(calc);stale.click();assert.equal(h.downloads.length,1);
});

test('filename drafts stay session-only and never enter stored or shared calculation state',()=>{
  const h=harness();const {calc,state}=h.open('power-torque-rpm');assert.ok(h.node('#noteFilename'));h.input('#noteFilename','private_filename');h.input('#field-rpm','70');assert.ok(!JSON.stringify([...h.storage]).includes('private_filename'));assert.ok(!JSON.stringify(h.app.sharePayload(calc,state)).includes('private_filename'));const reload=harness(h.storage);reload.open(calc.id);assert.equal(reload.node('#noteFilename').value,'engineering-calculator-power-torque-rpm');
});

test('unsafe names and repeated extensions become one safe nonempty .txt filename',()=>{
  const h=harness();h.open('convert-temperature');for(const [name,expected] of [['','engineering-calculator-convert-temperature.txt'],['...','engineering-calculator-convert-temperature.txt'],['bad/\\:*?"<>|\u0000name.txt.TXT','badname.txt'],[' CON.txt ','_CON.txt'],['安全なメモ.TXT','安全なメモ.txt'],['memo.txt. ','memo.txt']]){assert.ok(h.node('#noteFilename'));h.input('#noteFilename',name);assert.equal(download(h).filename,expected)}h.input('#noteFilename','🔧'.repeat(300));assert.ok(new TextEncoder().encode(download(h).filename).length<=255);
});

test('download anchors are removed and Blob URLs released after initiation and page exit',()=>{
  const h=harness();h.open('convert-temperature');download(h);assert.equal(h.document.querySelectorAll('a').length,0);assert.equal(h.urls.size,1);h.flushTimers();assert.equal(h.urls.size,0);assert.equal(h.revoked.length,1);download(h);h.emitWindow('pagehide');assert.equal(h.urls.size,0);assert.equal(h.revoked.length,2);h.flushTimers();assert.equal(h.revoked.length,2);
});

test('download failure cleans up without claiming completion and a retry can work',()=>{
  const h=harness(new Map(),'en',{clickThrows:true});h.open('convert-temperature');assert.doesNotThrow(()=>download(h));assert.equal(h.urls.size,0);assert.equal(h.document.querySelectorAll('a').length,0);assert.equal(h.node('#appToastMessage').textContent,'Could not start download');h.platform.clickThrows=false;download(h);assert.equal(h.downloads.length,1);assert.equal(h.node('#appToastMessage').textContent,'Download started');
});

for(const platform of [{clipboardRejects:true,fallbackThrows:true},{clipboardAbsent:true,fallbackThrows:true},{clipboardRejects:true,selectThrows:true}])test('clipboard thrown fallback resolves failure, removes textarea and restores focus '+JSON.stringify(platform),async()=>{
  const h=harness(new Map(),'en',platform);h.open('convert-temperature');const input=h.node('#field-value');input.focus();let result;await assert.doesNotReject(async()=>{result=await h.app.copyText('private calculation')});assert.equal(result,false);assert.equal(h.document.querySelectorAll('textarea').length,0);assert.equal(h.node('#appToastMessage').textContent,'Could not copy');assert.equal(h.document.activeElement,input);
});

for(const mode of ['modern','fallback','absent','false'])test('clipboard '+mode+' reports outcome and removes temporary nodes',async()=>{
  const h=harness(new Map(),'en',{clipboardRejects:mode==='fallback'||mode==='false',clipboardAbsent:mode==='absent',fallbackResult:mode!=='false'});h.open('convert-temperature');const result=await h.app.copyText('current text','Success');assert.equal(result,mode!=='false');assert.equal(h.node('#appToastMessage').textContent,mode==='false'?'Could not copy':'Success');assert.equal(h.document.querySelectorAll('textarea').length,0);if(mode==='modern')assert.deepEqual(h.copied,['current text']);
});

test('pending clipboard rejection preserves newer focus rather than restoring an old target',async()=>{
  let reject;const h=harness(new Map(),'en',{writeText:()=>new Promise((_,r)=>reject=r)});h.open('convert-temperature');h.node('#field-value').focus();const pending=h.app.copyText('current text');const next=h.node('#copyAllButton');next.focus();reject(new Error('denied'));assert.equal(await pending,true);assert.equal(h.document.activeElement,next);assert.equal(h.document.querySelectorAll('textarea').length,0);
});

test('every copy action fails safely and can succeed when retried',async()=>{
  const h=harness(new Map(),'ja',{clipboardRejects:true,fallbackThrows:true});h.open('convert-temperature');for(const selector of ['[data-copy-result]','#copyAllButton','#shareButton','#sweepCsvButton']){const button=h.node(selector);assert.ok(button);button.click();await flush();assert.equal(h.node('#appToastMessage').textContent,'コピーできませんでした');assert.equal(h.document.querySelectorAll('textarea').length,0);h.platform.fallbackThrows=false;button.click();await flush();assert.ok(h.node('#appToastMessage').textContent.includes('コピーしました'));h.platform.fallbackThrows=true}
});

for(const mode of ['modern','fallback','absent','false','throw'])test('all copy action boundaries: '+mode,async()=>{
  const h=harness(new Map(),'en',{clipboardRejects:mode!=='modern'&&mode!=='absent',clipboardAbsent:mode==='absent',fallbackResult:mode!=='false',fallbackThrows:mode==='throw'});h.open('convert-temperature');
  for(const [selector,message] of [['[data-copy-result]','Copied'],['#copyAllButton','Copied'],['#shareButton','Condition link copied'],['#sweepCsvButton','Sweep CSV copied']]){h.node(selector).click();await flush();assert.equal(h.node('#appToastMessage').textContent,['false','throw'].includes(mode)?'Could not copy':message);assert.equal(h.document.querySelectorAll('textarea').length,0)}
});

test('filename cleanup and UTF-8 truncation cannot expose a duplicate .txt suffix',()=>{
  const h=harness();h.open('convert-temperature');
  for(const [input,expected] of [['memo.txt .txt','memo.txt'],['あ'.repeat(65)+'.txtあ','あ'.repeat(65)+'.txt']]){h.input('#noteFilename',input);assert.equal(download(h).filename,expected)}
});
