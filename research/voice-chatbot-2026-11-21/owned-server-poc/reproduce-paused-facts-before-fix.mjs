// Historical diagnosis of the PRE-REPAIR implementation; assertions expect loss.
// Run only against that revision. Current acceptance is voice-retention.test.mjs.
// Synthetic words, local sockets, no providers/DB.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {writeFile} from 'node:fs/promises';
import {WebSocketServer} from '../../../services/api/node_modules/ws/wrapper.mjs';
import {ownedProvider} from '../../../services/api/src/voice/owned.mjs';
import {VoiceSession} from '../../../services/api/src/voice/session.mjs';

const phrases=['I enjoy hiking.','I prefer tea.','I am learning Spanish.'];
const pause=()=>new Promise(resolve=>setTimeout(resolve,30));
const worker=new WebSocketServer({host:'127.0.0.1',port:0});
const stt=new WebSocketServer({host:'127.0.0.1',port:0});
await Promise.all([once(worker,'listening'),once(stt,'listening')]);
let w,s,connection;const forwarded=[];
worker.on('connection',peer=>{w=peer;});stt.on('connection',peer=>{s=peer;});
let adapter;
try {
  const provider=ownedProvider({}, {url:`ws://127.0.0.1:${worker.address().port}/listen`,token:'synthetic-local-token',key:'synthetic-local-key',sttUrl:`ws://127.0.0.1:${stt.address().port}/stt`});
  connection=await provider.listen(event=>{if(event.event==='transcript.final')forwarded.push(event.text);},()=>assert.fail('Unexpected local diagnostic socket failure'));
  const boundary=async(name)=>{w.send(JSON.stringify({event:'vad.speech_'+name,owner:'backend',silence_ms:640}));await pause();};
  await boundary('start');await boundary('end');await boundary('start');
  s.send(JSON.stringify({event:'transcript.final',text:phrases[0]}));await pause();
  await boundary('end');await boundary('start');
  s.send(JSON.stringify({event:'transcript.final',text:phrases[1]}));await pause();
  await boundary('end');s.send(JSON.stringify({event:'transcript.final',text:phrases[2]}));await pause();
  assert.deepEqual(forwarded,[phrases[2]]);
  adapter={suppliedFinals:phrases,forwardedFinals:forwarded,droppedFinals:phrases.filter(p=>!forwarded.includes(p))};
}finally {
  connection?.close();for(const peer of [...worker.clients,...stt.clients])peer.terminate();
  await Promise.all([new Promise(r=>worker.close(r)),new Promise(r=>stt.close(r))]);
}

const requests=[],committed=[],sent=[];let listener;
const session=new VoiceSession({
  provider:{async listen(callback){listener=callback;return {send(){},close(){}};}},
  send:event=>sent.push(event),close(){},
  api:async(path,body,signal)=>{
    if(path==='/voice/session')return {maxSeconds:300};
    if(path==='/voice/speech')throw new Error('Muted diagnostic must not request speech');
    const request={message:body.message,aborted:false,resolve:null};requests.push(request);
    return new Promise((resolve,reject)=>{
      request.resolve=()=>{committed.push(body.message);resolve({conversationId:body.conversationId,reply:{id:'synthetic-reply',createdAt:new Date(0).toISOString(),content:'Synthetic acknowledgement'}});};
      signal.addEventListener('abort',()=>{request.aborted=true;reject(Object.assign(new Error('Diagnostic cancellation'),{name:'AbortError'}));},{once:true});
    });
  }
});
try {
  await session.start('personal');session.setMuted(true);
  for(const phrase of phrases){listener({event:'vad.speech_start',owner:'backend'});listener({event:'transcript.final',text:phrase});await pause();}
  requests.at(-1).resolve();await pause();
  assert.deepEqual(requests.map(r=>r.message),phrases);
  assert.deepEqual(requests.map(r=>r.aborted),[true,true,false]);
  assert.deepEqual(committed,[phrases[2]]);
}finally{session.stop();}

const result={date:'2026-11-22',diagnosisReproduced:true,syntheticOnly:true,productionDataRead:false,providerRequests:0,adapter,session:{chatRequests:requests.map(({message,aborted})=>({message,aborted})),simulatedSuccessfulCommits:committed,replyCount:sent.filter(e=>e.type==='reply').length},limits:['Deterministic synthetic transcript timing, not a real microphone/STT timing measurement.','Persistence is simulated according to the reviewed model-before-write backend; no real database read or modified.'],repairApplied:false};
await writeFile(new URL('./evidence-paused-facts-2026-11-22.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
