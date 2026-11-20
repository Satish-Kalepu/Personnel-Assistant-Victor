import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {remote} from './stage-ssh.mjs';
const binary=await readFile(new URL('../.local/docker-compose-linux-x86_64',import.meta.url));
const expected='db1889184726840f75c4f9c001048430d4f25b3be3cb084d3ddd762bc0aed576';
if(createHash('sha256').update(binary).digest('hex')!==expected)throw new Error('Compose binary differs from verified official release digest.');
await remote('umask 077; cat > /home/ai_assistant/victor-stage/docker-config/cli-plugins/docker-compose.part',binary);
await remote('bash -s',`set -euo pipefail
plugin="$HOME/victor-stage/docker-config/cli-plugins/docker-compose"
printf '%s  %s\\n' '${expected}' "$plugin.part" | sha256sum -c -
chmod 700 "$plugin.part"
mv "$plugin.part" "$plugin"
export DOCKER_CONFIG="$HOME/victor-stage/docker-config"
docker compose version
docker version --format '{{.Server.Version}}'
printf 'Application-scoped Compose installed; host Docker/system services unchanged.\\n'
`);
