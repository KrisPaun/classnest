import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalTitle } from "@/components/portal/PortalUi";

// Страници од менито што уште не се направени. Секоја прикажува кратко објаснување.
const sections: Record<string, { title: string; text: string }> = {
  invites: { title: "Покани", text: "Покани гости и пријатели да резервираат кај вас." },
  messages: { title: "Пораки", text: "Разговори со гостите на едно место." },
  notifications: { title: "Известувања", text: "Нови барања, резервации и рецензии." },
  vouchers: { title: "Ваучери", text: "Ваучери и подарок-картички за вашите понуди." },
  qr: { title: "QR кодови", text: "Печатете QR кодови што водат до вашите понуди." },
  reviews: { title: "Рецензии", text: "Што велат гостите за вашите понуди." },
  reports: { title: "Извештаи", text: "Резервации, приходи и исплати." },
  help: { title: "Помош и совети", text: "Совети како да добиете повеќе резервации." },
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  if (section === "account") {
    const links = [
      { step: 1, label: "Профил: фотографија, приказна и линкови" },
      { step: 2, label: "Мојата понуда" },
      { step: 3, label: "Достапност за термини по барање" },
      { step: 4, label: "Исплата и бизнис" },
    ];
    return (
      <div>
        <PortalTitle>Сметка</PortalTitle>
        <ul className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white">
          {links.map((l) => (
            <li key={l.step}>
              <Link href={`/host/setup?step=${l.step}`} className="flex items-center justify-between px-5 py-4 text-base hover:bg-cream">
                <span>{l.label}</span>
                <span className="text-accent">Уреди →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const info = sections[section];
  if (!info) notFound();

  return (
    <div>
      <PortalTitle>{info.title}</PortalTitle>
      <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🛠️
        </p>
        <p className="mt-3 text-lg font-semibold">Оваа страница е во подготовка.</p>
        <p className="mt-1 text-base text-muted">{info.text}</p>
      </div>
    </div>
  );
}
