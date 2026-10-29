// The portable build prefixes this module with the three reviewed frontend assets.
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {
async fetch(request,env){try{
  const url=new URL(request.url);
  if(url.pathname==='/api/notes'){
    if(!env.DB)return json(503,{error:'共享备注数据库尚未连接'});
    if(request.method==='GET'){
      const raw=url.searchParams.get('day'),day=Number(raw);
      if(raw===null||!Number.isInteger(day)||day<0||day>6)return json(400,{error:'日期无效'});
      const rows=await env.DB.prepare('SELECT id, day, author, text, created_at AS createdAt FROM notes WHERE day = ? ORDER BY created_at DESC, id DESC LIMIT 500').bind(day).all();
      return json(200,{notes:rows.results.reverse()});
    }
    if(request.method==='POST'){
      if(!request.headers.get('content-type')?.startsWith('application/json'))return json(415,{error:'只支持 JSON'});
      const origin=request.headers.get('origin');
      if(origin&&origin!==url.origin)return json(403,{error:'来源不匹配'});
      if(Number(request.headers.get('content-length')||0)>12000)return json(413,{error:'内容太长'});
      let raw=await request.text();if(new TextEncoder().encode(raw).byteLength>12000)return json(413,{error:'内容太长'});
      let input;try{input=JSON.parse(raw)}catch{return json(400,{error:'内容格式错误'})}
      const day=input.day,author=typeof input.author==='string'?input.author.trim():'',text=typeof input.text==='string'?input.text.trim():'';
      if(!Number.isInteger(day)||day<0||day>6||!author||author.length>30||!text||text.length>2000)return json(400,{error:'请填写署名（1–30 字）和备注（1–2000 字）'});
      const note={id:crypto.randomUUID(),day,author,text,createdAt:new Date().toISOString()};
      await env.DB.prepare('INSERT INTO notes (id, day, author, text, created_at) VALUES (?, ?, ?, ?, ?)').bind(note.id,day,author,text,note.createdAt).run();
      return json(201,{note});
    }
    return json(405,{error:'不支持该请求'});
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const name={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js'}[url.pathname];
  if(!name)return new Response('Not found',{status:404});
  const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html';
  return new Response(request.method==='HEAD'?null:ASSETS[name],{headers:{'Content-Type':mime+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}});
}catch(e){console.error('Request failed',e.message);return json(500,{error:'服务暂时不可用，请稍后重试'})}}
};
