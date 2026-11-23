#!/bin/bash
# Git-only staging release. Private settings and databases stay on this host.
set -Eeuo pipefail
umask 077
app="$HOME/victor-stage"
repo="$app/repository"
envfile="$repo/../PersonnelAssistant.env"
assetroot="$repo/deploy/.local/web"
export DOCKER_CONFIG="$app/docker-config"
export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes'

[ "$(cat "$app/.victor-managed")" = victor-stage ]
[ "$(git -C "$repo" branch --show-current)" = Stage ]
[ -z "$(git -C "$repo" status --porcelain)" ] || { echo 'Checkout has local changes; stopped.' >&2; exit 1; }
git -C "$repo" fetch origin Stage
git -C "$repo" merge --ff-only origin/Stage
commit=$(git -C "$repo" rev-parse HEAD)
expected_commit="${1:-}"
if [ -n "$expected_commit" ]; then
  [[ "$expected_commit" =~ ^[a-f0-9]{40}$ ]] && [ "$commit" = "$expected_commit" ] || { echo 'Git commit differs from reviewed target.' >&2; exit 1; }
fi

# Public build output belongs to the app-owned, ignored checkout subtree.
# Refuse unexpected symlink traversal; never modify a path outside this checkout.
[ "$(readlink -f "$repo")" = "$repo" ]
[ "$(readlink -m "$assetroot")" = "$repo/deploy/.local/web" ] || { echo 'Unexpected asset path traversal.' >&2; exit 1; }
mkdir -p "$assetroot/releases"
[ -w "$assetroot" ] && [ -w "$assetroot/releases" ]
if [ -e "$assetroot/current" ] && [ ! -L "$assetroot/current" ]; then echo 'Unexpected non-symlink asset current; stopped.' >&2; exit 1; fi
previous_assets=$(readlink "$assetroot/current" || true)
if [ -n "$previous_assets" ]; then case "$previous_assets" in "$assetroot/releases/"*) ;; *) echo 'Unexpected previous asset path.' >&2; exit 1;; esac; fi

read_setting() {
  python3 - "$envfile" "$1" "$2" <<'PY'
import pathlib,sys
values={}
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
    k,sep,v=line.partition('=')
    if sep: values[k]=v.strip().strip(chr(39)+chr(34))
print(values.get(sys.argv[2],sys.argv[3]))
PY
}
voice_mode=$(read_setting VOICE_ENDPOINT_MODE provider)
mode=$(read_setting NODE_ENV development)
case "$voice_mode" in owned|provider) ;; *) echo 'Unsupported voice mode.' >&2; exit 1;; esac
[ "$mode" = production ] || { echo 'Public staging must use production mode and real SMTP.' >&2; exit 1; }

tag="stage-git-${commit:0:12}-$(date -u +%Y%m%d%H%M%S)"
api="victor-api:$tag"
web="victor-web:$tag"
frontend="victor-frontend:$tag"
worker="victor-voice-worker:$tag"
release="$app/releases/$tag"
assets="$assetroot/releases/$tag"
cd "$repo"
DOCKER_BUILDKIT=0 docker build --quiet --memory 1g --memory-swap 1g --label "org.opencontainers.image.revision=$commit" -t "$api" services/api
DOCKER_BUILDKIT=0 docker build --quiet --memory 768m --memory-swap 768m --target build --label "org.opencontainers.image.revision=$commit" -t "$frontend" web
DOCKER_BUILDKIT=0 docker build --quiet --memory 768m --memory-swap 768m --label "org.opencontainers.image.revision=$commit" -t "$web" web
if [ "$voice_mode" = owned ]; then
  (umask 022; python3 services/voice-worker/fetch_model.py)
  chmod 644 services/voice-worker/.models/silero_vad.onnx
  DOCKER_BUILDKIT=0 docker build --quiet --memory 768m --memory-swap 768m --label "org.opencontainers.image.revision=$commit" -t "$worker" services/voice-worker
fi

docker run --rm --network none --memory 384m --user "$(id -u):$(id -g)" -v "$repo/services/api/test:/app/test:ro" "$api" node --test --test-concurrency=1 test/cors.test.mjs test/voice-session.test.mjs test/voice-sdk.test.mjs test/owned-voice.test.mjs test/voice-retention.test.mjs test/voice-push.test.mjs
if [ "$voice_mode" = owned ]; then
  docker run --rm --network none "$worker" python -c "from worker import Detector; assert Detector().push(bytes(3200)) == []; print('Non-root worker/model smoke passed')"
fi

# Extract only public build output on this server. No checkout, env or user data.
mkdir "$assets"
builder=$(docker create "$frontend")
trap 'docker rm "$builder" >/dev/null 2>&1 || true' EXIT
docker cp "$builder:/app/dist/." "$assets/"
docker rm "$builder" >/dev/null
trap - EXIT
[ -z "$(find "$assets" -type l -print -quit)" ] || { echo 'Unexpected asset symlink.' >&2; exit 1; }
find "$assets" -type d -exec chmod 755 {} +
find "$assets" -type f -exec chmod 644 {} +
docker run --rm --network none -v "$assets:/usr/share/nginx/html:ro" "$web" --check

mkdir -p "$release/deploy/mongo"
cp docker-compose.yml "$release/"
cp deploy/mongo/entry.sh deploy/mongo/setup.js "$release/deploy/mongo/"
previous=$(readlink "$app/current" || true)
if [ -n "$previous" ]; then case "$previous" in "$app/releases/"*) ;; *) echo 'Unexpected previous release path.' >&2; exit 1;; esac; fi
cp "$envfile" "$app/shared/PersonnelAssistant.env.previous"

select_assets() {
  ln -s "$1" "$assetroot/current.next.$$"
  mv -Tf "$assetroot/current.next.$$" "$assetroot/current"
}
rollback() {
  trap - ERR
  echo 'Release failed; restoring previous settings, assets and app containers.' >&2
  cp "$app/shared/PersonnelAssistant.env.previous" "$envfile"
  if [ -n "$previous_assets" ]; then select_assets "$previous_assets"; else rm -f "$assetroot/current"; fi
  if [ -n "$previous" ]; then
    cd "$previous"
    # Transitional rollback can launch the retained pre-rename release.
    if [ -f docker-compose.yml ]; then
      args=(-f docker-compose.yml)
      if [ "$voice_mode" = owned ]; then args+=(--profile owned-voice); fi
    else
      args=(-f compose.yml -f compose.prod.yml)
      if [ -f compose.owned-voice.yml ]; then args+=(-f compose.owned-voice.yml); fi
    fi
    docker compose --progress quiet --env-file "$envfile" -p victor-stage "${args[@]}" up -d --no-deps --no-build --pull never --force-recreate --wait --wait-timeout 180 "${services[@]}"
    curl -fsS http://127.0.0.1:18080/health
  fi
  exit 1
}
services=(api web)
args=(-f docker-compose.yml)
if [ "$voice_mode" = owned ]; then args+=(--profile owned-voice); services+=(voice-worker); fi
trap rollback ERR
python3 - "$envfile" "$api" "$web" "$voice_mode" "$worker" "$assetroot/current" <<'PY'
import pathlib,re,sys
p=pathlib.Path(sys.argv[1]); text=p.read_text(encoding='utf-8')
updates={'API_IMAGE':sys.argv[2], 'WEB_IMAGE':sys.argv[3], 'WEB_ASSET_PATH':sys.argv[6], 'COMPOSE_PROFILES':'owned-voice' if sys.argv[4]=='owned' else ''}
if sys.argv[4]=='owned': updates['VOICE_WORKER_IMAGE']=sys.argv[5]
for key,value in updates.items():
    line=key+"='"+value+"'"
    if re.search(r'^'+key+r'=.*$',text,re.M): text=re.sub(r'^'+key+r'=.*$',line,text,flags=re.M)
    else: text+='\n'+line+'\n'
p.write_text(text,encoding='utf-8'); p.chmod(0o600)
PY
select_assets "$assets"
cd "$release"
docker compose --env-file "$envfile" -p victor-stage "${args[@]}" config --quiet
# Recreate so Docker resolves the updated current symlink. DB containers stay put.
docker compose --progress quiet --env-file "$envfile" -p victor-stage "${args[@]}" up -d --no-deps --no-build --pull never --force-recreate --wait --wait-timeout 180 "${services[@]}"
curl -fsS http://127.0.0.1:18080/health
curl -fsS http://127.0.0.1:18080/voice-worklet.js >/dev/null
python3 - <<'PY'
import re,urllib.request
base='http://127.0.0.1:18080'
with urllib.request.urlopen(base+'/') as r: html=r.read().decode()
for asset in re.findall(r'(?:src|href)="(/assets/[^"<>]+)"',html):
    with urllib.request.urlopen(base+asset) as r:
        assert r.status==200 and 'text/html' not in r.headers.get('Content-Type',''), 'Asset response invalid'
print('Published index/worklet/assets passed HTTP acceptance')
PY
ln -sfn "$release" "$app/current"
trap - ERR
printf '\nGit release healthy: %s; public assets: %s\n' "$commit" "$assets"
# Retain prior app/asset versions and database volumes; never prune other projects.
