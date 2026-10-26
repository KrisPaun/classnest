import { pingDb } from "@/server/db/client";
import { isDatabaseConfigured } from "@/server/platform/config";

export const dynamic = "force-dynamic";

/** Проверка за живост за надгледување. Никогаш не открива детали за грешките. */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({ status: "ok", database: "not-configured" });
  }
  try {
    await pingDb();
    return Response.json({ status: "ok", database: "up" });
  } catch {
    return Response.json({ status: "degraded", database: "down" }, { status: 503 });
  }
}
