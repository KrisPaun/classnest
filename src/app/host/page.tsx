import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import { getAccountSafe } from "@/lib/auth";

const benefits = [
  "Бесплатно поставување на вашата работилница",
  "Ние го правиме маркетингот и резервациите",
  "Плаќање директно на вашата сметка",
];

export default async function HostPage() {
  const account = await getAccountSafe();

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div>
        <h1 className="text-3xl font-bold leading-tight">Развијте го вашиот бизнис со нас</h1>
        <h2 className="mt-2 text-xl font-medium text-accent">Споделете ја вашата вештина</h2>
        <p className="mt-4 text-muted">
          Готвите, цртате, правите керамика или свирите? Постојат луѓе што сакаат да научат од вас.
        </p>
        <ul className="mt-6 space-y-2">
          {benefits.map((b) => (
            <li key={b}>✓ {b}</li>
          ))}
        </ul>
      </div>
      {account ? (
        <div className="h-fit rounded-2xl border border-line bg-white p-6 text-center">
          <p className="text-3xl">👋</p>
          <h2 className="mt-2 text-xl font-semibold">Добредојдовте, {account.name.split(" ")[0]}!</h2>
          <p className="mt-1 text-muted">Веќе сте најавени.</p>
          <Link
            href="/host/dashboard"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
          >
            Оди на мојот профил
          </Link>
        </div>
      ) : (
        <RegisterForm />
      )}
    </div>
  );
}
