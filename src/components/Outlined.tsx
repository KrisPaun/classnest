import { ReactNode } from "react";

// Поле со „плутачка“ ознака:
//  - празно и некликнато: ознаката е внатре во полето
//  - кликнато или пополнето: ознаката се качува на горната линија
//  - грешка (:user-invalid): дебела црвена линија, розова позадина и порака под полето
// Контролата мора да има className={control} и непразен placeholder (на пр. " ").

// Класите се пишуваат цели (Tailwind не гледа класи составени од променливи).
export const control =
  "peer w-full rounded-lg border border-field-border bg-field px-4 py-3.5 text-base outline-none transition " +
  "placeholder:text-transparent focus:border-accent focus:bg-accent/10 focus:shadow-[0_0_0_2px_var(--color-accent)] " +
  "focus:placeholder:text-muted/60 " +
  "[&:user-invalid]:border-[#b91c1c] [&:user-invalid]:bg-red-50 [&:user-invalid]:shadow-[0_0_0_2px_#b91c1c]";

const labelBase = "pointer-events-none absolute z-10 transition-all peer-[:user-invalid]:text-red-700";

// Ознаката почнува внатре и се качува при фокус или кога има вредност.
const labelFloating =
  `${labelBase} left-4 top-3.5 text-base text-muted ` +
  "peer-focus:-top-2.5 peer-focus:left-3 peer-focus:bg-white peer-focus:px-1.5 peer-focus:text-sm peer-focus:text-ink " +
  "peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:bg-white " +
  "peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:text-sm";

// За select: секогаш е на линијата (нема placeholder).
const labelRaised = `${labelBase} -top-2.5 left-3 bg-white px-1.5 text-sm text-muted peer-focus:text-ink`;

export function Outlined({
  label,
  required,
  raised,
  error = "Ова поле е задолжително.",
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  /** true за select, каде ознаката е секогаш горе */
  raised?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <span aria-hidden className={raised ? labelRaised : labelFloating}>
        {label}
        {required && " *"}
      </span>
      <span className="mt-1.5 hidden w-fit rounded-full border border-red-300 px-2 py-0.5 text-sm text-red-700 peer-[:user-invalid]:block">
        {error}
      </span>
    </div>
  );
}
