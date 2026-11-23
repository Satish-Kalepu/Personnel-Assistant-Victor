try { rs.status(); }
catch(error) { if(error.code!==94)throw error; rs.initiate({_id:'rs0',members:[{_id:0,host:'mongodb:27017'}]}); }
let ready=false;
for(let i=0;i<90;i++){if(db.adminCommand({hello:1}).isWritablePrimary){ready=true;break;}sleep(1000);}
if(!ready)throw new Error('Offline restore replica set did not initialize');
console.log('Isolated offline restore bootstrap ready.');
