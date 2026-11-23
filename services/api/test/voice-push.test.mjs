import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocketServer} from 'ws';
import {manualListener} from '../dist/voice/manual.mjs';
import {VoiceSession} from '../dist/voice/session.mjs';

async function until(check){const end=Date.now()+2000;while(Date.now()<end){if(check())return;await new Promise(r=>setTimeout(r,5));}assert.fail('Expected voice operation did not settle');}

test('held turn streams authenticated manual STT and sends one endpoint only on release',async()=>{
  const server=new WebSocketServer({host:'127.0.0.1',port:0});await once(server,'listening');
  const frames=[],events=[];let peer,connection;
  server.on('connection',(ws,request)=>{
    peer=ws;assert.equal(request.headers['api-subscription-key'],'synthetic-only-key');assert.match(request.url,/endpointing=manual/);
    ws.on('message',raw=>{const frame=JSON.parse(raw);frames.push(frame);if(frame.event==='speech_end')ws.send(JSON.stringify({event:'transcript.final',text:'I prefer tea. I enjoy hiking.'}));});
  });
  try{
    connection=await manualListener('synthetic-only-key',e=>events.push(e),()=>assert.fail('Unexpected speech error'),`ws://127.0.0.1:${server.address().port}/stt`);
    connection.send(Buffer.from([1,0,2,0]));connection.send(Buffer.alloc(3200));
    await until(()=>frames.length===3);
    assert.deepEqual(frames.map(f=>f.event),['speech_start','audio_input','audio_input']);
    assert.equal(events.filter(e=>e.event==='transcript.final').length,0);
    connection.finish();connection.finish();
    await until(()=>events.some(e=>e.event==='transcript.final'));
    assert.equal(frames.filter(f=>f.event==='speech_end').length,1);
    const final=events.find(e=>e.event==='transcript.final');assert.equal(final.pendingTranscripts,0);assert.equal(final.speechActive,false);
    peer.send(JSON.stringify({event:'transcript.final',text:'Duplicate'}));
    await new Promise(r=>setTimeout(r,15));assert.equal(events.filter(e=>e.event==='transcript.final').length,1);
    assert.throws(()=>connection.send(Buffer.from([1,0])),/finished/);
  }finally{connection?.close();for(const ws of server.clients)ws.terminate();await new Promise(r=>server.close(r));}
});

async function harness(){
  let listener;const requests=[],events=[];
  const session=new VoiceSession({provider:{async listenManual(callback){listener=callback;return {send(){},finish(){listener({event:'vad.speech_end',pendingTranscripts:0,speechActive:false});},close(){}};}},send:e=>events.push(e),close(){},api:async(path,body)=>{
    if(path==='/voice/session')return {maxSeconds:300};
    assert.equal(path,'/chat');requests.push(body);
    return {conversationId:body.conversationId,reply:{id:'synthetic-reply',createdAt:'now',content:'Acknowledged'}};
  }});
  await session.start('personal',undefined,'push-to-talk');session.setMuted(true);
  return {session,requests,events,emit:event=>listener(event)};
}
test('held statements across pauses wait for release and enter a single serialized chat',async()=>{
  const h=await harness();try{
    h.emit({event:'transcript.final',text:'I prefer tea.',utteranceId:1,speechActive:false,pendingTranscripts:0});
    h.emit({event:'transcript.final',text:'I enjoy hiking.',utteranceId:2,speechActive:false,pendingTranscripts:0});
    assert.equal(h.requests.length,0);
    h.session.finishInput();await until(()=>h.events.some(e=>e.type==='reply'));
    assert.equal(h.requests.length,1);assert.equal(h.requests[0].message,'I prefer tea.\nI enjoy hiking.');
    assert.equal(h.requests[0].mode,'personal');assert.equal(h.requests[0].voice,true);
    assert.throws(()=>h.session.audio(Buffer.alloc(3200)),/Invalid microphone/);
  }finally{h.session.stop();}
});
test('cancelling a held turn never submits its pending statements',async()=>{
  const h=await harness();h.emit({event:'transcript.final',text:'Cancelled input.',utteranceId:1});h.session.stop();
  assert.equal(h.requests.length,0);assert.equal(h.session.pendingInput.length,0);assert.throws(()=>h.session.finishInput(),/Invalid input/);
});
test('empty held input reports completion without a model request',async()=>{
  const h=await harness();try{
    h.session.finishInput();h.emit({event:'transcript.final',text:'',pendingTranscripts:0,speechActive:false});
    assert(h.events.some(e=>e.type==='inputComplete'&&e.empty));assert.equal(h.requests.length,0);
  }finally{h.session.stop();}
});

