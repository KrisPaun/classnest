import Link from "next/link";
import ModerationActions from "@/components/admin/ModerationActions";
import { PortalTitle, TabLinks } from "@/components/portal/PortalUi";
import { getListingType } from "@/data/listing-types";
import { formatMinutes, formatPrice } from "@/lib/format";
import { experiencePhotoKey, listPhotoUrls } from "@/lib/photos";
import { canPublish, canReject, canTakeDown } from "@/server/modules/listings/status";
import { countByStatus, listForModeration } from "@/server/modules/listings/service";
import type { ListingStatus } from "@/server/modules/listings/types";

export const dynamic = "force-dynamic";

const TABS: { key: string; label: string; icon: string; statuses: ListingStatus[] }[] = [
  { key: "review", label: "На чекање", icon: "⏳", statuses: ["IN_REVIEW"] },
  { key: "published", label: "Објавени", icon: "✅", statuses: ["PUBLISHED"] },
  { key: "rejected", label: "Одбиени", icon: "⛔", statuses: ["REJECTED"] },
  { key: "takendown", label: "Симнати", icon: "🚫", statuses: ["TAKEN_DOWN"] },
  { key: "hidden", label: "Скриени", icon: "🙈", statuses: ["HIDDEN_TEMPORARY", "HIDDEN_PERMANENT"] },
];

const date = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ") + " UTC";

export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requested = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === requested) ?? TABS[0];

  const [listed, counts] = await Promise.all([listForModeration(tab.statuses), countByStatus()]);
  const items = await Promise.all(
    listed.map(async (item) => ({ item, photos: await listPhotoUrls(experiencePhotoKey(item.id)) })),
  );
  const count = (statuses: ListingStatus[]) => statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  return (
    <div>
      <PortalTitle>Понуди</PortalTitle>
      <TabLinks
        tabs={TABS.map((t) => ({
          href: `/admin/listings?tab=${t.key}`,
          label: `${t.label} (${count(t.statuses)})`,
          icon: t.icon,
          active: t.key === tab.key,
        }))}
      />

      {items.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-line bg-white p-6 text-muted">Нема понуди во оваа листа.</p>
      )}

      <div className="mt-8 space-y-6">
        {items.map(({ item, photos }) => {
          const facts = [
            getListingType(item.type)?.label ?? item.type,
            item.category,
            item.durationMinutes ? formatMinutes(item.durationMinutes) : null,
            item.maxPeople ? `до ${item.maxPeople} луѓе` : null,
            item.fulfilment ? `преземање: ${item.fulfilment}` : null,
          ].filter(Boolean);

          return (
            <article key={item.id} className="rounded-2xl border border-line bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted">{facts.join(" · ")}</p>
                </div>
                <p className="text-lg font-semibold">{formatPrice(item.price)}</p>
              </div>

              {photos.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {photos.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={item.title} className="h-24 w-24 rounded-lg object-cover hover:opacity-80" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">Нема фотографии.</p>
              )}

              <p className="mt-4 whitespace-pre-line leading-relaxed">{item.description}</p>

              {item.moderationNote && (
                <p className="mt-4 rounded-lg bg-line/60 px-3 py-2 text-sm">
                  <span className="font-semibold">Причина:</span> {item.moderationNote}
                </p>
              )}

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Домаќин</dt>
                  <dd>
                    <Link href={`/hosts/${item.host.slug}`} className="text-accent underline underline-offset-2" target="_blank">
                      {item.host.name}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Локација</dt>
                  <dd>
                    {item.platform ?? ([item.address, item.city].filter(Boolean).join(", ") || "—")}
                    {item.maskLocation && " (скриена за јавноста)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Испратена</dt>
                  <dd>{date(item.createdAt)}</dd>
                </div>
                {item.publishedAt && (
                  <div>
                    <dt className="text-muted">Објавена</dt>
                    <dd>{date(item.publishedAt)}</dd>
                  </div>
                )}
              </dl>

              {item.status === "PUBLISHED" && (
                <Link href={`/classes/${item.slug}`} target="_blank" className="mt-4 inline-block text-sm text-accent underline underline-offset-2">
                  Отвори ја јавната страница →
                </Link>
              )}

              <ModerationActions
                slug={item.slug}
                canPublish={canPublish(item.status)}
                canReject={canReject(item.status)}
                canTakeDown={canTakeDown(item.status)}
                publishLabel={item.status === "TAKEN_DOWN" ? "Врати на објавено" : "Одобри и објави"}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
