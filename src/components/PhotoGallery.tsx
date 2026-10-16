"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  photos: string[];
  title: string;
  emoji: string;
  gradient: string;
};

export default function PhotoGallery({ photos, title, emoji, gradient }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const n = photos.length;

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + n) % n)),
    [n],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  if (n === 0) {
    return (
      <div
        className={`mt-4 flex h-72 items-center justify-center rounded-3xl bg-gradient-to-br ${gradient} text-8xl`}
      >
        <span aria-hidden>{emoji}</span>
      </div>
    );
  }

  const gridClass =
    n === 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : "grid-cols-4 grid-rows-2";
  const visible = n >= 3 ? photos.slice(0, 5) : photos;

  const spanClass = (i: number) => {
    if (n < 3) return "";
    if (i === 0) return "col-span-2 row-span-2";
    if (n === 3) return "col-span-2";
    if (n === 4 && i === 1) return "col-span-2";
    return "";
  };

  return (
    <>
      <div className={`relative mt-4 grid h-72 gap-2 overflow-hidden rounded-3xl sm:h-96 ${gridClass}`}>
        {visible.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className={`relative overflow-hidden bg-line ${spanClass(i)}`}
            aria-label={`Отвори фотографија ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} – фотографија ${i + 1}`}
              className="h-full w-full object-cover transition hover:scale-105"
            />
          </button>
        ))}
        {n > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute bottom-3 right-3 rounded-full bg-white px-4 py-2 text-sm font-medium shadow hover:bg-cream"
          >
            Сите фотографии ({n})
          </button>
        )}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            aria-label="Затвори"
          >
            ×
          </button>
          {n > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-4 h-12 w-12 rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
                aria-label="Претходна"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-4 h-12 w-12 rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
                aria-label="Следна"
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[open]}
            alt={`${title} – фотографија ${open + 1}`}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-sm text-white/80">
            {open + 1} / {n}
          </p>
        </div>
      )}
    </>
  );
}
