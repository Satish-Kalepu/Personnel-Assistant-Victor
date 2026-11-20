import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {openSync,closeSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {host,sshOptions} from './stage-ssh.mjs';
for(const port of [18080,18025])await new Promise((resolve,reject)=>{const server=createServer();server.once('error',()=>reject(new Error(`Local port ${port} is already in use; no process was stopped.`)));server.listen(port,'127.0.0.1',()=>server.close(resolve));});
const log=new URL('../.local/stage-tunnel.log',import.meta.url),fd=openSync(log,'a',0o600);
const task=spawn('ssh',[...sshOptions,'-N','-o','ExitOnForwardFailure=yes','-o','ServerAliveInterval=30','-o','ServerAliveCountMax=3','-L','127.0.0.1:18080:127.0.0.1:18080','-L','127.0.0.1:18025:127.0.0.1:18025',host],{detached:true,windowsHide:true,stdio:['ignore',fd,fd]});
closeSync(fd);let failed;task.on('error',error=>{failed=error;});
let ready=false;
for(let i=0;i<30;i++){if(failed||task.exitCode!==null)throw new Error('SSH tunnel did not start; inspect its private log.');try{const response=await fetch('http://localhost:18080/health',{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
if(!ready){task.kill();throw new Error('Stage tunnel health check timed out.');}
await writeFile(new URL('../.local/stage-tunnel.pid',import.meta.url),String(task.pid)+'\n');task.unref();
console.log(JSON.stringify({stagePreview:'http://localhost:18080',stageMail:'http://localhost:18025',privateSshTunnel:true,pid:task.pid}));
