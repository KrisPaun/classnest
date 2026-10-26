"use client";

import { ReactNode, useState } from "react";
import { InfoPanel } from "./PortalUi";

/** Информативна кутија што може да се затвори со „×“ (до следно отворање на страницата). */
export default function DismissibleInfo({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <InfoPanel
      onClose={
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Затвори"
          className="absolute right-4 top-4 h-8 w-8 rounded-full text-xl leading-none text-muted hover:bg-black/5 hover:text-ink"
        >
          ×
        </button>
      }
    >
      {children}
    </InfoPanel>
  );
}
