"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = { slug: string; date: string; people: number };

export default function CheckoutForm({ slug, date, people }: Props) {
  const router = useRouter();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      slug,
      date,
      people: String(people),
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
    });
    router.push(`/confirmation?${params.toString()}`);
  };

  const field =
    "mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="checkout-name" className="text-sm font-medium">Име и презиме</label>
        <input id="checkout-name" name="name" autoComplete="name" required className={field} />
      </div>
      <div>
        <label htmlFor="checkout-email" className="text-sm font-medium">Е-пошта</label>
        <input id="checkout-email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div>
        <label htmlFor="checkout-phone" className="text-sm font-medium">Телефон</label>
        <input id="checkout-phone" name="phone" type="tel" autoComplete="tel" className={field} />
      </div>
      <div className="rounded-xl border border-dashed border-line p-3 text-sm text-muted">
        💳 Плаќањето (CaSys) ќе биде додадено во следната фаза. Во демо верзијата не се наплатува.
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-dark"
      >
        Потврди резервација
      </button>
    </form>
  );
}
