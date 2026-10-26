import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClassCard from "@/components/ClassCard";
import HostAvatar from "@/components/HostAvatar";
import PhotoGallery from "@/components/PhotoGallery";
import { getCategory, getCity } from "@/data/reference";
import { months } from "@/lib/format";
import { gradientFor } from "@/lib/gradient";
import { getHostAny } from "@/lib/host-directory";
import { findHostListings, summarize } from "@/lib/public-listings";
import { summary } from "@/lib/seo";
import { hostPhotoKey, listPhotoUrls } from "@/lib/photos";

// Нови домаќини се регистрираат во живо, па профилите не се генерираат статично.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const host = await getHostAny((await params).slug);
  if (!host) return { title: "Домаќинот не е пронајден", robots: { index: false } };

  const description = summary(host.story);
  return {
    title: host.name,
    description,
    alternates: { canonical: `/hosts/${host.slug}` },
    openGraph: { title: host.name, description, type: "profile" },
  };
}

export default async function HostProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const host = await getHostAny(slug);
  if (!host) notFound();

  const city = getCity(host.city);
  const category = getCategory(host.category ?? "");
  const list = await findHostListings(host.slug);
  const stats = summarize(list);
  const photos = await listPhotoUrls(hostPhotoKey(host.slug));
  const links = [
    host.website && { label: "Веб-страница", url: host.website },
    host.instagram && { label: "Instagram", url: host.instagram },
    host.facebook && { label: "Facebook", url: host.facebook },
  ].filter((l): l is { label: string; url: string } => Boolean(l));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/hosts" className="text-sm text-muted hover:text-accent">
        ← Сите домаќини
      </Link>

      <section className="mt-6 flex flex-col gap-6 rounded-3xl border border-line bg-white p-6 sm:flex-row sm:items-center">
        <HostAvatar host={host} size="lg" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{host.name}</h1>
          {host.businessName && <p className="mt-1 font-medium">{host.businessName}</p>}
          <p className="mt-1 text-muted">
            📍 {city?.name}
            {category ? ` · ${category.name}` : ""} · Домаќин од {host.since}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.reviewCount === 0 && (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">Нов домаќин</span>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-center sm:text-left">
          <div>
            <dt className="text-xs text-muted">Оцена</dt>
            <dd className="text-xl font-semibold">{stats.reviewCount > 0 ? `★ ${stats.rating.toFixed(1)}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Рецензии</dt>
            <dd className="text-xl font-semibold">{stats.reviewCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Искуства</dt>
            <dd className="text-xl font-semibold">{stats.listingCount}</dd>
          </div>
        </dl>
      </section>

      {photos.length > 0 && (
        <PhotoGallery photos={photos} title={host.name} emoji="" gradient={gradientFor(host.slug)} />
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-semibold">За {host.name.split(" ")[0]}</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{host.story}</p>

          <h2 className="mt-10 text-xl font-semibold">Искуства од {host.name.split(" ")[0]}</h2>
          {list.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {list.map((c) => (
                <ClassCard key={c.slug} item={c} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-muted">Сè уште нема објавени искуства.</p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-5">
          <h3 className="font-semibold">Информации</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Јазици</dt>
              <dd>{host.languages.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted">Град</dt>
              <dd>{city?.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Член од</dt>
              <dd>{host.since}</dd>
            </div>
            {host.startedMonth && host.startedYear && (
              <div>
                <dt className="text-muted">Бизнис од</dt>
                <dd>
                  {months[host.startedMonth - 1]} {host.startedYear}
                </dd>
              </div>
            )}
            {links.length > 0 && (
              <div>
                <dt className="text-muted">Линкови</dt>
                <dd className="space-y-1">
                  {links.map((l) => (
                    <div key={l.label} className="break-all">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                        className="font-medium text-accent underline underline-offset-2 hover:text-accent-dark"
                      >
                        {l.label}
                      </a>
                    </div>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
