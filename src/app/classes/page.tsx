import SearchForm from "@/components/SearchForm";
import ClassCard from "@/components/ClassCard";
import { classes } from "@/data/classes";

type SearchParams = Promise<{ q?: string; category?: string; city?: string }>;

export default async function ClassesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", category = "", city = "" } = await searchParams;
  const needle = q.trim().toLowerCase();

  const results = classes.filter(
    (c) =>
      (!category || c.category === category) &&
      (!city || c.city === city) &&
      (!needle ||
        c.title.toLowerCase().includes(needle) ||
        c.description.toLowerCase().includes(needle)),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Сите искуства</h1>
      <div className="mt-6">
        <SearchForm category={category} city={city} q={q} />
      </div>
      <p className="mt-6 text-sm text-muted">Пронајдени: {results.length}</p>
      {results.length === 0 ? (
        <p className="mt-10 text-center text-muted">Нема резултати. Пробајте други филтри.</p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <ClassCard key={c.slug} item={c} />
          ))}
        </div>
      )}
    </div>
  );
}
