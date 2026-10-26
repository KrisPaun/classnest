"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Само дигестот (без детали): серверот го има целиот запис во својот лог.
    console.error("page error", error.digest ?? "");
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-5xl" aria-hidden>
        😕
      </p>
      <h1 className="mt-4 text-3xl font-bold">Нешто тргна наопаку</h1>
      <p className="mt-2 text-muted">Обидете се повторно. Ако проблемот остане, пробајте подоцна.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
      >
        Обиди се повторно
      </button>
    </div>
  );
}
