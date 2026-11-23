import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const label=process.argv[2];
if(!/^[a-z0-9][a-z0-9_.-]{0,80}$/.test(label||''))throw new Error('Provide a release label, e.g. stage-YYYYMMDD.');
const source=createHash('sha256');
async function collect(folder){const entries=(await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));for(const entry of entries){if(['node_modules','dist','.git'].includes(entry.name)||entry.name.startsWith('.env'))continue;const filename=path.join(folder,entry.name);if(entry.isDirectory())await collect(filename);else{source.update(path.relative(root,filename).replaceAll('\\','/'));source.update(await readFile(filename));}}}
await collect(path.join(root,'services/api'));await collect(path.join(root,'web'));
const hash=source.digest('hex'),tag=`${label}-${hash.slice(0,12)}`;
async function build(service,image){await new Promise((resolve,reject)=>{const task=spawn('docker',['build','--quiet','--label',`org.opencontainers.image.revision=sha256:${hash}`,'-t',image,service],{cwd:root,stdio:['ignore','ignore','pipe']});let diagnostic='';task.stderr.on('data',data=>{diagnostic=(diagnostic+data.toString()).slice(-2000);});task.once('error',reject);task.once('close',code=>code===0?resolve():reject(new Error(`Image build failed for ${service}: ${diagnostic}`)));});}
const apiImage=`victor-api:${tag}`,webImage=`victor-web:${tag}`;
await build('services/api',apiImage);await build('web',webImage);
const target=path.resolve(root,'../PersonnelAssistant.env.stage');
let env=await readFile(target,'utf8');env=env.replace(/^API_IMAGE=.*\r?\n?/gm,'').replace(/^WEB_IMAGE=.*\r?\n?/gm,'');
await writeFile(target,env+`API_IMAGE='${apiImage}'\nWEB_IMAGE='${webImage}'\n`,{mode:0o600});
const result={apiImage,webImage,sourceSha256:hash,built:true,containsEnvironmentFiles:false};
await mkdir(path.join(root,'deploy/.local'),{recursive:true});await writeFile(path.join(root,'deploy/.local/stage-images.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
