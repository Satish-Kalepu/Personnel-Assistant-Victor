import test, { after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { permissiveCors } from "../dist/cors.js";

const app = express();
app.use(permissiveCors);
app.all("/private", (_req, res) => res.status(401).json({ error: "unauthorized" }));
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
after(() => new Promise(resolve => server.close(resolve)));

test("credentialed preflight allows any origin, requested headers and extension method", async () => {
  for (const origin of ["https://ai-test.satishk.com", "http://localhost:8080", "https://different.example", "null"]) {
    const response = await fetch(base + "/private", { method: "OPTIONS", headers: {
      Origin: origin,
      "Access-Control-Request-Method": "PROPFIND",
      "Access-Control-Request-Headers": "authorization, content-type, x-any-custom-header",
    }});
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    assert.equal(response.headers.get("access-control-allow-credentials"), "true");
    assert.ok(response.headers.get("access-control-allow-methods").split(/,\s*/).includes("PROPFIND"));
    assert.match(response.headers.get("access-control-allow-headers"), /authorization.*x-any-custom-header/);
    assert.match(response.headers.get("vary"), /Origin/);
    assert.match(response.headers.get("vary"), /Access-Control-Request-Headers/);
    assert.match(response.headers.get("vary"), /Access-Control-Request-Method/);
  }
});

test("permissive CORS preserves authentication rejection and exposes error responses", async () => {
  const origin = "https://different.example";
  const response = await fetch(base + "/private", { headers: { Origin: origin, Cookie: "invalid-session=1" }});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.equal(response.headers.get("access-control-expose-headers"), "set-auth-token");
});
