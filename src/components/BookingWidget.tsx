"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";

type Props = {
  slug: string;
  price: number;
  unit?: string;
  maxPeople: number;
  dates: string[];
};

export default function BookingWidget({ slug, price, unit = "по човек", maxPeople, dates }: Props) {
  const [date, setDate] = useState(dates[0]);
  const [people, setPeople] = useState(2);

  const params = new URLSearchParams({ date, people: String(people) });

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="text-2xl font-semibold">
        {formatPrice(price)} <span className="text-base font-normal text-muted">{unit}</span>
      </p>

      <p id="booking-date-label" className="mt-5 block text-sm font-medium">Датум</p>
      <div role="group" aria-labelledby="booking-date-label" className="mt-2 grid grid-cols-2 gap-2">
        {dates.slice(0, 6).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDate(d)}
            aria-pressed={d === date}
            className={`rounded-xl border px-3 py-2 text-sm ${
              d === date
                ? "border-accent bg-accent text-white"
                : "border-line hover:border-ink"
            }`}
          >
            {formatDate(d)}
          </button>
        ))}
      </div>

      <p id="booking-people-label" className="mt-5 block text-sm font-medium">Број на луѓе</p>
      <div role="group" aria-labelledby="booking-people-label" className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPeople((p) => Math.max(1, p - 1))}
          className="h-10 w-10 rounded-full border border-line text-lg hover:border-ink"
          aria-label="Помалку"
        >
          −
        </button>
        <span className="w-6 text-center text-lg" aria-live="polite">{people}</span>
        <button
          type="button"
          onClick={() => setPeople((p) => Math.min(maxPeople, p + 1))}
          className="h-10 w-10 rounded-full border border-line text-lg hover:border-ink"
          aria-label="Повеќе"
        >
          +
        </button>
      </div>

      <div className="mt-5 flex justify-between border-t border-line pt-4 font-semibold">
        <span>Вкупно</span>
        <span>{formatPrice(price * people)}</span>
      </div>

      <Link
        href={`/classes/${slug}/checkout?${params.toString()}`}
        className="mt-4 block rounded-xl bg-accent py-3 text-center font-semibold text-white hover:bg-accent-dark"
      >
        Резервирај
      </Link>
      <p className="mt-2 text-center text-xs text-muted">Нема наплата во демо верзијата.</p>
    </div>
  );
}
