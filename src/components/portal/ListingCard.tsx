"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ListingStatus } from "@/server/modules/listings/types";

type Visibility = "active" | "temporary" | "permanent";

type Props = {
  title: string;
  typeLabel: string;
  priceLabel: string;
  cover: string | null;
  emoji: string;
  gradient: string;
  status: ListingStatus;
  /** Причина за одбивање или симнување, од администратор. */
  note?: string;
  visibility: Visibility;
  /** Јавната страница, само за објавена понуда. */
  viewHref?: string;
};

const outlineBtn =
  "inline-flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-base font-medium text-accent hover:bg-accent/10";
const disabledBtn = "inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-line px-4 py-2 text-base text-muted";

export default function ListingCard({
  title,
  typeLabel,
  priceLabel,
  cover,
  emoji,
  gradient,
  status,
  note,
  visibility,
  viewHref,
}: Props) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [choice, setChoice] = useState<Exclude<Visibility, "active">>(
    visibility === "permanent" ? "permanent" : "temporary",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hidden = visibility !== "active";
  const takenDown = status === "TAKEN_DOWN"; // администратор ја симнал: домаќинот не може да ја скрие/прикаже

  const setVisibility = async (mode: Visibility) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/listings/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Промената не успеа.");
      setPanelOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Промената не успеа.");
    } finally {
      setBusy(false);
    }
  };

  const banner = takenDown
    ? {
        text: `Симната од Classnest${note ? `: ${note}` : "."} Контактирајте не за да ја вратиме.`,
        style: "bg-red-100 text-red-900",
      }
    : hidden
    ? {
        text:
          visibility === "temporary"
            ? "Привремено недостапна. Може пак да стане достапна подоцна."
            : "Трајно недостапна. Нема пак да стане достапна.",
        style: "bg-line/60 text-ink",
      }
    : status === "PUBLISHED"
      ? { text: "Објавена на маркетплејсот.", style: "bg-green-100 text-green-900" }
      : status === "REJECTED"
        ? {
            text: `Не е одобрена${note ? `: ${note}` : "."} Кога ќе ја уредите, автоматски се праќа повторно на преглед.`,
            style: "bg-red-100 text-red-900",
          }
        : {
            text: "На вашата страница; се прегледува за нашиот маркетплејс (може да потрае 1 до 3 работни дена).",
            style: "bg-amber-100 text-amber-900",
          };

  return (
    <article className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={title} className="h-44 w-full shrink-0 rounded-xl object-cover sm:h-48 sm:w-40" />
        ) : (
          <div
            className={`flex h-44 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-6xl sm:h-48 sm:w-40 ${gradient}`}
            aria-hidden
          >
            {emoji}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-base text-muted">
            {typeLabel} · {priceLabel}
          </p>
          <p className={`mt-3 rounded-lg px-4 py-2.5 text-base ${banner.style}`}>{banner.text}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/host/setup?step=3" className={outlineBtn}>
              <span aria-hidden>📅</span> Уреди термини
            </Link>
            <Link href="/host/setup?step=2" className={outlineBtn}>
              <span aria-hidden>✏️</span> Уреди понуда
            </Link>
            {viewHref ? (
              <Link href={viewHref} className={outlineBtn}>
                <span aria-hidden>👁️</span> Погледни
              </Link>
            ) : (
              <span className={disabledBtn} title="Достапно откако понудата ќе биде одобрена">
                <span aria-hidden>👁️</span> Погледни
              </span>
            )}
            {takenDown ? null : hidden ? (
                <button type="button" onClick={() => setVisibility("active")} disabled={busy} className={outlineBtn}>
                  <span aria-hidden>👁️</span> Прикажи
                </button>
              ) : (
                <button type="button" onClick={() => setPanelOpen((v) => !v)} className={outlineBtn}>
                  <span aria-hidden>🙈</span> Скриј
                </button>
              )}
          </div>

          {panelOpen && !hidden && (
            <div className="mt-5 rounded-xl border border-line p-5">
              <div className="space-y-3">
                <label className="flex items-start gap-3 text-base">
                  <input
                    type="radio"
                    name={`hide-${title}`}
                    checked={choice === "temporary"}
                    onChange={() => setChoice("temporary")}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span>Оваа понуда е привремено недостапна. Може пак да стане достапна подоцна.</span>
                </label>
                <label className="flex items-start gap-3 text-base">
                  <input
                    type="radio"
                    name={`hide-${title}`}
                    checked={choice === "permanent"}
                    onChange={() => setChoice("permanent")}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span>Оваа понуда е трајно недостапна. Нема пак да стане достапна.</span>
                </label>
              </div>

              {choice === "temporary" && (
                <div className="mt-4 space-y-3 rounded-xl bg-accent/10 p-4 text-base">
                  <p>
                    Ако понудата подоцна пак ќе биде достапна, препорачуваме да ја оставите на интернет.
                  </p>
                  <p>
                    Така можете да собирате повеќе гости на листа на чекање и/или да примате приватни барања (недостапните
                    периоди за барања ги поставувате во табот „Барања“).
                  </p>
                  <p>Нема трошок кај Classnest ако ја оставите на интернет, само предност!</p>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setVisibility(choice)}
                  className="rounded-lg bg-accent px-5 py-2.5 text-base font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                >
                  {busy ? "Се зачувува…" : "Скриј ја понудата"}
                </button>
                <button type="button" onClick={() => setPanelOpen(false)} className="px-3 py-2.5 text-base text-muted hover:text-ink">
                  Откажи
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
