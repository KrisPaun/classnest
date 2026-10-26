// Шифрирање на чувствителни податоци (IBAN, датум на раѓање, телефон) со AES-256-GCM.
// Клучот е во променлива на околината BANK_DATA_KEY (64 hex знаци) и не се комитира.
// Пишано како .mjs за да го користат и апликацијата и Node скриптите (на пр. увозот на сметки).
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** @returns {Buffer} */
function key() {
  const hex = process.env.BANK_DATA_KEY ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error("BANK_DATA_KEY is missing or invalid (need 64 hex chars)");
  return Buffer.from(hex, "hex");
}

export const secretBoxConfigured = () => /^[0-9a-f]{64}$/i.test(process.env.BANK_DATA_KEY ?? "");

/**
 * Формат: v1.<iv>.<tag>.<шифрат>, сè base64.
 * @param {string} plain
 * @returns {string}
 */
export function encryptSecret(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

/**
 * @param {string} box
 * @returns {string}
 */
export function decryptSecret(box) {
  const [version, iv, tag, data] = box.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
