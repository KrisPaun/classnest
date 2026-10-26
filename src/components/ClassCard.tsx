import Link from "next/link";
import { formatMinutes, formatPrice } from "@/lib/format";
import { gradientFor } from "@/lib/gradient";
import { experiencePhotoKey, listPhotoUrls } from "@/lib/photos";
import type { PublicListing } from "@/server/modules/listings/types";

export const priceUnit = (type: PublicListing["type"]) => (type === "product" ? "по производ" : "по човек");

export default async function ClassCard({ item }: { item: PublicListing }) {
  const [cover] = await listPhotoUrls(experiencePhotoKey(item.id));
  const details = [
    item.durationMinutes ? formatMinutes(item.durationMinutes) : null,
    item.maxPeople ? `до ${item.maxPeople} луѓе` : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/classes/${item.slug}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg"
    >
      {cover ? (
        <div className="h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={item.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className={`flex h-48 items-center justify-center bg-gradient-to-br ${gradientFor(item.slug)} text-6xl transition group-hover:scale-105`}
        >
          <span aria-hidden>{item.category.emoji ?? "✨"}</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{[item.category.name, item.city?.name].filter(Boolean).join(" · ")}</span>
          {item.rating !== undefined && (
            <span>
              ★ {item.rating.toFixed(1)} ({item.reviewCount})
            </span>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug">{item.title}</h3>
        {details.length > 0 && <p className="mt-1 text-sm text-muted">{details.join(" · ")}</p>}
        <p className="mt-3 font-semibold">
          {formatPrice(item.price)} <span className="font-normal text-muted">{priceUnit(item.type)}</span>
        </p>
      </div>
    </Link>
  );
}
