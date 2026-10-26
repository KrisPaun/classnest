import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PortalSidebar, { PortalItem } from "@/components/portal/PortalSidebar";
import { isAdminSafe, requireAccount } from "@/lib/auth";
import { getSetupProgress } from "@/lib/setup-progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Порталот се отвора дури кога се завршени сите чекори за поставување (и постои барем една понуда).
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();
  // Админ сметка без профил на домаќин нема што да прави тука: води на админ екранот.
  if (!account.hostSlug && (await isAdminSafe(account))) redirect("/admin/listings");
  const progress = await getSetupProgress(account);
  if (progress.nextStep) redirect(`/host/setup?step=${progress.nextStep}`);

  const items: PortalItem[] = [
    { href: "/host/dashboard", label: "Профил", icon: "📋" },
    { href: "/host/listings", label: "Понуди", icon: "🎨" },
    { href: "/host/requests", label: "Барања", icon: "💬" },
    { href: "/host/invites", label: "Покани", icon: "🎟️" },
    { href: "/host/messages", label: "Пораки", icon: "✉️" },
    { href: "/host/notifications", label: "Известувања", icon: "🔔" },
    { href: "/host/vouchers", label: "Ваучери", icon: "🏷️" },
    { href: "/host/qr", label: "QR кодови", icon: "▦" },
    { href: `/hosts/${account.hostSlug}`, label: "Мојата страница", icon: "🌐", external: true },
    { href: "/host/reviews", label: "Рецензии", icon: "⭐" },
    { href: "/host/reports", label: "Извештаи", icon: "📊" },
    { href: "/host/account", label: "Сметка", icon: "👤" },
    { href: "/host/help", label: "Помош и совети", icon: "❓" },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:items-start">
      <aside className="md:sticky md:top-24 md:w-64 md:shrink-0">
        <PortalSidebar items={items} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
