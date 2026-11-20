import { loadConfig } from "./config.js";
import { connectStore, ensureIndexes } from "./store.js";
const store = await connectStore(loadConfig());
try {
  await ensureIndexes(store.db);
  console.log("Indexes verified.");
} finally {
  await store.close();
}
