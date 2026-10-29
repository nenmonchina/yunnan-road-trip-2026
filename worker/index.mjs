// The portable build prefixes this module with the reviewed frontend assets.
const NOTES_API='https://yunnan-notes-d9glvl31g451cf24c-1255463023.ap-shanghai.app.tcloudbase.com/api/notes';
const PAGES_ORIGIN='https://nenmonchina.github.io';
const allowedOrigin=(origin,url)=>!origin||origin===url.origin||origin===PAGES_ORIGIN;
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
async function handleRequest(request){try{
  const url=new URL(request.url);
  if(url.pathname==='/api/notes'){
    if(!allowedOrigin(request.headers.get('origin'),url))return json(403,{error:'来源不匹配'});
    if(request.method==='OPTIONS')return new Response(null,{status:204});
    if(!['GET','POST','DELETE'].includes(request.method))return json(405,{error:'不支持该请求'});
    const headers=new Headers();
    if(request.headers.has('content-type'))headers.set('content-type',request.headers.get('content-type'));
    let body;
    if(request.method==='POST'){
      body=await request.text();
      if(new TextEncoder().encode(body).byteLength>12000)return json(413,{error:'内容太长'});
    }
    // Keep old clients on the same data store as new Pages clients.
    const upstream=await fetch(NOTES_API+url.search,{method:request.method,headers,body,redirect:'error',signal:AbortSignal.timeout(15000)});
    return new Response(upstream.body,{status:upstream.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const name={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js'}[url.pathname];
  if(!name)return new Response('Not found',{status:404});
  const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html';
  return new Response(request.method==='HEAD'?null:ASSETS[name],{headers:{'Content-Type':mime+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}});
}catch(e){console.error('Request failed',e.message);return json(503,{error:'共享备注服务暂时不可用，请稍后重试'})}}
export default {async fetch(request){const response=await handleRequest(request),origin=request.headers.get('origin');if(new URL(request.url).pathname==='/api/notes'&&origin&&allowedOrigin(origin,new URL(request.url))){const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Vary','Origin');return new Response(response.body,{status:response.status,headers})}return response}};
