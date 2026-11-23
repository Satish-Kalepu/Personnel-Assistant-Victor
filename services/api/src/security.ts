import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { Request } from "express";
import type { Config } from "./config.js";
import type { Store } from "./store.js";
import { AppError } from "./errors.js";
export function digest(secret: string, purpose: string, value: string) {
  return createHmac("sha256", secret)
    .update(`${purpose}\0${value}`)
    .digest("hex");
}
export function equalDigest(a: string, b: string) {
  const x = Buffer.from(a, "hex"),
    y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}
export function seal(key: string, value: unknown) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}
export function unseal<T>(key: string, value: string): T {
  const data = Buffer.from(value, "base64"),
    decipher = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      data.subarray(0, 12),
    );
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(data.subarray(28)),
      decipher.final(),
    ]).toString(),
  );
}
export function headersOf(request: Request) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers))
    if (typeof value === "string") headers.set(key, value);
  return headers;
}
export function checkOrigin(request: Request, config: Config) {
  const origin = request.get("origin");
  if (origin && origin !== config.APP_ORIGIN)
    throw new AppError(403, "origin", "Request origin is not allowed.");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !origin &&
    request.get("x-victor-client") !== "android"
  )
    throw new AppError(403, "origin", "Request origin is required.");
}
const rateScript = `local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n`;
export async function rateLimit(
  store: Store,
  secret: string,
  scope: string,
  identity: string,
  limit: number,
  seconds: number,
) {
  const count = await store.redis.eval(rateScript, {
    keys: [`rate:${scope}:${digest(secret, "rate", identity)}`],
    arguments: [String(seconds)],
  });
  if (Number(count) > limit)
    throw new AppError(
      429,
      "rate_limit",
      "Too many requests. Please wait and try again.",
    );
}
