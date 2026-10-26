import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-5xl" aria-hidden>
        🔎
      </p>
      <h1 className="mt-4 text-3xl font-bold">Страницата не е пронајдена</h1>
      <p className="mt-2 text-muted">Можеби адресата е погрешна или понудата повеќе не е достапна.</p>
      <Link
        href="/classes"
        className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
      >
        Разгледајте ги искуствата
      </Link>
    </div>
  );
}
