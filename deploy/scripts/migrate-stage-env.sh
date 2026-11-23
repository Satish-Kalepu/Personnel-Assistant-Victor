#!/bin/bash
# Run from the staging Git checkout; private values never leave this server.
set -euo pipefail
app="$HOME/victor-stage"
export DOCKER_CONFIG="$app/docker-config"
[ "$(cat "$app/.victor-managed")" = victor-stage ]
python3 - "$app" <<'PY'
import json,os,pathlib,subprocess,sys,uuid
app=pathlib.Path(sys.argv[1]); repo=app/'repository'
old=app/'shared/.env'; target=app/'PersonnelAssistant.env'
def config(file):
    result=subprocess.run(['docker','compose','--env-file',str(file),'-p','victor-stage','-f','docker-compose.yml','config','--format','json'],cwd=repo,capture_output=True,text=True)
    if result.returncode: raise RuntimeError('Compose validation failed; values withheld.')
    return json.loads(result.stdout)
created=False
try:
    if old.is_symlink():
        if old.resolve()!=target or not target.is_file(): raise RuntimeError('Unexpected legacy symlink.')
        config(target)
        print(json.dumps({'parentEnvSelected':True,'alreadyMigrated':True,'valuesDisplayed':False}))
        sys.exit(0)
    if not old.is_file() or target.is_symlink(): raise RuntimeError('Unexpected env path.')
    before=config(old)
    if target.exists():
        if not target.is_file() or target.read_bytes()!=old.read_bytes(): raise RuntimeError('Existing parent configuration differs.')
    else:
        # Exclusive same-filesystem link protects against overwriting a new file.
        os.link(old,target,follow_symlinks=False); created=True
    if config(target)!=before: raise RuntimeError('Compose values would change.')
    target.chmod(0o600)
    alias=old.parent/('.env.link-'+str(uuid.uuid4()))
    alias.symlink_to(os.path.relpath(target,old.parent))
    os.replace(alias,old)
    print(json.dumps({'parentEnv':'../PersonnelAssistant.env','composeEquivalent':True,'legacyCompatibilitySymlink':True,'mode':'0600','valuesDisplayed':False,'containersRestarted':False}))
except Exception:
    if created and not old.is_symlink(): target.unlink(missing_ok=True)
    print('Env relocation stopped; configuration details withheld. Inspect paths without printing credentials.',file=sys.stderr)
    sys.exit(1)
PY
