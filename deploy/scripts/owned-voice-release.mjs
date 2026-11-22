// Local verification builds only. Staging deploys through Git and server-side builds.
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const manifestPath=path.join(root,'deploy/.local/owned-voice-images.json');
const mode=process.argv[2];
const dockerEnv={...process.env,DOCKER_API_VERSION:'1.44'};
const run=(cmd,args,options={})=>new Promise((resolve,reject)=>{
  const proc=spawn(cmd,args,{cwd:root,stdio:['ignore','pipe','pipe'],...options});let out='',err='';
  proc.stdout.on('data',d=>{out+=d;});proc.stderr.on('data',d=>{err=(err+d).slice(-5000);});
  proc.on('error',reject);proc.on('close',code=>code===0?resolve(out.trim()):reject(new Error(`${cmd} failed (${code}): ${err}`)));
});
async function sourceHash(){
  const hash=createHash('sha256');
  async function visit(folder){for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    if(['node_modules','dist','__pycache__','.models'].includes(entry.name)||entry.name.startsWith('.env'))continue;
    const full=path.join(folder,entry.name);if(entry.isDirectory())await visit(full);else {hash.update(path.relative(root,full).replaceAll('\\','/'));hash.update(await readFile(full));}
  }}
  for(const name of ['services/api','services/voice-worker','web'])await visit(path.join(root,name));
  for(const name of ['docker-compose.yml'])hash.update(await readFile(path.join(root,name)));
  const model=JSON.parse(await readFile(path.join(root,'services/voice-worker/model-manifest.json'),'utf8'));
  if(createHash('sha256').update(await readFile(path.join(root,'services/voice-worker/.models/silero_vad.onnx'))).digest('hex')!==model.sha256)throw new Error('Worker model checksum mismatch');
  return hash.digest('hex');
}
if(mode==='build'){
  const sourceSha256=await sourceHash(),tag='stage-owned-'+sourceSha256.slice(0,12),images={};
  for(const [name,folder] of [['api','services/api'],['web','web'],['voice-worker','services/voice-worker']]){
    const image=`victor-${name}:${tag}`;
    console.log(JSON.stringify({building:name,tag}));
    await run('docker',['build','--quiet','--label',`org.opencontainers.image.revision=sha256:${sourceSha256}`,'-t',image,folder]);
    const layers=await run('docker',['image','inspect','--format','{{join .RootFS.Layers ","}}',image],{env:dockerEnv});
    if(!/^sha256:[a-f0-9]{64}(,sha256:[a-f0-9]{64})*$/.test(layers))throw new Error('Unexpected image fingerprint');
    images[name]={image,layers};console.log(JSON.stringify({built:name}));
  }
  await mkdir(path.dirname(manifestPath),{recursive:true});await writeFile(manifestPath,JSON.stringify({tag,sourceSha256,images},null,2)+'\n');
  console.log(JSON.stringify({built:true,tag,sourceSha256}));
}else if(mode==='deploy'){
  throw new Error('Workstation artifact deployment is retired. Commit reviewed changes, then run node deploy/scripts/deploy-stage.mjs for Git push/pull and server-side builds.');
}else throw new Error('Choose build or deploy');
