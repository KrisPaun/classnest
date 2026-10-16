import { categories, cities } from "@/data/classes";

type Props = { category?: string; city?: string; q?: string };

export default function SearchForm({ category = "", city = "", q = "" }: Props) {
  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-accent";

  return (
    <form
      action="/classes"
      className="grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm sm:grid-cols-[1.5fr_1fr_1fr_auto]"
    >
      <input
        name="q"
        defaultValue={q}
        placeholder="Што сакате да научите?"
        className={field}
      />
      <select name="category" defaultValue={category} className={field}>
        <option value="">Сите категории</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select name="city" defaultValue={city} className={field}>
        <option value="">Сите градови</option>
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Пребарај
      </button>
    </form>
  );
}
