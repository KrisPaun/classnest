import Link from "next/link";
import HostForm from "@/components/HostForm";

const benefits = [
  "Бесплатно поставување на вашата работилница",
  "Ние го правиме маркетингот и резервациите",
  "Плаќање директно на вашата сметка",
];

export default function HostPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold leading-tight">Споделете ја вашата вештина</h1>
        <p className="mt-4 text-muted">
          Готвите, цртате, правите керамика или свирите? Постојат луѓе што сакаат да научат од вас.
        </p>
        <ul className="mt-6 space-y-2">
          {benefits.map((b) => (
            <li key={b}>✓ {b}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-4">
        <HostForm />
        <Link
          href="/host/photos"
          className="block rounded-2xl border border-line bg-white p-4 text-center text-sm hover:border-accent"
        >
          Веќе сте домаќин? <span className="text-accent">Управувајте со фотографиите →</span>
        </Link>
      </div>
    </div>
  );
}
