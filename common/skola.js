/* Škola – sdílené jádro interaktivních stránek (body, hlasy, předčítání, navigace, hodnocení)
   a hotový engine pro slovíčka. Načítá se klasickým <script src> (ne modul), aby fungovalo i přes file://.
   Stránka musí mít #app, #score, #voiceSel, #voiceWarn a <nav> s tlačítky data-mode. */

const app = document.getElementById("app");
const SKOLA = { scoreKey: "score", rate: 0.85, czRate: 0.9, czech: true, english: true, say: {} };
let score = 0, voices = [], voice = null, csVoice = null, seqToken = 0;

function addScore(n) { score += n; localStorage.setItem(SKOLA.scoreKey, score); document.getElementById("score").textContent = score; }
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
/* porovnání odpovědí: bez ohledu na velikost písmen, mezery, tečky a druh apostrofu */
function norm(s) { return s.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!]/g, "").replace(/\s+/g, " ").trim(); }

/* --- hlasy --- */
function voiceRank(v) {
  const l = v.lang.replace("_", "-").toLowerCase(), n = v.name.toLowerCase();
  let r = 0;
  if (l === "en-gb" || /united kingdom|uk english|british/.test(n)) r += 100;
  if (/natural|online|neural/.test(n)) r += 20;
  if (/google/.test(n)) r += 10;
  if (/sonia|ryan|libby|hazel|george|susan|daniel|kate|serena/.test(n)) r += 5;
  return r;
}
/* český hlas: neurální (Edge: Antonín, Vlasta Online Natural) > Google > ostatní (Windows SAPI Jakub) */
function csRank(v) {
  const n = v.name.toLowerCase();
  return (/natural|online|neural/.test(n) ? 20 : 0) + (/google/.test(n) ? 10 : 0);
}
/* rychlost češtiny podle hlasu (neurální hlasy mluví přirozeně i v 1.0), jen když ji stránka nenastavila */
function setCzRate() {
  if (!SKOLA.czRateFixed) SKOLA.czRate = csVoice && csRank(csVoice) >= 20 ? 1 : 0.9;
}
/* lišta v hlavičce stránek jen v češtině: výběr českého hlasu + Ukázka + přepínač Automaticky předčítat */
function czBar() {
  if (document.getElementById("czBar")) return;
  SKOLA.autoRead = localStorage.getItem("schoolAutoReadCz") !== "0";
  document.getElementById("voiceWarn").insertAdjacentHTML("beforebegin", `<div class="voice" id="czBar">
    <span id="voiceCz" style="display:none">🔊 Hlas: <select id="voiceSelCz"></select> <button type="button" id="voiceDemo">▶️ Ukázka</button></span>
    <label class="autoread"><input type="checkbox" id="autoRead" ${SKOLA.autoRead ? "checked" : ""}> 🔊 Automaticky předčítat</label></div>`);
  const sel = document.getElementById("voiceSelCz");
  const demo = () => czSpeakNow(typeof SKOLA.demo === "string" ? SKOLA.demo : "Ahoj! Kolik je 8 plus 5? 8 plus 5 je 13.");
  sel.onchange = () => { csVoice = SKOLA.csVoices.find(v => v.name === sel.value) || csVoice; localStorage.setItem("schoolVoiceCz", csVoice.name); setCzRate(); demo(); };
  document.getElementById("voiceDemo").onclick = demo;
  document.getElementById("autoRead").onchange = e => {
    SKOLA.autoRead = e.target.checked;
    localStorage.setItem("schoolAutoReadCz", SKOLA.autoRead ? "1" : "0");
    if (!SKOLA.autoRead) stopSpeech();
    document.querySelectorAll("#listen").forEach(b => b.className = SKOLA.autoRead ? "btn light" : "btn");
  };
}
function czVoiceUi(cs) {
  const sel = document.getElementById("voiceSelCz");
  document.getElementById("voiceCz").style.display = cs.length ? "" : "none";
  sel.innerHTML = cs.map(v => `<option value="${v.name}">${v.name.replace(/^Microsoft /, "").replace(/ - .*$/, "")}</option>`).join("");
  if (csVoice) sel.value = csVoice.name;
}
function loadVoices() {
  const voiceSel = document.getElementById("voiceSel"), voiceWarn = document.getElementById("voiceWarn");
  if (!("speechSynthesis" in window)) { voiceWarn.textContent = "Tento prohlížeč neumí předčítat."; return; }
  const all = speechSynthesis.getVoices();
  voices = all.filter(v => /^en/i.test(v.lang)).sort((a, b) => voiceRank(b) - voiceRank(a));
  const cs = SKOLA.csVoices = all.filter(v => /^cs/i.test(v.lang)).sort((a, b) => csRank(b) - csRank(a));
  csVoice = cs.find(v => v.name === localStorage.getItem("schoolVoiceCz")) || cs[0] || null;
  if (!SKOLA.english) {
    setCzRate();
    czVoiceUi(cs);
    voiceWarn.innerHTML = !all.length ? "" : !csVoice ?
      "⚠️ Český hlas nenalezen, nic se nebude předčítat. Ve Windows: Nastavení → Čas a jazyk → Jazyk a oblast → Přidat jazyk → Čeština se zaškrtnutým <i>Převod textu na řeč</i>." :
      cs.some(v => csRank(v) >= 10) ? "" : "💡 Přirozenější hlas: otevři stránku v <b>Microsoft Edge</b> (hlasy Antonín a Vlasta).";
    return;
  }
  const hasGB = voices.some(v => voiceRank(v) >= 100);
  voiceWarn.innerHTML = (hasGB ? "" :
    "⚠️ Britský hlas nenalezen. Otevřete stránku v <b>Microsoft Edge</b> (hlasy Sonia/Ryan) nebo v <b>Chrome</b> (Google UK English), " +
    "případně ve Windows: Nastavení → Čas a jazyk → Jazyk a oblast → Přidat jazyk → English (United Kingdom) se zaškrtnutým <i>Převod textu na řeč</i>, pak restartovat prohlížeč.") +
    (!SKOLA.czech || csVoice || !all.length ? "" : (hasGB ? "" : "<br>") +
    "⚠️ Český hlas nenalezen, čeština se nebude předčítat. Ve Windows: Nastavení → Čas a jazyk → Jazyk a oblast → Přidat jazyk → Čeština se zaškrtnutým <i>Převod textu na řeč</i>.");
  if (!voices.length) { voiceSel.innerHTML = "<option>žádný anglický hlas</option>"; return; }
  const saved = localStorage.getItem("schoolVoice");
  voice = voices.find(v => v.name === saved) || voices[0];
  voiceSel.innerHTML = voices.map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`).join("");
  voiceSel.value = voice.name;
}

/* --- předčítání --- */
function utter(text, rate) {
  const u = new SpeechSynthesisUtterance(SKOLA.say[text] || text);
  if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-GB";
  u.rate = rate || SKOLA.rate;
  return u;
}
function czUtter(text, rate) {
  const u = new SpeechSynthesisUtterance(text);
  u.voice = csVoice; u.lang = csVoice.lang; u.rate = rate || SKOLA.czRate;
  /* sledování rozpracovaných českých promluv – podle nich čeká czWhenQuiet */
  const gen = czTalk.gen;
  czTalk.n++;
  let ended = false;
  const end = () => { if (ended || gen !== czTalk.gen) return; ended = true; czTalk.n--; czQuietCheck(); };
  u.addEventListener("end", end);
  u.addEventListener("error", end);
  return u;
}
/* n = počet rozpracovaných promluv; gen se mění při stopSpeech (zrušené promluvy už nepočítáme) */
const czTalk = { n: 0, gen: 0, waiters: [] };
function czQuietCheck() {
  if (!czTalk.n) czTalk.waiters.splice(0).forEach(f => f());
}
/* fn se spustí, až český hlas dočte (hned, pokud nic nemluví); pojistka max ms */
function czWhenQuiet(fn, max = 15000) {
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  setTimeout(go, max);
  if (czTalk.n) czTalk.waiters.push(go); else go();
}
function stopSpeech() {
  seqToken++;
  czTalk.gen++; czTalk.n = 0;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  /* po zrušení bez nové promluvy (např. vypnutí předčítání) pustí čekající dál */
  setTimeout(czQuietCheck, 0);
}
/* anglicky; text se přeloží přes SKOLA.say (opravy výslovnosti, např. "PE" → "P. E.") */
function speak(text, rate) {
  if (!("speechSynthesis" in window)) return;
  stopSpeech();
  speechSynthesis.speak(utter(text, rate));
}
/* Automatické předčítání vypnuté (jen stránky v češtině): čeština zazní jen po kliknutí na 🔊 prvek,
   ne při novém zadání, zpětné vazbě ani z časovače. Vychází z právě zpracovávané události (window.event). */
const CZ_MANUAL = ".clk, [data-say], .sp, .chip, .w, #listen";
function czAllowed() {
  if (SKOLA.english || SKOLA.autoRead !== false) return true;
  const e = window.event;
  if (!e || e.type !== "click" || !e.target || !e.target.closest) return false;
  const el = e.target.closest(`button, ${CZ_MANUAL}`);
  /* jedno předčtení na kliknutí: klik na slovo-odpověď přečte slovo, ale už ne následnou zpětnou vazbu */
  if (!el || czAllowed.last === e || !(el.matches(CZ_MANUAL) || /🔊|🐢/.test(el.textContent))) return false;
  czAllowed.last = e;
  return true;
}
function czSpeakNow(text, rate) {
  if (!("speechSynthesis" in window) || !csVoice) return;
  stopSpeech();
  speechSynthesis.speak(czUtter(text, rate));
}
function speakCz(text, rate) {
  if (czAllowed()) czSpeakNow(text, rate);
}
/* zařadí češtinu za právě mluvený text (bez přerušení) – např. zpětná vazba po přečteném slově */
function speakCzNext(text, rate) {
  if (!("speechSynthesis" in window) || !csVoice || !czAllowed()) return;
  speechSynthesis.speak(czUtter(text, rate));
}
/* české položky postupně s pauzou (řada vyjmenovaných slov) */
function speakSeqCz(items, pause = 350, rate) {
  if (!("speechSynthesis" in window) || !csVoice || !czAllowed()) return;
  stopSpeech();
  const id = seqToken;
  let k = 0;
  const next = () => {
    if (id !== seqToken || k >= items.length) return;
    const u = czUtter(items[k++], rate);
    u.onend = () => setTimeout(next, pause);
    speechSynthesis.speak(u);
  };
  next();
}
/* nejdřív anglicky, hned potom česky */
function speakBoth(en, cz, rate) {
  speak(en, rate);
  if (csVoice && cz) speechSynthesis.speak(czUtter(cz));
}
/* anglické položky postupně s pauzou (hláskování, abeceda) */
function speakSeq(items, pause = 350, rate) {
  if (!("speechSynthesis" in window)) return;
  stopSpeech();
  const id = seqToken;
  let k = 0;
  const next = () => {
    if (id !== seqToken || k >= items.length) return;
    const u = utter(items[k++], rate);
    u.onend = () => setTimeout(next, pause);
    speechSynthesis.speak(u);
  };
  next();
}

function finish(correct, total, again) {
  const pct = correct / total;
  const msg = pct === 1 ? "🏆 Perfektní!" : pct >= 0.7 ? "🌟 Skvělá práce!" : "💪 Dobrý začátek, procvič si to ještě!";
  app.innerHTML = `<div class="center"><h2>${msg}</h2><div class="big">${correct} / ${total}</div>
    <button class="btn" id="again">🔄 Znovu</button></div>`;
  app.querySelector("#again").onclick = again;
}

/* Spuštění stránky.
   opt.scoreKey – klíč v localStorage pro body (každá stránka vlastní!)
   opt.modes    – { learn, ... } funkce režimů podle data-mode v <nav>; spustí se tlačítko s class="active"
   opt.demo     – věta (nebo funkce) přehraná po změně hlasu
   opt.rate     – výchozí rychlost angličtiny (0.85); opt.czech: false = nevarovat kvůli chybějícímu českému hlasu
   opt.english: false – stránka jen v češtině: bez výběru anglického hlasu a varování o britském hlasu */
function skolaStart(opt) {
  Object.assign(SKOLA, opt);
  SKOLA.czRateFixed = "czRate" in opt;
  score = +(localStorage.getItem(SKOLA.scoreKey) || 0);
  document.getElementById("score").textContent = score;
  const voiceSel = document.getElementById("voiceSel");
  if (!SKOLA.english) { SKOLA.czech = true; if (voiceSel) voiceSel.closest(".voice").style.display = "none"; czBar(); }
  else voiceSel.onchange = () => {
    voice = voices.find(v => v.name === voiceSel.value);
    localStorage.setItem("schoolVoice", voice.name);
    typeof opt.demo === "function" ? opt.demo() : speak(opt.demo || "Hello!");
  };
  if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } else loadVoices();
  const btns = document.querySelectorAll("nav button");
  btns.forEach(b => b.onclick = () => {
    btns.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    opt.modes[b.dataset.mode]();
  });
  (document.querySelector("nav button.active") || btns[0]).click();
}

/* ===== Engine pro slovíčka: režimy learn / match / quiz / write =====
   words: [{ cz, en, alt?: [], e: "emoji", say?: "jak vyslovit", w?: "slovo bez členu" }]
   – en se zobrazuje a vyslovuje (může obsahovat člen: "a laptop"); v psaní se uzná i bez členu,
     u slov bez členu (glasses) se naopak člen neuzná.
   – e může být i HTML (např. barevná tečka <span style=…>).
   Režim listen (👂 Poslech: zazní slovo, klikne se na obrázek) se zobrazí jen s tlačítkem data-mode="listen".
   opt.groups – [{ title, words }] pro Učím se po skupinách (může obsahovat i slova mimo words, např. bonus);
   opt.learnExtra – HTML pod kartičkami v režimu Učím se; ostatní volby viz skolaStart */
function skolaVocab(opt) {
  const WORDS = opt.words;
  WORDS.forEach(w => { if (w.say) SKOLA.say[w.en] = w.say; });
  const stripArt = s => s.replace(/^(a|an)\s+/, "");
  const isOk = (w, v) => {
    if (!/^(a|an) /.test(w.en) && /^(a|an) /.test(norm(v))) return false;
    const bare = stripArt(norm(v));
    return [w.en, w.w || w.en, ...(w.alt || [])].some(a => stripArt(norm(a)) === bare);
  };

  function learn() {
    const groups = opt.groups || [{ words: WORDS }], all = groups.flatMap(g => g.words);
    const cards = ws => `<div class="grid">${ws.map(w => `<div class="card" data-i="${all.indexOf(w)}"><div class="emoji">${w.e}</div><div class="en">${w.en} <span class="ico">🔊</span></div><div class="cz">${w.cz}</div></div>`).join("")}</div>`;
    app.innerHTML = `<h2>📖 Slovíčka – klikni a poslechni si výslovnost</h2>${
      groups.map(g => (g.title ? `<h3 class="hs">${g.title} <span class="ico">🔊</span></h3>` : "") + cards(g.words)).join("")
    }${opt.learnExtra || ""}`;
    app.querySelectorAll(".card").forEach(c => { const w = all[c.dataset.i]; c.onclick = () => speakBoth(w.en, w.cz); });
    app.querySelectorAll("h3.hs").forEach(h => h.onclick = () => speakCz(h.textContent.replace(/[^\p{L}\p{N}\s–-]/gu, "").trim()));
  }

  function listen() {
    const order = shuffle(WORDS).slice(0, 10);
    let i = 0, correct = 0;
    function show() {
      if (i >= order.length) return finish(correct, order.length, listen);
      const w = order[i];
      const opts = shuffle([w, ...shuffle(WORDS.filter(x => x !== w && x.e !== w.e)).slice(0, 3)]);
      app.innerHTML = `<h2>👂 Poslech (${i + 1}/${order.length})</h2>
        <div class="progress"><div style="width:${i / order.length * 100}%"></div></div>
        <div class="center"><button class="btn" id="rep">🔊 Poslechnout znovu</button></div>
        <p class="center clk" id="task">Klikni na obrázek, který slyšíš. <span class="ico">🔊</span></p>
        <div class="options pics">${opts.map((o, k) => `<button data-k="${k}">${o.e}</button>`).join("")}</div>
        <div class="feedback" id="fb"></div>`;
      speak(w.en);
      app.querySelector("#rep").onclick = () => speak(w.en);
      app.querySelector("#task").onclick = () => speakCz("Klikni na obrázek, který slyšíš.");
      app.querySelectorAll(".options button").forEach(b => b.onclick = () => {
        app.querySelectorAll(".options button").forEach(x => { x.disabled = true; if (opts[x.dataset.k] === w) x.classList.add("ok"); });
        const fb = app.querySelector("#fb");
        if (opts[b.dataset.k] === w) { correct++; addScore(2); fb.innerHTML = `<span class="good">Výborně! ⭐ ${w.en} = ${w.cz}</span>`; }
        else { b.classList.add("bad"); fb.innerHTML = `<span class="badc">To bylo: ${w.e} ${w.en} = ${w.cz}</span>`; }
        speak(w.en);
        setTimeout(() => { i++; show(); }, 1700);
      });
    }
    show();
  }

  function match() {
    const set = shuffle(WORDS).slice(0, 6);
    let selected = null, done = 0, mistakes = 0;
    app.innerHTML = `<h2>🔗 Přiřaď anglické slovo k českému</h2>
      <div class="cols"><div id="colEn"></div><div id="colCz"></div></div>
      <div class="feedback" id="fb"></div>
      <div class="center"><button class="btn" id="again">🔄 Nová sada</button></div>`;
    const colEn = app.querySelector("#colEn"), colCz = app.querySelector("#colCz"), fb = app.querySelector("#fb");
    const mk = (w, side) => {
      const t = document.createElement("div");
      t.className = "tile"; t.innerHTML = side === "en" ? w.en : `${w.e} ${w.cz}`;
      t.dataset.key = w.en; t.dataset.side = side;
      t.onclick = () => choose(t);
      return t;
    };
    shuffle(set).forEach(w => colEn.appendChild(mk(w, "en")));
    shuffle(set).forEach(w => colCz.appendChild(mk(w, "cz")));
    function choose(t) {
      if (t.classList.contains("done")) return;
      if (t.dataset.side === "en") speak(t.dataset.key);
      else speakCz(WORDS.find(x => x.en === t.dataset.key).cz);
      if (!selected || selected.dataset.side === t.dataset.side) {
        if (selected) selected.classList.remove("sel");
        selected = t; t.classList.add("sel"); return;
      }
      if (selected.dataset.key === t.dataset.key) {
        [selected, t].forEach(x => { x.classList.remove("sel"); x.classList.add("done"); });
        done++; addScore(1); fb.innerHTML = `<span class="good">Správně! 👍</span>`;
        if (done === set.length) fb.innerHTML = `<span class="good">🎉 Hotovo! Chyb: ${mistakes}</span>`;
      } else {
        mistakes++;
        const a = selected; [a, t].forEach(x => x.classList.add("wrong"));
        fb.innerHTML = `<span class="badc">Zkus to znovu 🙂</span>`;
        setTimeout(() => [a, t].forEach(x => x.classList.remove("wrong", "sel")), 500);
      }
      selected = null;
    }
    app.querySelector("#again").onclick = match;
  }

  function quiz() {
    const order = shuffle(WORDS).slice(0, 10);
    let i = 0, correct = 0;
    function show() {
      if (i >= order.length) return finish(correct, order.length, quiz);
      const w = order[i];
      const toEn = Math.random() < 0.5;
      const opts = shuffle([w, ...shuffle(WORDS.filter(x => x !== w)).slice(0, 3)]);
      app.innerHTML = `<h2>❓ Kvíz (${i + 1}/${order.length})</h2>
        <div class="progress"><div style="width:${i / order.length * 100}%"></div></div>
        <div class="big clk">${w.e} ${toEn ? w.cz : w.en} 🔊</div>
        <p class="center">${toEn ? "Jak se to řekne anglicky?" : "Co to znamená česky?"}</p>
        <div class="options">${opts.map(o => `<button data-k="${o.en}">${toEn ? o.en : o.cz}</button>`).join("")}</div>
        <div class="feedback" id="fb"></div>`;
      const sayPrompt = () => toEn ? speakCz(w.cz) : speak(w.en);
      sayPrompt();
      app.querySelector(".big").onclick = sayPrompt;
      app.querySelectorAll(".options button").forEach(b => b.onclick = () => {
        app.querySelectorAll(".options button").forEach(x => { x.disabled = true; if (x.dataset.k === w.en) x.classList.add("ok"); });
        const fb = app.querySelector("#fb");
        if (b.dataset.k === w.en) { correct++; addScore(2); fb.innerHTML = `<span class="good">Výborně! ⭐</span>`; }
        else { b.classList.add("bad"); fb.innerHTML = `<span class="badc">Správně je: ${w.en} = ${w.cz}</span>`; }
        speak(w.en);
        setTimeout(() => { i++; show(); }, 1500);
      });
    }
    show();
  }

  function write() {
    const order = shuffle(WORDS).slice(0, 10);
    let i = 0, correct = 0, tries = 0, hintLen = 0;
    function show() {
      if (i >= order.length) return finish(correct, order.length, write);
      const w = order[i]; tries = 0; hintLen = 0;
      app.innerHTML = `<h2>✏️ Napiš anglicky (${i + 1}/${order.length})</h2>
        <div class="progress"><div style="width:${i / order.length * 100}%"></div></div>
        <div class="big clk">${w.e} ${w.cz} 🔊</div>
        <div class="hint" id="hint"></div>
        <input type="text" id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sem napiš slovíčko">
        <div class="center">
          <button class="btn" id="check">✔️ Zkontrolovat</button>
          <button class="btn light" id="hintBtn">💡 Nápověda</button>
          <button class="btn light" id="listen">🔊 Poslechnout</button>
          <button class="btn light" id="skip">⏭️ Nevím</button>
        </div>
        <div class="feedback" id="fb"></div>`;
      const inp = app.querySelector("#inp"), fb = app.querySelector("#fb"), hint = app.querySelector("#hint");
      inp.focus();
      speakCz(w.cz);
      app.querySelector(".big").onclick = () => { speakCz(w.cz); inp.focus(); };
      const renderHint = () => hint.textContent = [...w.en].map((c, k) => c === " " ? " " : (k < hintLen ? c : "_")).join("");
      renderHint();
      const next = () => setTimeout(() => { i++; show(); }, 1700);
      const fail = () => { fb.innerHTML = `<span class="badc">Správně je: <b>${w.en}</b></span>`; speak(w.en); inp.disabled = true; order.push(w); next(); };
      const check = () => {
        if (!norm(inp.value)) return;
        if (isOk(w, inp.value)) {
          const pts = Math.max(1, 3 - tries - hintLen);
          correct++; addScore(pts); speak(w.en);
          fb.innerHTML = `<span class="good">Správně! 🎉 +${pts} ${norm(w.en) !== norm(inp.value) ? "(" + w.en + ")" : ""}</span>`;
          inp.disabled = true; next();
        } else {
          tries++;
          if (tries >= 3) fail();
          else fb.innerHTML = `<span class="badc">Ještě ne, zkus to znovu (pokus ${tries}/3)</span>`;
        }
      };
      app.querySelector("#check").onclick = check;
      inp.onkeydown = e => { if (e.key === "Enter") check(); };
      app.querySelector("#hintBtn").onclick = () => { if (hintLen < w.en.length) { hintLen++; renderHint(); } inp.focus(); };
      app.querySelector("#listen").onclick = () => { speak(w.en); inp.focus(); };
      app.querySelector("#skip").onclick = () => { if (!inp.disabled) fail(); };
    }
    show();
  }

  skolaStart({ ...opt, modes: { learn, listen, match, quiz, write, ...(opt.modes || {}) } });
}
