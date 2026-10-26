"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categories, cities } from "@/data/reference";
import { Outlined, control } from "@/components/Outlined";
import {
  CancellationMode,
  CancellationPolicy,
  FULFILMENT,
  Fulfilment,
  ListingType,
  fulfilmentLabels,
  getListingType,
  listingTypes,
} from "@/data/listing-types";

// Мало поле за број (часови/минути), без стрелки.
const durationBox =
  "h-14 w-20 rounded-lg border border-field-border bg-field text-center text-base outline-none transition " +
  "focus:border-accent focus:bg-accent/10 focus:shadow-[0_0_0_2px_var(--color-accent)]";

const MAX_NEW_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ExperienceInitial = {
  type: ListingType;
  title: string;
  category: string;
  description: string;
  price: number;
  durationMinutes?: number;
  durationHours?: number; // стар формат, само за читање
  maxPeople?: number;
  cancellation?: CancellationPolicy;
  city?: string;
  address?: string;
  maskLocation?: boolean;
  platform?: string;
  fulfilment?: Fulfilment;
};

export default function SetupExperienceForm({
  initial,
  existingPhotos,
}: {
  initial: ExperienceInitial | null;
  existingPhotos: string[];
}) {
  const router = useRouter();
  const [type, setType] = useState<ListingType | "">(initial?.type ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Политика за откажување: подразбирано ништо не е дозволено, а полињата за денови почнуваат од 7.
  const saved = initial?.cancellation;
  const [policy, setPolicy] = useState<CancellationMode>(saved?.mode ?? "none");
  const [daysFlexible, setDaysFlexible] = useState(String(saved?.mode === "flexible" ? saved.days : 7));
  const [daysReschedule, setDaysReschedule] = useState(String(saved?.mode === "reschedule" ? saved.days : 7));

  // Траење: часови и минути во две мали полиња. Старите записи имале децимални часови.
  const startMinutes =
    initial?.durationMinutes ?? (initial?.durationHours ? Math.round(initial.durationHours * 60) : undefined);
  const [hours, setHours] = useState(startMinutes !== undefined ? String(Math.floor(startMinutes / 60)) : "");
  const [minutes, setMinutes] = useState(startMinutes !== undefined ? String(startMinutes % 60) : "");

  const kind = type ? getListingType(type)?.kind : undefined;
  const inPerson = kind === "in-person";
  const online = kind === "online";
  const product = kind === "product";

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";
    const bad = picked.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      setError(`„${bad.name}“ мора да биде JPG, PNG или WebP до 5 MB.`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_NEW_PHOTOS));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!type) {
      setError("Изберете тип на понуда.");
      return;
    }
    const form = new FormData(e.currentTarget);
    form.set("type", type);
    if (getListingType(type)?.kind !== "product") {
      const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
      if (total < 15 || total > 720 || (Number(minutes) || 0) > 59) {
        setError("Траењето мора да е од 15 минути до 12 часа (минутите од 0 до 59).");
        return;
      }
      form.set("durationHours", hours || "0");
      form.set("durationMinutes", minutes || "0");
      form.set("policyMode", policy);
      if (policy !== "none") form.set("policyDays", policy === "flexible" ? daysFlexible : daysReschedule);
    }
    files.forEach((f) => form.append("photos", f));

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/experience", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Зачувувањето не успеа.");
      setFiles([]);
      router.push("/host/setup?step=3");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Зачувувањето не успеа.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset>
        <legend className="text-base font-medium">Тип на понуда</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {listingTypes.map((t) => {
            const selected = t.id === type;
            return (
              <label
                key={t.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  selected ? "border-accent bg-accent/5" : "border-line bg-white hover:border-ink"
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value={t.id}
                  checked={selected}
                  onChange={() => setType(t.id)}
                  className="mt-1"
                  required
                />
                <span>
                  <span className="block font-medium">
                    <span aria-hidden>{t.emoji}</span> {t.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{t.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {type && (
        <>
          <div className="space-y-5">
            <Outlined label={product ? "Име на производот" : "Наслов"} required error="Внесете наслов (најмалку 3 знаци).">
              <input
                name="title"
                required
                minLength={3}
                maxLength={100}
                defaultValue={initial?.title}
                placeholder={product ? "на пр. Рачно изработена чинија" : "на пр. Домашна паста и тирамису"}
                className={control}
              />
            </Outlined>
            <Outlined label="Категорија" required raised>
              <select name="category" required defaultValue={initial?.category ?? ""} className={control}>
                <option value="" disabled>
                  Изберете
                </option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Outlined>
            <Outlined label="Опис" required error="Опишете барем 50 знаци.">
              <textarea
                name="description"
                required
                minLength={50}
                maxLength={2000}
                rows={6}
                defaultValue={initial?.description}
                placeholder={
                  product
                    ? "Од што е направено, големина, што е вклучено…"
                    : "Што ќе прават гостите, што е вклучено, што да понесат…"
                }
                className={control}
              />
            </Outlined>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Outlined label="Цена" required raised className="w-48" error="Внесете цена.">
                {/* МКД стои внатре во полето, лево од бројот */}
                <span aria-hidden className="pointer-events-none absolute left-4 top-3.5 text-base text-muted">
                  МКД
                </span>
                <input
                  name="price"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  maxLength={7}
                  // Само цифри: ги отстранува буквите и знаците додека пишувате.
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                  }}
                  defaultValue={initial?.price}
                  placeholder=" "
                  aria-label={product ? "Цена во денари (МКД)" : "Цена по човек во денари (МКД)"}
                  className={`${control} pl-16!`}
                />
              </Outlined>
              <span className="text-base">{product ? "по производ" : "по човек"}</span>
            </div>

            {!product && (
              <div className="space-y-5">
                <div>
                  <p className="text-base font-semibold">Траење</p>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={hours}
                      onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))}
                      aria-label="Часови"
                      className={durationBox}
                    />
                    <span>часа</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
                      aria-label="Минути"
                      className={durationBox}
                    />
                    <span>минути</span>
                  </div>
                </div>
                <Outlined label="Макс. број луѓе" required error="Од 1 до 100." className="sm:w-1/2">
                  <input
                    name="maxPeople"
                    type="number"
                    required
                    min={1}
                    max={100}
                    step={1}
                    defaultValue={initial?.maxPeople}
                    placeholder="на пр. 8"
                    className={control}
                  />
                </Outlined>
              </div>
            )}

            {inPerson && (
              <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Outlined label="Град" required raised>
                  <select name="city" required defaultValue={initial?.city ?? ""} className={control}>
                    <option value="" disabled>
                      Изберете
                    </option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Outlined>
                <Outlined label="Адреса или локација" required error="Внесете адреса.">
                  <input
                    name="address"
                    required
                    minLength={3}
                    maxLength={150}
                    defaultValue={initial?.address}
                    placeholder=" "
                    className={control}
                  />
                </Outlined>
              </div>

              <label className="flex items-start gap-3 text-base">
                <input
                  type="checkbox"
                  name="maskLocation"
                  defaultChecked={initial?.maskLocation}
                  className="mt-0.5 h-5 w-5 shrink-0"
                />
                <span>
                  Скриј ја точната локација
                  <span className="block text-sm text-muted">
                    Јавно се прикажува само градот. Точната адреса ја гледаат гостите по резервација.
                  </span>
                </span>
              </label>

              <div className="flex items-center gap-3 rounded-xl bg-accent/10 px-4 py-3 text-base">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0">
                  <circle cx="12" cy="12" r="11" fill="currentColor" />
                  <rect x="11" y="10" width="2" height="7" rx="1" fill="white" />
                  <circle cx="12" cy="7" r="1.25" fill="white" />
                </svg>
                <span>
                  Ви треба простор? <strong>Слободни простории во вашата близина</strong> — наскоро.
                </span>
              </div>
              </>
            )}

            {online && (
              <Outlined label="Платформа (по желба)">
                <input
                  name="platform"
                  maxLength={60}
                  defaultValue={initial?.platform}
                  placeholder="на пр. Zoom"
                  className={control}
                />
              </Outlined>
            )}

            {product && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Outlined label="Како го добива купувачот" required raised>
                  <select name="fulfilment" required defaultValue={initial?.fulfilment ?? ""} className={control}>
                    <option value="" disabled>
                      Изберете
                    </option>
                    {FULFILMENT.map((f) => (
                      <option key={f} value={f}>
                        {fulfilmentLabels[f]}
                      </option>
                    ))}
                  </select>
                </Outlined>
                <Outlined label="Град (по желба)" raised>
                  <select name="city" defaultValue={initial?.city ?? ""} className={control}>
                    <option value="">—</option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Outlined>
              </div>
            )}
          </div>

          {!product && (
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h3 className="font-semibold">Општа политика за откажување и промена на термин</h3>
              <div className="mt-5 space-y-4">
                {(
                  [
                    {
                      mode: "flexible" as const,
                      before: "Дозволи им на гостите да откажат или да променат термин до",
                      days: daysFlexible,
                      setDays: setDaysFlexible,
                    },
                    {
                      mode: "reschedule" as const,
                      before: "Без откажување, но дозволи промена на термин до",
                      days: daysReschedule,
                      setDays: setDaysReschedule,
                    },
                  ]
                ).map((o) => (
                  <label key={o.mode} className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base">
                    <input
                      type="radio"
                      name="cancellationUi"
                      checked={policy === o.mode}
                      onChange={() => setPolicy(o.mode)}
                      className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                    />
                    <span>{o.before}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={o.days}
                      disabled={policy !== o.mode}
                      onChange={(e) => o.setDays(e.target.value.replace(/\D/g, ""))}
                      aria-label="Број на денови"
                      className="w-16 rounded-lg border border-field-border bg-field px-3 py-2 text-center text-base outline-none focus:border-accent disabled:opacity-60"
                    />
                    <span>дена пред секоја сесија</span>
                  </label>
                ))}
                <label className="flex items-center gap-3 text-base">
                  <input
                    type="radio"
                    name="cancellationUi"
                    checked={policy === "none"}
                    onChange={() => setPolicy("none")}
                    className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span>Не се дозволени откажување и промена на термин</span>
                </label>
              </div>
            </section>
          )}

          <div className="space-y-3">
            <p className="text-base font-medium">Фотографии</p>
            <p className="text-sm text-muted">
              Првата фотографија е главна. JPG, PNG или WebP, до 5 MB. Може да додавате до {MAX_NEW_PHOTOS} одеднаш.
            </p>
            {(existingPhotos.length > 0 || previews.length > 0) && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {existingPhotos.map((src, i) => (
                  <div key={src} className="overflow-hidden rounded-xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Постоечка фотографија ${i + 1}`} className="h-24 w-full object-cover" />
                  </div>
                ))}
                {previews.map((src, i) => (
                  <div key={src} className="relative overflow-hidden rounded-xl border border-accent">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Нова фотографија ${i + 1}`} className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white/90 text-base leading-none hover:bg-white"
                      aria-label="Отстрани"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length < MAX_NEW_PHOTOS && (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-4 text-base hover:border-accent">
                <span>📷</span>
                <span>Додај фотографии</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onPick}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !type}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-8 py-4 text-base font-bold text-white hover:bg-accent-dark disabled:opacity-60 sm:w-auto"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 fill-current">
          <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
        </svg>
        {busy ? "Се зачувува…" : "Зачувај и продолжи"}
      </button>
    </form>
  );
}
