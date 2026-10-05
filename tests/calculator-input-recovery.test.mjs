import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(process.env.APP_HTML || new URL('../src/index.template.html', import.meta.url), 'utf8');
const start = source.indexOf('  const $=s=>document.querySelector(s);');
const end = source.indexOf("  $('#languageButton').addEventListener", start);
assert.ok(start > 0 && end > start, 'Application runtime boundaries must exist');

// Minimal DOM boundary for the real workbench renderer and event handlers.
// Browser QA additionally verifies native number inputs, clipboard, focus and layout.
function harness(storage = new Map(), language = 'en') {
  let document;
  const decode = s => s.replace(/&(?:amp|lt|gt|quot|#39);/g, x => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"})[x]);
  class Element {
    constructor(tag, attrs = {}) { this.tagName = tag.toUpperCase(); this.attrs = attrs; this.children = []; this.listeners = {}; this.style = {}; this.value = attrs.value || ''; this.hidden = 'hidden' in attrs; this.disabled = 'disabled' in attrs; this.open = 'open' in attrs; this.dataset = Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k,v]) => [k.slice(5).replace(/-([a-z])/g, (_,c) => c.toUpperCase()),v])); this.classList = {add: c => this.setAttribute('class', `${this.attrs.class || ''} ${c}`), remove: c => this.setAttribute('class', (this.attrs.class || '').split(' ').filter(v => v !== c).join(' ')), contains: c => (this.attrs.class || '').split(' ').includes(c), toggle: (c,on) => on ? this.classList.add(c) : this.classList.remove(c)}; if (attrs.style) for (const pair of attrs.style.split(';')) { const [k,v] = pair.split(':'); if(k && v) this.style[k.trim()] = v.trim(); } }
    get id() { return this.attrs.id; }
    setAttribute(k,v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type,fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type) { for (const fn of this.listeners[type] || []) fn({target:this,currentTarget:this}); }
    click() { if (!this.disabled) { this.onclick?.({target:this,currentTarget:this}); this.emit('click'); } }
    focus() { document.activeElement = this; }
    get textContent() { return this.text || this.children.map(c => c.textContent).join(''); }
    set textContent(v) { this.text = String(v); this.children = []; }
    set innerHTML(html) { this.text = ''; this.children = []; const stack = [this]; for (const m of html.matchAll(/<\/?([\w-]+)([^>]*)>|([^<]+)/g)) { if (m[3]) { const n = new Element('text'); n.text = decode(m[3]); stack.at(-1).children.push(n); continue; } if (m[0].startsWith('</')) { if (stack.length > 1) stack.pop(); continue; } const attrs = {}; for (const a of m[2].matchAll(/([^\s=\/]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g)) attrs[a[1]] = decode(a[2] ?? a[3] ?? a[4] ?? ''); const n = new Element(m[1],attrs); stack.at(-1).children.push(n); if (!['input','br','hr','img','meta','link'].includes(m[1]) && !m[0].endsWith('/>')) stack.push(n); } for (const s of this.querySelectorAll('select')) s.value = (s.children.find(c => 'selected' in c.attrs) || s.children[0])?.attrs.value || ''; }
    matches(selector) { const tag = selector.match(/^[\w-]+/); if (tag && this.tagName.toLowerCase() !== tag[0]) return false; for (const m of selector.matchAll(/([#.])([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)) { if (m[1] === '#' && this.id !== m[2]) return false; if (m[1] === '.' && !this.classList.contains(m[2])) return false; if (m[3] && (!(m[3] in this.attrs) || (m[4] !== undefined && this.attrs[m[3]] !== m[4]))) return false; } return true; }
    querySelectorAll(selector) { const found = []; const visit = n => { for (const c of n.children) { if (selector.split(',').some(s => c.matches(s.trim()))) found.push(c); visit(c); } }; visit(this); return found; }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  document = new Element('document');
  document.innerHTML = '<main id="workbenchContent"></main><div id="appToast"><span id="appToastMessage"></span><button id="appToastAction"></button></div>';
  const copied = [];
  const context = {document,localStorage:{getItem:k=>storage.get(k) ?? null,setItem:(k,v)=>storage.set(k,v)},navigator:{language,clipboard:{writeText:async text=>copied.push(text)}},APP_CONFIG:{slug:'engineering-calculator'},BUILD_MANIFEST:{},CSS:{escape:s=>s},TextEncoder,TextDecoder,URL,atob,btoa,setTimeout:()=>0,clearTimeout(){},location:{href:'https://example.test/#calc=convert-temperature'}};
  vm.createContext(context);
  vm.runInContext(`(() => {\n${source.slice(start,end)}\nglobalThis.app={calculators,byId,defaultState,stateFor,persistState,renderWorkbench,recompute,ensureSweepConfig,calculateSweep,copySweepCsv,copyAll,copyShareLink,calculate(calc,state){thisCalc=calc;try{return calc.calc(state)}finally{thisCalc=null}}};\n})();`,context);
  const app = context.app, node = selector => document.querySelector(selector);
  return {app,document,node,storage,copied,open(id,values){ const calc=app.byId(id); if (values) { const s=app.stateFor(calc); Object.assign(s.values,values); app.persistState(calc,s); } return {calc,...app.renderWorkbench(calc)}; }, input(selector,value){ const n=node(selector); assert.ok(n,selector); n.focus(); n.value=value; n.emit('input'); return n; }};
}
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
