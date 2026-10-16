import Link from "next/link";
import HostAvatar from "@/components/HostAvatar";
import { getCity } from "@/data/classes";
import { hosts, hostStats } from "@/data/hosts";

export default function HostsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Запознајте ги домаќините</h1>
      <p className="mt-2 text-muted">Локални мајстори што ја споделуваат својата вештина.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hosts.map((h) => {
          const stats = hostStats(h);
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
                  {getCity(h.city)?.name} · ★ {stats.rating.toFixed(1)} ({stats.reviews})
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
