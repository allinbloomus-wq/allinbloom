import { createHash, randomBytes, randomInt } from "crypto";

export const OTP_TTL_MINUTES = 10;

export const generateOtp = () => {
  const code = randomInt(100000, 999999).toString();
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(code + salt).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  return { code, salt, hash, expiresAt };
};

export const verifyOtp = (code: string, salt: string, hash: string) => {
  const candidate = createHash("sha256").update(code + salt).digest("hex");
  return candidate === hash;
};
