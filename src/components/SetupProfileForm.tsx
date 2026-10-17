"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Outlined, control } from "@/components/Outlined";
import { months } from "@/lib/format";

const MIN_STORY = 50;
const MAX_STORY = 2000;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  name: string;
  avatarUrl: string | null;
  initialStory: string;
  done: boolean;
  initialWebsite: string;
  initialInstagram: string;
  initialFacebook: string;
  initialMonth: number | null;
  initialYear: number | null;
};

export default function SetupProfileForm({
  name,
  avatarUrl,
  initialStory,
  done,
  initialWebsite,
  initialInstagram,
  initialFacebook,
  initialMonth,
  initialYear,
}: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [story, setStory] = useState(initialStory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(initialMonth ? String(initialMonth) : "");
  const [year, setYear] = useState(initialYear ? String(initialYear) : "");
  const [website, setWebsite] = useState(initialWebsite);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [facebook, setFacebook] = useState(initialFacebook);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1949 }, (_, i) => thisYear - i);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!picked) return;
    if (!TYPES.includes(picked.type) || picked.size > MAX_BYTES) {
      setError("Фотографијата мора да биде JPG, PNG или WebP до 5 MB.");
      return;
    }
    setError(null);
    setFile(picked);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData();
    form.set("story", story);
    form.set("startedMonth", month);
    form.set("startedYear", year);
    form.set("website", website);
    form.set("instagram", instagram);
    form.set("facebook", facebook);
    if (file) form.set("avatar", file);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/profile", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Зачувувањето не успеа.");
      setFile(null);
      // Следен чекор. Чекорите остануваат кликливи во горниот список.
      router.push("/host/setup?step=2");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Зачувувањето не успеа.");
    } finally {
      setBusy(false);
    }
  };

  const shown = preview ?? avatarUrl;
  const tooShort = story.trim().length < MIN_STORY;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-5">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Профилна фотографија" className="h-28 w-28 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-amber-400 text-5xl font-semibold text-white">
            {name[0]}
          </div>
        )}
        <div>
          <p className="font-medium">Профилна фотографија</p>
          <p className="mt-1 text-base text-muted">Јасна фотографија од вас. Гостите повеќе му веруваат на лице.</p>
          <label className="mt-3 inline-block cursor-pointer rounded-full border border-ink px-4 py-2 text-base hover:bg-ink hover:text-cream">
            {shown ? "Промени фотографија" : "Додај фотографија"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} className="hidden" />
          </label>
        </div>
      </div>

      <div>
        <Outlined label="Вашата приказна" required error={`Напишете најмалку ${MIN_STORY} знаци.`}>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            required
            minLength={MIN_STORY}
            maxLength={MAX_STORY}
            rows={10}
            placeholder="Започнете со „Јас сум…“"
            className={`${control} leading-relaxed`}
          />
        </Outlined>
        <div className="mt-1 flex justify-between text-sm text-muted">
          <span>{tooShort ? `Најмалку ${MIN_STORY} знаци.` : "Одлично!"}</span>
          <span>
            {story.length}/{MAX_STORY}
          </span>
        </div>
      </div>

      <div className="space-y-5 border-t border-line pt-6">
        <p className="text-base font-medium">Кога го започнавте бизнисот? (по желба)</p>
        <div className="grid grid-cols-2 gap-5">
          <Outlined label="Месец" raised required={year !== ""}>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required={year !== ""}
              className={control}
            >
              <option value="">—</option>
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Outlined>
          <Outlined label="Година" raised required={month !== ""}>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required={month !== ""}
              className={control}
            >
              <option value="">—</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Outlined>
        </div>

        <Outlined label="Веб-страница">
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            maxLength={200}
            placeholder="www.vasha-stranica.mk"
            className={control}
          />
        </Outlined>
        <Outlined label="Instagram">
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            maxLength={200}
            placeholder="instagram.com/vashata.rabotilnica"
            className={control}
          />
        </Outlined>
        <Outlined label="Facebook">
          <input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            maxLength={200}
            placeholder="facebook.com/vashata.rabotilnica"
            className={control}
          />
        </Outlined>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || tooShort}
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
