import { createHash, randomBytes } from "node:crypto";

// Токени за сесии: 32 случајни бајти (64 hex знаци). Прелистувачот го добива токенот,
// а базата го чува само SHA-256 хешот.

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дена

export const newSessionToken = () => randomBytes(32).toString("hex");

export const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Брза проверка на формат пред да се оди до базата (одбива очигледно погрешни колачиња). */
export const isValidSessionToken = (token: unknown): token is string =>
  typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
