"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Outlined, control } from "@/components/Outlined";
import { PAYOUT_FREQUENCIES, PayoutFrequency, payoutFrequencyLabels } from "@/data/payout";
import { maskIban } from "@/lib/iban";

/** Што се враќа од серверот за веќе зачуван запис. Полниот IBAN никогаш не се праќа. */
export type PayoutInitial = {
  bankName: string;
  holder: string;
  ibanLast4: string;
  tradingName: string;
  taxNumber: string | null;
  hasDateOfBirth: boolean; // самото датум никогаш не се праќа до прелистувачот
  vatRegistered: boolean;
  onePublicBookingAtATime: boolean;
  allowSelfServiceChanges: boolean;
  allowPromoUse: boolean;
  payoutFrequency: PayoutFrequency;
};

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <h3 className="flex items-center gap-3 text-xl font-semibold">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Информативна кутија со „i“ икона (светла позадина). */
function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-accent/10 p-5 text-base">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0">
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <rect x="11" y="10" width="2" height="7" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.25" fill="white" />
      </svg>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Radio({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 text-base">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
      />
      <span>{children}</span>
    </label>
  );
}

/** Полето type="date" дава ГГГГ-ММ-ДД, а серверот го чека ДД/ММ/ГГГГ. */
const isoToDmy = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function SetupPayoutForm({ initial }: { initial: PayoutInitial | null }) {
  const router = useRouter();

  // Граници на календарот: најмалку 18, најмногу 110 години.
  const now = new Date();
  const maxDob = toIso(new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()));
  const minDob = toIso(new Date(now.getFullYear() - 110, now.getMonth(), now.getDate()));
  const [hasTax, setHasTax] = useState<boolean | null>(initial ? initial.taxNumber !== null : null);
  const [vat, setVat] = useState<boolean | null>(initial ? initial.vatRegistered : null);
  const [onePublic, setOnePublic] = useState(initial?.onePublicBookingAtATime ?? false);
  const [selfService, setSelfService] = useState(initial?.allowSelfServiceChanges ?? false);
  const [promo, setPromo] = useState(initial?.allowPromoUse ?? true); // препорачано: штиклирано
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasTax === null) return setError("Одберете дали имате ЕДБ.");
    if (vat === null) return setError("Одберете дали сте регистрирани за ДДВ.");

    const data = new FormData(e.currentTarget);
    const text = (k: string) => String(data.get(k) ?? "");

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: text("bankName"),
          iban: text("iban"),
          holder: text("holder"),
          tradingName: text("tradingName"),
          hasTaxNumber: hasTax,
          taxNumber: hasTax ? text("taxNumber") : "",
          dateOfBirth: hasTax ? "" : isoToDmy(text("dateOfBirth")),
          vatRegistered: vat,
          onePublicBookingAtATime: onePublic,
          allowSelfServiceChanges: selfService,
          allowPromoUse: promo,
          payoutFrequency: text("payoutFrequency"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Зачувувањето не успеа.");
      router.push("/host/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Зачувувањето не успеа.");
      setBusy(false);
    }
  };

  const hint = "mt-1.5 px-1 text-sm text-ink/80";

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      <Section icon="🏦" title="Вашата банкарска сметка">
        <InfoBox>
          <p>Податоците за банката ги користиме само за да ви исплаќаме, никогаш за да ви наплаќаме.</p>
          <p>
            Внимавајте името на сметката да се совпаѓа со сопственикот, како што е регистриран во вашата банка, на
            пр. „Јана Петровска“ или „Керамичарска работилница Дебар“. Не го пишувајте името на банката или видот на
            сметката.
          </p>
          <p>Проверете ги податоците внимателно, бидејќи не можеме да вратиме погрешно испратени исплати!</p>
        </InfoBox>

        {initial && (
          <p className="rounded-xl border border-line bg-white px-4 py-3 text-base">
            Зачувана сметка: <strong>{initial.bankName}</strong>, {maskIban(initial.ibanLast4)}. За да ја задржите,
            оставете го IBAN празно.
          </p>
        )}

        <div className="max-w-xl space-y-5">
          <Outlined label="Име на банката" required>
            <input
              name="bankName"
              required
              maxLength={80}
              defaultValue={initial?.bankName}
              placeholder="на пр. Комерцијална банка"
              className={control}
            />
          </Outlined>
          <div>
            <Outlined label="IBAN" required={!initial} error="Внесете IBAN (19 знаци).">
              <input
                name="iban"
                required={!initial}
                maxLength={34}
                autoComplete="off"
                spellCheck={false}
                placeholder="MK07 2501 2000 0058 984"
                className={`${control} uppercase`}
              />
            </Outlined>
            <p className={hint}>Македонски IBAN: почнува со MK и има 19 знаци.</p>
          </div>
          <div>
            <Outlined label="Име на сметката" required>
              <input
                name="holder"
                required
                minLength={2}
                maxLength={100}
                defaultValue={initial?.holder}
                placeholder="на пр. Јана Петровска"
                className={control}
              />
            </Outlined>
            <p className={hint}>Целосното име на сопственикот на сметката.</p>
          </div>
        </div>
      </Section>

      <Section icon="🏪" title="Како работите">
        <div className="max-w-xl space-y-3">
          <Outlined label="Назив на бизнисот" required>
            <input
              name="tradingName"
              required
              minLength={2}
              maxLength={100}
              defaultValue={initial?.tradingName}
              placeholder=" "
              className={control}
            />
          </Outlined>
          <p className={hint}>Вашиот легален назив. Користете го личното име ако сте самовработени.</p>
        </div>

        <div className="space-y-3">
          <Radio checked={hasTax === true} onChange={() => setHasTax(true)}>
            Имам ЕДБ (единствен даночен број)
          </Radio>
          <Radio checked={hasTax === false} onChange={() => setHasTax(false)}>
            Немам ЕДБ
          </Radio>
          {hasTax === false && (
            <div className="max-w-xl pt-2">
              <Outlined
                label="Датум на раѓање"
                required={!initial?.hasDateOfBirth}
                raised
                error="Изберете валиден датум (од 18 до 110 години)."
              >
                {/* Избирач на датум од прелистувачот. Календарот дозволува само возраст од 18 до 110 години. */}
                <input
                  name="dateOfBirth"
                  type="date"
                  required={!initial?.hasDateOfBirth}
                  autoComplete="bday"
                  min={minDob}
                  max={maxDob}
                  className={control}
                />
              </Outlined>
              <p className={hint}>
                Бидејќи немате ЕДБ, ни треба вашиот датум на раѓање.
                {initial?.hasDateOfBirth && " Веќе е зачуван. Оставете празно за да го задржите."}
              </p>
            </div>
          )}
          {hasTax && (
            <div className="max-w-xl pt-2">
              <Outlined label="ЕДБ" required error="ЕДБ има 13 цифри.">
                <input
                  name="taxNumber"
                  required
                  inputMode="numeric"
                  maxLength={15}
                  defaultValue={initial?.taxNumber ?? ""}
                  placeholder="13 цифри"
                  className={control}
                />
              </Outlined>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="font-semibold">Дали сте регистрирани за ДДВ?</p>
          <Radio checked={vat === true} onChange={() => setVat(true)}>
            Да
          </Radio>
          <Radio checked={vat === false} onChange={() => setVat(false)}>
            Не
          </Radio>
          {vat === true && (
            <div className="max-w-xl pt-2">
              <InfoBox>
                <p>
                  Ако сте регистрирани за ДДВ, ќе треба да пресметате и уплатите ДДВ на вашата заработка, а можете да
                  бараете одбивка на ДДВ од нашата провизија.
                </p>
              </InfoBox>
            </div>
          )}
        </div>
      </Section>

      <Section icon="⚙️" title="Поставки на сметката">
        <div className="space-y-5">
          <label className="flex items-start gap-3 text-base">
            <input
              type="checkbox"
              checked={onePublic}
              onChange={(e) => setOnePublic(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span>
              Дозволи само една понуда да биде јавно резервирана во исто време. Кога јавен термин се резервира за една
              понуда, тој автоматски станува недостапен за јавни резервации кај сите ваши други понуди.
            </span>
          </label>
          <label className="flex items-start gap-3 text-base">
            <input
              type="checkbox"
              checked={selfService}
              onChange={(e) => setSelfService(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span>
              Дозволи им на гостите сами да откажуваат или да менуваат јавни резервации, според вашата политика.
              Напомена: ако датумите имаат различна цена, нема автоматски да наплатиме или вратиме разлика (тоа треба
              да го направите вие).
            </span>
          </label>
          <label className="flex items-start gap-3 text-base">
            <input
              type="checkbox"
              checked={promo}
              onChange={(e) => setPromo(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span>
              (Препорачано) Дозволи Classnest да користи слики и видеа од вашите понуди на својата страница, во реклами
              што ги промовираат категориите на вашите понуди. Ова ќе донесе повеќе гости.
            </span>
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-base">
            Колку често да ви исплаќаме? Многу наставници избираат исплата еднаш неделно или месечно, што може да ги
            поедностави изводите и сметководството.
          </p>
          <div className="max-w-xl">
            <Outlined label="Фреквенција на исплата" required raised>
              <select name="payoutFrequency" required defaultValue={initial?.payoutFrequency ?? ""} className={control}>
                <option value="" disabled>
                  Изберете
                </option>
                {PAYOUT_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {payoutFrequencyLabels[f]}
                  </option>
                ))}
              </select>
            </Outlined>
          </div>
        </div>
      </Section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-8 py-4 text-base font-semibold text-white hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:min-w-72"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 fill-current">
          <path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 5v4h9V5z" />
        </svg>
        {busy ? "Се зачувува…" : "Зачувај и продолжи"}
      </button>
    </form>
  );
}
