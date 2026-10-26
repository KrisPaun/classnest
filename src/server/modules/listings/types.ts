import type { CancellationPolicy, Fulfilment, ListingType } from "@/data/listing-types";
import type { Availability } from "@/lib/availability";

export const LISTING_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "HIDDEN_TEMPORARY",
  "HIDDEN_PERMANENT",
  "REJECTED",
  "TAKEN_DOWN", // симната од администратор: домаќинот не може сам да ја врати
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Како го гледа домаќинот: видлива, привремено или трајно недостапна. */
export type ListingVisibility = "active" | "temporary" | "permanent";

/** Понуда како што ја гледа остатокот од апликацијата. Цените се цели денари (во базата: price_minor / 100). */
export type ListingRecord = {
  id: string;
  hostSlug: string;
  slug: string;
  type: ListingType;
  title: string;
  category: string; // slug на категоријата
  description: string;
  price: number; // МКД, по човек (или по производ)
  durationMinutes?: number;
  maxPeople?: number;
  cancellation?: CancellationPolicy;
  availability?: Availability;
  status: ListingStatus;
  visibility: ListingVisibility;
  publishedAt?: Date; // кога е одобрена за прв пат
  moderationNote?: string; // причина за одбивање или симнување (само за домаќинот)
  city?: string; // slug на градот
  address?: string;
  maskLocation?: boolean;
  platform?: string;
  fulfilment?: Fulfilment;
  createdAt: Date;
  updatedAt: Date;
};

/** Што се зачувува од чекор 2. Полињата што не важат за типот не се праќаат. */
export type ListingInput = {
  type: ListingType;
  title: string;
  category: string;
  description: string;
  price: number;
  durationMinutes?: number;
  maxPeople?: number;
  cancellation?: CancellationPolicy;
  city?: string;
  address?: string;
  maskLocation?: boolean;
  platform?: string;
  fulfilment?: Fulfilment;
};

/**
 * Јавен поглед на објавена понуда (за посетители). Не содржи ништо приватно:
 * точната адреса се враќа САМО ако домаќинот не побарал да ја скрие.
 */
export type PublicListing = {
  id: string;
  slug: string;
  type: ListingType;
  title: string;
  description: string;
  category: { slug: string; name: string; emoji?: string };
  city?: { slug: string; name: string };
  address?: string;
  maskLocation: boolean;
  price: number; // цели денари
  durationMinutes?: number;
  maxPeople?: number;
  platform?: string;
  fulfilment?: Fulfilment;
  cancellation?: CancellationPolicy;
  rating?: number; // само ако има рецензии
  reviewCount: number;
  host: { slug: string; name: string; businessName?: string };
  publishedAt: Date;
};

export type ListingSearch = {
  q?: string;
  category?: string; // slug
  city?: string; // slug
  limit?: number;
};

/** Ред во админ листата: сè што му треба на модераторот за одлука. Не е јавно. */
export type ModerationItem = {
  id: string;
  slug: string;
  type: ListingType;
  title: string;
  description: string;
  status: ListingStatus;
  category: string; // име
  city?: string; // име
  address?: string;
  maskLocation: boolean;
  price: number;
  durationMinutes?: number;
  maxPeople?: number;
  platform?: string;
  fulfilment?: Fulfilment;
  host: { slug: string; name: string };
  moderationNote?: string;
  createdAt: Date;
  publishedAt?: Date;
};

/** Кој ја презема одлуката. Без `accountId` = командна линија. */
export type ModerationActor = { accountId?: string; ip?: string };
