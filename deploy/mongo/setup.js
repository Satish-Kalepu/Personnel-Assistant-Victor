const conn = new Mongo(process.env.MONGO_SETUP_URI);
const admin = conn.getDB("admin");
try {
  admin.runCommand({ replSetGetStatus: 1 });
} catch (error) {
  if (error.code !== 94) throw error;
  admin.runCommand({
    replSetInitiate: {
      _id: "rs0",
      members: [{ _id: 0, host: "mongodb:27017" }],
    },
  });
}
let ready = false;
for (let i = 0; i < 90; i++) {
  if (admin.runCommand({ hello: 1 }).isWritablePrimary) {
    ready = true;
    break;
  }
  sleep(1000);
}
if (!ready) throw new Error("MongoDB replica set not ready");
const app = conn.getDB("victor");
if (!app.getUser("victor"))
  app.createUser({
    user: "victor",
    pwd: process.env.MONGO_APP_PASSWORD,
    roles: [{ role: "readWrite", db: "victor" }],
  });
console.log("MongoDB replica set and least-privilege application user ready.");
