import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile('dist/server/index.js','utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const api='https://example.test/api/notes';
const originalFetch=globalThis.fetch;
const forwarded=[];
globalThis.fetch=async(url,options)=>{forwarded.push({url,options});return new Response(JSON.stringify({ok:true}),{status:options.method==='POST'?201:200})};
try{
 const page=await worker.fetch(new Request('https://example.test/'));assert.equal(page.status,200);assert.match(await page.text(),/出行前准备/);
 const preflight=await worker.fetch(new Request(api,{method:'OPTIONS',headers:{Origin:'https://nenmonchina.github.io'}}));assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://nenmonchina.github.io');assert.equal(forwarded.length,0);
 assert.equal((await worker.fetch(new Request(api,{headers:{Origin:'https://foreign.test'}}))).status,403);assert.equal(forwarded.length,0);
 const body=JSON.stringify({day:4,author:'同行人',text:'备注'});
 assert.equal((await worker.fetch(new Request(api,{method:'POST',headers:{Origin:'https://nenmonchina.github.io','Content-Type':'application/json',Cookie:'private=value',Authorization:'Bearer private'},body}))).status,201);
 assert.equal(forwarded[0].options.body,body);assert.equal(forwarded[0].options.headers.get('authorization'),null);assert.equal(forwarded[0].options.headers.get('cookie'),null);
 await worker.fetch(new Request(api+'?day=4&id=abc',{method:'DELETE'}));assert.match(forwarded[1].url,/tcloudbase\.com\/api\/notes\?day=4&id=abc$/);assert.equal(forwarded[1].options.method,'DELETE');
 assert.equal(forwarded[0].options.redirect,'manual');
 globalThis.fetch=async()=>new Response(null,{status:302,headers:{Location:'https://foreign.test'}});assert.equal((await worker.fetch(new Request(api+'?day=1'))).status,502);
 globalThis.fetch=async()=>new Response('{"error":"not found"}',{status:404});assert.equal((await worker.fetch(new Request(api+'?day=1'))).status,404);
 globalThis.fetch=async()=>{throw Error('upstream unavailable')};assert.equal((await worker.fetch(new Request(api+'?day=1'))).status,503);
 console.log('PASS: Worker assets, legacy notes proxy, CORS, credential isolation and upstream failures');
}finally{globalThis.fetch=originalFetch}
