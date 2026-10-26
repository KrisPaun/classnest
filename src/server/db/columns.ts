import { sql } from "drizzle-orm";
import { char, datetime } from "drizzle-orm/mysql-core";
import { uuidv7 } from "../platform/ids.mjs";

// Заеднички колони за сите табели (види docs/backend-design.md, секција 4).
// Во шемата се користат релативни увози, бидејќи drizzle-kit не го познава алиасот "@/".

/** Примарен клуч: UUIDv7 како char(36), генериран во апликацијата. */
export const idColumn = () =>
  char("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv7());

/** created_at и updated_at: datetime(3) во UTC (не TIMESTAMP, кој запира во 2038). */
// Времето го дава апликацијата (UTC), не часовникот на серверот на базата. Така е исто и на Hostinger,
// чија база може да не е на UTC. DEFAULT во табелата останува само како резерва за рачни вметнувања.
export const timestamps = () => ({
  createdAt: datetime("created_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
