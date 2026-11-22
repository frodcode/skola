/* Škola – sdílení pomocníci pro češtinu a matematiku. Načítá se až po skola.js:
   <script src="../../common/skola.js"></script><script src="../../common/cvic.js"></script>
   Všechny režimy kreslí do #app, ukazují průběh a na konci volají finish(). */

/* text bez emoji a HTML – k předčítání nadpisů a zadání */
function czClean(s) { return String(s).replace(/<[^>]*>/g, " ").replace(/\s\/\s/g, " nebo ").replace(/[^\p{L}\p{N}\s.,:;?!()+−=–-]/gu, "").replace(/\s+/g, " ").trim(); }
/* výraz slovy: "20 + (5 − 3)" → "20 plus, v závorce 5 mínus 3"; "?" / "_" → "kolik" */
function czExpr(s) {
  const t = String(s).trim().replace(/^\(([^()]*)\)/, "$1 v závorce, ").replace(/\(([^()]*)\)/g, ", v závorce $1");
  return t.replace(/<[^>]*>/g, " ").replace(/\+/g, " plus ").replace(/[−-]/g, " mínus ").replace(/·|×/g, " krát ")
    .replace(/:/g, " děleno ").replace(/\?|_+/g, " kolik ").replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").replace(/^, |,\s*$/g, "").trim();
}
/* příklad k předčítání jako přirozená věta:
   "13 − 5 = ?" → "Kolik je 13 mínus 5?", "34 + ? = 40" → "34 plus kolik je 40?", "13 − 5 = 8" → "13 mínus 5 je 8." */
function czMath(s) {
  const [l, r] = String(s).replace(/<[^>]*>/g, " ").split("=");
  if (r === undefined) return czExpr(l);
  const L = czExpr(l), R = czExpr(r);
  if (R === "kolik" || R === "") return `Kolik je ${L}?`;
  if (/\?|_/.test(s)) return `${L} je ${R}?`;
  return `${L} je ${R}.`;
}
/* text s příklady uvnitř věty („8 + 6 = 14, píšu 4“): symboly slovy, „=“ jako „je“ */
function czRead(s) {
  return czClean(String(s)).replace(/\s*\+\s*/g, " plus ").replace(/\s+[−-]\s+/g, " mínus ").replace(/\s*=\s*/g, " je ").replace(/\s+/g, " ").trim();
}
/* nadpis s počítadlem a progress bar; nadpis je klikací (přečte se česky) */
function cvicHead(title, i, n) {
  return `<h2 class="clk" onclick="speakCz(czClean(this.dataset.t))" data-t="${czClean(title)}">${title} (${i + 1}/${n}) <span class="ico">🔊</span></h2>
    <div class="progress"><div style="width:${i / n * 100}%"></div></div>`;
}
/* klikací český text s 🔊 */
function czSay(text, say) { return `<span class="sp czw" data-say="${(say || czClean(text)).replace(/"/g, "&quot;")}">${text} <span class="ico">🔊</span></span>`; }
/* napojí všechny [data-say] v kořeni na speakCz */
function czBind(root = app) { root.querySelectorAll("[data-say]").forEach(el => el.onclick = e => { e.stopPropagation(); speakCz(el.dataset.say); }); }
/* další krok až po dočtení hlasu (+ krátká pauza na nadechnutí), bez pevného čekání.
   Když zpětná vazba nezazněla (vypnuté předčítání, bez hlasu), nechá ji aspoň ms na přečtení. */
function cvicAfterSpeech(fn, ms = 1500) {
  const t0 = Date.now(), heard = SKOLA.autoRead !== false && czTalk.n > 0;
  czWhenQuiet(() => setTimeout(fn, heard ? 600 : Math.max(600, ms - (Date.now() - t0))));
}

/* kolo s opakováním chyb: špatně zodpovězené položky se zařadí na konec */
function cvicRound(items, again, render) {
  const order = [...items];
  let i = 0, correct = 0;
  function next() {
    if (i >= order.length) return finish(correct, order.length, again);
    const x = order[i];
    render(x, i, order.length, ok => { if (ok) correct++; else order.push(x); i++; next(); });
  }
  next();
}

/* Otázka s psanou odpovědí (příklady, diktát).
   o.items, o.again, o.title
   o.prompt(x) → HTML zadání (klikací – přehraje o.say), o.say(x) → přečte zadání
   o.answer(x) → správná odpověď (text/číslo), o.check?(x, v) → vlastní kontrola
   o.help?(x) → HTML nápovědy (jinak se odkrývají písmena odpovědi)
   o.numeric – číselná klávesnice; o.keys?(x) → písmena na klikací klávesnici
   o.solution?(x) → HTML řešení; o.after?(x) – co přečíst po odpovědi; o.wrong?(x, v) → text při chybě */
function cvicAsk(o) {
  cvicRound(o.items, o.again, (x, i, n, done) => {
    let tries = 0, hints = 0;
    const ans = String(o.answer(x));
    const keys = o.numeric ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] : o.keys ? o.keys(x) : null;
    const quiet = SKOLA.autoRead === false;
    app.innerHTML = `${cvicHead(o.title, i, n)}
      <div class="task clk" id="q">${o.prompt(x)} <span class="ico">🔊</span>${quiet && o.listen ? `<div class="note">Klikni na 🔊 Poslechnout</div>` : ""}</div>
      <div class="hint" id="hint"></div>
      <input type="text" id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" ${o.numeric ? 'inputmode="numeric" class="num"' : ""} placeholder="${o.placeholder || ""}">
      ${keys ? `<div class="pad${o.numeric ? " num" : ""}">${keys.map(k => `<button data-k="${k}">${k}</button>`).join("")}<button data-k="⌫" class="del">⌫</button></div>` : ""}
      <div class="center">
        <button class="btn" id="check">✔️ Zkontrolovat</button>
        <button class="btn light" id="hintBtn">💡 Nápověda</button>
        <button class="btn${quiet ? "" : " light"}" id="listen">🔊 Poslechnout</button>
        <button class="btn light" id="skip">⏭️ Nevím</button>
      </div>
      <div class="feedback" id="fb"></div>`;
    const inp = app.querySelector("#inp"), fb = app.querySelector("#fb"), hint = app.querySelector("#hint");
    const say = () => o.say(x);
    let over = false;
    say();
    inp.focus();
    app.querySelector("#q").onclick = () => { say(); inp.focus(); };
    app.querySelector("#listen").onclick = () => { say(); inp.focus(); };
    app.querySelectorAll(".pad button").forEach(b => b.onclick = () => {
      if (over) return;
      inp.value = b.dataset.k === "⌫" ? inp.value.slice(0, -1) : inp.value + b.dataset.k;
      if (!o.numeric) inp.focus();
    });
    const nextIn = (ok, ms) => { over = true; inp.disabled = true; cvicAfterSpeech(() => done(ok), ms); };
    const fail = () => {
      fb.innerHTML = `<span class="badc">Správně je: <b>${o.solution ? o.solution(x) : ans}</b></span>`;
      o.after ? o.after(x) : speakCz(ans);
      nextIn(false, o.delay || 2500);
    };
    const check = () => {
      if (over || !inp.value.trim()) return;
      const v = inp.value;
      if (o.check ? o.check(x, v) : norm(v) === norm(ans)) {
        const pts = Math.max(1, 3 - tries - hints);
        addScore(pts);
        fb.innerHTML = `<span class="good">Správně! 🎉 +${pts}</span>`;
        o.after ? o.after(x) : speakCz(ans);
        nextIn(true, 1500);
      } else {
        tries++;
        if (tries >= 3) fail();
        else { fb.innerHTML = `<span class="badc">${o.wrong ? o.wrong(x, v) : "Ještě ne, zkus to znovu"} (pokus ${tries}/3)</span>`; inp.select(); }
      }
    };
    app.querySelector("#check").onclick = check;
    inp.onkeydown = e => { if (e.key === "Enter") check(); };
    app.querySelector("#hintBtn").onclick = () => {
      if (over) return;
      if (o.help) { hints = 1; hint.innerHTML = `<div class="box helpbox">${o.help(x)}</div>`; czBind(hint); }
      else if (hints < ans.length) { hints++; hint.textContent = [...ans].map((c, k) => c === " " ? " " : (k < hints ? c : "_")).join(""); }
      inp.focus();
    };
    app.querySelector("#skip").onclick = () => { if (!over) fail(); };
  });
}

/* Číselné příklady: gen() → { q: "34 + 5", a: 39, say?: "…", help?: "HTML" } */
function cvicNumbers(o) {
  const items = [];
  for (let k = 0, guard = 0; k < (o.count || 10) && guard < 500; guard++) {
    const x = o.gen();
    if (items.some(y => y.q === x.q)) continue;
    items.push(x); k++;
  }
  cvicAsk({
    title: o.title, items, again: o.again, numeric: true, placeholder: "výsledek",
    prompt: x => `${x.q} = <span class="gap">?</span>`,
    say: x => speakCz(x.say || czMath(x.q + " = ?")),
    answer: x => x.a,
    check: (x, v) => +v.replace(/\s/g, "") === x.a,
    help: o.help || (x => x.help ? x.help : `Výsledek má ${String(x.a).length} ${String(x.a).length === 1 ? "číslici" : "číslice"}.`),
    solution: x => `${x.q} = ${x.a}`,
    after: x => speakCz(czMath(`${x.q} = ${x.a}`)),
  });
}

/* Minutovka: co nejvíc příkladů za o.seconds sekund; rekord se ukládá ke scoreKey */
function cvicSprint(o) {
  const secs = o.seconds || 60, bestKey = SKOLA.scoreKey + "Best_" + (o.id || "sprint");
  const best = +(localStorage.getItem(bestKey) || 0);
  app.innerHTML = `<h2 class="clk" id="t">⏱️ ${o.title} <span class="ico">🔊</span></h2>
    <p class="center clk" id="d">Máš ${secs} sekund. Počítej co nejrychleji, odpověď potvrď Enterem nebo ✔️. <span class="ico">🔊</span></p>
    ${best ? `<p class="center">🏅 Tvůj rekord: <b>${best}</b></p>` : ""}
    <div class="center"><button class="btn" id="go">▶️ Start</button></div>`;
  app.querySelector("#t").onclick = () => speakCz(czClean(o.title));
  app.querySelector("#d").onclick = () => speakCz(czClean(app.querySelector("#d").textContent));
  app.querySelector("#go").onclick = run;
  function run() {
    let left = secs, correct = 0, total = 0, x, lock = false;
    app.innerHTML = `<h2>⏱️ ${o.title}</h2>
      <div class="progress"><div id="bar" style="width:100%"></div></div>
      <div class="center"><span class="timer" id="tm">${left} s</span> &nbsp; ✅ <b id="ok">0</b></div>
      <div class="task" id="q"></div>
      <input type="text" id="inp" class="num" inputmode="numeric" autocomplete="off" placeholder="výsledek">
      <div class="pad num">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(k => `<button data-k="${k}">${k}</button>`).join("")}<button data-k="⌫" class="del">⌫</button><button data-k="✔" class="go">✔️</button></div>
      <div class="feedback" id="fb"></div>`;
    const inp = app.querySelector("#inp"), fb = app.querySelector("#fb");
    const newQ = () => { x = o.gen(); app.querySelector("#q").innerHTML = `${x.q} = <span class="gap">?</span>`; inp.value = ""; inp.focus(); lock = false; };
    const check = () => {
      if (lock || !inp.value.trim()) return;
      total++;
      if (+inp.value === x.a) { correct++; addScore(1); app.querySelector("#ok").textContent = correct; fb.innerHTML = `<span class="good">✔️</span>`; newQ(); }
      else { lock = true; fb.innerHTML = `<span class="badc">${x.q} = ${x.a}</span>`; setTimeout(newQ, 1200); }
    };
    inp.onkeydown = e => { if (e.key === "Enter") check(); };
    app.querySelectorAll(".pad button").forEach(b => b.onclick = () => {
      if (b.dataset.k === "✔") check();
      else if (b.dataset.k === "⌫") inp.value = inp.value.slice(0, -1);
      else inp.value += b.dataset.k;
    });
    newQ();
    const timer = setInterval(() => {
      if (!document.body.contains(inp)) return clearInterval(timer);
      left--;
      app.querySelector("#tm").textContent = left + " s";
      app.querySelector("#bar").style.width = left / secs * 100 + "%";
      if (left > 0) return;
      clearInterval(timer);
      const rec = correct > best;
      if (rec) localStorage.setItem(bestKey, correct);
      finish(correct, Math.max(total, 1), () => cvicSprint(o));
      app.querySelector(".center").insertAdjacentHTML("afterbegin", `<p class="clk" id="res">⏱️ Za ${secs} sekund: <b>${correct}</b> správně z ${total}. ${rec ? "🏅 Nový rekord!" : best ? `Rekord: ${best}` : ""} <span class="ico">🔊</span></p>`);
      const msg = `Za ${secs} sekund máš ${correct} správně. ${rec ? "Nový rekord!" : ""}`;
      app.querySelector("#res").onclick = () => speakCz(msg);
      speakCz(msg);
    }, 1000);
  }
}

/* Diktát: zazní slovo, dítě ho napíše (nebo naťuká z písmen při o.keys).
   items: [{ w: "hřeben", say?: "…", e?: "🖼️", help?: "HTML" }] */
function cvicDictation(o) {
  cvicAsk({
    title: o.title, items: o.items, again: o.again, placeholder: "napiš, co slyšíš", listen: true,
    prompt: x => o.showPic && x.e ? `<span class="pic">${x.e}</span>` : "👂 Poslouchej",
    say: x => speakCz(x.say || x.w, 0.75),
    answer: x => x.w,
    help: o.help,
    keys: o.keys,
    wrong: o.wrong,
    after: x => speakCz(x.say || x.w, 0.8),
  });
}

/* Kvíz s možnostmi: items: [{ q: "HTML", say?: "text", rate?: 0.7, opts: [...], a: "správná", why?: "HTML", after?: "text" }]
   o.cls – třída pro .options (např. "three"); špatná odpověď čeká na Další */
function cvicChoice(o) {
  cvicRound(o.items, o.again, (x, i, n, done) => {
    app.innerHTML = `${cvicHead(o.title, i, n)}
      <div class="task clk" id="q">${x.q} <span class="ico">🔊</span></div>
      ${o.ask ? `<p class="center clk" id="ask">${o.ask} <span class="ico">🔊</span></p>` : ""}
      <div class="options ${o.cls || ""}">${x.opts.map(t => `<button data-t="${t}">${t}</button>`).join("")}</div>
      <div class="feedback" id="fb"></div><div class="center" id="nx"></div>`;
    const say = () => speakCz(x.say || czClean(x.q), x.rate);
    if (!o.silent) say();
    app.querySelector("#q").onclick = say;
    if (o.ask) app.querySelector("#ask").onclick = () => speakCz(czClean(o.ask));
    app.querySelectorAll(".options button").forEach(b => b.onclick = () => {
      app.querySelectorAll(".options button").forEach(y => { y.disabled = true; if (y.dataset.t === String(x.a)) y.classList.add("ok"); });
      const fb = app.querySelector("#fb"), why = x.why ? `<span class="note">${x.why}</span>` : "";
      if (x.after) speakCz(x.after);
      if (b.dataset.t === String(x.a)) {
        addScore(2);
        fb.innerHTML = `<span class="good">Výborně! ⭐${why}</span>`;
        cvicAfterSpeech(() => done(true), x.why ? 2200 : 1300);
      } else {
        b.classList.add("bad");
        fb.innerHTML = `<span class="badc">Správně je: ${x.a}${why}</span>`;
        const nx = app.querySelector("#nx"); nx.innerHTML = `<button class="btn">Další ➡️</button>`; nx.firstChild.onclick = () => done(false);
      }
    });
  });
}

/* Třídění do sloupců: cols: [{ k, t }], items: [{ t: "text", k: "klíč sloupce", say?, why? }]
   klikne se na slovo a pak na sloupec */
function cvicSort(o) {
  const set = o.items;
  let selected = null, done = 0, mistakes = 0;
  app.innerHTML = `<h2 class="clk" id="t">${o.title} <span class="ico">🔊</span></h2>
    <p class="center clk" id="d">Klikni na slovo a pak na správný sloupec. <span class="ico">🔊</span></p>
    <div class="progress"><div id="bar" style="width:0"></div></div>
    <div class="pool" id="pool">${set.map((x, k) => `<span class="chip" data-i="${k}">${x.t}</span>`).join("")}</div>
    <div class="sortcols" style="grid-template-columns:repeat(${o.cols.length},1fr)">${o.cols.map(c => `<div class="col" data-k="${c.k}"><h3>${c.t}</h3></div>`).join("")}</div>
    <div class="feedback" id="fb"></div>
    <div class="center"><button class="btn" id="again">🔄 Nová sada</button></div>`;
  const fb = app.querySelector("#fb");
  app.querySelector("#t").onclick = () => speakCz(czClean(o.title));
  app.querySelector("#d").onclick = () => speakCz("Klikni na slovo a pak na správný sloupec.");
  app.querySelectorAll("#pool .chip").forEach(t => t.onclick = () => {
    if (selected) selected.classList.remove("sel");
    selected = t; t.classList.add("sel");
    app.querySelectorAll(".col").forEach(c => c.classList.add("hot"));
    const x = set[t.dataset.i]; speakCz(x.say || czClean(x.t));
  });
  app.querySelectorAll(".col").forEach(c => c.onclick = () => {
    if (!selected) { speakCz(czClean(c.querySelector("h3").textContent)); fb.innerHTML = `<span class="badc">Nejdřív klikni na slovo 🙂</span>`; return; }
    const t = selected, x = set[t.dataset.i], why = x.why ? `<span class="note">${x.why}</span>` : "";
    if (c.dataset.k === String(x.k)) {
      t.remove(); selected = null;
      app.querySelectorAll(".col").forEach(k => k.classList.remove("hot"));
      const d = document.createElement("div"); d.className = "chip done"; d.innerHTML = x.t; c.appendChild(d);
      d.onclick = e => { e.stopPropagation(); speakCz(x.say || czClean(x.t)); };
      done++; addScore(1);
      app.querySelector("#bar").style.width = done / set.length * 100 + "%";
      fb.innerHTML = `<span class="good">Správně! 👍${why}</span>`;
      if (done === set.length) {
        const ok = set.length - Math.min(mistakes, set.length);
        cvicAfterSpeech(() => finish(ok, set.length, o.again), 1200);
      }
    } else {
      mistakes++; t.classList.add("wrong");
      fb.innerHTML = `<span class="badc">Zkus to znovu 🙂${o.wrongWhy && x.why ? `<span class="note">${x.why}</span>` : ""}</span>`;
      setTimeout(() => t.classList.remove("wrong"), 400);
    }
  });
  app.querySelector("#again").onclick = o.again;
}

/* Desítky a jednotky jako tyčky a kostičky (matematika 2. ročník) */
function cvicBlocks(n) {
  const t = Math.floor(n / 10), u = n % 10;
  return `<span class="blocks" title="${n}">${"<span class='ten'></span>".repeat(t)}${u ? `<span class="ones">${"<span class='one'></span>".repeat(u)}</span>` : ""}</span>`;
}
