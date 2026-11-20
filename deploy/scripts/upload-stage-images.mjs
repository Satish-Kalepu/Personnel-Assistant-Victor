import {spawn,execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import {createGzip} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {remote,host,sshOptions} from './stage-ssh.mjs';
const manifest=JSON.parse(await readFile(new URL('../.local/stage-images.json',import.meta.url),'utf8'));
if(!/^victor-api:stage-[a-z0-9_.-]+$/.test(manifest.apiImage)||!/^victor-web:stage-[a-z0-9_.-]+$/.test(manifest.webImage))throw new Error('Unreviewed image reference.');
const refs=[manifest.apiImage,manifest.webImage,'mongo:8.2.5','redis:8.2.3-alpine','axllent/mailpit:v1.29.2'];
execFileSync(process.execPath,[fileURLToPath(new URL('./compare-stage-images.mjs',import.meta.url)),'--allow-missing'],{stdio:'inherit'});
await remote('umask 077; cat > /home/ai_assistant/victor-stage/load-images.sh','#!/bin/bash\nset -euo pipefail\ngzip -dc | docker load\n');
const save=spawn('docker',['image','save','--platform','linux/amd64',...refs],{stdio:['ignore','pipe','pipe']});
const ssh=spawn('ssh',[...sshOptions,host,'bash /home/ai_assistant/victor-stage/load-images.sh'],{stdio:['pipe','pipe','pipe']});
save.stderr.pipe(process.stderr);ssh.stdout.pipe(process.stdout);ssh.stderr.pipe(process.stderr);
const done=proc=>new Promise((resolve,reject)=>{proc.once('error',reject);proc.once('close',code=>code===0?resolve():reject(new Error(`Image transfer failed (${code}).`)));});
let bytes=0;const gzip=createGzip({level:1});gzip.on('data',part=>{bytes+=part.length;});
const timer=setInterval(()=>console.log(JSON.stringify({compressedMiBSent:Math.round(bytes/1048576)})),15000);
try{await Promise.all([pipeline(save.stdout,gzip,ssh.stdin),done(save),done(ssh)]);}catch(error){save.kill();ssh.kill();throw error;}finally{clearInterval(timer);}
execFileSync(process.execPath,[fileURLToPath(new URL('./compare-stage-images.mjs',import.meta.url))],{stdio:'inherit'});
