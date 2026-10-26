import Link from "next/link";
import ListingCard from "@/components/portal/ListingCard";
import DismissibleInfo from "@/components/portal/DismissibleInfo";
import { PortalTitle, TabLinks } from "@/components/portal/PortalUi";
import { getListingType } from "@/data/listing-types";
import { requireAccount } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { gradientFor } from "@/lib/gradient";
import { experiencePhotoKey, listPhotoUrls } from "@/lib/photos";
import { listHostListings } from "@/server/modules/listings/service";

export const dynamic = "force-dynamic";

const filledBtn =
  "inline-flex items-center justify-center gap-3 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white hover:bg-accent-dark";
const outlineBtn =
  "inline-flex items-center justify-center gap-3 rounded-xl border border-accent px-6 py-4 text-base font-semibold text-accent hover:bg-accent/10";
const disabledBtn =
  "inline-flex cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-line px-6 py-4 text-base font-semibold text-muted";

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const account = await requireAccount();
  const tab = (await searchParams).tab === "venues" ? "venues" : "experiences";

  const mine = await listHostListings(account.hostSlug);

  const dynamicCards = await Promise.all(
    mine.map(async (e) => {
      const [cover] = await listPhotoUrls(experiencePhotoKey(e.id));
      const type = getListingType(e.type);
      return { e, cover: cover ?? null, type };
    }),
  );

  return (
    <div>
      <PortalTitle>Понуди</PortalTitle>

      <TabLinks
        tabs={[
          { href: "/host/listings", label: "Искуства и производи", icon: "🎨", active: tab === "experiences" },
          { href: "/host/listings?tab=venues", label: "Простори", icon: "🏪", active: tab === "venues" },
        ]}
      />

      {tab === "experiences" ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/host/setup?step=2" className={filledBtn}>
              <span aria-hidden>➕</span> Создај понуда
            </Link>
            <Link href="/host/dashboard" className={outlineBtn}>
              <span aria-hidden>🖼️</span> Погледни фотографии
            </Link>
            <span className={disabledBtn} title="Наскоро">
              <span aria-hidden>🔁</span> Создај претплата
            </span>
            <span className={disabledBtn} title="Наскоро">
              <span aria-hidden>🏷️</span> Управувај со ознаки
            </span>
          </div>

          {dynamicCards.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-muted">
              Сè уште немате понуди. Кликнете „Создај понуда“.
            </p>
          )}

          {dynamicCards.map(({ e, cover, type }) => (
            <ListingCard
              key={e.id}
              status={e.status}
              note={e.moderationNote}
              title={e.title}
              typeLabel={type?.label ?? "Понуда"}
              priceLabel={formatPrice(e.price)}
              cover={cover}
              emoji={type?.emoji ?? "✨"}
              gradient={gradientFor(e.slug)}
              visibility={e.visibility ?? "active"}
              viewHref={e.status === "PUBLISHED" ? `/classes/${e.slug}` : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <DismissibleInfo>
            <p>
              Ако имате простор погоден за работилници и искуства, објавете го: барањата за простор ќе ви ги праќаме
              директно вам (не земаме никаков надомест за објавени простори).
            </p>
            <p>Ако ви треба простор за вашите искуства, прелистајте ја листата на простори.</p>
          </DismissibleInfo>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className={`${disabledBtn} min-w-64`} title="Наскоро">
              <span aria-hidden>➕</span> Создај простор
            </span>
            <span className={`${disabledBtn} min-w-64`} title="Наскоро">
              <span aria-hidden>↗️</span> Најди простор
            </span>
          </div>
          <p className="text-sm text-muted">Просторите се во подготовка (наскоро).</p>
        </div>
      )}
    </div>
  );
}
