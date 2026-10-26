import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Целиот /admin е само за администратори. Проверката е на серверот; не се потпираме на скриено мени.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between rounded-2xl bg-ink px-5 py-3 text-cream">
        <Link href="/admin/listings" className="font-semibold">
          Админ
        </Link>
        <span className="text-sm text-cream/70">{admin.email}</span>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
