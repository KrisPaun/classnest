import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/format";
import { findListing } from "@/lib/public-listings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; date?: string; people?: string; name?: string; email?: string }>;
}) {
  const { slug = "", date = "", people = "1", name = "", email = "" } = await searchParams;
  const item = await findListing(slug);
  if (!item) notFound();

  const count = Math.max(Number(people) || 1, 1);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-5xl">🎉</p>
      <h1 className="mt-4 text-3xl font-bold">Резервацијата е примена!</h1>
      <p className="mt-2 text-muted">
        {name ? `${name}, ` : ""}потврда ќе испратиме на <strong>{email}</strong>.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5 text-left">
        <h2 className="font-semibold">{item.title}</h2>
        <p className="mt-1 text-sm text-muted">{formatDate(date)} · {count} луѓе</p>
        <p className="text-sm text-muted">📍 {item.address ?? item.city?.name ?? "Онлајн"}</p>
        <p className="mt-3 border-t border-line pt-3 font-semibold">
          Вкупно: {formatPrice(item.price * count)}
        </p>
      </div>

      <Link
        href="/classes"
        className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
      >
        Разгледајте уште искуства
      </Link>
    </div>
  );
}
