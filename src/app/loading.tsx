export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16" role="status" aria-live="polite">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-line" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-line/70" />
        ))}
      </div>
      <span className="sr-only">Се вчитува…</span>
    </div>
  );
}
