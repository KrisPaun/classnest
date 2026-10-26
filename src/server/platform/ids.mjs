// Пишано како .mjs за да го користат и апликацијата (TypeScript) и Node скриптите (db:seed).
import { randomBytes } from "node:crypto";

/**
 * UUIDv7: првите 48 бита се време во милисекунди, па идентификаторите се подредени по време.
 * Тоа е добро за InnoDB (кластериран примарен клуч) и не се погодуваат однадвор.
 *
 * @param {number} [now] време во милисекунди (за тестови)
 * @returns {string}
 */
export function uuidv7(now = Date.now()) {
  const b = randomBytes(16);

  const high = Math.floor(now / 2 ** 32); // горните 16 бита од времето
  const low = now % 2 ** 32; // долните 32 бита
  b[0] = (high >> 8) & 0xff;
  b[1] = high & 0xff;
  b[2] = (low >>> 24) & 0xff;
  b[3] = (low >>> 16) & 0xff;
  b[4] = (low >>> 8) & 0xff;
  b[5] = low & 0xff;

  b[6] = (b[6] & 0x0f) | 0x70; // верзија 7
  b[8] = (b[8] & 0x3f) | 0x80; // вариjанта RFC 4122

  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
