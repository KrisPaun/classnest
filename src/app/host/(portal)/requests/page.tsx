import Link from "next/link";
import { PortalTitle, TabLinks } from "@/components/portal/PortalUi";
import { requireAccount } from "@/lib/auth";
import { weekdays } from "@/lib/availability";
import { getFirstListing } from "@/server/modules/listings/service";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const time = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

type Tab = "outstanding" | "previous" | "availability";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const account = await requireAccount();
  const raw = (await searchParams).tab;
  const tab: Tab = raw === "previous" || raw === "availability" ? raw : "outstanding";

  const experience = await getFirstListing(account.hostSlug);
  const availability = experience?.availability;

  return (
    <div>
      <PortalTitle>Барања</PortalTitle>

      <TabLinks
        tabs={[
          { href: "/host/requests", label: "Нерешени", icon: "📨", active: tab === "outstanding" },
          { href: "/host/requests?tab=previous", label: "Претходни", icon: "🕘", active: tab === "previous" },
          { href: "/host/requests?tab=availability", label: "Достапност", icon: "📅", active: tab === "availability" },
        ]}
      />

      <div className="mt-8">
        {tab !== "availability" && (
          <p className="flex max-w-md items-center gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-base text-green-900">
            <span aria-hidden className="text-2xl">
              👍
            </span>
            {tab === "outstanding" ? "Немате нерешени барања" : "Немате претходни барања"}
          </p>
        )}

        {tab === "availability" && (
          <div className="space-y-6">
            {availability ? (
              <>
                <p className="text-base">
                  <strong>Флексибилност:</strong>{" "}
                  {availability.flexibility === "flexible"
                    ? "Флексибилно (можете да примате барања и надвор од термините)"
                    : "Строго (само во термините подолу)"}
                </p>
                {availability.parallelBookings && (
                  <p className="text-base">Можете да одржите повеќе приватни резервации во исто време.</p>
                )}
                <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
                  {availability.slots.map((s, i) => (
                    <li key={i} className="flex justify-between gap-4 px-5 py-3 text-base">
                      <span className="font-medium">{weekdays[s.day - 1]}</span>
                      <span>
                        {time(s.from)} – {time(s.to)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-base text-muted">Сè уште не сте ја поставиле достапноста.</p>
            )}
            <Link
              href="/host/setup?step=3"
              className="inline-block font-medium text-accent underline underline-offset-2 hover:text-accent-dark"
            >
              Уреди ја достапноста
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
