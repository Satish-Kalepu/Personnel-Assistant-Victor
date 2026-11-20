#!/bin/bash
# Run on EC2 after reviewing/pushing Stage. Secrets/data stay outside checkout.
set -euo pipefail
umask 077
app="$HOME/victor-stage"
repo="$app/repository"
envfile="$app/shared/.env"
export DOCKER_CONFIG="$app/docker-config"
export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes'
[ "$(cat "$app/.victor-managed")" = 'victor-stage' ]
[ "$(git -C "$repo" branch --show-current)" = 'Stage' ]
[ -z "$(git -C "$repo" status --porcelain)" ] || { printf 'Checkout has local changes; stopping.\n' >&2; exit 1; }
git -C "$repo" fetch origin Stage
git -C "$repo" merge --ff-only origin/Stage
commit=$(git -C "$repo" rev-parse HEAD)
tag="stage-git-${commit:0:12}"
api="victor-api:$tag"
web="victor-web:$tag"
release="$app/releases/$tag"
cd "$repo"
# Docker 25's legacy builder supports these ordinary multi-stage Dockerfiles;
# no host Node upgrade or buildx/system installation is required.
DOCKER_BUILDKIT=0 docker build --quiet --memory 1g --memory-swap 1g --label "org.opencontainers.image.revision=$commit" -t "$api" services/api
DOCKER_BUILDKIT=0 docker build --quiet --memory 768m --memory-swap 768m --label "org.opencontainers.image.revision=$commit" -t "$web" web
mkdir -p "$release/deploy/mongo"
cp compose.yml compose.stage.yml compose.prod.yml "$release/"
cp deploy/mongo/entry.sh deploy/mongo/setup.js "$release/deploy/mongo/"
previous=$(readlink "$app/current" || true)
if [ -n "$previous" ]; then case "$previous" in "$app/releases/"*) ;; *) printf 'Unexpected prior release path.\n' >&2; exit 1;; esac; fi
cp "$envfile" "$app/shared/.env.previous"
python3 - "$envfile" "$api" "$web" <<'PY'
import pathlib,re,sys
p=pathlib.Path(sys.argv[1]); text=p.read_text(encoding='utf-8')
for key,value in [('API_IMAGE',sys.argv[2]),('WEB_IMAGE',sys.argv[3])]:
    line=key+"='"+value+"'"
    if re.search(r'^'+key+r'=.*$',text,re.M): text=re.sub(r'^'+key+r'=.*$',line,text,flags=re.M)
    else: text+='\n'+line+'\n'
p.write_text(text,encoding='utf-8');p.chmod(0o600)
PY
# Select the reviewed deployment mode without sourcing the private env as shell code.
mode=$(python3 - "$envfile" <<'PY'
import pathlib,sys
values={}
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
 k,sep,v=line.partition('=')
 if sep:values[k]=v.strip().strip(chr(39)+chr(34))
print(values.get('NODE_ENV','development'))
PY
)
case "$mode" in production) override=compose.prod.yml;; development) override=compose.stage.yml;; *) printf 'Unsupported deployment mode.\n' >&2; exit 1;; esac
cd "$release"
if ! docker compose --env-file "$envfile" -p victor-stage -f compose.yml -f "$override" config --quiet || ! docker compose --progress quiet --env-file "$envfile" -p victor-stage -f compose.yml -f "$override" up -d --no-build --pull never --wait --wait-timeout 180; then
  cp "$app/shared/.env.previous" "$envfile"
  if [ -n "$previous" ]; then cd "$previous"; docker compose --progress quiet --env-file "$envfile" -p victor-stage -f compose.yml -f "$override" up -d --no-build --pull never; fi
  printf 'New release failed health; prior image settings restored. Investigate before retry.\n' >&2
  exit 1
fi
ln -sfn "$release" "$app/current"
curl -fsS http://127.0.0.1:18080/health
printf '\nGit Stage release healthy: %s\n' "$commit"
# Do not prune unrelated/previous images or reset persistent volumes.
