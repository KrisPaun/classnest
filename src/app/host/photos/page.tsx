import Link from "next/link";
import PhotoManager from "@/components/PhotoManager";
import { classes } from "@/data/classes";
import { getHostByName, hosts } from "@/data/hosts";
import { MAX_PHOTOS_PER_CLASS, listPhotos, photoUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function HostPhotosPage() {
  const classOptions = await Promise.all(
    classes.map(async (c) => ({
      slug: c.slug,
      title: c.title,
      hostSlug: getHostByName(c.host)?.slug ?? "",
      photos: (await listPhotos(c.slug)).map((name) => ({ name, url: photoUrl(c.slug, name) })),
    })),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/host" className="text-sm text-muted hover:text-accent">
        ← Назад
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Фотографии на вашите искуства</h1>
      <p className="mt-2 text-muted">
        Првата фотографија е главна и се прикажува на картичката. Добрите фотографии носат повеќе резервации.
      </p>
      <div className="mt-8">
        <PhotoManager
          hosts={hosts.map((h) => ({ slug: h.slug, name: h.name }))}
          classes={classOptions}
          maxPhotos={MAX_PHOTOS_PER_CLASS}
        />
      </div>
    </div>
  );
}
