// Isolated Docker acceptance: no live app, database, provider or SMTP access.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../../',import.meta.url));
const docker=(...args)=>execFileSync('docker',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const checks=[];
function check(name,run){run();checks.push(name);console.log('PASS '+name);}
const sample={...process.env,COMPOSE_PROFILES:'',WEB_ASSET_PATH:path.join(root,'deploy/.local/web/current')};
for(const [name,extra,profiles] of [
  ['laptop',{NODE_ENV:'development',APP_ORIGIN:'http://localhost:8080',WEB_ASSET_PATH:'./web/dist',WEB_BIND:'127.0.0.1',WEB_PORT:'8080'},['local']],
  ['stage-host-nginx',{NODE_ENV:'production',APP_ORIGIN:'https://ai_test.satishk.com',WEB_BIND:'127.0.0.1',WEB_PORT:'18080',VOICE_ENDPOINT_MODE:'owned'},['owned-voice']],
  ['production-alb',{NODE_ENV:'production',APP_ORIGIN:'https://example.test',WEB_BIND:'10.0.1.10',WEB_PORT:'8080',VOICE_ENDPOINT_MODE:'owned'},['owned-voice']],
]){
  const cfg=JSON.parse(execFileSync('docker',['compose','--env-file','.env.example','-f','docker-compose.yml',...profiles.flatMap(p=>['--profile',p]),'config','--format','json'],{cwd:root,env:{...sample,...extra},encoding:'utf8'}));
  check(name+' Compose security and mount',()=>{
    assert.equal(cfg.services.web.volumes[0].target,'/usr/share/nginx/html');
    assert.equal(cfg.services.web.volumes[0].read_only,true);
    assert.equal(cfg.services.web.volumes[0].bind.create_host_path,false);
    assert.equal(cfg.services.web.volumes[0].source,name==='laptop'?path.join(root,'web/dist'):sample.WEB_ASSET_PATH);
    assert.equal(cfg.services.web.ports[0].host_ip,extra.WEB_BIND);
    assert.equal(cfg.networks.data.internal,true);
    for(const service of ['api','mongodb','redis','voice-worker'])assert.equal(cfg.services[service]?.ports,undefined);
    assert.equal(cfg.services.web.environment.OPENAI_API_KEY,undefined);
    assert.equal(cfg.services['voice-worker']?.environment.MONGODB_URI,undefined);
    assert.equal(Boolean(cfg.services.mailpit),name==='laptop');
  });
}

const id='victor-compose-check-'+randomUUID().slice(0,8);
const network=id,api=id+'-api',web=id+'-web';
const image=process.env.WEB_TEST_IMAGE||'victor-web:compose-review';
const assets=path.join(root,'web/dist');
const mock=`
const http=require('node:http'),crypto=require('node:crypto');
const server=http.createServer((req,res)=>{
  if(req.url==='/health/ready'){res.end('ready');return;}
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify({url:req.url,headers:req.headers}));
});
server.on('upgrade',(req,socket)=>{
  if(req.url!=='/voice'||req.headers.upgrade!=='websocket'){socket.destroy();return;}
  const accept=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\\r\\nUpgrade: websocket\\r\\nConnection: Upgrade\\r\\nSec-WebSocket-Accept: '+accept+'\\r\\n\\r\\n');
  const text=Buffer.from('voice-proxy-ok');socket.write(Buffer.concat([Buffer.from([129,text.length]),text]));
  socket.on('data',()=>socket.end(Buffer.from([136,0])));
});server.listen(3000,'0.0.0.0');`;
async function ready(url){
  const deadline=Date.now()+30000;
  while(Date.now()<deadline){
    try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});if(r.ok)return;}catch{}
    await new Promise(r=>setTimeout(r,200));
  }
  throw new Error('Isolated Nginx readiness timed out');
}
async function startWeb(cidr){
  docker('run','-d','--name',web,'--network',network,'--read-only','--tmpfs','/tmp','--tmpfs','/var/cache/nginx','--tmpfs','/var/run','--cap-drop','ALL','--security-opt','no-new-privileges:true','-e','ALB_TRUSTED_CIDR='+cidr,'--mount',`type=bind,src=${assets},dst=/usr/share/nginx/html,readonly`,'-p','127.0.0.1::8080',image);
  const state=JSON.parse(docker('inspect',web))[0];
  const base='http://127.0.0.1:'+state.NetworkSettings.Ports['8080/tcp'][0].HostPort;
  await ready(base+'/health');return {base,state};
}
try{
  docker('network','create',network);
  const subnet=JSON.parse(docker('network','inspect',network))[0].IPAM.Config[0].Subnet;
  docker('run','-d','--name',api,'--network',network,'--network-alias','api','--read-only','--cap-drop','ALL','node:24.15.0-bookworm-slim','node','-e',mock);
  let {base,state}=await startWeb('127.0.0.1/32');
  const html=await (await fetch(base+'/')).text();
  check('read-only published assets and non-root runtime',()=>{
    assert.equal(state.Mounts.find(m=>m.Destination==='/usr/share/nginx/html').RW,false);
    assert.notEqual(state.Config.User,'root');assert.ok(html.includes('<html'));
  });
  for(const asset of ['/voice-worklet.js',...html.matchAll(/(?:src|href)="(\/assets\/[^"<>]+)"/g)].map(v=>typeof v==='string'?v:v[1])){
    const r=await fetch(base+asset);assert.equal(r.status,200);assert.ok(!(r.headers.get('content-type')||'').includes('text/html'));
  }
  checks.push('index, worklet and every referenced build asset HTTP 200');
  assert.equal((await fetch(base+'/assets/missing.js')).status,404);
  assert.equal((await fetch(base+'/settings')).status,200);
  checks.push('missing asset 404 and SPA route fallback');
  const result=await (await fetch(base+'/api/check?q=1',{headers:{'X-Forwarded-For':'198.51.100.9','X-Forwarded-Proto':'https'}})).json();
  check('API path/query and untrusted forwarding headers',()=>{
    assert.equal(result.url,'/api/check?q=1');
    assert.notEqual(result.headers['x-forwarded-for'],'198.51.100.9');
    assert.equal(result.headers['x-forwarded-proto'],'http');
  });
  await new Promise((resolve,reject)=>{
    const ws=new WebSocket(base.replace('http:','ws:')+'/voice');
    const timer=setTimeout(()=>{ws.close();reject(new Error('WebSocket check timed out'));},10000);
    ws.onmessage=e=>{try{assert.equal(e.data,'voice-proxy-ok');clearTimeout(timer);ws.close();resolve();}catch(error){clearTimeout(timer);reject(error);}};
    ws.onerror=()=>{clearTimeout(timer);reject(new Error('WebSocket upgrade failed'));};
  });
  checks.push('actual WebSocket upgrade and voice-path message');
  docker('rm','-f',web);
  ({base}=await startWeb(subnet));
  const trusted=await (await fetch(base+'/api/check',{headers:{'X-Forwarded-For':'198.51.100.9','X-Forwarded-Proto':'https'}})).json();
  check('trusted TLS edge preserves client IP and HTTPS',()=>{
    assert.equal(trusted.headers['x-forwarded-for'],'198.51.100.9');
    assert.equal(trusted.headers['x-forwarded-proto'],'https');
  });
  // Parse the release script, without executing deployment commands.
  docker('run','--rm','--network','none','--mount',`type=bind,src=${root},dst=/repo,readonly`,'node:24.15.0-bookworm-slim','bash','-n','/repo/deploy/scripts/deploy-stage-from-git.sh');
  checks.push('server release Bash syntax');
  await mkdir(path.join(root,'deploy/.local'),{recursive:true});
  await writeFile(path.join(root,'deploy/.local/compose-nginx-check.json'),JSON.stringify({passed:true,checks},null,2)+'\n');
  console.log(JSON.stringify({passed:true,checks:checks.length}));
}finally{
  for(const name of [web,api]){try{docker('rm','-f',name);}catch{}}
  try{docker('network','rm',network);}catch{}
}
