import {readFile,writeFile} from 'node:fs/promises';
import {WebSocket} from '../../services/api/node_modules/ws/wrapper.mjs';
const base='https://ai_test.satishk.com';
const fixture=JSON.parse(await readFile(new URL('../.local/owned-stage-fixture.json',import.meta.url),'utf8'));
async function api(path,token,body){
  const response=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Victor-Client':'android',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('Synthetic stage API '+path.split('?')[0]+': '+response.status);
  return {body:await response.json(),token:response.headers.get('set-auth-token')};
}
const login=await api('/auth/sign-in/email',null,{email:fixture.email,password:fixture.password});
const config=(await api('/voice/config',login.token)).body;
const priorMessages=(await api('/messages?mode=personal',login.token)).body.messages;
const priorFacts=(await api('/facts',login.token)).body.facts;
if(priorMessages.length||priorFacts.length)throw new Error('Regression requires a fresh empty synthetic account');
const clips=[];
for(let n=1;n<=3;n++){
  const pcm=await readFile(new URL(`../../research/voice-chatbot-2026-11-21/owned-server-poc/.local/paused-fact-${n}.pcm`,import.meta.url));
  const count=Math.floor(pcm.length/3),out=Buffer.alloc(count*2);
  for(let i=0;i<count;i++){const p=i*1.5,a=Math.floor(p),b=Math.min(a+1,pcm.length/2-1);out.writeInt16LE(Math.round(pcm.readInt16LE(a*2)*(1-p+a)+pcm.readInt16LE(b*2)*(p-a)),i*2);}
  clips.push(out);
}
const gapMs=900;
const input=Buffer.concat([Buffer.alloc(16000),clips[0],Buffer.alloc(gapMs*32),clips[1],Buffer.alloc(gapMs*32),clips[2],Buffer.alloc(64000)]);
// TTS may finish before the deliberately appended test silence finishes.
const finalSpeechOffset=input.length-64000;
const events=[];let outputBytes=0,peak=0,timer,session,offset=0,complete=false,finalResult;
try{
  await new Promise((resolve,reject)=>{
    const ws=new WebSocket(config.gatewayUrl,{origin:base});session=ws;
    const deadline=setTimeout(()=>{ws.terminate();reject(new Error('Paused facts stage check timed out'));},60000);
    let checking=false;
    ws.on('open',()=>ws.send(JSON.stringify({type:'start',mode:'personal',token:login.token})));
    ws.on('message',raw=>{
      const event=JSON.parse(raw);
      if(event.type!=='audio'&&!(event.type==='transcript'&&!event.final))events.push({event,at:Math.round(performance.now())});
      if(event.type==='ready')timer=setInterval(()=>{if(ws.readyState!==1)return;const chunk=offset<input.length?input.subarray(offset,offset+3200):Buffer.alloc(3200);offset+=chunk.length;ws.send(chunk);},100);
      if(event.type==='audio'){const pcm=Buffer.from(event.audio,'base64');outputBytes+=pcm.length;for(let i=0;i+1<pcm.length;i+=2)peak=Math.max(peak,Math.abs(pcm.readInt16LE(i)));}
      if(event.type==='error'){clearInterval(timer);ws.close();reject(new Error('Paused facts voice failed: '+event.message));}
      if(event.type==='speechEnd'&&offset>=finalSpeechOffset&&!checking){
        checking=true;
        (async()=>{
          const reply=events.filter(x=>x.event.type==='reply').at(-1)?.event;
          if(!reply)return;
          const messages=(await api('/messages?mode=personal&conversationId='+encodeURIComponent(reply.conversationId),login.token)).body.messages;
          const facts=(await api('/facts',login.token)).body.facts;
          const userStatements=messages.filter(message=>message.role==='user').map(message=>message.content);
          const saved=facts.map(({subject,predicate,object})=>({subject,predicate,object}));
          const historyText=userStatements.join('\n').toLowerCase(),factText=JSON.stringify(saved).toLowerCase();
          const keys=['hiking','green tea','spanish'];
          const allHistory=keys.every(key=>historyText.includes(key)),allFacts=keys.every(key=>factText.includes(key));
          if(allHistory&&allFacts&&peak>100){
            const speechStarts=events.filter(({event})=>event.type==='speechBoundary'&&event.state==='started').length;
            if(speechStarts<3)throw new Error('Synthetic stimulus did not create three separate speech segments');
            complete=true;finalResult={date:'2026-11-22',passed:true,gapMs,endpointMs:640,syntheticOnly:true,freshEmptyAccountVerified:true,speechStarts,userStatements,savedFacts:saved,allThreeStatementsInHistory:allHistory,allThreeFactsSaved:allFacts,outputPcmBytes:outputBytes,peak,events,physicalMicrophoneTested:false};
            ws.send(JSON.stringify({type:'stop'}));ws.close();
          }
        })().catch(reject).finally(()=>{checking=false;});
      }
    });
    ws.on('error',()=>reject(new Error('Synthetic public stage socket failed')));
    ws.on('close',()=>{clearTimeout(deadline);clearInterval(timer);complete?resolve():reject(new Error('Stage closed before all three statements/facts were verified'));});
  });
  await writeFile(new URL('../../research/voice-chatbot-2026-11-21/owned-server-poc/evidence-paused-facts-staging-2026-11-22.json',import.meta.url),JSON.stringify(finalResult,null,2)+'\n');
  console.log(JSON.stringify({...finalResult,events:undefined}));
}finally{
  clearInterval(timer);session?.close();
  if(!complete)await writeFile(new URL('../../research/voice-chatbot-2026-11-21/owned-server-poc/evidence-paused-facts-staging-failed-2026-11-22.json',import.meta.url),JSON.stringify({date:'2026-11-22',passed:false,syntheticOnly:true,gapMs,offset,finalSpeechOffset,outputPcmBytes:outputBytes,peak,events},null,2)+'\n');
  await api('/auth/sign-out',login.token,{});
}
