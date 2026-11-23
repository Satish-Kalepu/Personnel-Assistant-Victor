import {spawn} from 'node:child_process';
import {createReadStream,createWriteStream} from 'node:fs';
import {open,stat,appendFile,rename,unlink} from 'node:fs/promises';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const args=process.argv.slice(2),production=args.includes('--production'),restore=args.includes('--restore-test');
const key=process.env.BACKUP_ENCRYPTION_KEY;
if(!/^[a-f0-9]{64}$/.test(key||''))throw new Error('Load the private BACKUP_ENCRYPTION_KEY via node --env-file. Keep a separate protected copy for disaster recovery.');
if(production&&restore)throw new Error('This tool restores only into the isolated victor-restore-test project.');
const compose=['compose','--progress','quiet','--env-file','../PersonnelAssistant.env',...(restore?['-p','victor-restore-test']:[]),'-f','docker-compose.yml'];
function child(extra,streams=['ignore','pipe','pipe']){
  const proc=spawn('docker',[...compose,...extra],{cwd:root,stdio:streams});
  // Neither database credentials nor tool diagnostic output enter logs.
  let diagnostic='';
  if(proc.stderr)proc.stderr.on('data',data=>{diagnostic=(diagnostic+data.toString()).slice(-4000);});
  if(proc.stdout && extra.some(value=>value.includes('mongorestore')))proc.stdout.on('data',data=>{diagnostic=(diagnostic+data.toString()).slice(-4000);});
  const completed=new Promise((resolve,reject)=>{proc.once('error',reject);proc.once('close',code=>{if(code===0){resolve();return;}for(const [name,value] of Object.entries(process.env)){if(/PASSWORD|SECRET|KEY/.test(name)&&value&&value.length>=8)diagnostic=diagnostic.split(value).join('[REDACTED]');}diagnostic=diagnostic.replace(/"[^"\n]*"|'[^'\n]*'/g,'[REDACTED]');reject(new Error(`Database ${extra[0]} failed (${code}): ${diagnostic.trim()}`));});});
  completed.catch(()=>{});return {proc,completed};
}
function workspaceFile(value){const resolved=path.resolve(root,value);if(!resolved.startsWith(path.resolve(root)+path.sep))throw new Error('Use a file inside this workspace.');return resolved;}
const input=args.find(v=>!v.startsWith('--'));
const filename=workspaceFile(input||`deploy/.local/mongo-${new Date().toISOString().replace(/[:.]/g,'-')}.vbackup`);
const credentials='--username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin';
if(!restore){
  const temp=filename+'.part',iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv);
  const file=await open(temp,'wx',0o600);await file.write(Buffer.concat([Buffer.from('VICTOR01'),iv]));await file.close();
  const {proc,completed}=child(['exec','-T','mongodb','bash','-c',`exec mongodump --quiet ${credentials} --archive --gzip --oplog`]);
  try{await Promise.all([pipeline(proc.stdout,cipher,createWriteStream(temp,{flags:'a'})),completed]);await appendFile(temp,cipher.getAuthTag());await rename(temp,filename);console.log(JSON.stringify({encryptedBackup:path.relative(root,filename),bytes:(await stat(filename)).size,consistentOplog:true}));}
  catch(error){proc.kill();await unlink(temp).catch(()=>{});throw error;}
}else{
  const size=(await stat(filename)).size;if(size<36)throw new Error('Invalid encrypted backup');
  const file=await open(filename,'r'),header=Buffer.alloc(20),tag=Buffer.alloc(16);await file.read(header,0,20,0);await file.read(tag,0,16,size-16);await file.close();
  if(header.subarray(0,8).toString()!=='VICTOR01')throw new Error('Unknown backup format');
  const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),header.subarray(8));decipher.setAuthTag(tag);
  compose.push('-f','docker-compose.restore.yml');
  await child(['up','-d','mongodb','mongo-setup'],['ignore','ignore','pipe']).completed;
  await child(['wait','mongo-setup'],['ignore','ignore','pipe']).completed;
  const {proc,completed}=child(['exec','-T','mongodb','mongorestore','--archive','--gzip','--oplogReplay','--drop'],['pipe','pipe','pipe']);
  try{
    await Promise.all([pipeline(createReadStream(filename,{start:20,end:size-17}),decipher,proc.stdin),completed]);
    compose.splice(-2);
    await child(['up','-d','mongodb','mongo-setup'],['ignore','ignore','pipe']).completed;
    await child(['wait','mongo-setup'],['ignore','ignore','pipe']).completed;
    console.log(JSON.stringify({restoreProject:'victor-restore-test',authenticatedDecryption:true,restored:true,authenticationRestored:true,productionUntouched:true}));
  }catch(error){proc.kill();await child(['stop'],['ignore','ignore','pipe']).completed.catch(()=>{});throw error;}
}
