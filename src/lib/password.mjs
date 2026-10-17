// Хеширање на лозинки со вграден scrypt (без надворешни пакети).
// Го користат и апликацијата и scripts/create-host-account.mjs.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;

/** @param {string} password @param {Buffer} salt @param {number} len @returns {Promise<Buffer>} */
const derive = (password, salt, len) =>
  new Promise((resolve, reject) =>
    scrypt(password, salt, len, (err, key) => (err ? reject(err) : resolve(key))),
  );

/** @param {string} password @returns {Promise<string>} формат: scrypt$salt$hash */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, KEY_LEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** @param {string} password @param {string} stored @returns {Promise<boolean>} */
export async function verifyPassword(password, stored) {
  const [alg, saltHex, hashHex] = String(stored).split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await derive(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Валиден хеш за непостоечки корисник, за да трае проверката исто (спречува timing напад). */
export const DUMMY_HASH = `scrypt$${"00".repeat(16)}$${"00".repeat(KEY_LEN)}`;
