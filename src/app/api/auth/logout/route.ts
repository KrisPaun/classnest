import { destroySession, sameOrigin } from "@/lib/auth";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Недозволено барање." }, { status: 403 });
  await destroySession();
  return Response.json({ ok: true });
}
