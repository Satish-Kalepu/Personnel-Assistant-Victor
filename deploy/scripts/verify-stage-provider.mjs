// Synthetic-only authenticated stage check. No microphone or key values.
import {randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {WebSocket} from '../../services/api/node_modules/ws/wrapper.mjs';
import {WavPcm} from '../../services/api/dist/voice/sarvam.mjs';
const base='http://localhost:18080',email=`stage-check-20261121-${randomUUID()}@example.test`,password=`Stage ${randomUUID()}!`;
async function api(path,body,token){const response=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:base,...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(35000)});const value=await response.json();if(!response.ok)throw new Error(`Stage API check failed: ${path} (${response.status})`);return {value,token:response.headers.get('set-auth-token')};}
await api('/account/register',{email});let code;
for(let i=0;i<100&&!code;i++){
  const result=await fetch('http://localhost:18025/api/v1/search?query='+encodeURIComponent(`to:${email}`)).then(r=>r.json());
  for(const item of result.messages||[]){const mail=await fetch(`http://localhost:18025/api/v1/message/${item.ID}`).then(r=>r.json());code=mail.Text?.match(/\b\d{6}\b/)?.[0];if(code)break;}
  if(!code)await new Promise(r=>setTimeout(r,100));
}
if(!code)throw new Error('Stage local verification email did not arrive.');
const verified=await api('/account/verify-registration',{email,code,password,name:'Stage verification'});
if(verified.value.recoveryCodes.length!==10)throw new Error('Recovery code enrollment failed.');
await writeFile(new URL('../.local/stage-fixture.json',import.meta.url),JSON.stringify({email,syntheticOnly:true})+'\n',{mode:0o600});
const login=await api('/auth/sign-in/email',{email,password});const token=login.token;if(!token)throw new Error('Signed native session missing.');
const started=performance.now();const chat=await api('/chat',{mode:'practice',message:'Hello. Please answer with one short friendly greeting.'},token);
if(!chat.value.reply?.content)throw new Error('Live stage chat did not reply.');
console.log(JSON.stringify({stageRegistration:true,emailOtp:true,recoveryCodes:true,liveChat:true,chatMs:Math.round(performance.now()-started)}));
const pcm=new WavPcm().push(await readFile(new URL('../../voice-gateway/.voice-local/sarvam-sample.wav',import.meta.url)));
const count=Math.floor(pcm.length/2*16000/24000),input=Buffer.alloc(count*2);
for(let i=0;i<count;i++){const position=i*1.5,a=Math.floor(position),b=Math.min(a+1,pcm.length/2-1);input.writeInt16LE(Math.round(pcm.readInt16LE(a*2)*(1-(position-a))+pcm.readInt16LE(b*2)*(position-a)),i*2);}
await new Promise((resolve,reject)=>{
  const ws=new WebSocket('ws://localhost:18080/voice');let timer,ended,transcriptAt,replyAt,audioAt,offset=0,bytes=0,complete=false;
  const deadline=setTimeout(()=>{ws.terminate();reject(new Error('Stage voice check timed out.'));},45000);
  ws.on('open',()=>ws.send(JSON.stringify({type:'start',token,mode:'practice'})));
  ws.on('message',data=>{
    const event=JSON.parse(data.toString());
    if(event.type==='ready')timer=setInterval(()=>{if(ws.readyState!==1)return;if(offset<input.length){const chunk=input.subarray(offset,offset+3200);ws.send(chunk);offset+=chunk.length;if(offset>=input.length)ended=performance.now();}else if(offset<input.length+32000){ws.send(Buffer.alloc(3200));offset+=3200;}else clearInterval(timer);},100);
    if(event.type==='transcript'&&event.final)transcriptAt=performance.now();
    if(event.type==='reply')replyAt=performance.now();
    if(event.type==='audio'){audioAt??=performance.now();bytes+=Buffer.from(event.audio,'base64').length;}
    if(event.type==='error'){ws.close();reject(new Error(`Stage voice: ${event.message}`));}
    if(event.type==='speechEnd'&&bytes){complete=true;console.log(JSON.stringify({stageVoice:true,syntheticOnly:true,transcriptAfterInputMs:Math.round(transcriptAt-ended),replyAfterInputMs:Math.round(replyAt-ended),firstAudioAfterInputMs:Math.round(audioAt-ended),outputPcmBytes:bytes}));ws.send(JSON.stringify({type:'stop'}));ws.close();}
  });
  ws.on('error',()=>reject(new Error('Stage voice transport failed.')));
  ws.on('close',()=>{clearTimeout(deadline);clearInterval(timer);complete?resolve():reject(new Error('Stage voice ended before playback.'));});
});
await api('/auth/sign-out',{},token);
console.log('Synthetic check complete; remove its exact fixture account through the stage operator cleanup.');
