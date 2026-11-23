import { createServer } from "node:http";
import { loadConfig } from "./config.js";
import { connectStore, ensureIndexes } from "./store.js";
import { createApplication } from "./app.js";
import { attachVoice } from "./voice.js";
const config = loadConfig();
const store = await connectStore(config);
await ensureIndexes(store.db);
const runtime = createApplication(store, config);
const server = createServer(runtime.app);
const voice = attachVoice(
  server,
  store,
  config,
  runtime.identity,
  runtime.assistant,
  runtime.usage,
);
server.requestTimeout = 40000;
server.headersTimeout = 10000;
server.listen(config.PORT, "0.0.0.0", () =>
  console.log(
    JSON.stringify({
      event: "listening",
      port: config.PORT,
      chatConfigured: !!config.OPENAI_API_KEY,
    }),
  ),
);
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  voice.close();
  runtime.mail.close();
  server.close();
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  await store.close();
}
process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});
