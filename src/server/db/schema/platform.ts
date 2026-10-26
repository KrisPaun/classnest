import {
  char,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { idColumn, timestamps } from "../columns";

// Платформски табели што ги користат сите модули (види docs/backend-design.md, секција 5.10).

/**
 * Outbox: настан се запишува во иста трансакција со деловната промена.
 * Cron крајната точка ги обработува настаните (е-пошта, мали слики, истекување на резервации).
 */
export const outboxEvents = mysqlTable(
  "outbox_events",
  {
    id: idColumn(),
    aggregateType: varchar("aggregate_type", { length: 64 }).notNull(),
    aggregateId: char("aggregate_id", { length: 36 }).notNull(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    payload: json("payload").notNull(),
    attempts: int("attempts").notNull().default(0),
    nextAttemptAt: datetime("next_attempt_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    processedAt: datetime("processed_at", { mode: "date", fsp: 3 }),
    createdAt: timestamps().createdAt,
  },
  (t) => [index("outbox_pending_idx").on(t.processedAt, t.nextAttemptAt)],
);

/** Ревизиска трага: кој што променил. Само се додава, никогаш не се менува. */
export const auditLog = mysqlTable(
  "audit_log",
  {
    id: idColumn(),
    actorAccountId: char("actor_account_id", { length: 36 }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: char("entity_id", { length: 36 }),
    diff: json("diff"),
    ip: varchar("ip", { length: 45 }),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_actor_idx").on(t.actorAccountId, t.createdAt),
  ],
);

/** Заштита од двојно извршување на ист API повик (на пр. двоен клик на „Резервирај“). */
export const idempotencyKeys = mysqlTable(
  "idempotency_keys",
  {
    scope: varchar("scope", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    requestHash: char("request_hash", { length: 64 }).notNull(),
    responseStatus: int("response_status"),
    responseBody: json("response_body"),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.scope, t.idempotencyKey] }),
    index("idempotency_created_idx").on(t.createdAt),
  ],
);

export type OutboxEvent = typeof outboxEvents.$inferSelect;
export type NewOutboxEvent = typeof outboxEvents.$inferInsert;
