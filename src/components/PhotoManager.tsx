"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

type HostOption = { slug: string; name: string };
type ClassOption = {
  slug: string;
  title: string;
  hostSlug: string;
  photos: { name: string; url: string }[];
};

type Props = {
  hosts: HostOption[];
  classes: ClassOption[];
  maxPhotos: number;
};

export default function PhotoManager({ hosts, classes, maxPhotos }: Props) {
  const router = useRouter();
  const [hostSlug, setHostSlug] = useState(hosts[0]?.slug ?? "");
  const hostClasses = classes.filter((c) => c.hostSlug === hostSlug);
  const [classSlug, setClassSlug] = useState(hostClasses[0]?.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const current = classes.find((c) => c.slug === classSlug);

  const onHostChange = (slug: string) => {
    setHostSlug(slug);
    setClassSlug(classes.find((c) => c.hostSlug === slug)?.slug ?? "");
    setMessage(null);
  };

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0 || !classSlug) return;

    const form = new FormData();
    form.set("slug", classSlug);
    files.forEach((f) => form.append("files", f));

    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/photos", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Грешка при качување.");
      setMessage({ ok: true, text: `Додадени фотографии: ${json.added}.` });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Грешка при качување." });
    } finally {
      setBusy(false);
      input.value = "";
    }
  };

  const onDelete = async (name: string) => {
    if (!confirm("Да ја избришам фотографијата?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: classSlug, name }),
      });
      if (!res.ok) throw new Error("Бришењето не успеа.");
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Бришењето не успеа." });
    } finally {
      setBusy(false);
    }
  };

  const field =
    "mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-line bg-white p-4 text-sm text-muted">
        Демо: во вистинската верзија ќе се најавите како домаќин и ќе ги гледате само вашите искуства.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Домаќин</label>
          <select value={hostSlug} onChange={(e) => onHostChange(e.target.value)} className={field}>
            {hosts.map((h) => (
              <option key={h.slug} value={h.slug}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Искуство</label>
          <select value={classSlug} onChange={(e) => setClassSlug(e.target.value)} className={field}>
            {hostClasses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {current && (
        <>
          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center transition hover:border-accent ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <span className="text-3xl">📷</span>
            <span className="mt-2 font-medium">{busy ? "Се качува…" : "Кликнете за да додадете фотографии"}</span>
            <span className="mt-1 text-xs text-muted">
              JPG, PNG или WebP · до 5 MB по фотографија · максимум {maxPhotos} ({current.photos.length}/{maxPhotos})
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={onFiles}
              className="hidden"
            />
          </label>

          {message && (
            <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>
          )}

          {current.photos.length === 0 ? (
            <p className="text-sm text-muted">Сè уште нема фотографии за ова искуство.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {current.photos.map((p, i) => (
                <div key={p.name} className="group relative overflow-hidden rounded-xl border border-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Фотографија ${i + 1}`} className="h-36 w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">
                      Главна
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(p.name)}
                    disabled={busy}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs hover:bg-white"
                  >
                    Избриши
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
