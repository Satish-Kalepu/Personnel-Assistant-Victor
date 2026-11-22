// Move local primary configuration out of Git's working tree, without rotation.
import {readFile,writeFile,copyFile,rename,unlink,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {parseEnv,isDeepStrictEqual} from 'node:util';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../../',import.meta.url));
const target=path.resolve(root,'../PersonnelAssistant.env');
async function optional(file){
  try{const stat=await lstat(file);if(!stat.isFile())throw Error('Env path is not a regular file; stopped.');return await readFile(file);}
  catch(error){if(error.code==='ENOENT')return null;throw error;}
}
const main=await optional(path.join(root,'.env'));
const dev=await optional(path.join(root,'.env.dev'));
const parent=await optional(target);
if(!main&&!dev){if(!parent)throw Error('No configuration found. Run init-dev.mjs for a new setup.');console.log('Parent configuration already selected; no legacy files to migrate.');process.exit(0);}
const original={...parseEnv(dev?.toString()||''),...parseEnv(main?.toString()||'')};
const existing=parseEnv(parent?.toString()||'');
if(Object.keys(existing).some(key=>key in original&&existing[key]!==original[key]))throw Error('Parent and legacy settings conflict; stopped without overwriting values.');
const candidate=Buffer.from((dev?.toString()||'')+'\n'+(main?.toString()||'')+'\n'+(parent?.toString()||''));
const desired={...original,...existing};
if(!isDeepStrictEqual({...parseEnv(candidate.toString())},desired))throw Error('Merged values differ; stopped.');
const temp=target+'.pending-'+randomUUID();
let selected=false;
try{
  await writeFile(temp,candidate,{flag:'wx',mode:0o600});
  const config=envfiles=>{
    try{return JSON.parse(execFileSync('docker',['compose',...envfiles.flatMap(file=>['--env-file',file]),'-f','docker-compose.yml','config','--format','json'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}));}
    catch{throw Error('Compose validation failed; diagnostic values withheld. Legacy files preserved.');}
  };
  const before=config([...(dev?['.env.dev']:[]),...(main?['.env']:[]),...(parent?['../PersonnelAssistant.env']:[])]);
  if(!isDeepStrictEqual(before,config([temp])))throw Error('Compose settings would change; legacy files preserved.');
  // Preserve exact legacy bytes outside the repo before removing any original.
  for(const [name,data,suffix] of [['.env',main,'.legacy-main'],['.env.dev',dev,'.legacy-dev']]){
    if(!data)continue;
    const archive=target+suffix,oldArchive=await optional(archive);
    if(oldArchive&&!oldArchive.equals(data))throw Error('An archive already exists with different contents; stopped.');
    if(!oldArchive)await copyFile(path.join(root,name),archive,constants.COPYFILE_EXCL);
  }
  const latest=await optional(target);
  if(Boolean(latest)!==Boolean(parent)||(latest&&!latest.equals(parent)))throw Error('Parent configuration changed concurrently; stopped.');
  await rename(temp,target);selected=true;
  if(!isDeepStrictEqual({...parseEnv((await readFile(target)).toString())},desired))throw Error('Saved configuration validation failed; legacy files retained.');
  for(const [name,data] of [['.env',main],['.env.dev',dev]]){
    if(data){if(!(await readFile(path.join(root,name))).equals(data))throw Error('Legacy configuration changed concurrently; retained.');await unlink(path.join(root,name));}
  }
  console.log(JSON.stringify({parentEnv:'../PersonnelAssistant.env',allValuesPreserved:true,composeEquivalent:true,legacyArchivesOutsideRepo:true,credentialsDisplayed:false}));
}finally{if(!selected)await unlink(temp).catch(()=>{});}
