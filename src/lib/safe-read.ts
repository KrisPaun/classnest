import { isDatabaseConfigured } from "@/server/platform/config";

/**
 * Јавните страници не смеат да паднат кога базата не е подесена или не одговара:
 * тогаш се прикажува празна состојба (fallback), а грешката се запишува во логот.
 */
export async function readOrFallback<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;
  try {
    return await read();
  } catch (error) {
    console.error("database read failed:", error instanceof Error ? error.message : "unknown error");
    return fallback;
  }
}
