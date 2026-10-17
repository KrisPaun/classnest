import { promises as fs } from "fs";
import path from "path";
import type { CancellationPolicy, Fulfilment, ListingType } from "@/data/listing-types";
import type { Availability } from "./availability";
import type { PayoutFrequency } from "@/data/payout";

// PoC база: еден JSON фајл (.data/db.json). Во продукција: Postgres.
// Сите менувања поминуваат низ mutate(), кој ги сериализира и пишува атомски.

export type Account = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  hostSlug: string; // профил на домаќин (статичен од hosts.ts или динамичен од оваа база)
  phone?: string; // приватно: не се прикажува јавно
  createdAt: string;
};

export type DynamicHost = {
  slug: string;
  name: string;
  city: string;
  category?: string; // по желба: не се бара при регистрација
  about: string; // кратко, од регистрацијата: "Што би предавале?"
  story?: string; // подолга приказна, од чекор 1 на поставувањето
  profileCompletedAt?: string; // поставен кога е завршен чекор 1
  businessName?: string;
  website?: string; // нормализиран http(s) линк
  instagram?: string; // линк на instagram.com
  facebook?: string; // линк на facebook.com
  startedMonth?: number; // 1–12, кога е започнат бизнисот
  startedYear?: number;
  payout?: PayoutSettings; // чекор 4: исплата, бизнис и поставки на сметката
  createdAt: string;
};

export type BankDetails = {
  bankName: string;
  holder: string;
  ibanEnc: string; // шифриран IBAN (види lib/secret-box.ts). Никогаш не се праќа до прелистувачот.
  ibanLast4: string;
};

export type PayoutSettings = {
  bank: BankDetails;
  tradingName: string; // легален назив (или лично име за самовработени)
  taxNumber?: string; // ЕДБ, 13 цифри; нема ако домаќинот нема
  dobEnc?: string; // шифриран датум на раѓање (ГГГГ-ММ-ДД), само кога нема ЕДБ. Никогаш не се праќа до прелистувачот.
  vatRegistered: boolean; // регистриран за ДДВ
  onePublicBookingAtATime: boolean; // еден јавен термин се резервира само за една понуда
  allowSelfServiceChanges: boolean; // гостите сами откажуваат/менуваат според политиката
  allowPromoUse: boolean; // Classnest смее да користи слики/видеа за реклами
  payoutFrequency: PayoutFrequency;
  savedAt: string;
};

export type Experience = {
  id: string; // кратко hex, се користи и за клучот на фотографиите: exp-<id>
  hostSlug: string;
  type: ListingType;
  title: string;
  category: string;
  description: string;
  price: number; // МКД, по човек (или по производ)
  durationMinutes?: number; // час/искуство/онлајн: вкупно минути (15–720)
  durationHours?: number; // стар формат (децимални часови), само за читање
  maxPeople?: number; // час/искуство/онлајн
  cancellation?: CancellationPolicy; // час/искуство/онлајн: политика за откажување и промена
  availability?: Availability; // чекор 3: достапност за термини по барање
  /** active: видлива, temporary: привремено недостапна, permanent: трајно недостапна (подразбирано: active) */
  visibility?: "active" | "temporary" | "permanent";
  city?: string; // во живо (и по желба за производ)
  address?: string; // во живо
  maskLocation?: boolean; // во живо: јавно само градот, точната адреса по резервација
  platform?: string; // онлајн
  fulfilment?: Fulfilment; // производ
  createdAt: string;
  updatedAt: string;
};

export type SessionRow = { tokenHash: string; accountId: string; expiresAt: number };

export type Db = {
  accounts: Account[];
  hosts: DynamicHost[];
  experiences: Experience[];
  sessions: SessionRow[];
};

const FILE = path.join(process.cwd(), ".data", "db.json");

const empty = (): Db => ({ accounts: [], hosts: [], experiences: [], sessions: [] });

async function load(): Promise<Db> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8"));
    return { ...empty(), ...raw };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw e;
  }
}

async function save(db: Db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  await fs.rename(tmp, FILE);
}

let queue: Promise<unknown> = Promise.resolve();

export const readDb = () => load();

export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await save(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
