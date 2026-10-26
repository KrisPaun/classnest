import type { Metadata } from "next";
import Link from "next/link";
import HostAvatar from "@/components/HostAvatar";
import { getCity } from "@/data/reference";
import { listAllHosts } from "@/lib/host-directory";
import { findListings, summarize } from "@/lib/public-listings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Домаќини",
  description: "Запознајте ги локалните мајстори што ги водат работилниците на Classnest.",
};

export default async function HostsPage() {
  const [hosts, listings] = await Promise.all([listAllHosts(), findListings({ limit: 100 })]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Запознајте ги домаќините</h1>
      <p className="mt-2 text-muted">Локални мајстори што ја споделуваат својата вештина.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hosts.map((h) => {
          const stats = summarize(listings.filter((l) => l.host.slug === h.slug));
          return (
            <Link
              key={h.slug}
              href={`/hosts/${h.slug}`}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:shadow-lg"
            >
              <HostAvatar host={h} />
              <div>
                <h2 className="font-semibold">{h.name}</h2>
                <p className="text-sm text-muted">
                  {getCity(h.city)?.name}
                  {stats.reviewCount > 0 ? ` · ★ ${stats.rating.toFixed(1)} (${stats.reviewCount})` : " · Нов домаќин"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
