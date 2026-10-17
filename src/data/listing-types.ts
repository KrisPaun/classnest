export type ListingType = "class" | "food" | "experience" | "product" | "online";

/** in-person: час/искуство на локација, online: преку интернет, product: се продава производ. */
export type ListingKind = "in-person" | "online" | "product";

export type ListingTypeInfo = {
  id: ListingType;
  kind: ListingKind;
  label: string;
  description: string;
  emoji: string;
};

export const listingTypes: ListingTypeInfo[] = [
  {
    id: "class",
    kind: "in-person",
    label: "Час во живо",
    description: "Практично учење со раце, на пр. керамика, сликање, плетење.",
    emoji: "🏺",
  },
  {
    id: "food",
    kind: "in-person",
    label: "Искуство со храна во живо",
    description: "Правење храна заедно, на пр. паста или тирамису.",
    emoji: "🍝",
  },
  {
    id: "experience",
    kind: "in-person",
    label: "Искуство во живо",
    description: "Сè друго: дегустации, прошетки, работилници без практичен дел.",
    emoji: "✨",
  },
  {
    id: "product",
    kind: "product",
    label: "Производ",
    description: "Накит, даска со сирења, уметничко дело…",
    emoji: "🎁",
  },
  {
    id: "online",
    kind: "online",
    label: "Онлајн час",
    description: "Час преку интернет, на пр. преку Zoom.",
    emoji: "💻",
  },
];

export const getListingType = (id: string) => listingTypes.find((t) => t.id === id);

/** flexible: откажување и промена до N дена, reschedule: само промена до N дена, none: ништо од двете */
export const CANCELLATION_MODES = ["flexible", "reschedule", "none"] as const;
export type CancellationMode = (typeof CANCELLATION_MODES)[number];
export type CancellationPolicy = { mode: CancellationMode; days?: number };

export const FULFILMENT =["pickup", "delivery", "both"] as const;
export type Fulfilment = (typeof FULFILMENT)[number];

export const fulfilmentLabels: Record<Fulfilment, string> = {
  pickup: "Подигање лично",
  delivery: "Достава",
  both: "Подигање или достава",
};
