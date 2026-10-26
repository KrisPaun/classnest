import type { ListingStatus, ListingVisibility } from "./types";

// Домаќинот гледа „видлива / привремено / трајно недостапна“, а базата чува поточен статус.

export function statusToVisibility(status: ListingStatus): ListingVisibility {
  if (status === "HIDDEN_TEMPORARY") return "temporary";
  if (status === "HIDDEN_PERMANENT") return "permanent";
  return "active";
}

/**
 * Нов статус според изборот на домаќинот.
 * „Прикажи“ од скриена состојба враќа на PUBLISHED ако понудата некогаш била одобрена (`wasPublished`),
 * а инаку на IN_REVIEW. Така скривањето и враќањето не бара повторно одобрување.
 */
export function visibilityToStatus(
  visibility: ListingVisibility,
  current: ListingStatus,
  wasPublished = false,
): ListingStatus {
  // Симната од администратор: домаќинот не може ниту да ја скрие ниту да ја прикаже.
  if (current === "TAKEN_DOWN") return current;
  if (visibility === "temporary") return "HIDDEN_TEMPORARY";
  if (visibility === "permanent") return "HIDDEN_PERMANENT";
  if (current === "HIDDEN_TEMPORARY" || current === "HIDDEN_PERMANENT") {
    return wasPublished ? "PUBLISHED" : "IN_REVIEW";
  }
  return current;
}

/** Може ли домаќинот да го менува „скриј / прикажи“? Не, ако е симната од администратор. */
export const canChangeVisibility = (status: ListingStatus) => status !== "TAKEN_DOWN";

/** Може ли модераторот да ја објави понудата од тековниот статус? (од „симната“ значи „врати“) */
export const canPublish = (status: ListingStatus) =>
  status === "IN_REVIEW" || status === "REJECTED" || status === "TAKEN_DOWN";

/** Може ли модераторот да ја одбие понудата од тековниот статус? */
export const canReject = (status: ListingStatus) => status === "IN_REVIEW";

/** Може ли модераторот да ја симне понудата? Само објавена. */
export const canTakeDown = (status: ListingStatus) => status === "PUBLISHED";

/** Домаќинот ја менува одбиена понуда: оди пак на преглед. */
export const statusAfterHostEdit = (status: ListingStatus): ListingStatus =>
  status === "REJECTED" ? "IN_REVIEW" : status;
