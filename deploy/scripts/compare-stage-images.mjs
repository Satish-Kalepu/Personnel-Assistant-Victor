import {spawn,execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {host,sshOptions} from './stage-ssh.mjs';
const manifest=JSON.parse(await readFile(new URL('../.local/stage-images.json',import.meta.url),'utf8'));
const refs=[manifest.apiImage,manifest.webImage,'mongo:8.2.5','redis:8.2.3-alpine','axllent/mailpit:v1.29.2'];
if(!/^victor-api:stage-[a-z0-9_.-]+$/.test(refs[0])||!/^victor-web:stage-[a-z0-9_.-]+$/.test(refs[1]))throw new Error('Unreviewed image reference.');
const allowMissing=process.argv.includes('--allow-missing');
const proc=spawn('ssh',[...sshOptions,host,'docker image inspect '+refs.join(' ')],{stdio:['ignore','pipe','pipe']});
let output='';proc.stdout.on('data',part=>{output+=part.toString();});proc.stderr.pipe(process.stderr);
await new Promise((resolve,reject)=>{proc.once('error',reject);proc.once('close',code=>code===0||(allowMissing&&code===1&&output.trim().startsWith('['))?resolve():reject(new Error('Remote image metadata unavailable')));});
const remote=JSON.parse(output);
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));return value;}
function fingerprint(info){
  const config=Object.fromEntries(['Cmd','Entrypoint','Env','User','WorkingDir','ExposedPorts','Volumes','Labels'].map(key=>[key,info.Config[key]??null]));
  const health=info.Config.Healthcheck;
  config.Healthcheck=health?Object.fromEntries(['Test','Interval','Timeout','Retries','StartPeriod'].map(key=>[key,health[key]??(key==='Test'?null:0)])):null;
  return createHash('sha256').update(JSON.stringify(canonical({os:info.Os,architecture:info.Architecture,layers:info.RootFS.Layers,config}))).digest('hex');
}
const verified=[];
for(let i=0;i<refs.length;i++){
  const local=JSON.parse(execFileSync('docker',['image','inspect',refs[i]],{encoding:'utf8',env:{...process.env,DOCKER_API_VERSION:'1.44'}}))[0],other=remote.find(image=>image.RepoTags?.includes(refs[i]));
  if(local.Os!=='linux'||local.Architecture!=='amd64')throw new Error('Unexpected image architecture.');
  if(!other){if(allowMissing){console.log(JSON.stringify({ref:refs[i],notLoaded:true}));continue;}throw new Error('Expected transferred image is missing.');}
  const layers=JSON.stringify(local.RootFS.Layers)===JSON.stringify(other.RootFS.Layers),runtime=fingerprint(local)===fingerprint(other);
  if(!runtime)console.log(JSON.stringify({differentRuntimeFields:['Cmd','Entrypoint','Env','User','WorkingDir','ExposedPorts','Volumes','Labels','Healthcheck'].filter(key=>JSON.stringify(canonical(local.Config[key]??null))!==JSON.stringify(canonical(other.Config[key]??null)))}));
  console.log(JSON.stringify({ref:refs[i],localId:local.Id,remoteId:other.Id,identicalLayers:layers,identicalRuntime:runtime}));
  if(!layers||!runtime)throw new Error('Image content/configuration mismatch; do not start stage.');
  verified.push({ref:refs[i],remoteId:other.Id,fingerprint:fingerprint(other)});
}
if(verified.length===refs.length)await writeFile(new URL('../.local/stage-image-verification.json',import.meta.url),JSON.stringify(verified,null,2)+'\n');
