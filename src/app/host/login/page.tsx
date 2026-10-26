import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getAccountSafe } from "@/lib/auth";

export const metadata: Metadata = { title: "Најава", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getAccountSafe()) redirect("/host/dashboard");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold">Најава за домаќини</h1>
      <p className="mt-2 text-muted">Управувајте со вашиот профил и фотографии.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
