"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Availability, Flexibility, weekdays } from "@/lib/availability";

const selectBox =
  "h-14 rounded-lg border border-field-border bg-field px-3 text-base outline-none transition " +
  "focus:border-accent focus:bg-accent/10 focus:shadow-[0_0_0_2px_var(--color-accent)]";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = ["00", "15", "30", "45"];

type Row = { id: number; day: string; fromH: string; fromM: string; toH: string; toM: string };

let nextId = 1;
const newRow = (): Row => ({ id: nextId++, day: "", fromH: "09", fromM: "00", toH: "20", toM: "00" });

function rowsFrom(initial: Availability | null): Row[] {
  if (!initial || initial.slots.length === 0) return [newRow()];
  return initial.slots.map((s) => ({
    id: nextId++,
    day: String(s.day),
    fromH: pad(Math.floor(s.from / 60)),
    fromM: pad(s.from % 60),
    toH: pad(Math.floor(s.to / 60)),
    toM: pad(s.to % 60),
  }));
}

export default function SetupAvailabilityForm({ initial }: { initial: Availability | null }) {
  const router = useRouter();
  const [flexibility, setFlexibility] = useState<Flexibility>(initial?.flexibility ?? "flexible");
  const [parallel, setParallel] = useState(initial?.parallelBookings ?? false);
  const [rows, setRows] = useState<Row[]>(() => rowsFrom(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (id: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const slots = rows.map((r) => ({
      day: Number(r.day),
      from: Number(r.fromH) * 60 + Number(r.fromM),
      to: Number(r.toH) * 60 + Number(r.toM),
    }));
    if (slots.some((s) => !s.day)) {
      setError("Изберете ден за секој термин.");
      return;
    }
    if (slots.some((s) => s.to <= s.from)) {
      setError("Крајот на терминот мора да е по почетокот.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flexibility, parallelBookings: parallel, slots }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Зачувувањето не успеа.");
      router.push("/host/setup?step=4");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Зачувувањето не успеа.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset>
        <legend className="font-semibold">Флексибилност</legend>
        <div className="mt-4 space-y-3 pl-1">
          <label className="flex items-start gap-3 text-base">
            <input
              type="radio"
              name="flexibility"
              checked={flexibility === "flexible"}
              onChange={() => setFlexibility("flexible")}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span>Флексибилно (ги претпочитам термините подолу, но можам да примам барања и надвор од нив)</span>
          </label>
          <label className="flex items-start gap-3 text-base">
            <input
              type="radio"
              name="flexibility"
              checked={flexibility === "strict"}
              onChange={() => setFlexibility("strict")}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span>Строго (не дозволувај барања надвор од термините подолу)</span>
          </label>
        </div>

        <label className="mt-6 flex items-start gap-3 pl-1 text-base">
          <input
            type="checkbox"
            checked={parallel}
            onChange={(e) => setParallel(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span>
            Можам да одржам повеќе од една приватна резервација во исто време (на пр. имам повеќе наставници или
            простории)
          </span>
        </label>
      </fieldset>

      <section>
        <h3 className="font-semibold">Достапни термини неделно</h3>
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3">
              <select
                value={r.day}
                onChange={(e) => update(r.id, { day: e.target.value })}
                required
                aria-label="Ден"
                className={`${selectBox} w-44`}
              >
                <option value="" disabled>
                  Ден
                </option>
                {weekdays.map((d, i) => (
                  <option key={d} value={i + 1}>
                    {d}
                  </option>
                ))}
              </select>

              <span>од</span>
              <select
                value={r.fromH}
                onChange={(e) => update(r.id, { fromH: e.target.value })}
                aria-label="Час на почеток"
                className={`${selectBox} w-20`}
              >
                {HOURS.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
              <select
                value={r.fromM}
                onChange={(e) => update(r.id, { fromM: e.target.value })}
                aria-label="Минути на почеток"
                className={`${selectBox} w-20`}
              >
                {MINUTES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>

              <span>до</span>
              <select
                value={r.toH}
                onChange={(e) => update(r.id, { toH: e.target.value })}
                aria-label="Час на крај"
                className={`${selectBox} w-20`}
              >
                {HOURS.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
              <select
                value={r.toM}
                onChange={(e) => update(r.id, { toM: e.target.value })}
                aria-label="Минути на крај"
                className={`${selectBox} w-20`}
              >
                {MINUTES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>

              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                  aria-label="Избриши термин"
                  className="rounded-lg p-2 text-accent hover:bg-accent/10"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, newRow()])}
          disabled={rows.length >= 28}
          className="mt-5 inline-flex items-center gap-3 rounded-lg border border-accent px-5 py-3 text-base font-semibold text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
            <circle cx="12" cy="12" r="11" />
            <path d="M11 6h2v5h5v2h-5v5h-2v-5H6v-2h5z" fill="white" />
          </svg>
          Додај уште еден термин
        </button>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-8 py-4 text-base font-semibold text-white hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:min-w-64"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 fill-current">
          <path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 5v4h9V5z" />
        </svg>
        {busy ? "Се зачувува…" : "Зачувај и продолжи"}
      </button>
    </form>
  );
}
