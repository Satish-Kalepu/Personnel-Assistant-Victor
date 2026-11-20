import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {remote} from './stage-ssh.mjs';
const root=new URL('../../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('deploy/.local/stage-images.json',root),'utf8'));
const release=manifest.apiImage.split(':')[1];
if(!/^stage-[a-z0-9_.-]+$/.test(release)||manifest.webImage!==`victor-web:${release}`)throw new Error('Invalid reviewed release manifest.');
execFileSync(process.execPath,[fileURLToPath(new URL('./compare-stage-images.mjs',import.meta.url))],{stdio:'inherit'});
const base=`/home/ai_assistant/victor-stage/releases/${release}`;
await remote('bash -s',`set -euo pipefail
umask 077
[ "$(cat "$HOME/victor-stage/.victor-managed")" = 'victor-stage' ]
mkdir -p '${base}/deploy/mongo'
`);
for(const name of ['compose.yml','compose.stage.yml','compose.prod.yml','deploy/mongo/entry.sh','deploy/mongo/setup.js']){
  const data=(await readFile(new URL(name,root),'utf8')).replaceAll('\r\n','\n');
  const destination=`${base}/${name}`,hash=createHash('sha256').update(data).digest('hex');
  await remote(`umask 077; cat > ${destination}.part`,data);
  await remote('bash -s',`set -euo pipefail\nprintf '%s  %s\\n' '${hash}' '${destination}.part' | sha256sum -c -\nmv '${destination}.part' '${destination}'\n`);
}
const env=await readFile(new URL('.env.stage',root),'utf8');
if(!env.includes(`API_IMAGE='${manifest.apiImage}'`)||!env.includes(`WEB_IMAGE='${manifest.webImage}'`))throw new Error('Stage env does not match reviewed images.');
const hash=createHash('sha256').update(env).digest('hex'),target='/home/ai_assistant/victor-stage/shared/.env';
const stableHash=createHash('sha256').update(env.replace(/^(API_IMAGE|WEB_IMAGE)=.*\r?\n?/gm,'')).digest('hex');
await remote('bash -s',`set -euo pipefail
if [ -e '${target}' ]; then [ "$(grep -v -E '^(API_IMAGE|WEB_IMAGE)=' '${target}' | sha256sum | cut -d ' ' -f 1)" = '${stableHash}' ] || { printf 'Existing non-image settings differ; review before update.\\n' >&2; exit 1; }; fi
`);
await remote(`umask 077; cat > ${target}.part`,env);
await remote('bash -s',`set -euo pipefail
printf '%s  %s\\n' '${hash}' '${target}.part' | sha256sum -c -
chmod 600 '${target}.part'
mv '${target}.part' '${target}'
export DOCKER_CONFIG="$HOME/victor-stage/docker-config"
cd '${base}'
docker compose --env-file '${target}' -p victor-stage -f compose.yml -f compose.stage.yml config --quiet
docker compose --progress quiet --env-file '${target}' -p victor-stage -f compose.yml -f compose.stage.yml up -d --no-build --pull never --wait --wait-timeout 180
curl -fsS http://127.0.0.1:18080/health
[ "$(curl -fsS http://127.0.0.1:18080/api/auth/get-session)" = 'null' ]
[ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18080/api/me)" = '401' ]
if [ -e "$HOME/victor-stage/current" ] && [ ! -L "$HOME/victor-stage/current" ]; then printf 'Refusing non-symlink release pointer.\\n' >&2; exit 1; fi
ln -sfn '${base}' "$HOME/victor-stage/current"
docker ps --filter label=com.docker.compose.project=victor-stage --format '{{.Names}} {{.Status}} {{.Ports}}'
printf 'Stage is healthy on server loopback only; provider settings remain private.\\n'
`);
