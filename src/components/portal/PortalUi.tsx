import Link from "next/link";
import { ReactNode } from "react";

/** Голем наслов на страницата во портал. */
export function PortalTitle({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-accent px-6 py-5 text-center">
      <h1 className="text-3xl font-bold text-white">{children}</h1>
    </div>
  );
}

export type TabItem = { href: string; label: string; icon: string; active: boolean };

/** Табови во форма на таблетка (активниот е бел). */
export function TabLinks({ tabs }: { tabs: TabItem[] }) {
  return (
    <div className="mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-line/60 p-1.5">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-base font-semibold transition ${
            t.active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/** Кутија со „i“ икона. */
export function InfoPanel({ children, onClose }: { children: ReactNode; onClose?: ReactNode }) {
  return (
    <div className="relative flex gap-4 rounded-2xl bg-accent/10 p-5 text-base">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0">
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <rect x="11" y="10" width="2" height="7" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.25" fill="white" />
      </svg>
      <div className="space-y-3 pr-8">{children}</div>
      {onClose}
    </div>
  );
}
