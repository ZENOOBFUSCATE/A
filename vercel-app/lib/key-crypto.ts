import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey(): Buffer {
  const secret = process.env.GEMINI_KEYS_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("GEMINI_KEYS_ENCRYPTION_SECRET ကို Vercel Environment Variables တွင် အနည်းဆုံး 32 လုံးထည့်ပါ။");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptGeminiKeys(keys: string[]): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(keys), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptGeminiKeys(payload: string): string[] {
  const [ivText, tagText, ciphertextText] = payload.split(".");
  if (!ivText || !tagText || !ciphertextText) throw new Error("Gemini key payload မမှန်ပါ။");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
  const keys = JSON.parse(plaintext);
  if (!Array.isArray(keys) || keys.length < 1 || keys.length > 5 || keys.some((key) => typeof key !== "string" || !key)) {
    throw new Error("Gemini API key စာရင်း မမှန်ပါ။");
  }
  return keys;
}
