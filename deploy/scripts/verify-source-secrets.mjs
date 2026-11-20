import {readFile,readdir} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const values=parseEnv(await readFile(path.join(root,'.env'),'utf8'));
const secrets=['OPENAI_API_KEY','SARVAM_API_KEY'].map(name=>values[name]).filter(Boolean);
if(secrets.length!==2)throw new Error('Both provider keys must be configured for this value-free check.');
let count=0;
async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){if(['node_modules','.git'].includes(entry.name)||entry.name.startsWith('.env'))continue;const full=path.join(directory,entry.name);if(entry.isDirectory())await walk(full);else{const content=await readFile(full);if(secrets.some(value=>content.includes(Buffer.from(value))))throw new Error(`Provider key found in ${path.relative(root,full)}; value withheld.`);count++;}}}
for(const directory of ['services/api/src','services/api/dist','web'])await walk(path.join(root,directory));
for(const name of ['services/api/Dockerfile','services/api/.dockerignore','web/.dockerignore']){const content=await readFile(path.join(root,name));if(secrets.some(value=>content.includes(Buffer.from(value))))throw new Error('Secret found in build configuration; value withheld.');count++;}
console.log(JSON.stringify({sourceAndBuildFilesChecked:count,providerKeyMatches:0,secretValuesDisplayed:false}));
