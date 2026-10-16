import Link from "next/link";
import { notFound } from "next/navigation";
import ClassCard from "@/components/ClassCard";
import HostAvatar from "@/components/HostAvatar";
import { getCity } from "@/data/classes";
import { getHost, getHostClasses, hosts, hostStats } from "@/data/hosts";

const greenStyle = "bg-green-100 text-green-800";

// Зелено е стандардно (перформанси). Само статус и традиција имаат своја боја.
const badgeStyles: Record<string, string> = {
  "Нов домаќин": "bg-sky-100 text-sky-800",
  "Традиционален занает": "bg-amber-100 text-amber-800",
};

export function generateStaticParams() {
  return hosts.map((h) => ({ slug: h.slug }));
}

export default async function HostProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const host = getHost(slug);
  if (!host) notFound();

  const city = getCity(host.city);
  const list = getHostClasses(host);
  const stats = hostStats(host);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/hosts" className="text-sm text-muted hover:text-accent">
        ← Сите домаќини
      </Link>

      <section className="mt-6 flex flex-col gap-6 rounded-3xl border border-line bg-white p-6 sm:flex-row sm:items-center">
        <HostAvatar host={host} size="lg" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{host.name}</h1>
          <p className="mt-1 text-muted">
            📍 {city?.name} · Домаќин од {host.since}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {host.badges.map((b) => (
              <span
                key={b}
                className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[b] ?? greenStyle}`}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-center sm:text-left">
          <div>
            <dt className="text-xs text-muted">Оцена</dt>
            <dd className="text-xl font-semibold">★ {stats.rating.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Рецензии</dt>
            <dd className="text-xl font-semibold">{stats.reviews}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Искуства</dt>
            <dd className="text-xl font-semibold">{stats.classCount}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-semibold">За {host.name.split(" ")[0]}</h2>
          <p className="mt-3 leading-relaxed text-muted">{host.story}</p>

          <h2 className="mt-10 text-xl font-semibold">Искуства од {host.name.split(" ")[0]}</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {list.map((c) => (
              <ClassCard key={c.slug} item={c} />
            ))}
          </div>

          <h2 className="mt-10 text-xl font-semibold">Што велат гостите</h2>
          <div className="mt-4 space-y-4">
            {host.reviews.map((r) => (
              <article key={r.author} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{r.author}</span>
                  <span className="text-accent">{"★".repeat(r.rating)}</span>
                </div>
                <p className="mt-2 text-muted">{r.text}</p>
              </article>
            ))}
          </div>
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
          </dl>
        </aside>
      </div>
    </div>
  );
}
