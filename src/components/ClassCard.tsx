import Link from "next/link";
import { ClassItem, getCategory, getCity } from "@/data/classes";
import { formatDuration, formatPrice } from "@/lib/format";

export default function ClassCard({ item }: { item: ClassItem }) {
  const category = getCategory(item.category);
  const city = getCity(item.city);

  return (
    <Link
      href={`/classes/${item.slug}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg"
    >
      <div
        className={`flex h-48 items-center justify-center bg-gradient-to-br ${item.gradient} text-6xl transition group-hover:scale-105`}
      >
        <span aria-hidden>{item.emoji}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {category?.name} · {city?.name}
          </span>
          <span>
            ★ {item.rating.toFixed(1)} ({item.reviews})
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug">{item.title}</h3>
        <p className="mt-1 text-sm text-muted">
          {formatDuration(item.durationHours)} · до {item.maxPeople} луѓе
        </p>
        <p className="mt-3 font-semibold">
          {formatPrice(item.price)} <span className="font-normal text-muted">по човек</span>
        </p>
      </div>
    </Link>
  );
}
