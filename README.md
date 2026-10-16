# Classnest.mk – PoC

Демо на маркетплејс за работилници и искуства (Next.js + Tailwind). Податоците се примерни, без база и без плаќање.

## Стартување

```bash
npm install
npm run dev
```

Отворете http://localhost:3000.

## Структура

- `src/data/classes.ts` – категории, градови, 12 примерни работилници
- `src/app/` – страници (почетна, листа, детали, checkout, потврда, домаќин)
- `src/components/` – Header, Footer, ClassCard, SearchForm, BookingWidget, CheckoutForm, HostForm
- Боите се менуваат во `src/app/globals.css` (`@theme`)

## Домаќини: регистрација, најава, фотографии

- `/host` – регистрација (име, е-пошта, лозинка, град, категорија, опис и до 6 фотографии)
- `/host/login` – најава, `/host/dashboard` – табла со фотографии за сопствениот профил и искуства
- Податоците се во `.data/db.json` (PoC, не се комитира), фотографиите во `uploads/` (не се комитираат)
- Лозинки: scrypt. Сесии: httpOnly cookie, во базата се чува само хеш на токенот.
- Демо домаќин со искуства: `npm run host:create -- <email> <лозинка> nikola-stojanov`
- Фотографии за демо: `npm run seed:photos` (види `seed-photos/README.md`)

## Следно (MVP)

Postgres наместо JSON, S3/R2 за фотографии, додавање искуства од домаќини, ресет на лозинка и потврда на е-пошта, CaSys плаќање, рецензии, ваучери.
