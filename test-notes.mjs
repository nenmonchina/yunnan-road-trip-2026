import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,unlink,rmdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const directory=await mkdtemp(path.join(root,'.data','test-')),file=path.join(directory,'notes.json');
let child;
async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:'4174',NOTES_FILE:file},stdio:['ignore','pipe','pipe']});await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('server failed')})])}
async function stop(){if(child){child.kill();await once(child,'exit');child=null}}
const api='http://127.0.0.1:4174/api/notes',send=data=>fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
try{
await start();
assert.deepEqual((await(await fetch(api+'?day=4')).json()).notes,[]);
assert.equal((await send({day:4,author:' ',text:'invalid'})).status,400);
const requests=await Promise.all([send({day:4,author:'同行人 A',text:'蓝月谷备注测试 <script>test</script>'}),send({day:4,author:'同行人 B',text:'另一个浏览器的备注'})]);assert.deepEqual(requests.map(r=>r.status),[201,201]);
let notes=(await(await fetch(api+'?day=4')).json()).notes;assert.equal(notes.length,2);assert.deepEqual(new Set(notes.map(n=>n.author)),new Set(['同行人 A','同行人 B']));assert.ok(notes.every(n=>n.id&&Number.isFinite(Date.parse(n.createdAt))));
assert.equal((await(await fetch(api+'?day=3')).json()).notes.length,0);
const target=notes[0].id;
assert.equal((await fetch(api+'?id='+target+'&day=3',{method:'DELETE'})).status,404);
assert.equal((await fetch(api+'?id='+target+'&day=4',{method:'DELETE'})).status,200);
assert.equal((await fetch(api+'?id='+target+'&day=4',{method:'DELETE'})).status,404);
await stop();await start();notes=(await(await fetch(api+'?day=4')).json()).notes;assert.equal(notes.length,1);assert.equal(JSON.parse(await readFile(file,'utf8')).length,1);assert.notEqual(notes[0].id,target);
console.log('PASS: concurrent shared notes, author/timestamp, date isolation, validation, persistence after restart');
}finally{await stop();await unlink(file).catch(()=>{});await rmdir(directory)}
