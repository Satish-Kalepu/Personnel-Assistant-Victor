// Inspect the exact Git index, with actual private values withheld from output.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {parseEnv} from 'node:util';
const secrets=new Set();
for(const name of ['../PersonnelAssistant.env','../PersonnelAssistant.env.stage','.env','.env.dev','.env.stage']){
  let text;try{text=await readFile(name,'utf8');}catch(error){if(error.code==='ENOENT')continue;throw error;}
  for(const [key,value] of Object.entries(parseEnv(text)))
    if(/(?:API_KEY|PASSWORD|SECRET|ENCRYPTION_KEY|REPLICA_KEY)$/i.test(key)&&value.length>=16&&!value.startsWith('GENERATE_'))secrets.add(value);
}
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACMR','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const name of files){
  if(/(^|\/)PersonnelAssistant\.env(?:$|\.)/.test(name)||( /(^|\/)\.env($|\.)/.test(name)&&name!=='.env.example')||/(^|\/)(node_modules|\.local|\.models|venv|__pycache__)(\/|$)/.test(name))throw new Error('Private/runtime path staged: '+name);
  const data=execFileSync('git',['show',':'+name],{maxBuffer:20*1024*1024});
  if([...secrets].some(value=>data.includes(Buffer.from(value))))throw new Error('Private value found in staged file; value withheld: '+name);
}
console.log(JSON.stringify({stagedFilesChecked:files.length,privateValuesChecked:secrets.size,secretMatches:0,privatePathsStaged:0}));
