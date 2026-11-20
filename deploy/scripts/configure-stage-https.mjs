// Reviewed stage HTTPS transition. Settings stay private; no host proxy changes.
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
import {remote} from './stage-ssh.mjs';
const file=new URL('../../.env.stage',import.meta.url);
const original=await readFile(file,'utf8'),values=parseEnv(original);
for(const key of ['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'])if(!values[key]||values[key].includes('localhost.test')||values[key]==='mailpit')throw new Error('Production SMTP settings are required; values withheld.');
if(!['587','465'].includes(values.SMTP_PORT))throw new Error('Review SMTP TLS port before deployment.');
const stableKeys=['MONGO_ROOT_PASSWORD','MONGO_APP_PASSWORD','MONGO_REPLICA_KEY','REDIS_PASSWORD','AUTH_SECRET','MAIL_ENCRYPTION_KEY','BACKUP_ENCRYPTION_KEY','API_IMAGE','WEB_IMAGE'];
const stableHash=createHash('sha256').update(stableKeys.map(key=>key+'='+values[key]).join('\n')).digest('hex');
const updates={NODE_ENV:'production',APP_ORIGIN:'https://ai_test.satishk.com',WEB_BIND:'127.0.0.1',WEB_PORT:'18080',ALB_TRUSTED_CIDR:'172.19.0.1/32',SMTP_SECURE:values.SMTP_PORT==='465'?'true':'false'};
let candidate=original;
for(const [key,value] of Object.entries(updates)){const line=key+"='"+value+"'";const pattern=new RegExp('^'+key+'=.*$','m');candidate=pattern.test(candidate)?candidate.replace(pattern,()=>line):candidate+'\n'+line+'\n';}
await remote('bash -s',`set -euo pipefail
[ "$(cat "$HOME/victor-stage/.victor-managed")" = 'victor-stage' ]
python3 - <<'PY'
import hashlib,pathlib
p=pathlib.Path.home()/'victor-stage/shared/.env'
values={}
for line in p.read_text().splitlines():
 k,sep,v=line.partition('=')
 if sep:values[k]=v.strip().strip(chr(39)+chr(34))
keys=${JSON.stringify(stableKeys)}
h=hashlib.sha256(chr(10).join(k+'='+values.get(k,'') for k in keys).encode()).hexdigest()
if h!='${stableHash}':raise SystemExit('Existing database/auth/image settings differ; stopped without update.')
PY
`);
await remote('umask 077; cat > "$HOME/victor-stage/shared/.env.https-next"',candidate);
await remote('bash -s',`set -euo pipefail
umask 077
app="$HOME/victor-stage"
export DOCKER_CONFIG="$app/docker-config"
cd "$app/current"
docker compose --env-file "$app/shared/.env.https-next" -p victor-stage -f compose.yml -f compose.prod.yml config --quiet
cp "$app/shared/.env" "$app/shared/.env.before-https"
mv "$app/shared/.env.https-next" "$app/shared/.env"
if ! docker compose --progress quiet --env-file "$app/shared/.env" -p victor-stage -f compose.yml -f compose.prod.yml up -d --no-build --pull never --wait --wait-timeout 180; then
 cp "$app/shared/.env.before-https" "$app/shared/.env"
 docker compose --progress quiet --env-file "$app/shared/.env" -p victor-stage -f compose.yml -f compose.stage.yml up -d --no-build --pull never
 printf 'HTTPS release failed; previous private settings restored.\n' >&2
 exit 1
fi
curl -fsS http://127.0.0.1:18080/health
printf '\nHTTPS app configuration ready; host Nginx remains administrator-managed.\n'
`);
await writeFile(file,candidate,{mode:0o600});
console.log('Private stage env synchronized; no credentials displayed.');
