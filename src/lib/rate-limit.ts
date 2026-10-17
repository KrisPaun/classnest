// Едноставно ограничување во меморија (PoC). Во продукција: Redis или reverse proxy.
const hits = new Map<string, { count: number; reset: number }>();

/** Враќа true ако барањето е дозволено. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (hits.size > 1000) {
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }
  const hit = hits.get(key);
  if (!hit || hit.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  hit.count++;
  return hit.count <= max;
}

export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
