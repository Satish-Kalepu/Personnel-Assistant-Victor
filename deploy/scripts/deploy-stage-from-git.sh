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
expected_commit="${1:-}"
if [ -n "$expected_commit" ]; then
  [[ "$expected_commit" =~ ^[a-f0-9]{40}$ ]] && [ "$commit" = "$expected_commit" ] || { printf 'Git commit differs from the reviewed target.\n' >&2; exit 1; }
fi
tag="stage-git-${commit:0:12}"
api="victor-api:$tag"
web="victor-web:$tag"
worker="victor-voice-worker:$tag"
release="$app/releases/$tag"
voice_mode=$(python3 - "$envfile" <<'PY'
import pathlib,sys
values={}
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
 k,sep,v=line.partition('=')
 if sep:values[k]=v.strip().strip(chr(39)+chr(34))
print(values.get('VOICE_ENDPOINT_MODE','provider'))
PY
)
case "$voice_mode" in owned|provider) ;; *) printf 'Unsupported voice mode.\n' >&2; exit 1;; esac
cd "$repo"
# Docker 25's legacy builder supports these ordinary multi-stage Dockerfiles;
# no host Node upgrade or buildx/system installation is required.
DOCKER_BUILDKIT=0 docker build --quiet --memory 1g --memory-swap 1g --label "org.opencontainers.image.revision=$commit" -t "$api" services/api
DOCKER_BUILDKIT=0 docker build --quiet --memory 768m --memory-swap 768m --label "org.opencontainers.image.revision=$commit" -t "$web" web
if [ "$voice_mode" = owned ]; then
  # Public model artifact must be readable by the non-root image user. Private
  # runtime config below retains077; this sub-shell only prepares the model.
  (umask 022; python3 services/voice-worker/fetch_model.py)
  chmod 644 services/voice-worker/.models/silero_vad.onnx
  DOCKER_BUILDKIT=0 docker build --quiet --memory 768m --memory-swap 768m --label "org.opencontainers.image.revision=$commit" -t "$worker" services/voice-worker
fi
# Smoke-test the actual server-built runtimes before touching the release/env.
docker run --rm --network none --memory 384m --user "$(id -u):$(id -g)" -v "$repo/services/api/test:/app/test:ro" "$api" node --test --test-concurrency=1 test/voice-session.test.mjs test/voice-sdk.test.mjs test/owned-voice.test.mjs test/voice-retention.test.mjs
docker run --rm --network none --entrypoint sh "$web" -c 'test -r /etc/nginx/victor.conf.template && test -r /usr/share/nginx/html/index.html && echo "Non-root web source smoke check passed"'
if [ "$voice_mode" = owned ]; then
  docker run --rm --network none "$worker" python -c "from worker import Detector; assert Detector().push(bytes(3200)) == []; print('Non-root worker/model smoke check passed')"
fi
mkdir -p "$release/deploy/mongo"
cp compose.yml compose.stage.yml compose.prod.yml "$release/"
if [ "$voice_mode" = owned ]; then cp compose.owned-voice.yml "$release/"; fi
cp deploy/mongo/entry.sh deploy/mongo/setup.js "$release/deploy/mongo/"
previous=$(readlink "$app/current" || true)
if [ -n "$previous" ]; then case "$previous" in "$app/releases/"*) ;; *) printf 'Unexpected prior release path.\n' >&2; exit 1;; esac; fi
cp "$envfile" "$app/shared/.env.previous"
python3 - "$envfile" "$api" "$web" "$voice_mode" "$worker" <<'PY'
import pathlib,re,sys
p=pathlib.Path(sys.argv[1]); text=p.read_text(encoding='utf-8')
updates=[('API_IMAGE',sys.argv[2]),('WEB_IMAGE',sys.argv[3])]
if sys.argv[4]=='owned':updates.append(('VOICE_WORKER_IMAGE',sys.argv[5]))
for key,value in updates:
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
args=(-f compose.yml -f "$override")
services=(api web)
if [ "$voice_mode" = owned ]; then args+=(-f compose.owned-voice.yml); services+=(voice-worker); fi
if ! docker compose --env-file "$envfile" -p victor-stage "${args[@]}" config --quiet || ! docker compose --progress quiet --env-file "$envfile" -p victor-stage "${args[@]}" up -d --no-deps --no-build --pull never --wait --wait-timeout 180 "${services[@]}"; then
  cp "$app/shared/.env.previous" "$envfile"
  if [ -n "$previous" ]; then
    cd "$previous"; args=(-f compose.yml -f "$override"); services=(api web)
    if [ -e compose.owned-voice.yml ]; then args+=(-f compose.owned-voice.yml); services+=(voice-worker); fi
    docker compose --progress quiet --env-file "$envfile" -p victor-stage "${args[@]}" up -d --no-deps --no-build --pull never "${services[@]}"
  fi
  printf 'New release failed health; prior image settings restored. Investigate before retry.\n' >&2
  exit 1
fi
ln -sfn "$release" "$app/current"
curl -fsS http://127.0.0.1:18080/health
printf '\nGit Stage release healthy: %s\n' "$commit"
# Do not prune unrelated/previous images or reset persistent volumes.
