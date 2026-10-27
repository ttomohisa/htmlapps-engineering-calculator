import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('pinned components keep their bytes and native combined scripts parse in every release',()=>{
  const lock=JSON.parse(read('components/ui-conventions.lock.json'));
  for(const [name,hash] of Object.entries(lock.files))assert.equal(sha(read('components/'+name)),hash,name);
  const readable=read('dist/index.html');
  const loader=read('dist/index.self-extract.html').toString();
  const payload=loader.match(/<script id="self-extract-payload" type="application\/octet-stream">([A-Za-z0-9+/=\r\n]+)<\/script>/);
  assert.ok(payload);
  const decoded=gunzipSync(Buffer.from(payload[1],'base64'));
  assert.equal(sha(decoded),sha(readable));
  assert.equal(sha(read('engineering-calculator.html')),sha(readable),'public root must match current readable build');
  for(const [name,bytes] of [['readable',readable],['decoded',decoded],['root',read('engineering-calculator.html')]]){
    const html=bytes.toString();
    for(const file of Object.keys(lock.files))assert.ok(html.includes(read('components/'+file).toString()),name+': '+file);
    const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(([,attrs])=>!(/type\s*=\s*["'](?:application\/json|application\/octet-stream)/i.test(attrs))).map(([,attrs,code])=>{assert.doesNotMatch(attrs,/type\s*=\s*["']module/i);return code;});
    assert.ok(scripts.length>=2);
    new vm.Script(scripts.join('\n'),{filename:name});
    assert.match(html,/connect-src 'none'/);
  }
});
