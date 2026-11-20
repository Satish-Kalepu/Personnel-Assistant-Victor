import { z } from "zod";
const positive = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);
export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const config = z
    .object({
      NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("production"),
      PORT: positive(3000),
      APP_ORIGIN: z.url(),
      MONGODB_URI: z.string().min(1),
      REDIS_URL: z.string().min(1),
      AUTH_SECRET: z.string().min(48),
      MAIL_ENCRYPTION_KEY: z.string().regex(/^[a-f0-9]{64}$/),
      OPENAI_API_KEY: z.string().default(""),
      OPENAI_MODEL: z
        .string()
        .default("gpt-6.1-terra")
        .transform((v) => v || "gpt-6.1-terra"),
      OPENAI_VOICE_MODEL: z.enum(["gpt-6-luna", "gpt-6.1-terra"]).default("gpt-6-luna"),
      SARVAM_API_KEY: z.string().default(""),
      SARVAM_PRIVACY_CONFIRMED: z.string().default("false"),
      SARVAM_SPEAKER: z.string().default("simran_en_customer"),
      SMTP_HOST: z.string().min(1),
      SMTP_PORT: positive(587),
      SMTP_SECURE: z.string().default("false"),
      SMTP_USER: z.string().default(""),
      SMTP_PASSWORD: z.string().default(""),
      SMTP_FROM: z.string().min(1),
      DAILY_CHAT_LIMIT: positive(20),
      DAILY_EMAIL_LIMIT: positive(500),
      DAILY_VOICE_SECONDS: positive(300),
      MONTHLY_AI_LIMIT_CENTS: positive(5000),
      CHAT_RESERVE_CENTS: positive(5),
      VOICE_RESERVE_CENTS_PER_MINUTE: positive(4),
      TTS_RESERVE_CENTS_PER_1000_CHARS: positive(2),
    })
    .parse(env);
  const origin = new URL(config.APP_ORIGIN);
  if (origin.origin !== config.APP_ORIGIN || origin.username || origin.password)
    throw new Error(
      "APP_ORIGIN must be an origin without a path or credentials.",
    );
  if (
    config.NODE_ENV === "production" &&
    (origin.protocol !== "https:" ||
      !config.OPENAI_API_KEY ||
      !config.SARVAM_API_KEY ||
      config.SMTP_HOST === "mailpit" ||
      !config.SMTP_USER ||
      !config.SMTP_PASSWORD)
  )
    throw new Error(
      "Production needs HTTPS, provider keys and authenticated production SMTP.",
    );
  if (config.OPENAI_MODEL !== "gpt-6.1-terra")
    throw new Error(
      "Review model pricing/reservation bounds before selecting a different OPENAI_MODEL.",
    );
  if (config.CHAT_RESERVE_CENTS < 5)
    throw new Error(
      "Chat reserve must cover the configured bounded model call (minimum 5 cents).",
    );
  return config;
}
export type Config = ReturnType<typeof loadConfig>;
