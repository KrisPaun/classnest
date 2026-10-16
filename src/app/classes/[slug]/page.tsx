import { notFound } from "next/navigation";
import Link from "next/link";
import BookingWidget from "@/components/BookingWidget";
import { getCategory, getCity, getClass } from "@/data/classes";
import { formatDuration, upcomingDates } from "@/lib/format";

// Датумите се пресметуваат при секое барање (демо), затоа не се генерира статично.
export const dynamic = "force-dynamic";

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getClass(slug);
  if (!item) notFound();

  const category = getCategory(item.category);
  const city = getCity(item.city);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/classes" className="text-sm text-muted hover:text-accent">
        ← Назад
      </Link>

      <div
        className={`mt-4 flex h-72 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradient} text-8xl`}
      >
        <span aria-hidden>{item.emoji}</span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm text-muted">
            {category?.name} · {city?.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{item.title}</h1>
          <p className="mt-2 text-sm text-muted">
            ★ {item.rating.toFixed(1)} ({item.reviews} рецензии) · {formatDuration(item.durationHours)} · до{" "}
            {item.maxPeople} луѓе
          </p>

          <h2 className="mt-8 text-xl font-semibold">За искуството</h2>
          <p className="mt-2 leading-relaxed text-muted">{item.description}</p>

          <h2 className="mt-8 text-xl font-semibold">Што е вклучено</h2>
          <ul className="mt-2 space-y-1 text-muted">
            {item.includes.map((i) => (
              <li key={i}>✓ {i}</li>
            ))}
          </ul>

          <h2 className="mt-8 text-xl font-semibold">Локација</h2>
          <p className="mt-2 text-muted">📍 {item.location}</p>

          <h2 className="mt-8 text-xl font-semibold">Вашиот домаќин</h2>
          <div className="mt-3 flex items-start gap-4 rounded-2xl border border-line bg-white p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-lg font-semibold text-accent">
              {item.host[0]}
            </div>
            <div>
              <p className="font-semibold">{item.host}</p>
              <p className="text-sm text-muted">{item.hostBio}</p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingWidget
            slug={item.slug}
            price={item.price}
            maxPeople={item.maxPeople}
            dates={upcomingDates()}
          />
        </aside>
      </div>
    </div>
  );
}
