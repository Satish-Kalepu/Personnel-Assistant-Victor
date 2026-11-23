import {readFile} from 'node:fs/promises';
import {remote} from './stage-ssh.mjs';
const {email}=JSON.parse(await readFile(new URL('../.local/stage-fixture.json',import.meta.url),'utf8'));
if(!/^stage-check-20261121-[a-f0-9-]{36}@example\.test$/.test(email))throw new Error('Refusing non-fixture account cleanup.');
await remote('bash -s',`set -euo pipefail
docker exec -i -e FIXTURE_EMAIL='${email}' victor-stage-api-1 node --input-type=module <<'NODE'
import {MongoClient} from 'mongodb';
const client=new MongoClient(process.env.MONGODB_URI);await client.connect();
try{
  const db=client.db('victor'),email=process.env.FIXTURE_EMAIL,user=await db.collection('user').findOne({email,name:'Stage verification'});
  if(!user)throw new Error('Exact synthetic fixture not found; no changes made.');
  const tenantId=user._id.toString();
  await client.withSession(async session=>{await session.withTransaction(async()=>{
    for(const name of ['messages','conversations','facts','usage','voiceReservations','recoveryCodes'])await db.collection(name).deleteMany({tenantId},{session});
    for(const name of ['session','account'])await db.collection(name).deleteMany({$or:[{userId:user._id},{userId:tenantId}]},{session});
    await db.collection('challenges').deleteMany({email},{session});
    await db.collection('user').deleteOne({_id:user._id,email,name:'Stage verification'},{session});
  });});
  if(await db.collection('user').countDocuments({email})||await db.collection('messages').countDocuments({tenantId}))throw new Error('Fixture removal not confirmed');
  console.log(JSON.stringify({removedSyntheticFixture:true,applicationSpendAccountingPreserved:true,otherAccountsUntouched:true}));
}finally{await client.close();}
NODE
`);
const result=await fetch('http://localhost:18025/api/v1/search?query='+encodeURIComponent(`to:${email}`)).then(r=>r.json());
const ids=(result.messages||[]).filter(message=>message.To?.some(recipient=>recipient.Address===email)).map(message=>message.ID);
if(ids.length){const response=await fetch('http://localhost:18025/api/v1/messages',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({IDs:ids})});if(!response.ok)throw new Error('Fixture email removal not confirmed');}
console.log(JSON.stringify({syntheticEmailsRemoved:ids.length}));
