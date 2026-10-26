import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SetupAvailabilityForm from "@/components/SetupAvailabilityForm";
import SetupExperienceForm from "@/components/SetupExperienceForm";
import SetupPayoutForm from "@/components/SetupPayoutForm";
import SetupProfileForm from "@/components/SetupProfileForm";
import { requireAccount } from "@/lib/auth";
import { getDynamicHost } from "@/lib/host-directory";
import { avatarKey, experiencePhotoKey, listPhotoUrls } from "@/lib/photos";
import { getFirstListing } from "@/server/modules/listings/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const account = await requireAccount();
  const host = await getDynamicHost(account.hostSlug);
  // Демо домаќините (поврзани со hosts.ts) немаат чекори за поставување.
  if (!host) redirect("/host/dashboard");

  const experience = await getFirstListing(host.slug);

  const profileDone = Boolean(host.profileCompletedAt);
  const experienceDone = Boolean(experience);
  const availabilityDone = Boolean(experience?.availability);
  const payoutDone = Boolean(host.payout);

  // Чекор 1 е секогаш достапен. Следните се отклучуваат по завршување на претходниот.
  const unlocked = (n: number) =>
    n === 1 ||
    (n === 2 && profileDone) ||
    (n === 3 && profileDone && experienceDone) ||
    (n === 4 && profileDone && experienceDone && availabilityDone);
  const requested = Number((await searchParams).step);
  const active = unlocked(requested)
    ? requested
    : !profileDone
      ? 1
      : !experienceDone
        ? 2
        : !availabilityDone
          ? 3
          : 4;

  // Само што е потребно за формата: полниот IBAN никогаш не се праќа до прелистувачот.
  const payoutInitial = host.payout
    ? {
        bankName: host.payout.bank.bankName,
        holder: host.payout.bank.holder,
        ibanLast4: host.payout.bank.ibanLast4,
        tradingName: host.payout.tradingName,
        taxNumber: host.payout.taxNumber ?? null,
        hasDateOfBirth: Boolean(host.payout.dobEnc),
        vatRegistered: host.payout.vatRegistered,
        onePublicBookingAtATime: host.payout.onePublicBookingAtATime,
        allowSelfServiceChanges: host.payout.allowSelfServiceChanges,
        allowPromoUse: host.payout.allowPromoUse,
        payoutFrequency: host.payout.payoutFrequency,
      }
    : null;

  const avatars = await listPhotoUrls(avatarKey(host.slug));
  const avatarUrl = avatars[avatars.length - 1] ?? null;
  const experiencePhotos = experience ? await listPhotoUrls(experiencePhotoKey(experience.id)) : [];

  const steps = [
    { n: 1, title: "Вашиот профил", text: "Фотографија и приказна", complete: profileDone },
    { n: 2, title: "Вашето прво искуство", text: "Тип, опис, цена", complete: experienceDone },
    { n: 3, title: "Вашата достапност", text: "Термини за барања по мерка", complete: availabilityDone },
    { n: 4, title: "Исплата", text: "Банкарска сметка и бизнис", complete: payoutDone },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Завршете го поставувањето</h1>
      <p className="mt-2 text-muted">Уште малку и вашиот профил е подготвен. Ова трае неколку минути.</p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => {
          const isActive = s.n === active;
          const open = unlocked(s.n);
          const circle =
            s.complete && !isActive
              ? "bg-green-100 text-green-800"
              : isActive
                ? "bg-accent text-white"
                : "bg-line text-muted";
          const body = (
            <>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-semibold ${circle}`}
              >
                {s.complete && !isActive ? "✓" : s.n}
              </span>
              <div>
                <p className={`font-medium ${open ? "" : "text-muted"}`}>{s.title}</p>
                <p className="text-sm text-muted">{open ? s.text : "Наскоро"}</p>
              </div>
            </>
          );
          const base = `flex items-start gap-3 rounded-2xl border p-4 ${
            isActive ? "border-accent bg-white" : "border-line bg-white/60"
          }`;
          return (
            <li key={s.n} aria-current={isActive ? "step" : undefined}>
              {open ? (
                <Link href={`/host/setup?step=${s.n}`} className={`${base} hover:border-accent`}>
                  {body}
                </Link>
              ) : (
                <div className={base}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>

      {active === 1 && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Чекор 1 од 4</p>
            <h2 className="mt-1 text-xl font-semibold">Вашиот профил</h2>
            <div className="mt-6">
              <SetupProfileForm
                name={host.name}
                avatarUrl={avatarUrl}
                initialStory={host.story ?? ""}
                done={profileDone}
                initialWebsite={host.website ?? ""}
                initialInstagram={host.instagram ?? ""}
                initialFacebook={host.facebook ?? ""}
                initialMonth={host.startedMonth ?? null}
                initialYear={host.startedYear ?? null}
              />
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-line bg-cream p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold">Раскажете ја вашата приказна</h2>
            <p className="mt-2 text-base text-muted">Гостите сакаат да запознаат вистинска личност. Напишете:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
              <li>Како започнавте и зошто го сакате она што го правите?</li>
              <li>Зошто уживате да подучувате?</li>
              <li>Нешто посебно за вас или вашиот занает што малкумина го знаат.</li>
            </ul>
            <p className="mt-4 text-base text-muted">Не се плашете малку да се пофалите. Тоа создава доверба:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-base">
              <li>Колку години искуство имате и колку луѓе сте научиле?</li>
              <li>Имате ли сертификати, дипломи или награди?</li>
              <li>Сте ли предавале на школи или факултети, или се појавувале во медиуми?</li>
            </ul>
            <p className="mt-4 text-base font-medium">Пишувајте во прво лице, лично и топло.</p>
          </aside>
        </div>
      )}

      {active === 2 && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Чекор 2 од 4</p>
          <h2 className="mt-1 text-xl font-semibold">Вашето прво искуство</h2>
          <p className="mt-2 text-base text-muted">
            Изберете што нудите. Формата подолу се прилагодува според типот. Можете да го смените подоцна.
          </p>
          <div className="mt-6">
            <SetupExperienceForm initial={experience} existingPhotos={experiencePhotos} />
          </div>
        </section>
      )}

      {active === 3 && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Чекор 3 од 4</p>
          <h2 className="mt-1 text-xl font-semibold">Кога сте обично достапни за термини по барање?</h2>
          <div className="mt-6">
            <SetupAvailabilityForm initial={experience?.availability ?? null} />
          </div>
        </section>
      )}

      {active === 4 && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Чекор 4 од 4</p>
          <h2 className="mt-1 text-xl font-semibold">Исплата</h2>
          <div className="mt-6">
            <SetupPayoutForm initial={payoutInitial} />
          </div>
        </section>
      )}
    </div>
  );
}
