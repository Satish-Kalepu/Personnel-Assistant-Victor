import {spawn} from 'node:child_process';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
export const host='ai_assistant@65.2.130.74';
export const sshOptions=['-o','BatchMode=yes','-o','ConnectTimeout=15','-o','StrictHostKeyChecking=yes','-o','HostKeyAlgorithms=ssh-ed25519','-o',`UserKnownHostsFile=${path.join(root,'deploy/.local/stage-known-hosts').replaceAll('\\','/')}`];
export async function remote(command,input){
  await access(path.join(root,'deploy/.local/stage-known-hosts'));
  const proc=spawn('ssh',[...sshOptions,host,command],{cwd:root,stdio:['pipe','pipe','pipe']});
  proc.stdout.pipe(process.stdout);proc.stderr.pipe(process.stderr);
  const done=new Promise((resolve,reject)=>{proc.once('error',reject);proc.once('close',code=>code===0?resolve():reject(new Error(`Stage SSH command failed (${code}); no success claimed.`)));});
  proc.stdin.on('error',()=>{});proc.stdin.end(input);
  await done;
}
export async function remoteScript(filename){const source=await readFile(filename,'utf8');await remote('bash -s',source.replaceAll('\r\n','\n').trimEnd()+'\n');}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const name=process.argv[2];
  if(!['inspect','bootstrap'].includes(name))throw new Error('Choose inspect or bootstrap.');
  await remoteScript(path.join(root,`deploy/scripts/${name==='inspect'?'inspect-stage':'bootstrap-stage'}.sh`));
}
