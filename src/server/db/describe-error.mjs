// Читлива порака за грешка од базата, за скриптите (миграции, увози).
// Drizzle ја завиткува вистинската грешка („Failed query: …“), а причината е во `cause`.
// Никогаш не ги печати параметрите на барањето ниту DATABASE_URL (може да содржат лозинка).

/** @type {Record<string, string>} */
const HINTS = {
  ECONNREFUSED: "MySQL не одговара на тој host и порт. Дали работи? (npm run db:up; Docker Desktop мора да е вклучен)",
  ENOTFOUND: "Host-от од DATABASE_URL не постои.",
  ETIMEDOUT: "Врската со базата истече. Проверете го host-от, портот и заштитниот ѕид.",
  PROTOCOL_CONNECTION_LOST: "Врската со базата е прекината.",
  ER_ACCESS_DENIED_ERROR: "Погрешно корисничко име или лозинка во DATABASE_URL.",
  ER_BAD_DB_ERROR: "Базата од DATABASE_URL не постои.",
  ER_DBACCESS_DENIED_ERROR: "Корисникот нема право на таа база.",
  ER_TABLEACCESS_DENIED_ERROR: "Корисникот нема доволно права (на пр. CREATE, ALTER, INSERT).",
  ER_SPECIFIC_ACCESS_DENIED_ERROR: "Корисникот нема потребна привилегија.",
  ER_CANT_CREATE_TABLE: "Табелата не може да се создаде (проверете ги надворешните клучеви и CHECK правилата).",
  ER_CHECK_CONSTRAINT_VIOLATED: "Ред го прекршува CHECK правилото на табелата.",
};

/** @param {unknown} error */
function rootCause(error) {
  const seen = new Set();
  let current = /** @type {any} */ (error);
  while (current && typeof current === "object" && current.cause && !seen.has(current)) {
    seen.add(current);
    current = current.cause;
  }
  return current;
}

/**
 * @param {unknown} error
 * @returns {string} на пример: "ER_ACCESS_DENIED_ERROR: Access denied for user … → Погрешно корисничко име …"
 */
export function describeDbError(error) {
  const root = rootCause(error);
  if (!root || typeof root !== "object") return "непозната грешка";

  const code = root.code ? String(root.code) : "";
  // sqlMessage е пораката од самата база. Не го користиме `query`/`params` од Drizzle.
  const raw = String(root.sqlMessage ?? root.message ?? "непозната грешка");
  // Ако е само Drizzle обвивката, не го печатиме барањето (може да има параметри).
  const message = raw.startsWith("Failed query:") ? "барањето не успеа (причината не е достапна)" : raw;

  const hint = HINTS[code];
  return `${code ? `${code}: ` : ""}${message}${hint ? `\n→ ${hint}` : ""}`;
}
