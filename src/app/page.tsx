import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import ClassCard from "@/components/ClassCard";
import { categories, classes } from "@/data/classes";

const steps = [
  { emoji: "🔎", title: "Пронајдете", text: "Разгледајте стотици искуства по град и категорија." },
  { emoji: "📅", title: "Резервирајте", text: "Изберете датум и број на луѓе. Потврда веднаш на е-пошта." },
  { emoji: "✨", title: "Уживајте", text: "Научете нешто ново од локални мајстори." },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Научете нешто ново од <span className="text-accent">локални мајстори</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Работилници и искуства во Скопје, Охрид и Битола. Одличен подарок, дејт или тимски настан.
        </p>
        <div className="mt-8">
          <SearchForm />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-semibold">Категории</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/classes?category=${c.slug}`}
              className="rounded-2xl border border-line bg-white p-4 text-center transition hover:border-accent"
            >
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-2 text-sm font-medium">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Популарни искуства</h2>
          <Link href="/classes" className="text-sm text-accent hover:underline">
            Види сите →
          </Link>
        </div>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.slice(0, 6).map((c) => (
            <ClassCard key={c.slug} item={c} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold">Како функционира</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-2xl border border-line bg-white p-6">
              <div className="text-3xl">{s.emoji}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl bg-ink px-8 py-12 text-cream">
          <h2 className="text-3xl font-bold">Имате вештина што сакате да ја споделите?</h2>
          <p className="mt-2 max-w-xl text-cream/80">
            Станете домаќин на Classnest, пополнете ги работилниците и заработете од она што го сакате.
          </p>
          <Link
            href="/host"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
          >
            Станете домаќин
          </Link>
        </div>
      </section>
    </>
  );
}
