import {remote} from './stage-ssh.mjs';
await remote('bash -s',`set -euo pipefail
umask 077
app="$HOME/victor-stage"
export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes'
if [ ! -e "$app/repository" ]; then
  git clone --single-branch --branch Stage git@github.com:Satish-Kalepu/Personnel-Assistant-Victor.git "$app/repository"
else
  [ -d "$app/repository/.git" ] || { printf 'Existing repository path is not a Git checkout.\\n' >&2; exit 1; }
  [ -z "$(git -C "$app/repository" status --porcelain)" ] || { printf 'Server checkout has local changes; not overwriting.\\n' >&2; exit 1; }
  [ "$(git -C "$app/repository" branch --show-current)" = 'Stage' ]
  git -C "$app/repository" fetch origin Stage
  git -C "$app/repository" merge --ff-only origin/Stage
fi
git -C "$app/repository" log -1 --format='%h %s'
printf 'Stage checkout synced; runtime secrets remain outside Git.\\n'
`);
