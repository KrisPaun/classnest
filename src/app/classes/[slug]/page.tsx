import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BookingWidget from "@/components/BookingWidget";
import { priceUnit } from "@/components/ClassCard";
import HostAvatar from "@/components/HostAvatar";
import PhotoGallery from "@/components/PhotoGallery";
import { experiencePhotoKey, listPhotoUrls } from "@/lib/photos";
import { formatMinutes, upcomingDates } from "@/lib/format";
import { gradientFor } from "@/lib/gradient";
import { findListing } from "@/lib/public-listings";
import { summary } from "@/lib/seo";

// Датумите се пресметуваат при секое барање (демо), а понудата се чита од базата.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = await findListing((await params).slug);
  if (!item) return { title: "Понудата не е пронајдена", robots: { index: false } };

  const [cover] = await listPhotoUrls(experiencePhotoKey(item.id));
  const description = summary(item.description);
  return {
    title: item.title,
    description,
    alternates: { canonical: `/classes/${item.slug}` },
    openGraph: { title: item.title, description, type: "website", ...(cover ? { images: [cover] } : {}) },
  };
}

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await findListing(slug);
  if (!item) notFound();

  const photos = await listPhotoUrls(experiencePhotoKey(item.id));
  const facts = [
    item.rating !== undefined ? `★ ${item.rating.toFixed(1)} (${item.reviewCount} рецензии)` : null,
    item.durationMinutes ? formatMinutes(item.durationMinutes) : null,
    item.maxPeople ? `до ${item.maxPeople} луѓе` : null,
  ].filter(Boolean);
  const location = item.type === "online" ? `Онлајн${item.platform ? ` (${item.platform})` : ""}` : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/classes" className="text-sm text-muted hover:text-accent">
        ← Назад
      </Link>

      <PhotoGallery
        photos={photos}
        title={item.title}
        emoji={item.category.emoji ?? "✨"}
        gradient={gradientFor(item.slug)}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm text-muted">{[item.category.name, item.city?.name].filter(Boolean).join(" · ")}</p>
          <h1 className="mt-1 text-3xl font-bold">{item.title}</h1>
          {facts.length > 0 && <p className="mt-2 text-sm text-muted">{facts.join(" · ")}</p>}

          <h2 className="mt-8 text-xl font-semibold">За искуството</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{item.description}</p>

          <h2 className="mt-8 text-xl font-semibold">Локација</h2>
          <p className="mt-2 text-muted">
            📍 {location ?? item.address ?? item.city?.name ?? "Ќе ја добиете по резервацијата"}
            {item.maskLocation && " (точната адреса ќе ја добиете по резервацијата)"}
          </p>

          <h2 className="mt-8 text-xl font-semibold">Вашиот домаќин</h2>
          <Link
            href={`/hosts/${item.host.slug}`}
            className="mt-3 flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:shadow-md"
          >
            <HostAvatar host={item.host} />
            <div>
              <p className="font-semibold">{item.host.name}</p>
              {item.host.businessName && <p className="text-sm text-muted">{item.host.businessName}</p>}
              <p className="mt-2 text-sm text-accent">Погледни профил →</p>
            </div>
          </Link>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget
            slug={item.slug}
            price={item.price}
            unit={priceUnit(item.type)}
            maxPeople={item.maxPeople ?? 10}
            dates={upcomingDates()}
          />
        </aside>
      </div>
    </div>
  );
}
