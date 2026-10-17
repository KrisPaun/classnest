"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type PortalItem = { href: string; label: string; icon: string; external?: boolean };

export default function PortalSidebar({ items }: { items: PortalItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Мени за домаќини" className="flex gap-1 overflow-x-auto rounded-2xl bg-accent p-2 md:flex-col md:overflow-visible">
      {items.map((item) => {
        const active = !item.external && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-base font-semibold transition ${
              active ? "bg-cream text-ink" : "text-white hover:bg-white/15"
            }`}
          >
            <span aria-hidden className="w-6 text-center">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
