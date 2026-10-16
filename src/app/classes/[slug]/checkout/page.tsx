import { notFound } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { getClass } from "@/data/classes";
import { formatDate, formatPrice } from "@/lib/format";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; people?: string }>;
}) {
  const { slug } = await params;
  const { date = "", people = "1" } = await searchParams;
  const item = getClass(slug);
  if (!item || !date) notFound();

  const count = Math.min(Math.max(Number(people) || 1, 1), item.maxPeople);

  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-10 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold">Завршете ја резервацијата</h1>
        <div className="mt-6">
          <CheckoutForm slug={slug} date={date} people={count} />
        </div>
      </div>
      <aside className="h-fit rounded-2xl border border-line bg-white p-5">
        <div className={`flex h-28 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-5xl`}>
          {item.emoji}
        </div>
        <h2 className="mt-3 font-semibold">{item.title}</h2>
        <p className="mt-1 text-sm text-muted">{formatDate(date)}</p>
        <p className="text-sm text-muted">{count} луѓе</p>
        <div className="mt-4 flex justify-between border-t border-line pt-3 font-semibold">
          <span>Вкупно</span>
          <span>{formatPrice(item.price * count)}</span>
        </div>
      </aside>
    </div>
  );
}
