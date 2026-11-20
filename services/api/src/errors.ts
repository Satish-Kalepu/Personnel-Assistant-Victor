import { z } from "zod";
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
  get publicMessage() {
    return this.message;
  }
}
export const emailSchema = z
  .email()
  .max(254)
  .transform((v) => v.trim().toLowerCase());
export const passwordSchema = z
  .string()
  .min(15)
  .max(128)
  .refine(
    (v) =>
      !["passwordpassword", "123456789012345", "qwertyuiopasdfgh"].includes(
        v.toLowerCase(),
      ),
    "Choose a less common password.",
  );
export const modeSchema = z.enum(["personal", "practice"]);
export const idSchema = z.uuid();
export const secretCue =
  /\b(password|passcode|pin|otp|secret|api[_ -]?key|token|credential|account\s*(?:number|no\.?|#)|iban|cvv|card\s*number|routing\s*number)\b/i;
const accountShape = /(?:^|[^\w])(?:\d[ -]?){9,18}(?:$|[^\w])/;
export function holdsSecret(text: string) {
  return secretCue.test(text) || accountShape.test(text);
}
export function checkedMessage(value: unknown) {
  const text = z.string().trim().min(1).max(4000).parse(value);
  if (holdsSecret(text))
    throw new AppError(
      422,
      "secret_hold",
      "This may contain confidential credentials or account details. It was not sent or saved.",
    );
  return text;
}
