/** Најавена сметка, како што ја гледа остатокот од апликацијата. */
export type Account = {
  id: string;
  email: string;
  name: string;
  /**
   * Slug на профилот на домаќинот (од .data/db.json или од hosts.ts).
   * Празен за сметки без профил на домаќин. Се заменува со hosts.account_id во чекор 4.
   */
  hostSlug: string;
  createdAt: Date;
};

export class EmailTakenError extends Error {
  constructor() {
    super("Email is already registered");
    this.name = "EmailTakenError";
  }
}
