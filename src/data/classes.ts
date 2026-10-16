export type Category = { slug: string; name: string; emoji: string };
export type City = { slug: string; name: string };

export type ClassItem = {
  slug: string;
  title: string;
  category: string;
  city: string;
  price: number; // МКД по човек
  durationHours: number;
  maxPeople: number;
  rating: number;
  reviews: number;
  host: string;
  hostBio: string;
  description: string;
  includes: string[];
  emoji: string;
  gradient: string;
  location: string;
};

export const categories: Category[] = [
  { slug: "gotvenje", name: "Готвење", emoji: "🍝" },
  { slug: "keramika", name: "Керамика", emoji: "🏺" },
  { slug: "slikanje", name: "Сликање", emoji: "🎨" },
  { slug: "vino", name: "Вино и храна", emoji: "🍷" },
  { slug: "muzika", name: "Музика", emoji: "🎸" },
  { slug: "fotografija", name: "Фотографија", emoji: "📷" },
  { slug: "cvekjarstvo", name: "Цвеќарство", emoji: "💐" },
  { slug: "zanaeti", name: "Занает", emoji: "🧵" },
];

export const cities: City[] = [
  { slug: "skopje", name: "Скопје" },
  { slug: "ohrid", name: "Охрид" },
  { slug: "bitola", name: "Битола" },
];

export const classes: ClassItem[] = [
  {
    slug: "tavche-gravche-so-nikola",
    title: "Тавче гравче и македонска кујна",
    category: "gotvenje",
    city: "skopje",
    price: 1900,
    durationHours: 3,
    maxPeople: 8,
    rating: 4.9,
    reviews: 42,
    host: "Никола Стојанов",
    hostBio: "Готвач со 15 години искуство во ресторани во Скопје и Виена.",
    description:
      "Научете како се подготвува вистинско тавче гравче, шопска салата и баница од нула. На крај седнуваме заедно и ја јадеме вечерата што ја направивме.",
    includes: ["Сите состојки", "Престилка", "Рецепти за дома", "Вечера и пијалок"],
    emoji: "🍲",
    gradient: "from-orange-200 to-amber-300",
    location: "Старата чаршија, Скопје",
  },
  {
    slug: "domasna-pasta",
    title: "Домашна паста и тирамису",
    category: "gotvenje",
    city: "skopje",
    price: 2200,
    durationHours: 3,
    maxPeople: 10,
    rating: 4.8,
    reviews: 31,
    host: "Марија Ристовска",
    hostBio: "Љубител на италијанската кујна, ги учи гостите да прават паста на рака.",
    description:
      "Од брашно и јајца до свежи таљатели и кремаст тирамису. Идеално за парови и групи пријатели.",
    includes: ["Сите состојки", "Чаша вино", "Рецепти"],
    emoji: "🍝",
    gradient: "from-yellow-200 to-orange-300",
    location: "Центар, Скопје",
  },
  {
    slug: "grncarstvo-za-pocetnici",
    title: "Грнчарство за почетници",
    category: "keramika",
    city: "skopje",
    price: 2500,
    durationHours: 2.5,
    maxPeople: 6,
    rating: 5.0,
    reviews: 27,
    host: "Ана Димитровска",
    hostBio: "Керамичарка и дипломирана на Факултетот за ликовни уметности.",
    description:
      "Седнете на грнчарско тркало и направете своја чаша или чинија. Изработката се пече и можете да ја подигнете по две недели.",
    includes: ["Глина и алат", "Печење на изработката", "Чај и закуска"],
    emoji: "🏺",
    gradient: "from-rose-200 to-orange-200",
    location: "Дебар Маало, Скопје",
  },
  {
    slug: "ohridski-biseri-nakit",
    title: "Изработка на накит со охридски бисер",
    category: "zanaeti",
    city: "ohrid",
    price: 2800,
    durationHours: 2,
    maxPeople: 6,
    rating: 4.9,
    reviews: 19,
    host: "Билјана Трајковска",
    hostBio: "Третата генерација на семејство со традиција во изработка на охридски бисер.",
    description:
      "Научете за историјата на охридскиот бисер и направете сопствена алка или привезок под водство на мајстор.",
    includes: ["Материјали", "Кутија за подарок", "Кафе или чај"],
    emoji: "📿",
    gradient: "from-sky-200 to-indigo-200",
    location: "Стара чаршија, Охрид",
  },
  {
    slug: "vino-i-sirenje-ohrid",
    title: "Дегустација на вино и сирења",
    category: "vino",
    city: "ohrid",
    price: 2400,
    durationHours: 2,
    maxPeople: 12,
    rating: 4.7,
    reviews: 53,
    host: "Горан Петров",
    hostBio: "Сомелиер и сопственик на мала визба над Охридското Езеро.",
    description:
      "Пет македонски вина, пет локални сирења и приказни зад секое од нив, со поглед на езерото.",
    includes: ["5 вина", "Даска со сирења", "Леб и маслинки"],
    emoji: "🍷",
    gradient: "from-purple-200 to-rose-300",
    location: "Лагадин, Охрид",
  },
  {
    slug: "slikanje-pri-ezero",
    title: "Сликање со акварел покрај езерото",
    category: "slikanje",
    city: "ohrid",
    price: 1700,
    durationHours: 2.5,
    maxPeople: 8,
    rating: 4.8,
    reviews: 22,
    host: "Елена Јовановска",
    hostBio: "Сликарка и предавач, организира работилници на отворено.",
    description:
      "Без потребно предзнаење. Заедно ќе насликаме пејзаж на Охридското Езеро со акварел.",
    includes: ["Боја, четки и платно", "Кафе"],
    emoji: "🎨",
    gradient: "from-cyan-200 to-sky-300",
    location: "Каней, Охрид",
  },
  {
    slug: "fotografija-bitola",
    title: "Улична фотографија низ Широк Сокак",
    category: "fotografija",
    city: "bitola",
    price: 1500,
    durationHours: 3,
    maxPeople: 8,
    rating: 4.9,
    reviews: 14,
    host: "Дарко Илиев",
    hostBio: "Фотограф со изложби во Македонија и Србија.",
    description:
      "Прошетка низ Битола со совети за композиција, светло и портрети. Доволен е и телефон.",
    includes: ["Лични совети", "Преглед на фотографиите", "Кафе"],
    emoji: "📷",
    gradient: "from-stone-200 to-zinc-300",
    location: "Широк Сокак, Битола",
  },
  {
    slug: "gitara-za-pocetnici",
    title: "Гитара за почетници за еден ден",
    category: "muzika",
    city: "bitola",
    price: 1400,
    durationHours: 2,
    maxPeople: 6,
    rating: 4.6,
    reviews: 11,
    host: "Стефан Крстев",
    hostBio: "Музичар и наставник по гитара веќе 10 години.",
    description:
      "Научете три акорди и одсвирете ја вашата прва песна. Гитарите ги обезбедуваме ние.",
    includes: ["Гитара за час", "Ноти и акорди"],
    emoji: "🎸",
    gradient: "from-amber-200 to-red-200",
    location: "Центар, Битола",
  },
  {
    slug: "cvetni-aranzmani",
    title: "Цветни аранжмани и венци",
    category: "cvekjarstvo",
    city: "skopje",
    price: 1800,
    durationHours: 2,
    maxPeople: 10,
    rating: 4.9,
    reviews: 36,
    host: "Софија Андреева",
    hostBio: "Цвеќарка со сопствено студио во Скопје.",
    description:
      "Направете сопствен букет или венец од свежо цвеќе и однесете го дома.",
    includes: ["Свежо цвеќе", "Материјали", "Чаша пенливо"],
    emoji: "💐",
    gradient: "from-pink-200 to-rose-300",
    location: "Карпош, Скопје",
  },
  {
    slug: "sushi-skopje",
    title: "Вечер со суши",
    category: "gotvenje",
    city: "skopje",
    price: 2600,
    durationHours: 2.5,
    maxPeople: 8,
    rating: 4.8,
    reviews: 25,
    host: "Кирил Ангелов",
    hostBio: "Готвач специјализиран за азиска кујна.",
    description:
      "Научете да правите маки, нигири и уромаки и вечерајте со она што сте го направиле.",
    includes: ["Сите состојки", "Прибор", "Зелен чај"],
    emoji: "🍣",
    gradient: "from-emerald-200 to-teal-300",
    location: "Аеродром, Скопје",
  },
  {
    slug: "vino-bitola",
    title: "Вечер со вина од Тиквешијата",
    category: "vino",
    city: "bitola",
    price: 2100,
    durationHours: 2,
    maxPeople: 12,
    rating: 4.7,
    reviews: 17,
    host: "Васко Митев",
    hostBio: "Винар од трето колено, ги претставува вината од Тиквешијата.",
    description:
      "Дегустација на шест вина со приказни за лозјата, берба и производство.",
    includes: ["6 вина", "Ладни предјадења"],
    emoji: "🍇",
    gradient: "from-violet-200 to-fuchsia-300",
    location: "Центар, Битола",
  },
  {
    slug: "tkaenje-na-razboj",
    title: "Ткаење на разбој",
    category: "zanaeti",
    city: "bitola",
    price: 1600,
    durationHours: 3,
    maxPeople: 5,
    rating: 5.0,
    reviews: 9,
    host: "Лидија Серафимова",
    hostBio: "Чувар на традиционалното ткаење, организира работилници за млади.",
    description:
      "Запознајте го традиционалното ткаење и изработете мал ќилимец или подметач на разбој.",
    includes: ["Материјали", "Чај и бисквити"],
    emoji: "🧵",
    gradient: "from-lime-200 to-green-300",
    location: "Стара чаршија, Битола",
  },
];

export const getClass = (slug: string) => classes.find((c) => c.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getCity = (slug: string) => cities.find((c) => c.slug === slug);
