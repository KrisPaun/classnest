import Link from "next/link";
import PhotoManager from "@/components/PhotoManager";
import { PortalTitle } from "@/components/portal/PortalUi";
import { requireAccount } from "@/lib/auth";
import { ownedTargets } from "@/lib/ownership";
import { listPhotos, photoUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const account = await requireAccount();

  const targets = await Promise.all(
    (await ownedTargets(account)).map(async (t) => ({
      ...t,
      photos: (await listPhotos(t.key)).map((name) => ({ name, url: photoUrl(t.key, name) })),
    })),
  );

  return (
    <div>
      <PortalTitle>Табла</PortalTitle>

      <h2 className="mt-8 text-2xl font-semibold">Здраво, {account.name.split(" ")[0]}</h2>
      <p className="mt-2 text-muted">
        Вашиот јавен профил:{" "}
        <Link
          href={`/hosts/${account.hostSlug}`}
          className="font-medium text-accent underline underline-offset-2 hover:text-accent-dark"
        >
          погледни →
        </Link>
      </p>

      <h2 className="mt-10 text-xl font-semibold">Фотографии</h2>
      <p className="mt-1 text-base text-muted">
        Првата фотографија е главна. Добрите фотографии носат повеќе резервации.
      </p>
      <div className="mt-6">
        <PhotoManager targets={targets} />
      </div>
    </div>
  );
}
