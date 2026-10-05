import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/app-harness.mjs';

function assertUnavailable(h) {
  assert.equal(h.node('#resultList').textContent,'');
  for (const id of ['copyAllButton','shareButton']) { const n=h.node('#'+id); assert.ok(!n || n.disabled, `${id} must be unavailable`); }
  assert.ok(!h.node('#sweepBox') || h.node('#sweepBox').hidden, 'Sweep must be unavailable');
  assert.equal(h.node('#sweepCsvButton'),null);
}
function assertAvailable(h) {
  for (const id of ['copyAllButton','shareButton','sweepBox']) { const n=h.node('#'+id); assert.ok(n, `${id} restored`); assert.equal(n.disabled,false); assert.equal(n.hidden,false); }
}

for (const language of ['en','ja']) test(`${language}: blank temperature is invalid; explicit zero and negative remain valid`, () => {
  const h=harness(new Map(),language); const {calc,state}=h.open('convert-temperature');
  for (const invalid of ['', '  ', 'Infinity', '1e999']) { const input=h.input('#field-value',invalid); assertUnavailable(h); assert.equal(h.document.activeElement,input); assert.match(h.node('#resultStatus').textContent,language==='ja'?/数値/:/number/); assert.equal(h.node('#field-value').getAttribute('aria-invalid'),'true'); }
  for (const valid of ['0','-40','20']) { h.input('#field-value',valid); assertAvailable(h); const results=h.app.calculate(calc,state); assert.equal(results[0].value,Number(valid)); if(valid==='0') { assert.equal(results[1].value,32); assert.equal(results[2].value,273.15); } assert.equal(h.node('#field-value').getAttribute('aria-invalid'),'false'); }
});

test('invalid saved RPM recovers result, Copy/Share and sweep repeatedly without replacing input', () => {
  let h=harness(); h.open('power-torque-rpm',{power:'1',rpm:''}); h=harness(h.storage); const {calc,state}=h.open('power-torque-rpm'); assertUnavailable(h);
  for (let i=0;i<3;i++) { const input=h.input('#field-rpm','60'); assertAvailable(h); assert.equal(h.node('#field-rpm'),input); assert.equal(h.document.activeElement,input); assert.ok(Math.abs(h.app.calculate(calc,state)[0].value-159.15494309189535)<1e-9); h.node('#copyAllButton').click(); assert.match(h.copied.at(-1),/159\.15 N·m/); h.node('#shareButton').click(); assert.match(h.copied.at(-1),/#share=/); h.input('#field-rpm',''); assertUnavailable(h); }
  h.input('#field-rpm','60'); state.values.power='1000'; state.units.power='W'; assert.ok(Math.abs(h.app.calculate(calc,state)[0].value-159.15494309189535)<1e-9);
});

test('manual sweep equal or blank ranges stay visible and persisted, suppressing graph and CSV until corrected', () => {
  const h=harness(); const {calc,state,results}=h.open('convert-temperature');
  assert.equal(h.node('#sweepStart').value,'16'); assert.equal(h.node('#sweepEnd').value,'24');
  for (const invalid of ['24','','  ']) { const input=h.input('#sweepStart',invalid); assert.equal(state.meta.sweep.start,invalid); assert.equal(h.node('#sweepStart'),input); assert.equal(h.document.activeElement,input); assert.equal(h.node('.sweep-chart'),null); assert.equal(h.node('#sweepCsvButton'),null); assert.match(h.node('#sweepGraph').textContent,/range/); const count=h.copied.length; h.app.copySweepCsv(calc,state,results); assert.equal(h.copied.length,count); const reload=harness(h.storage); reload.open(calc.id); assert.equal(reload.node('#sweepStart').value,invalid); assert.equal(reload.node('#sweepCsvButton'),null); }
  h.input('#sweepStart','0'); assert.ok(h.node('.sweep-chart')); h.node('#sweepCsvButton').click(); const csv=h.copied.at(-1).split('\n'); assert.equal(csv.length,22); assert.equal(csv[1],'0,0'); assert.equal(csv.at(-1),'24,24'); assert.equal(state.meta.sweep.start,'0');
  h.input('#sweepStart','30'); h.node('#sweepCsvButton').click(); assert.equal(h.copied.at(-1).split('\n')[1],'30,30'); assert.equal(h.copied.at(-1).split('\n').at(-1),'24,24');
});

test('all 80 default calculators render and active blank numeric fields invalidate calculations', () => {
  const h=harness(); assert.equal(h.app.calculators.length,80);
  for(const calc of h.app.calculators) { const {state,error}=h.open(calc.id); assert.equal(error,'',calc.id); assert.ok(h.node('#resultList').textContent,calc.id); for(const field of calc.fields) { if(field.type==='select'||(calc.solveFields?.includes(field.id)&&state.values[calc.solveTarget]===field.id))continue; const original=state.values[field.id]; state.values[field.id]=''; h.app.recompute(calc,state); assertUnavailable(h); state.values[field.id]=original; h.app.recompute(calc,state); } }
});

test('invalid calculation cannot copy stale conditions, share links or sweep data through an old action', () => {
  const h=harness(); const {calc,state,results}=h.open('convert-temperature'); h.input('#field-value',''); h.app.copyAll(calc,state); h.app.copyShareLink(calc,state); h.app.copySweepCsv(calc,state,results); assert.equal(h.copied.length,0);
});

test('overflowing results are unavailable and finite recovery works', () => {
  const h=harness(); h.open('circle'); h.input('#field-d','1e308'); assertUnavailable(h); h.input('#field-d','100'); assertAvailable(h);
});

test('output-unit overflow cannot expose a placeholder as a valid copyable result', () => {
  const h=harness(); h.open('circle'); h.input('#field-d','1e156'); assertUnavailable(h); h.input('#field-d','100'); assertAvailable(h);
});

test('initialization fills only absent sweep bounds and preserves a partial saved blank', () => {
  const h=harness(); const calc=h.app.byId('convert-temperature'),state=h.app.defaultState(calc); state.meta.sweep={start:'',rangePreset:'custom'}; h.app.persistState(calc,state); h.open(calc.id); assert.equal(h.node('#sweepStart').value,''); assert.equal(h.node('#sweepEnd').value,'24'); assert.equal(h.node('#sweepCsvButton'),null);
});
