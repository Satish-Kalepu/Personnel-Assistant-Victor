import { WebSocket } from 'ws';

function opened(socket) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.terminate();reject(new Error('Voice handshake timed out'));},10000);
    socket.once('open',()=>{clearTimeout(timer);resolve();});
    socket.once('error',()=>{clearTimeout(timer);reject(new Error('Voice handshake failed'));});
    socket.once('close',()=>{clearTimeout(timer);reject(new Error('Voice handshake closed'));});
  });
}

// Only speech boundaries move to our worker. Checked app replies/memory stay in Node.
export function ownedProvider(base,{url,token,key,sttUrl='wss://api.sarvam.ai/speech-to-text-realtime/ws'}) {
  return {...base,
    async listen(onEvent,onError) {
      let closed=false,worker,stt,turn=0,speechActive=false;
      const pending=[];
      const close=()=>{closed=true;worker?.close();stt?.close();};
      const fail=()=>{if(!closed){close();onError();}};
      const send=(socket,data,binary=false)=>{
        if(socket.readyState!==WebSocket.OPEN||socket.bufferedAmount>262144)throw new Error('Voice stream backpressure');
        socket.send(binary?data:JSON.stringify(data));
      };
      try {
        const target=new URL(sttUrl);
        for(const [name,value] of Object.entries({model:'saaras:v4',language_code:'en-IN',mode:'transcribe',stream_type:'fast',endpointing:'manual',encoding:'linear16',sample_rate:'16000'}))target.searchParams.set(name,value);
        stt=new WebSocket(target,{headers:{'Api-Subscription-Key':key},perMessageDeflate:false,maxPayload:262144});
        stt.on('message',bytes=>{
          if(closed)return;
          try {
            const event=JSON.parse(bytes.toString());
            if(event.event==='transcript.final'){
              const completed=pending.shift();
              // Older finalized speech is valid user input, even if a new
              // utterance has already started. Only its reply may be stale.
              if(completed!==undefined)onEvent({...event,utteranceId:completed,pendingTranscripts:pending.length,speechActive});
            }else if(event.event==='transcript.partial')onEvent(event);
            else if(event.event==='error')fail();
          }catch{fail();}
        });
        stt.on('error',fail);stt.on('close',fail);
        await opened(stt);
        worker=new WebSocket(url,{headers:{Authorization:'Bearer '+token},perMessageDeflate:false,maxPayload:16384});
        worker.on('message',(bytes,binary)=>{
          if(closed)return;
          try {
            if(binary)send(stt,{event:'audio_input',audio:bytes.toString('base64')});
            else {
              const event=JSON.parse(bytes.toString());
              if(event.event==='vad.speech_start'){
                turn++;speechActive=true;send(stt,{event:'speech_start'});onEvent({...event,utteranceId:turn,pendingTranscripts:pending.length,speechActive});
              }else if(event.event==='vad.speech_end'){
                if(pending.length>=20)throw new Error('Too many pending transcripts');
                pending.push(turn);speechActive=false;send(stt,{event:'speech_end'});onEvent({...event,utteranceId:turn,pendingTranscripts:pending.length,speechActive});
              }
            }
          }catch{fail();}
        });
        worker.on('error',fail);worker.on('close',fail);
        await opened(worker);
        if(closed)throw new Error('Voice worker unavailable');
        return {send(bytes){if(!closed)send(worker,bytes,true);},close};
      }catch(error){close();throw error;}
    }
  };
}
