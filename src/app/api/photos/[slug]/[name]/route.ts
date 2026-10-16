import { promises as fs } from "fs";
import { getClass } from "@/data/classes";
import { MIME_BY_EXT, isValidPhotoName, photoPath } from "@/lib/photos";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; name: string }> },
) {
  const { slug, name } = await params;
  if (!getClass(slug) || !isValidPhotoName(name)) return new Response("Not found", { status: 404 });

  try {
    const data = await fs.readFile(photoPath(slug, name));
    const ext = name.split(".").pop() ?? "";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        // Името е уникатно, па може долго да се кешира.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
