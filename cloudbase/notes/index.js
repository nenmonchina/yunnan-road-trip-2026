'use strict';
const {randomUUID}=require('node:crypto');
const allowedOrigins=new Set(['https://nenmonchina.github.io','https://yunnan-november-journey-2026.corou-2728.chatgpt.site']);
function createHandler(database){
  return async function(event){
    const headers=Object.fromEntries(Object.entries(event.headers||{}).map(([key,value])=>[key.toLowerCase(),value]));
    const origin=headers.origin;
    const cors=origin&&allowedOrigins.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{};
    const reply=(statusCode,data)=>({statusCode,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:statusCode===204?'':JSON.stringify(data),isBase64Encoded:false});
    if(origin&&!allowedOrigins.has(origin))return reply(403,{error:'来源不匹配'});
    const method=(event.httpMethod||event.requestContext?.http?.method||'').toUpperCase();
    if(method==='OPTIONS')return reply(204,{});
    const query=event.queryStringParameters||{};
    const day=Number(query.day);
    try{
      const notes=database.collection('travel_notes');
      if(method==='GET'){
        if(query.day==null||!Number.isInteger(day)||day<0||day>6)return reply(400,{error:'日期无效'});
        const result=await notes.where({day}).orderBy('createdAt','desc').limit(500).get();
        return reply(200,{notes:(result.data||[]).reverse().map(n=>({id:n.id||n._id,day:n.day,author:n.author,text:n.text,createdAt:n.createdAt}))});
      }
      if(method==='POST'){
        if(!String(headers['content-type']||'').startsWith('application/json'))return reply(415,{error:'只支持 JSON'});
        const raw=event.isBase64Encoded?Buffer.from(event.body||'','base64').toString('utf8'):event.body;
        if(typeof raw!=='string'||Buffer.byteLength(raw)>12000)return reply(413,{error:'请求正文无效或过长'});
        let input;try{input=JSON.parse(raw)}catch{return reply(400,{error:'内容格式错误'})}
        const author=typeof input.author==='string'?input.author.trim():'',text=typeof input.text==='string'?input.text.trim():'';
        if(!Number.isInteger(input.day)||input.day<0||input.day>6||!author||author.length>30||!text||text.length>2000)return reply(400,{error:'请填写署名（1–30 字）和备注（1–2000 字）'});
        const note={id:randomUUID(),day:input.day,author,text,createdAt:new Date().toISOString()};
        await notes.add({...note,_id:note.id});
        return reply(201,{note});
      }
      if(method==='DELETE'){
        const id=query.id;
        if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id)||query.day==null||!Number.isInteger(day)||day<0||day>6)return reply(400,{error:'备注标识或日期无效'});
        const result=await notes.where({_id:id,day}).remove();
        return result.deleted?reply(200,{deleted:true,id}):reply(404,{error:'该备注已被删除或不存在'});
      }
      return reply(405,{error:'不支持该请求'});
    }catch(error){console.error('Notes request failed',error.code||error.message);return reply(500,{error:'备注服务暂时不可用，请稍后重试'})}
  };
}
let handler;
exports.main=async(event)=>{
  if(!handler){const cloudbase=require('@cloudbase/node-sdk');const app=cloudbase.init({env:cloudbase.SYMBOL_CURRENT_ENV});handler=createHandler(app.database())}
  return handler(event);
};
exports.createHandler=createHandler;
