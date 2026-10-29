import http from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url)),store=process.env.NOTES_FILE||path.join(root,'.data','notes.json');
await mkdir(path.dirname(store),{recursive:true});
let notes=[];try{notes=JSON.parse(await readFile(store,'utf8'));if(!Array.isArray(notes))throw Error('Invalid notes database')}catch(e){if(e.code!=='ENOENT')throw e}
let writes=Promise.resolve();
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');
if(url.pathname==='/api/notes'){
if(req.method==='GET'){const raw=url.searchParams.get('day'),day=Number(raw);if(raw===null||!Number.isInteger(day)||day<0||day>6)return json(res,400,{error:'日期无效'});return json(res,200,{notes:notes.filter(n=>n.day===day).slice(-500)})}
if(req.method==='DELETE'){
if(req.headers.origin){let host;try{host=new URL(req.headers.origin).host}catch{return json(res,403,{error:'来源无效'})}if(host!==req.headers.host)return json(res,403,{error:'来源不匹配'})}
const id=url.searchParams.get('id'),raw=url.searchParams.get('day'),day=Number(raw);
if(!id||!/^[a-f0-9-]{36}$/i.test(id)||raw===null||!Number.isInteger(day)||day<0||day>6)return json(res,400,{error:'备注标识或日期无效'});
let removed=false;const write=writes.then(async()=>{const next=notes.filter(n=>!(n.id===id&&n.day===day));removed=next.length!==notes.length;if(removed){await writeFile(store+'.tmp',JSON.stringify(next,null,2),'utf8');await rename(store+'.tmp',store);notes=next}});writes=write.catch(()=>{});await write;
return removed?json(res,200,{deleted:true,id}):json(res,404,{error:'该备注已被删除或不存在'})}
if(req.method==='POST'){
if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'只支持 JSON'});
if(req.headers.origin){let host;try{host=new URL(req.headers.origin).host}catch{return json(res,403,{error:'来源无效'})}if(host!==req.headers.host)return json(res,403,{error:'来源不匹配'})}
let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>12000){json(res,413,{error:'内容太长'});return}body+=chunk}
let input;try{input=JSON.parse(body)}catch{return json(res,400,{error:'内容格式错误'})}
const {day}=input,author=typeof input.author==='string'?input.author.trim():'',text=typeof input.text==='string'?input.text.trim():'';
if(!Number.isInteger(day)||day<0||day>6||!author||author.length>30||!text||text.length>2000)return json(res,400,{error:'请填写署名（1–30 字）和备注（1–2000 字）'});
const note={id:randomUUID(),day,author,text,createdAt:new Date().toISOString()};
const write=writes.then(async()=>{const next=[...notes,note];await writeFile(store+'.tmp',JSON.stringify(next,null,2),'utf8');await rename(store+'.tmp',store);notes=next});writes=write.catch(()=>{});await write;return json(res,201,{note})}
return json(res,405,{error:'不支持该请求'})}
if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js'};const file=files[url.pathname];if(!file){res.writeHead(404);return res.end('Not found')}
const body=await readFile(path.join(root,'dist',file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body)
}catch(e){console.error(e.message);if(!res.headersSent)json(res,500,{error:'服务暂时不可用'});else res.end()}});
server.listen(Number(process.env.PORT||4173),process.env.HOST||'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(process.env.PORT||4173)));
