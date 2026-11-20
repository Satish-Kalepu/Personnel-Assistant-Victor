const connection = new Mongo('mongodb://' + encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME) + ':' + encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD) + '@mongodb:27017/admin');
const restored = connection.getDB('victor');
const options = connection.getDB('admin').runCommand({getCmdLineOpts:1});
if(!options.ok || (!options.parsed.security?.keyFile && options.parsed.security?.authorization!=='enabled'))throw new Error('Restore bootstrap must not remain unauthenticated');
print(JSON.stringify({authenticated:true,authorizationEnabled:true,users:restored.user.countDocuments({}),messages:restored.messages.countDocuments({}),factIndexes:restored.facts.getIndexes().length}));
