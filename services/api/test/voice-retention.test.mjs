import test from 'node:test';
import assert from 'node:assert/strict';
import {VoiceSession} from '../dist/voice/session.mjs';

const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function until(check){for(let i=0;i<100;i++){if(check())return;await tick();}assert.fail('Retention operation did not settle');}
async function harness(mode='personal'){
  let listener;const requests=[],events=[],committed=new Map();let failAfterCommit=false;
  const session=new VoiceSession({
    provider:{async listen(callback){listener=callback;return {send(){},close(){}};}},
    send:event=>events.push(event),close(){},
    api:async(path,body,signal)=>{
      if(path==='/voice/session')return {maxSeconds:300};
      assert.equal(path,'/chat');
      const request={body,signal};requests.push(request);
      if(committed.has(body.clientMessageId))return committed.get(body.clientMessageId);
      return new Promise((resolve,reject)=>{
        request.finish=()=>{
          const reply={conversationId:body.conversationId,reply:{id:body.clientMessageId,createdAt:'now',content:'Acknowledged'}};
          committed.set(body.clientMessageId,reply);
          if(failAfterCommit){failAfterCommit=false;reject(new Error('Ambiguous failure after commit'));}else resolve(reply);
        };
        signal.addEventListener('abort',()=>reject(Object.assign(new Error('stopped'),{name:'AbortError'})),{once:true});
      });
    }
  });
  await session.start(mode);session.setMuted(true);
  return {session,requests,events,committed,failNextCommit:()=>{failAfterCommit=true;},
    start:(id,pending=0)=>listener({event:'vad.speech_start',owner:'backend',utteranceId:id,speechActive:true,pendingTranscripts:pending}),
    end:(id,pending=1)=>listener({event:'vad.speech_end',owner:'backend',utteranceId:id,speechActive:false,pendingTranscripts:pending,silence_ms:640}),
    final:(id,text,pending=0,active=false)=>listener({event:'transcript.final',utteranceId:id,text,pendingTranscripts:pending,speechActive:active})};
}

test('three delayed finalized statements remain ordered and process after current speech ends',async()=>{
  const h=await harness();try{
    h.start(1);h.end(1);h.start(2,1);h.final(1,'I enjoy hiking.',0,true);
    h.end(2);h.start(3,1);h.final(2,'I prefer tea.',0,true);
    assert.equal(h.requests.length,0);
    h.end(3);h.final(3,'I am learning Spanish.');
    assert.equal(h.requests.length,1);
    assert.equal(h.requests[0].body.message,'I enjoy hiking.\nI prefer tea.\nI am learning Spanish.');
    assert.equal(h.requests[0].body.mode,'personal');
    h.requests[0].finish();await until(()=>!h.session.processingInput);
    assert.equal(h.committed.size,1);assert.equal(h.events.filter(e=>e.type==='reply').length,1);
  }finally{h.session.stop();}
});

test('continued speech preserves processing input, serializes later input and suppresses stale reply',async()=>{
  const h=await harness();try{
    h.start(1);h.end(1);h.final(1,'I enjoy hiking.');
    const first=h.requests[0];
    h.start(2);h.end(2);h.final(2,'I prefer tea.');
    h.start(3);h.end(3);h.final(3,'I am learning Spanish.');
    assert.equal(first.signal.aborted,false);assert.equal(h.requests.length,1);
    first.finish();await until(()=>h.requests.length===2);
    assert.equal(h.events.filter(e=>e.type==='reply').length,0);
    assert.equal(h.requests[1].body.message,'I prefer tea.\nI am learning Spanish.');
    h.requests[1].finish();await until(()=>!h.session.processingInput);
    assert.equal(h.committed.size,2);assert.equal(h.events.filter(e=>e.type==='reply').length,1);
    assert.notEqual(h.requests[0].body.clientMessageId,h.requests[1].body.clientMessageId);
  }finally{h.session.stop();}
});

test('segment deduplication preserves correction order and legitimate repeated words',async()=>{
  const h=await harness('practice');try{
    h.start(1);h.end(1,3);h.final(1,'I live in Pune.',2);h.final(1,'I live in Pune.',2);
    h.final(2,'Actually, I live in Hyderabad.',1);h.final(3,'Actually, I live in Hyderabad.',0);
    assert.equal(h.requests[0].body.message,'I live in Pune.\nActually, I live in Hyderabad.\nActually, I live in Hyderabad.');
    assert.equal(h.requests[0].body.mode,'practice');
    h.requests[0].finish();await until(()=>!h.session.processingInput);
    h.final(3,'Actually, I live in Hyderabad.');assert.equal(h.requests.length,1);
  }finally{h.session.stop();}
});

test('empty last transcript releases earlier retained statements',async()=>{
  const h=await harness();try{
    h.start(1);h.end(1,2);h.final(1,'I prefer tea.',1);h.final(2,'',0);
    assert.equal(h.requests[0].body.message,'I prefer tea.');
    h.requests[0].finish();await until(()=>!h.session.processingInput);
  }finally{h.session.stop();}
});

test('ambiguous commit retries identical id/content before later statements without duplicate commit',async()=>{
  const h=await harness();try{
    h.failNextCommit();h.start(1);h.end(1);h.final(1,'I prefer tea.');
    const first=h.requests[0];first.finish();await until(()=>h.session.inputPaused);
    h.start(2);h.end(2);h.final(2,'I enjoy hiking.');
    await until(()=>h.requests.length===3);
    assert.equal(h.requests[1].body.clientMessageId,first.body.clientMessageId);
    assert.equal(h.requests[1].body.message,first.body.message);
    assert.equal(h.requests[2].body.message,'I enjoy hiking.');
    h.requests[2].finish();await until(()=>!h.session.processingInput);
    assert.equal(h.committed.size,2);
    assert.equal(h.events.filter(event=>event.type==='reply').length,1);
  }finally{h.session.stop();}
});

test('ending session still cancels processing and discards queued work without further calls',async()=>{
  const h=await harness();
  h.start(1);h.end(1);h.final(1,'I prefer tea.');h.start(2);h.end(2);h.final(2,'I enjoy hiking.');
  h.session.stop();await tick();
  assert.equal(h.requests[0].signal.aborted,true);assert.equal(h.requests.length,1);
  assert.equal(h.session.pendingInput.length,0);assert.equal(h.committed.size,0);
});
