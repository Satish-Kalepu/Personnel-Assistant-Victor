// Publish reviewed Git code, pull the exact commit and execute its server-side builder.
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {remote} from './stage-ssh.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
if(git('branch','--show-current')!=='Stage')throw new Error('Deploy from the reviewed Stage branch');
if(git('status','--porcelain','--untracked-files=normal'))throw new Error('Commit reviewed changes before deployment; checkout must be clean');
const commit=git('rev-parse','HEAD');
if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('Unexpected Git commit');
await new Promise((resolve,reject)=>{
  const child=spawn('git',['push','origin','Stage'],{cwd:root,stdio:'inherit'});
  child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Non-force Git push failed')));
});
await remote('bash -s',`set -euo pipefail
app="$HOME/victor-stage"
repo="$app/repository"
export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes'
[ "$(cat "$app/.victor-managed")" = 'victor-stage' ]
[ "$(git -C "$repo" branch --show-current)" = Stage ]
[ -z "$(git -C "$repo" status --porcelain)" ] || { printf 'Stage checkout has local changes; stopping.\\n' >&2; exit 1; }
git -C "$repo" fetch origin Stage
git -C "$repo" merge --ff-only origin/Stage
[ "$(git -C "$repo" rev-parse HEAD)" = '${commit}' ] || { printf 'Remote branch changed; review before deploying.\\n' >&2; exit 1; }
exec bash "$repo/deploy/scripts/deploy-stage-from-git.sh" '${commit}'
`);
console.log(JSON.stringify({deployedFromGit:true,commit,url:'https://ai_test.satishk.com'}));
