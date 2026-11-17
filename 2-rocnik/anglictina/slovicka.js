/* Slovíčka angličtiny pro 2. ročník – sdílí je stránky témat i opakování (globální AJ2). */
const AJ2 = (() => {
  const dot = (c, border) => `<span style="display:inline-block;width:1em;height:1em;border-radius:50%;vertical-align:-.12em;background:${c};border:${border ? "2px solid #999" : "0"}"></span>`;
  const rubber = `<svg viewBox="0 0 64 40" width="1.3em" height="1em" style="vertical-align:-.12em"><rect x="2" y="6" width="60" height="28" rx="6" fill="#ff8fb1"/><rect x="36" y="6" width="26" height="28" rx="6" fill="#5b8def"/><rect x="36" y="6" width="8" height="28" fill="#5b8def"/></svg>`;
  const czNum = ["jedna", "dva", "tři", "čtyři", "pět", "šest", "sedm", "osm", "devět", "deset",
    "jedenáct", "dvanáct", "třináct", "čtrnáct", "patnáct", "šestnáct", "sedmnáct", "osmnáct", "devatenáct", "dvacet"];
  const enNum = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const numbers = enNum.map((en, i) => ({ cz: czNum[i], en, e: String(i + 1), n: i + 1 }));
  return {
    numbers: numbers.slice(0, 10),
    numbersBonus: numbers.slice(10),
    colours: [
      { cz: "červená", en: "red", e: dot("#e53935") },
      { cz: "modrá", en: "blue", e: dot("#1e88e5") },
      { cz: "zelená", en: "green", e: dot("#43a047") },
      { cz: "žlutá", en: "yellow", e: dot("#fdd835") },
      { cz: "oranžová", en: "orange", e: dot("#fb8c00") },
      { cz: "fialová", en: "purple", e: dot("#8e24aa") },
      { cz: "růžová", en: "pink", e: dot("#f48fb1") },
      { cz: "hnědá", en: "brown", e: dot("#795548") },
      { cz: "černá", en: "black", e: dot("#111") },
      { cz: "bílá", en: "white", e: dot("#fff", true) },
      { cz: "šedá", en: "grey", alt: ["gray"], e: dot("#9e9e9e") },
    ],
    autumn: [
      { cz: "list", en: "a leaf", e: "🍁" },
      { cz: "strom", en: "a tree", e: "🌳" },
      { cz: "jablko", en: "an apple", e: "🍎" },
      { cz: "dýně", en: "a pumpkin", e: "🎃" },
      { cz: "houba", en: "a mushroom", e: "🍄" },
      { cz: "ježek", en: "a hedgehog", e: "🦔" },
      { cz: "veverka", en: "a squirrel", e: "🐿️" },
      { cz: "kaštan", en: "a chestnut", e: "🌰" },
      { cz: "déšť", en: "rain", e: "🌧️" },
      { cz: "deštník", en: "an umbrella", e: "☂️" },
      { cz: "vítr", en: "wind", e: "💨" },
      { cz: "drak (pouštěcí)", en: "a kite", e: "🪁" },
    ],
    school: [
      { cz: "tužka", en: "a pencil", e: "✏️" },
      { cz: "pero", en: "a pen", e: "🖊️" },
      { cz: "guma", en: "a rubber", alt: ["an eraser"], e: rubber },
      { cz: "pravítko", en: "a ruler", e: "📏" },
      { cz: "nůžky", en: "scissors", e: "✂️" },
      { cz: "lepidlo", en: "glue", e: "🧴" },
      { cz: "kniha", en: "a book", e: "📕" },
      { cz: "sešit", en: "an exercise book", alt: ["a notebook"], e: "📒" },
      { cz: "pastelka", en: "a crayon", alt: ["a coloured pencil"], e: "🖍️" },
      { cz: "školní taška", en: "a schoolbag", alt: ["a school bag", "a bag"], e: "🎒" },
      { cz: "penál", en: "a pencil case", e: "👝" },
      { cz: "židle", en: "a chair", e: "🪑" },
    ],
  };
})();
