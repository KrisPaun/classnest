"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  slug: string;
  canPublish: boolean;
  canReject: boolean;
  canTakeDown: boolean;
  /** Објави (од преглед или одбиена) или врати (од симната). */
  publishLabel: string;
};

type Action = "publish" | "reject" | "takedown";

const primaryBtn = "rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dark disabled:opacity-60";
const outlineBtn = "rounded-lg border border-line px-5 py-2.5 font-semibold hover:bg-line/60 disabled:opacity-60";

const REASON_UI = {
  reject: { label: "Причина за одбивање (ја гледа домаќинот)", confirm: "Потврди одбивање" },
  takedown: { label: "Причина за симнување (ја гледа домаќинот)", confirm: "Потврди симнување" },
} as const;

export default function ModerationActions({ slug, canPublish, canReject, canTakeDown, publishLabel }: Props) {
  const router = useRouter();
  const [asking, setAsking] = useState<"reject" | "takedown" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (action: Action) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/listings/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Промената не успеа.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Промената не успеа.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setAsking(null);
    setReason("");
  };

  if (!canPublish && !canReject && !canTakeDown) return null;

  return (
    <div className="mt-4">
      {!asking && (
        <div className="flex flex-wrap gap-2">
          {canPublish && (
            <button type="button" disabled={busy} onClick={() => send("publish")} className={primaryBtn}>
              {busy ? "Се зачувува…" : publishLabel}
            </button>
          )}
          {canReject && (
            <button type="button" disabled={busy} onClick={() => setAsking("reject")} className={outlineBtn}>
              Одбиј
            </button>
          )}
          {canTakeDown && (
            <button type="button" disabled={busy} onClick={() => setAsking("takedown")} className={outlineBtn}>
              Симни
            </button>
          )}
        </div>
      )}

      {asking && (
        <div className="rounded-xl border border-line p-4">
          <label className="block text-sm font-medium" htmlFor={`reason-${slug}`}>
            {REASON_UI[asking].label}
          </label>
          <textarea
            id={`reason-${slug}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2 w-full rounded-lg border border-line px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted">Најмалку 5 знаци. Пишете јасно што треба да се поправи.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy || reason.trim().length < 5}
              onClick={() => send(asking)}
              className={primaryBtn}
            >
              {busy ? "Се зачувува…" : REASON_UI[asking].confirm}
            </button>
            <button type="button" disabled={busy} onClick={cancel} className="px-3 py-2.5 text-muted hover:text-ink">
              Откажи
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
