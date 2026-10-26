/** mysql2 фрла код ER_DUP_ENTRY (1062), а Drizzle го става во `cause`. */
export function isDuplicateKeyError(error: unknown): boolean {
  const e = error as { code?: string; errno?: number; cause?: { code?: string; errno?: number } };
  return [e, e?.cause].some((x) => x?.code === "ER_DUP_ENTRY" || x?.errno === 1062);
}

/**
 * Името на индексот што е прекршен, на пр. "hosts_slug_uq".
 * MySQL пишува „for key 'hosts.hosts_slug_uq'“, а MariaDB „for key 'hosts_slug_uq'“.
 */
export function duplicateKeyName(error: unknown): string {
  const e = error as { sqlMessage?: string; message?: string; cause?: { sqlMessage?: string; message?: string } };
  const message = e?.cause?.sqlMessage ?? e?.sqlMessage ?? e?.cause?.message ?? e?.message ?? "";
  const match = /for key '([^']+)'/.exec(message);
  return match ? match[1].split(".").pop()! : "";
}
