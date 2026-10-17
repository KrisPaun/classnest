"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cities } from "@/data/classes";
import { Outlined, control } from "@/components/Outlined";

const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBusiness, setHasBusiness] = useState(false);

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
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    files.forEach((f) => form.append("photos", f));

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Регистрацијата не успеа.");
      router.push("/host/setup");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Регистрацијата не успеа.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-7 rounded-2xl border border-line bg-white p-6 sm:p-8">
      <Section title="За вас">
        <div className="grid gap-5 sm:grid-cols-2">
          <Outlined label="Име и презиме" required>
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder=" "
              className={control}
            />
          </Outlined>
          <Outlined label="Град" required raised>
            <select name="city" required defaultValue="" className={control}>
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
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Outlined label="Е-пошта" required error="Внесете валидна е-пошта.">
            <input name="email" type="email" required autoComplete="email" placeholder=" " className={control} />
          </Outlined>
          <Outlined label="Лозинка" required error="Лозинката мора да има најмалку 8 знаци.">
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Најмалку 8 знаци"
              className={control}
            />
          </Outlined>
        </div>
        <Outlined label="Што би предавале?" required error="Опишете барем 20 знаци.">
          <textarea
            name="about"
            required
            minLength={20}
            maxLength={1000}
            rows={4}
            placeholder="Вашето искуство и што ќе научат гостите"
            className={control}
          />
        </Outlined>
      </Section>

      <Section title="Контакт и бизнис">
        <label className="flex items-center gap-2 text-base">
          <input type="checkbox" checked={hasBusiness} onChange={(e) => setHasBusiness(e.target.checked)} />
          Работам под име на бизнис
        </label>
        {hasBusiness && (
          <Outlined label="Име на бизнисот" required>
            <input
              name="businessName"
              required
              maxLength={100}
              placeholder="на пр. Керамичарска работилница Дебар"
              className={control}
            />
          </Outlined>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Outlined label="Веб-страница или социјални мрежи">
            <input name="website" maxLength={200} placeholder="instagram.com/vashata.rabotilnica" className={control} />
          </Outlined>
          <Outlined label="Мобилен телефон">
            <input
              name="phone"
              type="tel"
              maxLength={20}
              autoComplete="tel"
              placeholder="+389 70 123 456"
              className={control}
            />
          </Outlined>
        </div>
        <p className="text-sm text-muted">Двете полиња се по желба. Телефонот не се прикажува јавно.</p>
      </Section>

      <Section title="Фотографии (по желба)">
        <p className="text-sm text-muted">
          Вашата работилница, изработки или вие додека работите. До {MAX_PHOTOS} фотографии, JPG/PNG/WebP, до 5 MB.
        </p>
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Избрана фотографија ${i + 1}`} className="h-24 w-full object-cover" />
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
        {files.length < MAX_PHOTOS && (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-4 text-base hover:border-accent">
            <span>📷</span>
            <span>
              Додај фотографии ({files.length}/{MAX_PHOTOS})
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPick} className="hidden" />
          </label>
        )}
      </Section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {busy ? "Се креира профилот…" : "Креирај профил"}
        </button>
        <p className="text-center text-base text-muted">
          Веќе имате профил?{" "}
          <Link href="/host/login" className="font-medium text-accent underline underline-offset-2 hover:text-accent-dark">
            Најавете се
          </Link>
        </p>
      </div>
    </form>
  );
}
