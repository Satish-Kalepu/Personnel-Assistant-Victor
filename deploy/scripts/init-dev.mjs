import {randomBytes} from 'node:crypto';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
const root=new URL('../../',import.meta.url);
const target=new URL('../PersonnelAssistant.env',root);
for(const name of ['.env','.env.dev']){
  let exists=true;try{await access(new URL(name,root));}catch(error){if(error.code==='ENOENT')exists=false;else throw error;}
  if(exists)throw Error('Legacy local settings exist. Run node deploy/scripts/migrate-parent-env.mjs first; no credentials have been rotated.');
}
let template=await readFile(new URL('.env.example',root),'utf8');
for(const name of ['MONGO_ROOT_PASSWORD','MONGO_APP_PASSWORD','REDIS_PASSWORD','AUTH_SECRET','MAIL_ENCRYPTION_KEY','BACKUP_ENCRYPTION_KEY']){
  template=template.replace(`${name}=GENERATE_LOCAL_SECRET`,`${name}=${randomBytes(32).toString('hex')}`);
}
template=template.replace('MONGO_REPLICA_KEY=GENERATE_LOCAL_SECRET',`MONGO_REPLICA_KEY=${randomBytes(72).toString('base64')}`);
try{
  await writeFile(target,template,{flag:'wx',mode:0o600});
  console.log('Created ../PersonnelAssistant.env. Add private provider keys there.');
}catch(error){if(error.code!=='EEXIST')throw error;console.log('Preserved existing ../PersonnelAssistant.env; no credentials rotated.');}
await mkdir(new URL('deploy/.local/',root),{recursive:true});
console.log('Use docker compose --env-file ../PersonnelAssistant.env. No secret values displayed.');
