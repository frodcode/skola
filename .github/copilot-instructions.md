# Škola – interaktivní procvičovací stránky

Statické HTML stránky pro žáka ZŠ (začátečník, mluví česky). Každá stránka funguje otevřením souboru v prohlížeči (`file://`). Nepoužívej build, npm, ES moduly ani externí CDN.

## Struktura

```
index.html                    rozcestník ročníků
common/skola.css, skola.js    sdílený styl + logika (hlas, body, režimy, engine slovíček)
<N>-rocnik/index.html         rozcestník předmětů
<N>-rocnik/<predmet>/index.html   rozcestník témat (dlaždice)
<N>-rocnik/<predmet>/<tema>.html  stránky témat
```

- Názvy souborů a adresářů piš bez diakritiky a mezer, slova odděluj pomlčkou (`veci-denni-potreby.html`).
- Každou novou stránku přidej jako dlaždici do `index.html` v nadřazeném adresáři.
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
| `skolaStart({ scoreKey, modes, demo, rate=0.85, czRate=0.9, czech=true })` | Načte body a hlasy, napojí `<nav>` a spustí režim s class `active`. `czech:false` vypne varování o chybějícím českém hlasu. |
| `skolaVocab({ ...skolaStart, words, learnExtra, modes? })` | Kompletní stránka slovíček s režimy learn / match / quiz / write. |
| `speak(text, rate?)` | Přečte text britsky; použije `SKOLA.say[text]`, pokud je definováno. |
| `speakCz(text)` | Přečte text česky. |
| `speakBoth(en, cz)` | Přečte anglicky, pak česky. |
| `speakSeq(items, pause=350, rate?)` | Přečte položky postupně s pauzou. |
| `stopSpeech()` | Zastaví čtení. |
| `addScore(n)` | Přičte body. |
| `shuffle(a)`, `pick(a)` | Náhodné pořadí, náhodný prvek. |
| `norm(s)` | Normalizace odpovědi: malá písmena, sjednocené apostrofy, bez `.!` a nadbytečných mezer. |
| `finish(correct, total, again)` | Závěrečné hodnocení. |

Užitečné CSS třídy: `box`, `btn`, `btn light`, `big`, `clk` (klikací s 🔊), `options` (tlačítka `.ok`/`.bad`), `progress`, `feedback` (`<div class="feedback" id="fb">`), `ok-x`/`no-x`, `center`, `grid`, `card`.

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

Na počítači je jen hlas en-US a cs-CZ, proto se varování o britském hlasu zobrazuje a je to v pořádku. Node ani Python nejsou nainstalované.

## Git

- Repo `frodcode/skola`. Commit message anglicky, s trailerem `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- Push jen na vyžádání, obyčejným `git push`. Remote používá SSH alias `github-anglictina` přes port 443.
