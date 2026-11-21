// Exact ephemeral synthetic account; no human data, email delivery, or secret output.
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {WebSocket} from '../../services/api/node_modules/ws/wrapper.mjs';
import {host,sshOptions} from './stage-ssh.mjs';
const base='https://ai_test.satishk.com';
const fixturePath=new URL('../.local/owned-stage-fixture.json',import.meta.url);
async function privateRemote(source){
  const child=spawn('ssh',[...sshOptions,host,'docker exec -i victor-stage-api-1 node --input-type=module'],{stdio:['pipe','pipe','pipe']});
  let output='',error='';child.stdout.on('data',d=>{output+=d;});child.stderr.on('data',d=>{error=(error+d).slice(-500);});
  const done=new Promise((resolve,reject)=>{child.on('error',()=>reject(new Error('Private stage fixture SSH failed')));child.on('close',code=>code===0?resolve(output):reject(new Error('Private stage fixture operation failed; values withheld')));});
  child.stdin.end(source);return done;
}
if(process.argv[2]==='create'){
  try{await readFile(fixturePath);throw new Error('A fixture record exists; clean it up first');}catch(error){if(error.code!=='ENOENT')throw error;}
  const output=await privateRemote(`
import {randomUUID,randomInt} from 'node:crypto';
import {loadConfig} from './dist/config.js';
import {connectStore} from './dist/store.js';
import {createIdentity} from './dist/auth.js';
import {digest,seal} from './dist/security.js';
const config=loadConfig(),store=await connectStore(config);
try{
 const email='owned-stage-'+randomUUID()+'@example.test',password='Synthetic '+randomUUID()+'!',code=String(randomInt(100000,1000000));
 const identity=createIdentity(store,config,{async queue(){throw new Error('Synthetic fixture must not send mail')}});
 await store.db.collection('challenges').insertOne({email,purpose:'registration',digest:digest(config.AUTH_SECRET,'registration:'+email,code),payload:seal(config.MAIL_ENCRYPTION_KEY,null),expiresAt:new Date(Date.now()+600000),attempts:0,usedAt:null});
 await identity.verifyRegistration({email,code,password,name:'Owned voice staging fixture'});
 console.log(JSON.stringify({email,password,syntheticOnly:true}));
}finally{await store.close();}
`);
  const fixture=JSON.parse(output.trim());
  await writeFile(fixturePath,JSON.stringify(fixture)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({syntheticFixtureCreated:true,emailSent:false,credentialsDisplayed:false}));
}else if(process.argv[2]==='cleanup'){
  const fixture=JSON.parse(await readFile(fixturePath,'utf8'));
  if(!/^owned-stage-[a-f0-9-]{36}@example\.test$/.test(fixture.email))throw new Error('Not an exact synthetic fixture');
  await privateRemote(`
import {MongoClient} from 'mongodb';
const client=new MongoClient(process.env.MONGODB_URI);await client.connect();
try{
 const db=client.db('victor'),email=${JSON.stringify(fixture.email)},user=await db.collection('user').findOne({email,name:'Owned voice staging fixture'});
 if(!user)throw new Error('Exact synthetic fixture missing');
 const tenantId=String(user._id);
 await client.withSession(async session=>{await session.withTransaction(async()=>{
  for(const name of ['messages','conversations','facts','usage','voiceReservations','recoveryCodes'])await db.collection(name).deleteMany({tenantId},{session});
  for(const name of ['session','account'])await db.collection(name).deleteMany({$or:[{userId:user._id},{userId:tenantId}]},{session});
  await db.collection('challenges').deleteMany({email},{session});
  await db.collection('user').deleteOne({_id:user._id,email,name:'Owned voice staging fixture'},{session});
 });});
 if(await db.collection('user').countDocuments({email})||await db.collection('messages').countDocuments({tenantId}))throw new Error('Synthetic cleanup not verified');
 console.log(JSON.stringify({exactSyntheticFixtureRemoved:true,globalSpendPreserved:true}));
}finally{await client.close();}
`);
  const {unlink}=await import('node:fs/promises');await unlink(fixturePath);
  console.log(JSON.stringify({syntheticFixtureRemoved:true,otherAccountsUntouched:true,globalSpendPreserved:true}));
}else if(process.argv[2]==='check'){
  const fixture=JSON.parse(await readFile(fixturePath,'utf8'));
  const api=async(path,body,token)=>{
    const response=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Victor-Client':'android',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(35000)});
    if(!response.ok)throw new Error(`Stage API ${path}: ${response.status}`);
    return {value:await response.json(),token:response.headers.get('set-auth-token')};
  };
  const login=await api('/auth/sign-in/email',{email:fixture.email,password:fixture.password});
  if(!login.token)throw new Error('Signed native session unavailable');
  const config=(await api('/voice/config',null,login.token)).value;
  if(config.endpointMode!=='owned')throw new Error('Stage is not using owned endpointing');
  const pcm=await readFile(new URL('../../research/voice-chatbot-2026-11-21/owned-server-poc/.local/fixture.pcm',import.meta.url));
  const count=Math.floor(pcm.length/3),audio=Buffer.alloc(count*2);
  for(let i=0;i<count;i++){const position=i*1.5,a=Math.floor(position),b=Math.min(a+1,pcm.length/2-1);audio.writeInt16LE(Math.round(pcm.readInt16LE(a*2)*(1-(position-a))+pcm.readInt16LE(b*2)*(position-a)),i*2);}
  const events=[];let outputBytes=0,peak=0,firstAudio,endedAt,offset=0,timer,complete=false;
  try{
    await new Promise((resolve,reject)=>{
      const ws=new WebSocket(config.gatewayUrl,{origin:base});
      const deadline=setTimeout(()=>{ws.terminate();reject(new Error('Owned stage check timed out'));},45000);
      ws.on('open',()=>ws.send(JSON.stringify({type:'start',token:login.token,mode:'practice'})));
      ws.on('message',raw=>{
        const event=JSON.parse(raw);
        if(event.type!=='audio'&&!(event.type==='transcript'&&!event.final))events.push({event,at:Math.round(performance.now())});
        if(event.type==='ready'){
          timer=setInterval(()=>{
            if(ws.readyState!==1)return;
            if(offset<audio.length){const chunk=audio.subarray(offset,offset+3200);ws.send(chunk);offset+=chunk.length;if(offset>=audio.length)endedAt=performance.now();}
            else ws.send(Buffer.alloc(3200));
          },100);
        }
        if(event.type==='audio'){
          firstAudio??=performance.now();const chunk=Buffer.from(event.audio,'base64');outputBytes+=chunk.length;
          for(let i=0;i+1<chunk.length;i+=2)peak=Math.max(peak,Math.abs(chunk.readInt16LE(i)));
        }
        if(event.type==='error'){clearInterval(timer);ws.close();reject(new Error('Stage voice returned an error: '+event.message));}
        if(event.type==='speechEnd'&&outputBytes){complete=true;ws.send(JSON.stringify({type:'interrupt'}));ws.send(JSON.stringify({type:'stop'}));ws.close();}
      });
      ws.on('error',()=>reject(new Error('Public stage WSS failed')));
      ws.on('close',()=>{clearInterval(timer);clearTimeout(deadline);complete?resolve():reject(new Error('Stage ended before completed reply'));});
    });
    const reply=events.find(x=>x.event.type==='reply')?.event.reply?.content||'';
    const final=events.find(x=>x.event.type==='transcript'&&x.event.final)?.event.text||'';
    const boundaries=events.filter(x=>x.event.type==='speechBoundary').map(x=>x.event);
    const passed=peak>100&&/156|one hundred and fifty.six/i.test(reply)&&/12|twelve/i.test(final)&&boundaries.some(x=>x.state==='started')&&boundaries.some(x=>x.state==='ended');
    const result={date:'2026-11-21',passed,publicUrl:base,transport:'authenticated HTTPS/WSS PCM; private Silero worker',endpointMode:config.endpointMode,syntheticOnly:true,transcript:final,reply,boundaries,outputPcmBytes:outputBytes,peak,firstAudioAfterSyntheticInputMs:Math.round(firstAudio-endedAt),events,physicalMicrophoneTested:false,pixelTested:false};
    await writeFile(new URL('../../research/voice-chatbot-2026-11-21/owned-server-poc/evidence-staging.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({passed,endpointMode:config.endpointMode,transcript:final,reply,outputPcmBytes:outputBytes,peak,firstAudioAfterSyntheticInputMs:result.firstAudioAfterSyntheticInputMs}));
    if(!passed)throw new Error('Stage acceptance failed; inspect synthetic evidence');
  }finally{clearInterval(timer);await api('/auth/sign-out',{},login.token);}
}else throw new Error('Choose create, check or cleanup');
