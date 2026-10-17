import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Шифрирање на чувствителни податоци (на пр. IBAN) со AES-256-GCM.
// Клучот е во променлива на околината BANK_DATA_KEY (64 hex знаци) и не се комитира.

function key(): Buffer {
  const hex = process.env.BANK_DATA_KEY ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error("BANK_DATA_KEY is missing or invalid (need 64 hex chars)");
  return Buffer.from(hex, "hex");
}

export const secretBoxConfigured = () => /^[0-9a-f]{64}$/i.test(process.env.BANK_DATA_KEY ?? "");

/** Формат: v1.<iv>.<tag>.<шифрат>, сè base64. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decryptSecret(box: string): string {
  const [version, iv, tag, data] = box.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
