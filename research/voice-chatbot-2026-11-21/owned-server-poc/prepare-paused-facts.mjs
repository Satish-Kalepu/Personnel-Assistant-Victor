// Fixed AI-generated synthetic phrases, never human audio or production records.
import {readFile,writeFile} from 'node:fs/promises';
import {loadProviderConfig} from '../demo/providers.mjs';
const phrases=['My favorite outdoor activity is hiking.','My preferred drink is green tea.','I am learning Spanish.'];
const {OPENAI_API_KEY}=await loadProviderConfig();
if(!OPENAI_API_KEY)throw new Error('Existing OpenAI key needed for synthetic fixture generation');
for(let index=0;index<phrases.length;index++){
  const target=new URL(`./.local/paused-fact-${index+1}.pcm`,import.meta.url);
  try{await readFile(target);continue;}catch(error){if(error.code!=='ENOENT')throw error;}
  const response=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:'Bearer '+OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini-tts',voice:'alloy',input:phrases[index],response_format:'pcm'}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('Synthetic phrase generation failed: '+response.status);
  await writeFile(target,Buffer.from(await response.arrayBuffer()));
}
console.log(JSON.stringify({syntheticPhrases:phrases,cached:true,keysPrinted:false}));
