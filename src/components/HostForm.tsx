"use client";

import { FormEvent, useState } from "react";
import { categories, cities } from "@/data/classes";

export default function HostForm() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // PoC: податоците не се зачувуваат. Во MVP се праќаат до API.
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-xl font-semibold">Ви благодариме!</h2>
        <p className="mt-2 text-muted">Ќе ве контактираме наскоро на вашата е-пошта.</p>
      </div>
    );
  }

  const field =
    "mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-white p-6">
      <div>
        <label className="text-sm font-medium">Име и презиме</label>
        <input required className={field} />
      </div>
      <div>
        <label className="text-sm font-medium">Е-пошта</label>
        <input type="email" required className={field} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Категорија</label>
          <select className={field}>
            {categories.map((c) => (
              <option key={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Град</label>
          <select className={field}>
            {cities.map((c) => (
              <option key={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Што би предавале?</label>
        <textarea rows={4} className={field} />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-dark"
      >
        Пријави се
      </button>
    </form>
  );
}
