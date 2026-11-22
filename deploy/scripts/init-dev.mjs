import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../../", import.meta.url);
let template = await readFile(new URL(".env.example", root), "utf8");
for (const name of [
  "MONGO_ROOT_PASSWORD",
  "MONGO_APP_PASSWORD",
  "REDIS_PASSWORD",
  "AUTH_SECRET",
  "MAIL_ENCRYPTION_KEY",
  "BACKUP_ENCRYPTION_KEY",
]) {
  template = template.replace(
    `${name}=GENERATE_LOCAL_SECRET`,
    `${name}=${randomBytes(32).toString("hex")}`,
  );
}
template = template.replace(
  "MONGO_REPLICA_KEY=GENERATE_LOCAL_SECRET",
  `MONGO_REPLICA_KEY=${randomBytes(72).toString("base64")}`,
);
// Keys remain in root .env, which is loaded last. Never duplicate them in dev settings.
template = template.replace(/^(OPENAI_API_KEY|SARVAM_API_KEY)=.*\r?\n/gm, "");
for (const [name, content] of [
  [".env.dev", template],
  [".env", "# Private provider keys; do not commit.\n"],
]) {
  try {
    await writeFile(new URL(name, root), content, { flag: "wx", mode: 0o600 });
    console.log(`Created ${name}`);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    console.log(`Preserved existing ${name}`);
  }
}
await mkdir(new URL("deploy/.local/", root), { recursive: true });
const existing=await readFile(new URL('.env.dev',root),'utf8');
// New local-only Compose settings; preserve every existing private value.
let composeDefaults='';
for(const [key,value] of Object.entries({WEB_ASSET_PATH:'./web/dist',COMPOSE_PROFILES:'local'})){
  if(!new RegExp('^'+key+'=','m').test(existing))composeDefaults+=`\n${key}=${value}\n`;
}
if(composeDefaults)await writeFile(new URL('.env.dev',root),existing+composeDefaults,{mode:0o600});
if(!/^BACKUP_ENCRYPTION_KEY=/m.test(existing)){
  await writeFile(new URL('.env.dev',root),existing+composeDefaults+`\nBACKUP_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\n`,{mode:0o600});
  console.log('Added a private local backup encryption key; existing values preserved.');
}
console.log(
  `Local configuration ready in ${fileURLToPath(root)}. No secret values displayed.`,
);
