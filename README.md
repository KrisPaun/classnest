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

## Следно (MVP)

База (Postgres + Prisma), најава, dashboard за домаќини, CaSys плаќање, е-пошта, рецензии, ваучери.
