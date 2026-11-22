import {randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
const root=new URL('../../',import.meta.url);
if(!process.argv.includes('--private'))throw new Error('Explicit --private is required. Production HTTPS/SMTP configuration must be reviewed separately.');
const target=new URL('.env.stage',root);
try{await readFile(target);console.log('Preserved existing .env.stage; no credential rotation.');process.exit(0);}catch(error){if(error.code!=='ENOENT')throw error;}
const source=parseEnv(await readFile(new URL('../PersonnelAssistant.env',root),'utf8'));
for(const name of ['OPENAI_API_KEY','SARVAM_API_KEY'])if(!source[name])throw new Error(`Set ${name} in private ../PersonnelAssistant.env first.`);
const values={
  NODE_ENV:'development',APP_ORIGIN:'http://localhost:18080',WEB_BIND:'127.0.0.1',WEB_PORT:'18080',STAGE_MAIL_PORT:'18025',
  MONGO_ROOT_PASSWORD:randomBytes(32).toString('hex'),MONGO_APP_PASSWORD:randomBytes(32).toString('hex'),MONGO_REPLICA_KEY:randomBytes(72).toString('base64'),
  REDIS_PASSWORD:randomBytes(32).toString('hex'),AUTH_SECRET:randomBytes(32).toString('hex'),MAIL_ENCRYPTION_KEY:randomBytes(32).toString('hex'),BACKUP_ENCRYPTION_KEY:randomBytes(32).toString('hex'),
  OPENAI_API_KEY:source.OPENAI_API_KEY,OPENAI_MODEL:'gpt-6.1-terra',OPENAI_VOICE_MODEL:'gpt-6-luna',
  SARVAM_API_KEY:source.SARVAM_API_KEY,SARVAM_PRIVACY_CONFIRMED:'true',SARVAM_SPEAKER:'simran_en_customer',
  SMTP_HOST:'mailpit',SMTP_PORT:'1025',SMTP_SECURE:'false',SMTP_USER:'',SMTP_PASSWORD:'',SMTP_FROM:'Victor <noreply@localhost.test>',
  DAILY_CHAT_LIMIT:'20',DAILY_EMAIL_LIMIT:'500',DAILY_VOICE_SECONDS:'300',MONTHLY_AI_LIMIT_CENTS:'5000',CHAT_RESERVE_CENTS:'5',VOICE_RESERVE_CENTS_PER_MINUTE:'4',TTS_RESERVE_CENTS_PER_1000_CHARS:'2',
};
const lines=Object.entries(values).map(([key,value])=>{
  if(/[\r\n']/.test(value))throw new Error(`Unsupported env quoting in ${key}; no file written.`);
  return `${key}='${value}'`;
});
await writeFile(target,'# Private stage settings; never commit or add to image builds.\n'+lines.join('\n')+'\n',{flag:'wx',mode:0o600});
console.log('Created ignored private .env.stage with independent server secrets. Parent PersonnelAssistant.env and local dev state preserved.');
