import fs from 'node:fs';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';

const artifact = fs.readFileSync(process.env.APP_HTML || new URL('../../src/index.template.html', import.meta.url), 'utf8');
const payload=artifact.match(/<script id="self-extract-payload" type="application\/octet-stream">([A-Za-z0-9+/=\r\n]+)<\/script>/);
const source=payload?gunzipSync(Buffer.from(payload[1],'base64')).toString('utf8'):artifact;
const start = source.indexOf('  const $=s=>document.querySelector(s);');
const end = source.indexOf("  $('#languageButton').addEventListener", start);
assert.ok(start > 0 && end > start, 'Application runtime boundaries must exist');

// Minimal DOM boundary for the real workbench renderer and event handlers.
// Browser QA additionally verifies native number inputs, clipboard, focus and layout.
export function harness(storage = new Map(), language = 'en', platform = {}) {
  let document;
  const decode = s => s.replace(/&(?:amp|lt|gt|quot|#39);/g, x => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"})[x]);
  class Element {
    constructor(tag, attrs = {}) { this.tagName = tag.toUpperCase(); this.attrs = attrs; this.children = []; this.listeners = {}; this.style = {}; this.value = attrs.value || ''; this.hidden = 'hidden' in attrs; this.disabled = 'disabled' in attrs; this.open = 'open' in attrs; this.dataset = Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k,v]) => [k.slice(5).replace(/-([a-z])/g, (_,c) => c.toUpperCase()),v])); this.classList = {add: c => this.setAttribute('class', `${this.attrs.class || ''} ${c}`), remove: c => this.setAttribute('class', (this.attrs.class || '').split(' ').filter(v => v !== c).join(' ')), contains: c => (this.attrs.class || '').split(' ').includes(c), toggle: (c,on) => on ? this.classList.add(c) : this.classList.remove(c)}; if (attrs.style) for (const pair of attrs.style.split(';')) { const [k,v] = pair.split(':'); if(k && v) this.style[k.trim()] = v.trim(); } }
    append(...nodes) { for(const n of nodes) { n.remove(); this.children.push(n); n.parentNode=this; } }
    remove() { if(this.parentNode) { this.parentNode.children=this.parentNode.children.filter(n=>n!==this); this.parentNode=null; } if(document.activeElement===this)document.activeElement=document.body; }
    get isConnected() { return this===document || !!this.parentNode?.isConnected; }
    select() { this.focus(); if(platform.selectThrows)throw new Error('Selection failed'); }
    get options() { return this.children.filter(child => child.tagName === 'OPTION'); }
    get title() { return this.getAttribute('title') || ''; }
    set title(value) { this.setAttribute('title', value); }
    get id() { return this.attrs.id; }
    setAttribute(k,v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type,fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type) { for (const fn of this.listeners[type] || []) fn({target:this,currentTarget:this}); }
    click() { if(this.tagName==='A') { if(platform.clickThrows)throw new Error('Download failed'); downloads.push({filename:this.download,blob:urls.get(this.href)}); } if (!this.disabled) { this.onclick?.({target:this,currentTarget:this}); this.emit('click'); } }
    focus() { document.activeElement = this; }
    get textContent() { return this.text || this.children.map(c => c.textContent).join(''); }
    set textContent(v) { this.text = String(v); this.children = []; }
    set innerHTML(html) { this.text = ''; for(const c of this.children)c.parentNode=null; this.children = []; const stack = [this]; for (const m of html.matchAll(/<\/?([\w-]+)([^>]*)>|([^<]+)/g)) { if (m[3]) { const n = new Element('text'); n.text = decode(m[3]); stack.at(-1).append(n); continue; } if (m[0].startsWith('</')) { if (stack.length > 1) stack.pop(); continue; } const attrs = {}; for (const a of m[2].matchAll(/([^\s=\/]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g)) attrs[a[1]] = decode(a[2] ?? a[3] ?? a[4] ?? ''); const n = new Element(m[1],attrs); stack.at(-1).append(n); if (!['input','br','hr','img','meta','link'].includes(m[1]) && !m[0].endsWith('/>')) stack.push(n); } for (const s of this.querySelectorAll('select')) s.value = (s.children.find(c => 'selected' in c.attrs) || s.children[0])?.attrs.value || ''; }
    matches(selector) { const tag = selector.match(/^[\w-]+/); if (tag && this.tagName.toLowerCase() !== tag[0]) return false; for (const m of selector.matchAll(/([#.])([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)) { if (m[1] === '#' && this.id !== m[2]) return false; if (m[1] === '.' && !this.classList.contains(m[2])) return false; if (m[3] && (!(m[3] in this.attrs) || (m[4] !== undefined && this.attrs[m[3]] !== m[4]))) return false; } return true; }
    querySelectorAll(selector) { const found = []; const visit = n => { for (const c of n.children) { if (selector.split(',').some(s => c.matches(s.trim()))) found.push(c); visit(c); } }; visit(this); return found; }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  document = new Element('document');
  document.innerHTML = '<main id="workbenchContent"></main><div id="appToast"><span id="appToastMessage"></span><button id="appToastAction"></button></div>';
  if (platform.shell) document.innerHTML = source.slice(source.indexOf('<body>') + 6, source.indexOf('<script>', source.indexOf('<body>')));
  document.documentElement = new Element('html');
  document.body=document;
  document.activeElement=document.body;
  document.createElement=tag=>new Element(tag);
  document.execCommand=()=>{ if(platform.fallbackThrows)throw new Error('Copy denied'); return platform.fallbackResult ?? true; };
  const copied = [],downloads=[],urls=new Map(),revoked=[],timers=new Map(),events={};let nextTimer=0,nextUrl=0;
  class TestURL extends URL { static createObjectURL(blob) { if(platform.urlThrows)throw new Error('URL failed');const url='blob:test-'+(++nextUrl);urls.set(url,blob);return url; } static revokeObjectURL(url) { revoked.push(url);urls.delete(url); } }
  const clipboard={writeText: async text=>{ if(platform.writeText)return platform.writeText(text);if(platform.clipboardRejects)throw new Error('Clipboard denied');copied.push(text); }};
  const context = {document,localStorage:{getItem:k=>storage.get(k) ?? null,setItem:(k,v)=>storage.set(k,v)},navigator:{language,clipboard:platform.clipboardAbsent?undefined:clipboard},APP_CONFIG:{slug:'engineering-calculator',name:'Engineering Calculator',nameJa:'Engineering Calculator',version:'1.0.0'},BUILD_MANIFEST:{},CSS:{escape:s=>s},TextEncoder,TextDecoder,URL:TestURL,Blob,atob,btoa,setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),addEventListener:(type,fn)=>(events[type]||=[]).push(fn),location:{href:'https://example.test/#calc=convert-temperature'}};
  vm.createContext(context);
  vm.runInContext(`(() => {\n${source.slice(start,end)}\n${platform.shell ? source.slice(end, source.indexOf('const help=', end)) : ''}\nglobalThis.app={applyLanguage,updateQuick,copyText,displayResult,sharePayload,label,tr,calculationOutcome,setLanguage(value){language=value},setPrecision(value){precisionSetting=value},calculators,byId,defaultState,stateFor,persistState,renderWorkbench,recompute,ensureSweepConfig,calculateSweep,copySweepCsv,copyAll,copyShareLink,calculate(calc,state){thisCalc=calc;try{return calc.calc(state)}finally{thisCalc=null}}};\n})();`,context);
  const app = context.app, node = selector => document.querySelector(selector);
  return {app,document,node,storage,copied,downloads,urls,revoked,platform,flushTimers(){for(const [id,t] of [...timers]){timers.delete(id);t.fn()}},emitWindow(type){for(const fn of events[type]||[])fn()},open(id,values){ const calc=app.byId(id); if (values) { const s=app.stateFor(calc); Object.assign(s.values,values); app.persistState(calc,s); } return {calc,...app.renderWorkbench(calc)}; }, input(selector,value){ const n=node(selector); assert.ok(n,selector); n.focus(); n.value=value; n.emit('input'); return n; }};
}
