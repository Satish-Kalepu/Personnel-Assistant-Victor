import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function browserHarness() {
  const states=[],errors=[],sockets=[],nodes=[],playback=[];
  let stopped=false,closed=0;
  const stream={getTracks:()=>[{stop(){stopped=true;}}]};
  class Context {
    constructor(){this.destination={};this.currentTime=0;this.audioWorklet={async addModule(){}};}
    async resume(){} async close(){closed++;}
    createMediaStreamSource(){return {connect(){},disconnect(){}};}
    createBuffer(channels,length){const data=new Float32Array(length);return {duration:length/24000,getChannelData:()=>data};}
    createBufferSource(){const source={connect(){},disconnect(){},start(){},stop(){}};playback.push(source);return source;}
  }
  class Worklet {
    constructor(){nodes.push(this);this.port={postMessage:message=>{if(message.type==='flush')queueMicrotask(()=>{this.port.onmessage({data:new Uint8Array([1,0]).buffer});this.port.onmessage({data:{type:'flushed'}});});}};}
    connect(){} disconnect(){}
  }
  class Socket {
    static OPEN=1;
    constructor(){sockets.push(this);this.sent=[];this.readyState=0;queueMicrotask(()=>{this.readyState=1;this.onopen?.();});}
    send(value){this.sent.push({value,microphoneStopped:stopped});if(typeof value==='string'&&JSON.parse(value).type==='start')queueMicrotask(()=>this.emit({type:'ready'}));}
    emit(value){this.onmessage?.({data:JSON.stringify(value)});}
    close(){this.readyState=3;this.wasClosed=true;}
  }
  const window={AudioWorkletNode:Worklet};
  vm.runInNewContext(await readFile(new URL('../voice.js',import.meta.url),'utf8'),{
    window,navigator:{mediaDevices:{getUserMedia:async()=>stream}},AudioContext:Context,AudioWorkletNode:Worklet,WebSocket:Socket,
    location:{protocol:'https:',host:'fixture.test',href:'https://fixture.test/'},URL,setTimeout,clearTimeout,atob,
  });
  const voice=new window.VictorVoice({api:async()=>({gatewayUrl:'wss://fixture.test/voice'}),token:()=>null,onState:s=>states.push(s),onTranscript(){},onReply(){},onError:e=>errors.push(e)});
  return {voice,states,errors,sockets,nodes,playback,get stopped(){return stopped;},get closed(){return closed;}};
}
const tick=()=>new Promise(r=>setImmediate(r));

test('press release stops microphone after flushing and waits for complete playback before closing',async()=>{
  const h=await browserHarness();await h.voice.start('personal',null,false,'push-to-talk');await tick();
  const socket=h.sockets[0];assert.equal(JSON.parse(socket.sent[0].value).inputMode,'push-to-talk');
  h.voice.finishInput();await tick();
  const finish=socket.sent.find(x=>typeof x.value==='string'&&JSON.parse(x.value).type==='finishInput');
  assert(finish);assert.equal(finish.microphoneStopped,true);assert.equal(h.stopped,true);assert.equal(h.voice.active,true);
  assert.equal(socket.sent.filter(x=>typeof x.value!=='string').length,1);
  socket.emit({type:'clear',turn:1});socket.emit({type:'reply',reply:{content:'Acknowledged'}});
  socket.emit({type:'audio',turn:1,sampleRate:24000,audio:Buffer.from([1,0,2,0]).toString('base64')});
  socket.emit({type:'speechEnd'});assert.equal(h.voice.active,true);
  h.playback[0].onended();assert.equal(h.voice.active,false);assert.equal(socket.wasClosed,true);assert.equal(h.closed,1);assert.equal(h.states.at(-1),'idle');assert.deepEqual(h.errors,[]);
});
test('muted press reply closes without reopening microphone',async()=>{
  const h=await browserHarness();await h.voice.start('practice',null,true,'push-to-talk');await tick();
  h.voice.finishInput();await tick();h.sockets[0].emit({type:'reply',reply:{content:'Text reply'}});h.sockets[0].emit({type:'state',state:'listening'});
  assert.equal(h.voice.active,false);assert.equal(h.stopped,true);assert.equal(h.closed,1);
});
test('live mode retains microphone after reply and releases it on exit',async()=>{
  const h=await browserHarness();await h.voice.start('personal',null,false,'live');await tick();
  h.sockets[0].emit({type:'reply',reply:{content:'Live reply'}});h.sockets[0].emit({type:'speechEnd'});
  assert.equal(h.voice.active,true);assert.equal(h.stopped,false);assert.equal(h.states.at(-1),'listening');
  h.voice.stop();assert.equal(h.stopped,true);assert.equal(h.closed,1);assert.equal(h.states.at(-1),'idle');
});

test('release flushes the last partial microphone frame before its completion marker',async()=>{
  const frames=[];let processor;
  const source=await readFile(new URL('../public/voice-worklet.js',import.meta.url),'utf8');
  vm.runInNewContext(source,{AudioWorkletProcessor:class{constructor(){this.port={postMessage:frame=>frames.push(frame)};}},sampleRate:48000,registerProcessor(name,Constructor){assert.equal(name,'victor-microphone');processor=new Constructor();}});
  processor.process([[new Float32Array(480).fill(0.25)]]);
  assert.equal(frames.length,0);
  processor.port.onmessage({data:{type:'flush'}});
  assert.equal(frames[0].byteLength,320);assert.equal(new DataView(frames[0]).getInt16(0,true),8192);assert.equal(frames[1].type,'flushed');
  processor.process([[new Float32Array(4800).fill(0.25)]]);assert.equal(frames.length,2);
});
