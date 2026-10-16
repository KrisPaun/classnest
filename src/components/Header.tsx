import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getAccount } from "@/lib/auth";

export default async function Header() {
  const account = await getAccount();

  return (
    <header className="border-b border-line bg-cream/90 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          class<span className="text-accent">nest</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/classes" className="hover:text-accent">
            Сите искуства
          </Link>
          <Link href="/hosts" className="hover:text-accent">
            Домаќини
          </Link>
          {account ? (
            <>
              <Link
                href="/host/dashboard"
                className="rounded-full border border-ink px-4 py-2 hover:bg-ink hover:text-cream"
              >
                Моја табла
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/host/login" className="hover:text-accent">
                Најава
              </Link>
              <Link
                href="/host"
                className="rounded-full border border-ink px-4 py-2 hover:bg-ink hover:text-cream"
              >
                Станете домаќин
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
