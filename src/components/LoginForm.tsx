"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Outlined, control } from "@/components/Outlined";

export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Најавата не успеа.");
      router.push("/host/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Најавата не успеа.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-line bg-white p-6">
      <Outlined label="Е-пошта" required error="Внесете валидна е-пошта.">
        <input name="email" type="email" required autoComplete="email" placeholder=" " className={control} />
      </Outlined>
      <Outlined label="Лозинка" required>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder=" "
          className={control}
        />
      </Outlined>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {busy ? "Се најавувате…" : "Најави се"}
      </button>
      <p className="text-center text-base text-muted">
        Немате профил?{" "}
        <Link href="/host" className="font-medium text-accent underline underline-offset-2 hover:text-accent-dark">
          Станете домаќин
        </Link>
      </p>
    </form>
  );
}
