import {WebSocket} from 'ws';

// A user-held turn has explicit boundaries; it needs no silence/VAD endpoint.
export async function manualListener(key,onEvent,onError,url='wss://api.sarvam.ai/speech-to-text-realtime/ws') {
  const target=new URL(url);
  for(const [name,value] of Object.entries({model:'saaras:v4',language_code:'en-IN',mode:'transcribe',stream_type:'fast',endpointing:'manual',encoding:'linear16',sample_rate:'16000'}))target.searchParams.set(name,value);
  const socket=new WebSocket(target,{headers:{'Api-Subscription-Key':key},perMessageDeflate:false,maxPayload:262144});
  let closed=false,started=false,finished=false,finalized=false,timer;
  const close=()=>{closed=true;clearTimeout(timer);socket.close();};
  const fail=()=>{if(!closed){close();onError();}};
  const send=data=>{
    if(socket.readyState!==WebSocket.OPEN||socket.bufferedAmount>262144)throw Error('Speech backpressure');
    socket.send(JSON.stringify(data));
  };
  socket.on('message',bytes=>{
    if(closed)return;
    try{
      const event=JSON.parse(bytes.toString());
      if(event.event==='transcript.partial')onEvent(event);
      else if(event.event==='transcript.final'&&finished&&!finalized){
        finalized=true;clearTimeout(timer);
        onEvent({...event,utteranceId:1,pendingTranscripts:0,speechActive:false});
      }else if(event.event==='error')fail();
    }catch{fail();}
  });
  socket.on('error',fail);socket.on('close',()=>{if(!finalized)fail();});
  try{
    await new Promise((resolve,reject)=>{
      const deadline=setTimeout(()=>{socket.terminate();reject(Error('Speech handshake timed out'));},10000);
      const done=callback=>()=>{clearTimeout(deadline);callback();};
      socket.once('open',done(resolve));
      socket.once('error',done(()=>reject(Error('Speech handshake failed'))));
      socket.once('close',done(()=>reject(Error('Speech handshake closed'))));
    });
    if(closed)throw Error('Speech unavailable');
    return {
      send(bytes){
        if(closed||finished)throw Error('Input already finished');
        if(!started){started=true;send({event:'speech_start'});onEvent({event:'vad.speech_start',owner:'user',speechActive:true,pendingTranscripts:0});}
        send({event:'audio_input',audio:bytes.toString('base64')});
      },
      finish(){
        if(closed||finished)return;
        finished=true;
        onEvent({event:'vad.speech_end',owner:'user',speechActive:false,pendingTranscripts:started?1:0});
        if(started){timer=setTimeout(fail,15000);send({event:'speech_end'});}
        else{finalized=true;onEvent({event:'transcript.final',text:'',utteranceId:1,pendingTranscripts:0,speechActive:false});}
      },close,
    };
  }catch(error){close();throw error;}
}
