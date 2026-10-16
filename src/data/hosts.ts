import { classes, ClassItem } from "./classes";

export type Review = { author: string; rating: number; text: string };

export type Host = {
  slug: string;
  name: string; // мора да се совпаѓа со ClassItem.host
  city: string;
  since: number;
  languages: string[];
  story: string;
  badges: string[];
  gradient: string;
  reviews: Review[];
};

export const hosts: Host[] = [
  {
    slug: "nikola-stojanov",
    name: "Никола Стојанов",
    city: "skopje",
    since: 2022,
    languages: ["Македонски", "Англиски", "Германски"],
    story:
      "Готвам од тинејџер, а професионално од 2009 година. Работев во ресторани во Скопје и Виена, а денес сакам да ја пренесам македонската кујна на луѓе што сакаат да научат како се прави вистинско тавче гравче. Кај мене нема тајни рецепти. Сè се споделува.",
    badges: ["Топ домаќин", "Одговара брзо"],
    gradient: "from-orange-300 to-amber-400",
    reviews: [
      { author: "Јована К.", rating: 5, text: "Одлична атмосфера и најдобро тавче гравче што сум го јадела. Никола е многу трпелив." },
      { author: "Мартин П.", rating: 5, text: "Идеален подарок за родителите. Сите се одушевени." },
    ],
  },
  {
    slug: "marija-ristovska",
    name: "Марија Ристовска",
    city: "skopje",
    since: 2023,
    languages: ["Македонски", "Англиски", "Италијански"],
    story:
      "Откако живеев една година во Болоња, паста правам само на рака. На моите работилници сите месиме, ги сечеме таљателите и на крај заедно ја јадеме вечерата со чаша вино.",
    badges: ["Омилена за групи"],
    gradient: "from-yellow-300 to-orange-400",
    reviews: [
      { author: "Ивана С.", rating: 5, text: "Дојдовме 6 другарки и поминавме супер. Тирамисуто е за паметење!" },
      { author: "Бојан Т.", rating: 4, text: "Многу забавно, само малку беше тесно во кујната." },
    ],
  },
  {
    slug: "ana-dimitrovska",
    name: "Ана Димитровска",
    city: "skopje",
    since: 2021,
    languages: ["Македонски", "Англиски"],
    story:
      "Керамичарка сум повеќе од десет години. Во моето студио во Дебар Маало секој ќе го пронајде мирот пред грнчарското тркало и ќе однесе дома нешто што сам го направил.",
    badges: ["Топ домаќин", "5★ просек"],
    gradient: "from-rose-300 to-orange-300",
    reviews: [
      { author: "Теодора Н.", rating: 5, text: "Најопуштено искуство досега. Чашата ми е омилена." },
      { author: "Филип Г.", rating: 5, text: "Ана објаснува многу јасно, дури и кога првпат ќе пробаш." },
    ],
  },
  {
    slug: "biljana-trajkovska",
    name: "Билјана Трајковска",
    city: "ohrid",
    since: 2022,
    languages: ["Македонски", "Англиски"],
    story:
      "Мојата фамилија го работи охридскиот бисер три генерации. Ја учам историјата и занаетот на гости од цел свет, па секој оди дома со накит што сам го направил.",
    badges: ["Традиционален занает"],
    gradient: "from-sky-300 to-indigo-300",
    reviews: [
      { author: "Сара М.", rating: 5, text: "Прекрасна приказна и убав привезок за спомен од Охрид." },
      { author: "Дејан Л.", rating: 5, text: "Билјана е топла и пријатна. Препорака!" },
    ],
  },
  {
    slug: "goran-petrov",
    name: "Горан Петров",
    city: "ohrid",
    since: 2021,
    languages: ["Македонски", "Англиски", "Германски"],
    story:
      "Сомелиер сум и имам мала визба над Охридското Езеро. Вечерите ги правам неформални: добро вино, локални сирења и приказни зад секоја чаша.",
    badges: ["Топ домаќин"],
    gradient: "from-purple-300 to-rose-400",
    reviews: [
      { author: "Катерина В.", rating: 5, text: "Поглед, вино и добро друштво. Не сакавме да заминеме." },
      { author: "Роберт А.", rating: 4, text: "Одличен избор на вина, малку подолго од најавеното." },
    ],
  },
  {
    slug: "elena-jovanovska",
    name: "Елена Јовановска",
    city: "ohrid",
    since: 2023,
    languages: ["Македонски", "Англиски"],
    story:
      "Сликам од дете и предавам веќе осум години. Работилниците ги правам на отворено, затоа што најдобрите пејзажи се токму тука, покрај езерото.",
    badges: ["Одговара брзо"],
    gradient: "from-cyan-300 to-sky-400",
    reviews: [
      { author: "Мила Д.", rating: 5, text: "Никогаш не сум сликала, а излегов со слика за дома." },
      { author: "Горан Р.", rating: 5, text: "Опуштено и креативно. Елена е одличен ментор." },
    ],
  },
  {
    slug: "darko-iliev",
    name: "Дарко Илиев",
    city: "bitola",
    since: 2023,
    languages: ["Македонски", "Англиски", "Српски"],
    story:
      "Фотографирам улици и луѓе повеќе од петнаесет години. На прошетките низ Широк Сокак ги делам советите што ми беа најкорисни, без технички жаргон.",
    badges: ["Нов домаќин"],
    gradient: "from-stone-300 to-zinc-400",
    reviews: [
      { author: "Андреј Б.", rating: 5, text: "Научив повеќе за 3 часа отколку од десетици видеа." },
      { author: "Николина Ј.", rating: 5, text: "Многу добар водич и убаво друштво." },
    ],
  },
  {
    slug: "stefan-krstev",
    name: "Стефан Крстев",
    city: "bitola",
    since: 2024,
    languages: ["Македонски", "Англиски"],
    story:
      "Свирам гитара од 12-годишна возраст и предавам 10 години. Верувам дека секој може да научи три акорди за еден ден и да одсвири песна пред другарите.",
    badges: ["Нов домаќин"],
    gradient: "from-amber-300 to-red-300",
    reviews: [
      { author: "Влатко Е.", rating: 5, text: "Првпат фатив гитара и веќе знам песна. Супер!" },
      { author: "Ирена П.", rating: 4, text: "Многу трпелив. Би дошла пак за напредно ниво." },
    ],
  },
  {
    slug: "sofija-andreeva",
    name: "Софија Андреева",
    city: "skopje",
    since: 2022,
    languages: ["Македонски", "Англиски"],
    story:
      "Моето студио е полно со свежо цвеќе секој ден. Сакам луѓето да се опуштат, да мирисаат и да направат нешто убаво со рацете.",
    badges: ["Топ домаќин", "Омилена за групи"],
    gradient: "from-pink-300 to-rose-400",
    reviews: [
      { author: "Тамара С.", rating: 5, text: "Организиравме моминска вечер и беше феноменално." },
      { author: "Елизабета Ц.", rating: 5, text: "Прекрасен букет и многу пријатна атмосфера." },
    ],
  },
  {
    slug: "kiril-angelov",
    name: "Кирил Ангелов",
    city: "skopje",
    since: 2023,
    languages: ["Македонски", "Англиски", "Јапонски (основно)"],
    story:
      "Азиската кујна ме фасцинира од студентските денови. Суши е повеќе техника отколку тајна, па затоа на работилницата секој прави свои ролни од почеток.",
    badges: ["Одговара брзо"],
    gradient: "from-emerald-300 to-teal-400",
    reviews: [
      { author: "Дарја Ш.", rating: 5, text: "Забавна вечер и вкусни ролни. Кирил е одличен." },
      { author: "Марко З.", rating: 4, text: "Супер искуство, мало пожелба: повеќе вегетаријански опции." },
    ],
  },
  {
    slug: "vasko-mitev",
    name: "Васко Митев",
    city: "bitola",
    since: 2022,
    languages: ["Македонски", "Англиски"],
    story:
      "Винар сум од трето колено од Тиквешијата. Вечерите во Битола ги правам за да ги претставам вината од мојот крај и приказните од лозјата.",
    badges: ["Традиционален занает"],
    gradient: "from-violet-300 to-fuchsia-400",
    reviews: [
      { author: "Ема Т.", rating: 5, text: "Вина од врвен квалитет и приказни што се паметат." },
      { author: "Саво Н.", rating: 4, text: "Одлична дегустација и вкусни предјадења." },
    ],
  },
  {
    slug: "lidija-serafimova",
    name: "Лидија Серафимова",
    city: "bitola",
    since: 2024,
    languages: ["Македонски"],
    story:
      "Ткаењето ми го пренесе баба ми. Сакам тој занает да не исчезне, затоа ги учам младите на разбој и со задоволство гледам како раѓаат нови мотиви.",
    badges: ["Традиционален занает", "5★ просек"],
    gradient: "from-lime-300 to-green-400",
    reviews: [
      { author: "Анастасија Р.", rating: 5, text: "Трогателна приказна и многу убаво искуство." },
      { author: "Борис Д.", rating: 5, text: "Лидија е вистински мајстор. Ќилимчето го чувам." },
    ],
  },
];

export const getHost = (slug: string) => hosts.find((h) => h.slug === slug);
export const getHostByName = (name: string) => hosts.find((h) => h.name === name);
export const getHostClasses = (host: Host): ClassItem[] =>
  classes.filter((c) => c.host === host.name);

export const hostStats = (host: Host) => {
  const list = getHostClasses(host);
  const reviews = list.reduce((sum, c) => sum + c.reviews, 0);
  const rating = reviews
    ? list.reduce((sum, c) => sum + c.rating * c.reviews, 0) / reviews
    : 0;
  return { classCount: list.length, reviews, rating };
};
