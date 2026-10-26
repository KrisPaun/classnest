import { sql } from "drizzle-orm";
import {
  char,
  check,
  datetime,
  foreignKey,
  index,
  mysqlTable,
  primaryKey,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { idColumn, timestamps } from "../columns";

// Идентитет: најава за домаќини, гости и администратори (види docs/backend-design.md, секција 5.2).

export const accounts = mysqlTable(
  "accounts",
  {
    id: idColumn(),
    email: varchar("email", { length: 254 }).notNull(), // секогаш мали букви (апликацијата ги нормализира)
    fullName: varchar("full_name", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(), // scrypt$salt$hash
    status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
    emailVerifiedAt: datetime("email_verified_at", { mode: "date", fsp: 3 }),
    lastLoginAt: datetime("last_login_at", { mode: "date", fsp: 3 }),
    /**
     * ПРИВРЕМЕНО (до чекор 4): slug на профилот на домаќинот што сè уште е во .data/db.json.
     * Се брише кога домаќините се префрлат во базата (hosts.account_id).
     */
    legacyHostSlug: varchar("legacy_host_slug", { length: 80 }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("accounts_email_uq").on(t.email),
    uniqueIndex("accounts_legacy_host_slug_uq").on(t.legacyHostSlug),
    check("accounts_status_chk", sql`${t.status} in ('ACTIVE', 'SUSPENDED', 'DELETED')`),
  ],
);

export const accountRoles = mysqlTable(
  "account_roles",
  {
    accountId: char("account_id", { length: 36 }).notNull(),
    role: varchar("role", { length: 16 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.accountId, t.role] }),
    foreignKey({
      columns: [t.accountId],
      foreignColumns: [accounts.id],
      name: "account_roles_account_fk",
    }).onDelete("cascade"),
    check("account_roles_role_chk", sql`${t.role} in ('HOST', 'GUEST', 'ADMIN')`),
  ],
);

/** Сесии на сервер: во базата стои само SHA-256 хеш од токенот, па протечена база не дава валидни сесии. */
export const authSessions = mysqlTable(
  "auth_sessions",
  {
    id: idColumn(),
    accountId: char("account_id", { length: 36 }).notNull(),
    tokenHash: char("token_hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    lastSeenAt: datetime("last_seen_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    ip: varchar("ip", { length: 45 }),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    uniqueIndex("auth_sessions_token_uq").on(t.tokenHash),
    index("auth_sessions_account_idx").on(t.accountId),
    index("auth_sessions_expires_idx").on(t.expiresAt),
    foreignKey({
      columns: [t.accountId],
      foreignColumns: [accounts.id],
      name: "auth_sessions_account_fk",
    }).onDelete("cascade"),
  ],
);

export type AccountRow = typeof accounts.$inferSelect;
