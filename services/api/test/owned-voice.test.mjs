import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocketServer} from 'ws';
import {ownedProvider} from '../dist/voice/owned.mjs';

test('owned VAD uses private auth/manual STT and retains finalized input across new speech',async()=>{
  const worker=new WebSocketServer({host:'127.0.0.1',port:0});
  const stt=new WebSocketServer({host:'127.0.0.1',port:0});
  await Promise.all([once(worker,'listening'),once(stt,'listening')]);
  let workerPeer,sttPeer;const sttMessages=[],events=[];
  worker.on('connection',(peer,request)=>{workerPeer=peer;assert.equal(request.headers.authorization,'Bearer synthetic-worker-token');});
  stt.on('connection',(peer,request)=>{sttPeer=peer;assert.equal(request.headers['api-subscription-key'],'synthetic-speech-key');assert.match(request.url,/endpointing=manual/);peer.on('message',bytes=>sttMessages.push(JSON.parse(bytes)));});
  const provider=ownedProvider({speak(){return 'existing-checked-TTS';}},{url:`ws://127.0.0.1:${worker.address().port}/listen`,token:'synthetic-worker-token',key:'synthetic-speech-key',sttUrl:`ws://127.0.0.1:${stt.address().port}/stt`});
  let connection;
  const settle=()=>new Promise(resolve=>setTimeout(resolve,25));
  try{
    connection=await provider.listen(event=>events.push(event),()=>assert.fail('Unexpected voice error'));
    const input=once(workerPeer,'message');connection.send(Buffer.from([1,2]));assert.deepEqual((await input)[0],Buffer.from([1,2]));
    workerPeer.send(JSON.stringify({event:'vad.speech_start',owner:'backend'}));
    workerPeer.send(Buffer.from([3,4]));
    workerPeer.send(JSON.stringify({event:'vad.speech_end',owner:'backend',silence_ms:640}));
    workerPeer.send(JSON.stringify({event:'vad.speech_start',owner:'backend'}));
    await settle();
    assert.deepEqual(sttMessages.map(e=>e.event),['speech_start','audio_input','speech_end','speech_start']);
    sttPeer.send(JSON.stringify({event:'transcript.final',text:'Superseded phrase'}));
    await settle();assert(events.some(e=>e.text==='Superseded phrase'&&e.utteranceId===1&&e.speechActive===true));
    workerPeer.send(JSON.stringify({event:'vad.speech_end',owner:'backend',silence_ms:640}));
    await settle();sttPeer.send(JSON.stringify({event:'transcript.final',text:'Current phrase'}));
    await settle();assert(events.some(e=>e.text==='Current phrase'&&e.utteranceId===2&&e.pendingTranscripts===0&&e.speechActive===false));
    assert.equal(provider.speak(),'existing-checked-TTS');
  }finally{
    connection?.close();
    for(const peer of [...worker.clients,...stt.clients])peer.terminate();
    await Promise.all([new Promise(r=>worker.close(r)),new Promise(r=>stt.close(r))]);
  }
});
