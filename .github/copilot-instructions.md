# Škola – interaktivní procvičovací stránky

Statické HTML stránky pro žáka ZŠ (začátečník, mluví česky). Každá stránka funguje otevřením souboru v prohlížeči (`file://`). Nepoužívej build, npm, ES moduly ani externí CDN.

## Struktura

```
index.html                    rozcestník ročníků
common/skola.css, skola.js    sdílený styl + logika (hlas, body, režimy, engine slovíček)
common/cvic.js                sdílení pomocníci pro češtinu a matematiku (načítá se po skola.js)
<N>-rocnik/index.html         rozcestník předmětů (anglictina, cestina, matematika)
<N>-rocnik/<predmet>/index.html   rozcestník témat (dlaždice)
<N>-rocnik/<predmet>/<tema>.html  stránky témat
```

- Názvy souborů a adresářů piš bez diakritiky a mezer, slova odděluj pomlčkou (`veci-denni-potreby.html`).
- Každou novou stránku přidej jako dlaždici do `index.html` v nadřazeném adresáři.
- Rozcestník angličtiny má sekce `<h2 class="sec">📖 Slovníčky</h2>` a `<h2 class="sec">✏️ Gramatika a cvičení</h2>`. Dlaždice slovníčku má class `tile vocab` (zelený okraj a štítek „📖 slovníček“) a jednu ikonu tématu, která se mezi dlaždicemi neopakuje.
- Odkaz zpět na stránce: `<a class="home" href="index.html">← Všechna témata</a>`.
- Cesty ke společným souborům jsou relativní: `../../common/skola.css` a `../../common/skola.js`.

## Nová stránka se slovíčky (nejrychlejší cesta)

1. Zkopíruj `4-rocnik/anglictina/skola-slovicka.html`.
2. Změň `<title>`, `<h1>`, `scoreKey` (musí být unikátní), `demo` a pole `words`.
3. Formát slova: `{ cz, en, e: "emoji", alt?: [...], say?: "text k vyslovení", w?: "slovo bez členu" }`.
   - `en` se zobrazuje a vyslovuje. Může obsahovat člen (`"a laptop"`), v psaní se pak uzná i bez členu. U slov bez členu (`glasses`) se člen naopak neuzná.
   - `say` použij, když hlas čte slovo špatně (např. `PE` → `"P. E."`).
   - `alt` obsahuje rozumné alternativní odpovědi (synonyma, americká varianta, varianta bez apostrofu).
   - Volitelně `learnExtra: "<div class='box'>…</div>"` přidá vysvětlení pod kartičky.
4. Vzor s členy a vysvětlením: `veci-denni-potreby.html`.
5. Režim 👂 Poslech (zazní slovo, dítě klikne na 1 ze 4 obrázků – bez čtení): přidej do `<nav>` tlačítko `data-mode="listen"`. `e` může být i HTML (barevná tečka, SVG).
6. `groups: [{ title, words }]` rozdělí Učím se do sekcí s nadpisy; může obsahovat i slova mimo `words` (bonus). Vzor: `skola-slovicka.html` (pole `rooms`, `subjects`… a `words: [...rooms, ...subjects]`).
7. V rámci stránky musí být `en` i `cz` unikátní (Přiřazování páruje podle `en`, Kvíz nabízí `cz`). U shodného překladu je rozliš (`dítě` / `děcko`).
8. Slovníčky 4. ročníku vycházejí z `../anglicke-materialy/slovnicek.md` (mimo repo). Při přidání slovíčka do stránky doplň i md a naopak; téma Gramatika z md se jako slovníček nezobrazuje.

### 2. ročník

Slovíčka jsou sdílená v `2-rocnik/anglictina/slovicka.js` (globální `AJ2`: `numbers`, `numbersBonus`, `colours`, `autumn`, `school`) a používají je stránky témat i `opakovani.html`. Stránky 2. ročníku nemají režim Psaní (dítě teprve začíná číst); režimy: Učím se, Poslech, Přiřazování, Kvíz.

## Gramatická / vlastní stránka

Šablona: hlavička a `<nav>` jako u stránky se slovíčky. Pak:

```html
<link rel="stylesheet" href="../../common/skola.css">
<style>/* jen styly specifické pro stránku */</style>
...
<main id="app"></main>
<script src="../../common/skola.js"></script>
<script>
function learn() { app.innerHTML = `...`; }
function quiz() { ... }
skolaStart({ scoreKey: "uniqueKey", demo: "Hello!", modes: { learn, quiz } });
</script>
```

Vzory: `sloveso-byt.html` (tabulky, doplňování, přeměna vět, skládání slov), `abeceda.html` (hláskování přes `speakSeq`), `clen-a-an.html` (třídění do sloupců).

### API ze `skola.js`

Globální proměnné nikdy znovu nedeklaruj přes let/const: `app`, `SKOLA`, `score`, `voices`, `voice`, `csVoice`, `seqToken`. Funkce lze předefinovat deklarací `function`.

| Funkce | Popis |
|---|---|
| `skolaStart({ scoreKey, modes, demo, rate=0.85, czRate=0.9, czech=true, english=true })` | Načte body a hlasy, napojí `<nav>` a spustí režim s class `active`. `czech:false` vypne varování o chybějícím českém hlasu. `english:false` je pro stránky jen v češtině (viz níže). |
| `skolaVocab({ ...skolaStart, words, groups?, learnExtra, modes? })` | Kompletní stránka slovíček s režimy learn / listen / match / quiz / write (zobrazí se ty, které mají tlačítko v `<nav>`). |
| `speak(text, rate?)` | Přečte text britsky; použije `SKOLA.say[text]`, pokud je definováno. |
| `speakCz(text, rate?)` | Přečte text česky (výchozí `czRate`; diktát a věty pomaleji, 0.7–0.8). |
| `speakSeqCz(items, pause=350, rate?)` | Přečte české položky postupně (řady vyjmenovaných slov, hlásky). |
| `speakBoth(en, cz)` | Přečte anglicky, pak česky. |
| `speakSeq(items, pause=350, rate?)` | Přečte položky postupně s pauzou. |
| `stopSpeech()` | Zastaví čtení. |
| `addScore(n)` | Přičte body. |
| `shuffle(a)`, `pick(a)` | Náhodné pořadí, náhodný prvek. |
| `norm(s)` | Normalizace odpovědi: malá písmena, sjednocené apostrofy, bez `.!` a nadbytečných mezer. |
| `finish(correct, total, again)` | Závěrečné hodnocení. |

Užitečné CSS třídy: `box`, `btn`, `btn light`, `big`, `clk` (klikací s 🔊), `options` (tlačítka `.ok`/`.bad`), `progress`, `feedback` (`<div class="feedback" id="fb">`), `ok-x`/`no-x`, `center`, `grid`, `card`. Pro ČJ/M navíc: `task`, `hint`, `gap`, `pad` (`pad num`), `chip`, `pool`, `sortcols`/`col`, `blocks`, `timer`, `note`, `good`/`badc`.

Globální funkce `pick`, `shuffle`, `addScore`, `finish`, `norm` ani funkce z `cvic.js` na stránce **nikdy nedeklaruj znovu** (ani jako `const pick = …`) – kolize jmen zastaví celý skript a `#app` zůstane prázdný; `new Function` to neodhalí. Před testem ověř grepem v `common/`, že pomocná jména stránky (`rnd`, `sample`…) nekolidují.

## Čeština a matematika

Stránky jsou v `<N>-rocnik/cestina/` a `<N>-rocnik/matematika/`, každý s vlastním rozcestníkem. Jsou jen v češtině – šablona:

```html
<header>
  <a class="home" href="index.html">← Všechna témata</a><br>
  <h1>🧠 Název</h1>
  <div class="score">⭐ Body: <span id="score">0</span></div>
  <div class="voicewarn" id="voiceWarn"></div>
</header>
<nav><button data-mode="learn" class="active">📖 Učím se</button> …</nav>
<main id="app"></main>
<script src="../../common/skola.js"></script>
<script src="../../common/cvic.js"></script>
<script>
…
skolaStart({ scoreKey: "mUniqueScore", english: false, modes: { learn, … } });
</script>
```

Bez výběru hlasu (`<select>`); `english:false` skryje anglický hlas i varování o britském hlasu a demo je česky. Prefix `scoreKey`: `cj…` pro češtinu, `m…` pro matematiku.

### API z `cvic.js`

| Funkce | Popis |
|---|---|
| `cvicHead(title, i, n)` | Klikací nadpis s počítadlem `(i+1/n)` a progress bar. |
| `czSay(text, say?)`, `czBind(root=app)` | Klikací český text s 🔊; `czBind` napojí všechna `[data-say]` na `speakCz`. |
| `czClean(s)`, `czMath(s)` | Text bez HTML/emoji k předčítání; příklad ke čtení (`13 − 5 = ?` → „13 mínus 5 rovná se kolik“). |
| `cvicRound(items, again, render(x, i, n, done))` | Kolo s opakováním chyb na konci a `finish`. Základ vlastních režimů. |
| `cvicAsk(o)` | Psaná odpověď: 3 pokusy, Nápověda / Poslechnout / Nevím, volitelná klávesnice (`numeric`, `keys(x)`). |
| `cvicNumbers({ title, gen, count=10, again, help? })` | Číselné příklady; `gen()` → `{ q: "34 + 5", a: 39, say?, help? }`. |
| `cvicSprint({ title, gen, seconds=60, id })` | Minutovka, rekord v `localStorage` pod `scoreKey + "Best_" + id`. |
| `cvicDictation({ title, items, again, keys?, help?, showPic? })` | Diktát přes `speakCz` (`items: [{ w, say?, e? }]`); `keys(x)` = klikací písmena místo psaní. |
| `cvicChoice({ title, items, again, ask?, cls?, silent? })` | Kvíz s možnostmi (`items: [{ q, say?, rate?, opts, a, why?, after? }]`). |
| `cvicSort({ title, cols: [{ k, t }], items: [{ t, k, say?, why? }], again })` | Třídění do sloupců (klik na slovo, pak na sloupec). |
| `cvicBlocks(n)` | Desítky a jednotky jako tyčky a kostičky (2. ročník). |

Vzory: `4-rocnik/cestina/vyjmenovana-slova.html` (předčítání řad, doplň i/y, diktát), `slovni-druhy.html` (třídění), `skladebni-dvojice.html` (klikání na slova ve větě), `2-rocnik/cestina/hlasky-ve-slove.html` (skládání slov z písmen), `2-rocnik/matematika/do-20-s-prechodem.html` (vizualizace rozkladu), `4-rocnik/matematika/pisemne-scitani-odcitani.html` (příklad pod sebou, číslice zprava).

Obsah:
- Český obsah musí být jazykově správný a přiměřený věku. Ve 2. ročníku dítě teprve čte – preferuj klikání a skládání z písmen před psaním.
- Odčítání pod sebou se počítá doplňováním („6 a kolik je 13? 7, píšu 7, 1 si pamatuju“).
- U počítání hlásek nepoužívej slova, kde se počet písmen liší od počtu hlásek (`ch`, `ě`…).

## Konvence

- UI je česky; angličtina je britská (en-GB, `colour`, `maths`, `Z = zed`).
- Vše, co lze přehrát, je klikací a má ikonu 🔊. Klikací je i čeština (`speakCz`) a nadpisy.
- Každý řádek nebo tvar je samostatně klikací; nečti celý řádek najednou. Věty čti pomaleji (rate 0.7–0.8).
- Odpovědi porovnávej přes `norm`. Přijímej stažené i plné tvary (`I'm` = `I am`) a rozumné alternativy.
- V psaní se špatně zodpovězené položky zopakují na konci kola. Po 3 pokusech se ukáže řešení. Tlačítka Nápověda, Poslechnout a Nevím.
- Ukazuj průběh (progress bar) a na konci volej `finish`.
- Pro náhled na prázdná pole použij podtržítka (`__ ______`).

## Ověření

Otevři stránku v browser canvasu (`file:///C:/Users/frant/Documents/github-copilot/skola/...`). Přes `evaluate_javascript`:
1. Počkej asi 800 ms, pak obal `speechSynthesis.speak` logováním (`u.lang`, `u.text`). Nevolej `u.onend`, jinak vznikne smyčka.
2. Zkontroluj, že `#app` není prázdný. Pokud je prázdný, skript stránky má syntaktickou chybu (`new Function(document.scripts[1].text)` ji ukáže).
3. Klikni na každé tlačítko v `<nav>` a v každém režimu proveď jednu akci.
4. Udělej screenshot režimu Učím se.

Canvas otevřený přímo na stránce v podadresáři nemusí načíst `../../common` (404). Pak otevři kořenový `index.html` a navigaci proveď samostatným voláním `evaluate_javascript` s `location.href = '2-rocnik/…'`. `evaluate_javascript` běží v izolovaném světě – přepsání `speechSynthesis.speak` a zachytávání chyb vlož jako `<script>` element a výsledky zapisuj do `document.body.dataset.log`.

Na počítači je jen hlas en-US a cs-CZ, proto se varování o britském hlasu zobrazuje a je to v pořádku. Node ani Python nejsou nainstalované.

## Git

- Repo `frodcode/skola`. Commit message anglicky, s trailerem `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- Push jen na vyžádání, obyčejným `git push`. Remote používá SSH alias `github-anglictina` přes port 443.
