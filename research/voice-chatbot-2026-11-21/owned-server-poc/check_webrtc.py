"""Real localhost WebRTC check with a synthetic voice, never a human microphone."""
import argparse
import asyncio
import contextlib
from fractions import Fraction
import json
from pathlib import Path
import time
import aiohttp
import numpy as np
from av import AudioFrame
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, MediaStreamTrack

BASE=Path(__file__).resolve().parent
URL='http://127.0.0.1:4319'
HEADERS={'Origin':URL,'X-Voice-POC':'local'}

class SyntheticTrack(MediaStreamTrack):
    kind='audio'
    def __init__(self,pcm):
        super().__init__()
        # A short lead-in avoids clipping the phrase while channels connect.
        self.samples=np.concatenate((np.zeros(12000,dtype=np.int16),np.frombuffer(pcm,dtype='<i2')))
        self.position=0
        self.started=None
    async def recv(self):
        loop=asyncio.get_running_loop()
        if self.started is None:self.started=loop.time()
        await asyncio.sleep(max(0,self.started+self.position/24000-loop.time()))
        samples=np.zeros(480,dtype=np.int16)
        part=self.samples[self.position:self.position+480]
        samples[:len(part)]=part
        frame=AudioFrame.from_ndarray(samples.reshape(1,-1),format='s16',layout='mono')
        frame.sample_rate=24000;frame.pts=self.position;frame.time_base=Fraction(1,24000)
        self.position+=480
        return frame

async def check(mode):
    events=[];audio={'frames':0,'non_silent_frames':0,'peak':0}
    pc=RTCPeerConnection(RTCConfiguration(iceServers=[]));session_id=None;receiver=None
    cookie=aiohttp.CookieJar(unsafe=True)
    started=time.monotonic()
    async with aiohttp.ClientSession(cookie_jar=cookie,headers=HEADERS,timeout=aiohttp.ClientTimeout(total=45)) as http:
        config=await (await http.get(URL+'/api/config')).json()
        async with http.post(URL+'/api/fixture',json={}) as response:
            if response.status!=200:raise RuntimeError('Synthetic fixture unavailable: '+str(response.status))
            pcm=await response.read()
        @pc.on('track')
        def track(track):
            nonlocal receiver
            async def consume():
                while True:
                    frame=await track.recv();samples=frame.to_ndarray().astype(np.int32)
                    peak=int(np.max(np.abs(samples)));audio['frames']+=1
                    audio['peak']=max(audio['peak'],peak)
                    if peak>100:audio['non_silent_frames']+=1
            receiver=asyncio.create_task(consume())
        channel=pc.createDataChannel('events')
        @channel.on('message')
        def message(data):
            event=json.loads(data)
            if event['type']!='vad':events.append(event)
        pc.addTrack(SyntheticTrack(pcm))
        try:
            await pc.setLocalDescription(await pc.createOffer())
            async with http.post(URL+'/api/offer',json={'sdp':pc.localDescription.sdp,'mode':mode,'silence_ms':640}) as response:
                answer=await response.json()
                if response.status!=200:raise RuntimeError(answer.get('error'))
            session_id=answer['id']
            await pc.setRemoteDescription(RTCSessionDescription(sdp=answer['sdp'],type=answer['type']))
            async with asyncio.timeout(40):
                while not any(e['type'] in ('agent_completed','error') for e in events):await asyncio.sleep(.05)
                # Completion means generated/enqueued; it does not mean played.
                while audio['non_silent_frames']<4:await asyncio.sleep(.05)
                await asyncio.sleep(.3)
            kinds=[e['type'] for e in events]
            passed=all(kind in kinds for kind in ('ready','speech_start','speech_end','turn_end','agent_started','agent_completed')) and 'error' not in kinds and audio['non_silent_frames']>=4
            if mode=='cloud':passed=passed and any(e['type']=='transcript_final' and ('12' in e['text'] or 'twelve' in e['text'].lower()) for e in events) and any(e['type']=='agent_completed' and ('156' in e.get('reply','') or 'one hundred' in e.get('reply','').lower()) for e in events)
            result={'mode':mode,'passed':passed,'transport':config['transport'],'synthetic_phrase':'Hello Victor. What is twelve times thirteen?','elapsed_seconds':round(time.monotonic()-started,2),'audio':audio,'events':events,'limits':['Synthetic input, localhost; not physical microphone or Pixel testing.','Server PCM stage timings exclude endpoint wait and acoustic playback.']}
            print(json.dumps(result,indent=2))
            path=BASE/('evidence-'+mode+'.json');path.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
            if not passed:raise AssertionError('POC acceptance check failed; inspect evidence JSON.')
        finally:
            if session_id:await http.post(URL+'/api/stop',json={'id':session_id})
            await pc.close()
            if receiver:receiver.cancel();await asyncio.gather(receiver,return_exceptions=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--mode',choices=['local','cloud'],default='local')
    asyncio.run(check(parser.parse_args().mode))
