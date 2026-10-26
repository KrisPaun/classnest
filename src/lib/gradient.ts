const gradients = [
  "from-orange-300 to-amber-400",
  "from-rose-300 to-orange-300",
  "from-sky-300 to-indigo-300",
  "from-emerald-300 to-teal-400",
  "from-violet-300 to-fuchsia-400",
  "from-lime-300 to-green-400",
];

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Стабилен градиент за дадена ознака (slug), за места каде што нема фотографија. */
export const gradientFor = (key: string) => gradients[hash(key) % gradients.length];
