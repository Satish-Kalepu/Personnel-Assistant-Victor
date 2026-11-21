const $ = id => document.getElementById(id);
let config, session = null, busy = false, epoch = 0, turnCount = 0;
const headers = {'Content-Type':'application/json','X-Voice-POC':'local'};
async function post(path, body) {
  const response = await fetch(path, {method:'POST', headers, body:JSON.stringify(body)});
  if (!response.ok) { let message = `Request failed (${response.status})`; try {message = (await response.json()).error || message;} catch {} throw new Error(message); }
  return response;
}
function error(message) {$('error').textContent=message; $('error').hidden=!message;}
function controls() {
  $('mode').disabled = $('silence').disabled = busy || !!session;
  $('microphone').disabled = busy || !!session || !config;
  $('fixture').disabled = busy || !!session || !config?.fixture_available;
  $('end').disabled = busy || !session;
  $('interrupt').disabled = !session || session.channel?.readyState !== 'open';
}
function route() {
  const cloud=$('mode').value==='cloud';
  $('privacy').textContent=cloud?'Cloud mode sends audio to Sarvam for transcription and synthesis. OpenAI receives the transcript. This isolated demo has no personal memory or production tools.':'Local mode sends live audio only to this computer. The demo agent returns an acknowledgement tone; it does not transcribe or understand speech.';
  $('route').textContent=cloud?'Sarvam STT → OpenAI → Sarvam TTS':'Local acknowledgement → WebRTC';
  $('transcript').textContent=cloud?'Waiting for speech…':'Local routing mode does not transcribe.';
}
$('mode').addEventListener('change',route);
function event(event) {
  if(event.type==='vad') {
    const percent=Math.round(event.probability*100); $('level').style.width=`${percent}%`;
    $('level').parentElement.setAttribute('aria-valuenow',percent); $('probability').textContent=`${percent}%`;
    $('frames').textContent=event.frames; return;
  }
  const labels={ready:'Audio server ready',speech_start:'Speech started',speech_end:'Speech stopped',turn_end:'Turn sent to agent',agent_started:'Agent started',agent_completed:'Agent completed',clear:'Reply cleared',first_reply_pcm:'First reply audio at server',transcript_final:'Transcript finalized',error:'Pipeline error'};
  if(event.type==='transcript_partial'||event.type==='transcript_final') $('transcript').textContent=event.text || '(Empty transcript)';
  if(event.type==='reply_delta') {$('reply').textContent += event.text; return;}
  if(event.type==='reply') $('reply').textContent=event.text;
  if(event.type==='agent_started') {$('reply').textContent=''; $('phase').textContent='Agent is responding';}
  if(event.type==='speech_start') {$('phase').textContent='Speech detected on our server'; $('orb').classList.add('active');}
  if(event.type==='speech_end') {$('phase').textContent='Pause reached the endpoint'; $('orb').classList.remove('active');}
  if(event.type==='turn_end') {$('turns').textContent=++turnCount;}
  if(event.type==='agent_completed') $('phase').textContent='Reply generated · listening';
  if(event.type==='first_reply_pcm') $('latency').textContent=`${event.endpoint_to_pcm_ms} ms`;
  if(event.type==='error') error(event.message);
  if(event.type==='ready') {$('status').textContent='Connected · our server'; controls();}
  if(!labels[event.type]) return;
  $('timeline').querySelector('.empty')?.remove();
  const li=document.createElement('li'), t=document.createElement('time'), title=document.createElement('span'), detail=document.createElement('small');
  t.textContent=new Date().toLocaleTimeString('en-GB');title.textContent=labels[event.type];
  detail.textContent=event.type==='speech_end'?`${event.silence_ms} ms silence`:event.type==='turn_end'?'Silence rule · not semantic completion':event.type==='clear'?event.reason:event.type==='first_reply_pcm'?'Server stage timing only':`Turn ${event.turn}`;
  li.append(t,title,detail);$('timeline').prepend(li);while($('timeline').children.length>80) $('timeline').lastChild.remove();
}
async function ice(pc) {
  if(pc.iceGatheringState==='complete')return;
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Local ICE gathering timed out.')),10000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);resolve();}});});
}
async function end() {
  epoch++; const current=session;session=null;
  if(current) {
    current.source?.stop();current.stream?.getTracks().forEach(track=>track.stop());current.pc?.close();
    await current.context?.close().catch(()=>{});
    if(current.id) await post('/api/stop',{id:current.id}).catch(()=>{});
  }
  $('remote').srcObject=null;$('status').textContent='Session ended';$('phase').textContent='Ready when you are';$('orb').classList.remove('active');busy=false;controls();
}
async function start(kind) {
  busy=true;error('');controls();const version=++epoch;
  const current={pc:new RTCPeerConnection({iceServers:[]})};session=current;
  try {
    $('timeline').replaceChildren();turnCount=0;$('turns').textContent='0';$('frames').textContent='0';$('latency').textContent='—';$('reply').textContent='Waiting for a turn…';route();
    $('status').textContent=kind==='fixture'?'Preparing synthetic speech…':'Requesting microphone…';
    if(kind==='fixture') {
      current.context=new AudioContext({sampleRate:48000});await current.context.resume();
      const response=await post('/api/fixture',{}), bytes=await response.arrayBuffer(), pcm=new Int16Array(bytes);
      // Keep the graph producing frames after speech so backend endpointing sees silence.
      const buffer=current.context.createBuffer(1,pcm.length+24000*2,24000), samples=buffer.getChannelData(0);
      for(let i=0;i<pcm.length;i++)samples[i]=pcm[i]/32768;
      const destination=current.context.createMediaStreamDestination();current.source=current.context.createBufferSource();current.source.buffer=buffer;current.source.connect(destination);current.stream=destination.stream;
    } else current.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    if(version!==epoch){current.stream.getTracks().forEach(t=>t.stop());return;}
    for(const track of current.stream.getAudioTracks())current.pc.addTrack(track,current.stream);
    current.pc.ontrack=e=>{$('remote').srcObject=new MediaStream([e.track]);$('remote').play().catch(()=>error('Audio playback is paused by the browser. Use the audio control to play the reply.'));$('remote').controls=true;};
    const channel=current.pc.createDataChannel('events');current.channel=channel;
    channel.onmessage=e=>{try{event(JSON.parse(e.data));}catch{error('Invalid server event.');}};
    channel.onopen=()=>{controls();$('status').textContent='Connected · our server';$('phase').textContent=kind==='fixture'?'Replaying synthetic speech':'Listening through our server';$('hint').textContent=kind==='fixture'?'AI-generated test audio is travelling through WebRTC.':'Speak naturally. A new speech start cancels the active reply.';if(kind==='fixture')current.source.start(current.context.currentTime+.35);};
    current.pc.onconnectionstatechange=()=>{if(current===session&&current.pc.connectionState==='failed'){error('WebRTC connection failed. End the session and try again.');}};
    await current.pc.setLocalDescription(await current.pc.createOffer());await ice(current.pc);
    const response=await post('/api/offer',{sdp:current.pc.localDescription.sdp,mode:$('mode').value,silence_ms:Number($('silence').value)});const answer=await response.json();current.id=answer.id;
    await current.pc.setRemoteDescription({sdp:answer.sdp,type:answer.type});busy=false;controls();
  } catch(e) {await end();error(e.name==='NotAllowedError'?'Microphone access was denied. Allow it in browser settings or use synthetic replay.':e.message);}
}
$('microphone').onclick=()=>start('microphone');$('fixture').onclick=()=>start('fixture');$('end').onclick=end;
$('interrupt').onclick=()=>{if(session?.channel.readyState==='open')session.channel.send(JSON.stringify({type:'stop_reply'}));};
window.addEventListener('pagehide',()=>{if(session?.id){fetch('/api/stop',{method:'POST',headers,body:JSON.stringify({id:session.id}),keepalive:true});session.stream?.getTracks().forEach(t=>t.stop());session.pc.close();}});
fetch('/api/config').then(r=>{if(!r.ok)throw new Error('Server unavailable.');return r.json();}).then(data=>{config=data;$('mode').options[1].disabled=!data.cloud_available;$('status').textContent='Server ready · offline detector';controls();}).catch(e=>error(e.message));
