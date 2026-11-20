import assert from 'node:assert/strict';
const origin=new URL(process.argv[2]||'http://localhost:18080');
assert.equal(origin.username,'');assert.equal(origin.password,'');
const health=await fetch(new URL('/health',origin));assert.equal(health.status,200);assert.equal((await health.json()).status,'ready');
const session=await fetch(new URL('/api/auth/get-session',origin));assert.equal(session.status,200);assert.equal(await session.json(),null);
const me=await fetch(new URL('/api/me',origin));assert.equal(me.status,401);
const page=await fetch(origin);assert.equal(page.status,200);assert.match(await page.text(),/Your personal assistant/);
assert.ok(page.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
console.log(JSON.stringify({origin:origin.origin,ready:true,anonymousSession:null,privateDataRejected:true,webAndCsp:true}));
