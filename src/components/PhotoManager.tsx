"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Target = {
  key: string;
  title: string;
  max: number;
  photos: { name: string; url: string }[];
};

export default function PhotoManager({ targets }: { targets: Target[] }) {
  const router = useRouter();
  const [key, setKey] = useState(targets[0]?.key ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const current = targets.find((t) => t.key === key);

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0 || !current) return;

    const form = new FormData();
    form.set("key", current.key);
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
    if (!current || !confirm("Да ја избришам фотографијата?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: current.key, name }),
      });
      if (!res.ok) throw new Error("Бришењето не успеа.");
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Бришењето не успеа." });
    } finally {
      setBusy(false);
    }
  };

  if (!current) return null;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Фотографии за</label>
        <select
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setMessage(null);
          }}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-accent"
        >
          {targets.map((t) => (
            <option key={t.key} value={t.key}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center transition hover:border-accent ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <span className="text-3xl">📷</span>
        <span className="mt-2 font-medium">{busy ? "Се обработува…" : "Кликнете за да додадете фотографии"}</span>
        <span className="mt-1 text-xs text-muted">
          JPG, PNG или WebP · до 5 MB по фотографија · {current.photos.length}/{current.max}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFiles}
          className="hidden"
        />
      </label>

      {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}

      {current.photos.length === 0 ? (
        <p className="text-sm text-muted">Сè уште нема фотографии.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {current.photos.map((p, i) => (
            <div key={p.name} className="relative overflow-hidden rounded-xl border border-line bg-white">
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
    </div>
  );
}
