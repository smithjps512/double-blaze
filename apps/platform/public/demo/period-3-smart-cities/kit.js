/*
 * Smart Cities kit: the shared parts of the four Period 3 city pages.
 *
 *   SmartKit.init({ city: "solar-city", questions: [...] })
 *   SmartKit.mountAnswers(element)      the designer-question answer board
 *   SmartKit.finishGame({ mode, score, title, lines })
 *                                       end-of-game dialog: score, initials,
 *                                       the class leaderboard
 *   SmartKit.showBoard(mode, title)     the leaderboard on its own
 *
 * Talks to /api/smart-cities on the same site. When that is not reachable (a
 * file:// preview, or no database yet) answers say so and scores fall back to
 * a personal best kept on this device, so a page never breaks.
 */
(function () {
  "use strict";
  var API = "/api/smart-cities";
  var cfg = { city: "", questions: [] };

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { /* private window: fine */ }
    return null;
  }

  function playerKey() {
    var k = store("smartkit.player");
    if (k && /^[A-Za-z0-9_-]{16,64}$/.test(k)) return k;
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    k = "";
    var rnd = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(24)) : null;
    for (var i = 0; i < 24; i++) k += chars[(rnd ? rnd[i] : Math.floor(Math.random() * 256)) % chars.length];
    store("smartkit.player", k);
    return k;
  }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var a in attrs) {
      if (a === "text") n.textContent = attrs[a];
      else if (a === "class") n.className = attrs[a];
      else if (a.slice(0, 2) === "on") n.addEventListener(a.slice(2), attrs[a]);
      else n.setAttribute(a, attrs[a]);
    }
    (kids || []).forEach(function (k) { if (k) n.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }

  // No API here: a file:// preview, a static server, or no database yet.
  function unavailable(err) {
    return err.message === "offline" || !err.status || [404, 405, 501, 503].indexOf(err.status) >= 0;
  }

  function api(path, opts) {
    if (location.protocol === "file:") return Promise.reject(new Error("offline"));
    return fetch(API + path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) { var err = new Error(data.error || "Something went wrong."); err.status = res.status; throw err; }
        return data;
      });
    });
  }

  var css = "\
.sk-card{background:var(--card,#fff);border:1px solid var(--border,#e3ded6);border-radius:16px;padding:16px;margin-top:16px}\
.sk-card h2{font-size:20px;margin:0 0 4px}.sk-muted{color:var(--muted,#5b5651);font-size:14px;line-height:1.45}\
.sk-q{margin:14px 0 0;padding-top:12px;border-top:1px solid var(--border,#e3ded6)}.sk-q:first-of-type{border-top:0;padding-top:0}\
.sk-q p.sk-qt{font-weight:600;margin:0 0 6px;line-height:1.4}\
.sk-a{background:#f6f5f1;border-left:3px solid var(--accent,#b4531a);border-radius:8px;padding:8px 10px;margin:6px 0;white-space:pre-wrap;line-height:1.45}\
.sk-a small{display:block;color:var(--muted,#5b5651);font-size:12px;margin-bottom:2px;font-weight:600}\
.sk-form{display:grid;gap:10px;margin-top:16px;padding-top:14px;border-top:1px dashed var(--border,#e3ded6)}\
.sk-form select,.sk-form textarea,.sk-in{font:inherit;font-size:16px;border:1px solid var(--border,#e3ded6);border-radius:10px;padding:10px;background:#fff;color:inherit;width:100%;box-sizing:border-box}\
.sk-form textarea{min-height:90px;resize:vertical}.sk-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}\
.sk-btn{font:inherit;font-weight:600;border:0;border-radius:999px;padding:10px 18px;background:var(--accent,#b4531a);color:#fff;cursor:pointer;min-height:44px}\
.sk-btn.sk-ghost{background:#fff;color:inherit;border:1px solid var(--border,#e3ded6)}.sk-btn:disabled{opacity:.6;cursor:default}\
.sk-btn:focus-visible,.sk-form :focus-visible,.sk-in:focus-visible{outline:3px solid var(--accent,#b4531a);outline-offset:2px}\
.sk-msg{font-size:14px;font-weight:600;color:#2f7a3b;min-height:1.2em}.sk-msg.sk-err{color:#b23a18}\
.sk-dlg{border:0;border-radius:18px;padding:0;max-width:420px;width:calc(100% - 32px);box-shadow:0 20px 60px rgba(0,0,0,.25);color:var(--ink,#1c1a19)}\
.sk-dlg::backdrop{background:rgba(20,18,16,.45)}.sk-dlg-in{padding:20px}.sk-dlg h2{margin:0 0 4px;font-size:22px}\
.sk-big{font-size:44px;font-weight:800;color:var(--accent,#b4531a);margin:6px 0;line-height:1}\
.sk-lines{margin:8px 0 12px;padding-left:18px;color:var(--muted,#5b5651);font-size:14px;line-height:1.5}\
.sk-board{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:4px}\
.sk-board li{display:flex;justify-content:space-between;padding:6px 10px;border-radius:8px;background:#f6f5f1;font-variant-numeric:tabular-nums}\
.sk-board li.sk-me{background:#fbe9dc;font-weight:700}.sk-in.sk-ini{width:110px;text-transform:uppercase;letter-spacing:.2em;font-weight:700;text-align:center}";

  function injectCss() {
    if (document.getElementById("sk-css")) return;
    document.head.appendChild(el("style", { id: "sk-css", text: css }));
  }

  // ---------------------------------------------------------------- answers

  function mountAnswers(host) {
    injectCss();
    var list = el("div");
    var msg = el("p", { class: "sk-msg", role: "status", "aria-live": "polite" });
    var qSel = el("select", { id: "sk-qsel", "aria-label": "Which question?" },
      cfg.questions.map(function (q, i) { return el("option", { value: String(i), text: (i + 1) + ". " + q }); }));
    var text = el("textarea", { id: "sk-answer", maxlength: "500", placeholder: "Your idea…", "aria-label": "Your answer" });
    var designer = el("input", { type: "radio", name: "sk-writer", value: "designer", id: "sk-w1" });
    var classmate = el("input", { type: "radio", name: "sk-writer", value: "classmate", id: "sk-w2", checked: "" });
    var send = el("button", { class: "sk-btn", type: "submit", text: "Send to my teacher" });
    var form = el("form", { class: "sk-form" }, [
      el("label", { for: "sk-qsel", class: "sk-muted", text: "Pick a question" }), qSel,
      el("label", { for: "sk-answer", class: "sk-muted", text: "Your answer" }), text,
      el("div", { class: "sk-row" }, [
        el("label", {}, [designer, " I designed this city"]),
        el("label", {}, [classmate, " I'm a classmate"]),
      ]),
      el("div", { class: "sk-row" }, [send]), msg,
      el("p", { class: "sk-muted", text: "Don't put your name. Your teacher reads every answer first, then good ones show up here for the class." }),
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var answer = text.value.trim();
      if (answer.length < 3) { say("Write an answer first.", true); text.focus(); return; }
      send.disabled = true; say("Sending…");
      api("/answers", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ city: cfg.city, question: Number(qSel.value), answer: answer, writer: designer.checked ? "designer" : "classmate" }),
      }).then(function () {
        text.value = ""; say("Sent! Your teacher will read it soon.");
      }).catch(function (err) {
        say(unavailable(err) ? "Answers aren't switched on here yet. Tell your teacher your idea!" : err.message, true);
      }).then(function () { send.disabled = false; });
    });
    function say(t, bad) { msg.textContent = t; msg.className = "sk-msg" + (bad ? " sk-err" : ""); }

    host.innerHTML = "";
    host.appendChild(el("div", { class: "sk-card", id: "sk-answers" }, [
      el("h2", { text: "Answer the designer questions" }),
      el("p", { class: "sk-muted", text: "The designers left some mysteries. What do you think? Approved answers from the class show under each question." }),
      list, form,
    ]));

    function render(answers) {
      list.innerHTML = "";
      cfg.questions.forEach(function (q, i) {
        var mine = answers.filter(function (a) { return a.question === i; });
        list.appendChild(el("div", { class: "sk-q" }, [el("p", { class: "sk-qt", text: q })].concat(
          mine.length ? mine.map(function (a) {
            return el("div", { class: "sk-a" }, [el("small", { text: a.writer === "designer" ? "The designer says" : "A classmate says" }), a.answer]);
          }) : [el("p", { class: "sk-muted", text: "No answers yet. Be the first!" })])));
      });
    }
    render([]);
    api("/answers?city=" + encodeURIComponent(cfg.city)).then(function (d) { render(d.answers || []); }).catch(function () {});
  }

  // ------------------------------------------------------------- leaderboard

  var dlg;
  function dialog() {
    injectCss();
    if (dlg) return dlg;
    dlg = el("dialog", { class: "sk-dlg", "aria-labelledby": "sk-dlg-title" });
    document.body.appendChild(dlg);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    return dlg;
  }

  function boardList(rows) {
    if (!rows.length) return el("p", { class: "sk-muted", text: "No scores yet. You could be first!" });
    return el("ol", { class: "sk-board" }, rows.map(function (r, i) {
      return el("li", { class: r.mine ? "sk-me" : "" }, [el("span", { text: (i + 1) + ". " + r.initials + (r.mine ? " (you)" : "") }), el("strong", { text: String(r.score) })]);
    }));
  }

  function localBest(mode, score) {
    var key = "smartkit.best." + cfg.city + "." + mode;
    var best = Number(store(key) || 0);
    if (score !== undefined && score > best) { store(key, String(score)); return { best: score, isNew: true }; }
    return { best: best, isNew: false };
  }

  function showBoard(mode, title) {
    var d = dialog();
    var body = el("div", {}, [el("p", { class: "sk-muted", text: "Loading…" })]);
    d.innerHTML = "";
    d.appendChild(el("div", { class: "sk-dlg-in" }, [
      el("h2", { id: "sk-dlg-title", text: title || "Class leaderboard" }), body,
      el("div", { class: "sk-row", style: "margin-top:16px" }, [el("button", { class: "sk-btn sk-ghost", text: "Close", onclick: function () { d.close(); } })]),
    ]));
    if (!d.open) d.showModal();
    api("/scores?city=" + encodeURIComponent(cfg.city) + "&mode=" + mode + "&player=" + playerKey()).then(function (data) {
      body.innerHTML = ""; body.appendChild(boardList(data.board || []));
    }).catch(function () {
      body.innerHTML = "";
      body.appendChild(el("p", { class: "sk-muted", text: "The class leaderboard isn't switched on here. Your best on this device: " + localBest(mode).best }));
    });
  }

  /**
   * End of a game: shows the score and lets the student put their initials on
   * the class board. `lines` are short strings saying how the score was made.
   * Returns a promise that resolves when the dialog closes.
   */
  function finishGame(opts) {
    var mode = opts.mode, score = Math.max(0, Math.min(1000, Math.round(opts.score || 0)));
    var d = dialog();
    var local = localBest(mode, score);
    var msg = el("p", { class: "sk-msg", role: "status", "aria-live": "polite" });
    var boardHost = el("div");
    var ini = el("input", { class: "sk-in sk-ini", maxlength: "3", autocomplete: "off", "aria-label": "Your initials (2 or 3 letters)", placeholder: "ABC", value: store("smartkit.initials") || "" });
    var post = el("button", { class: "sk-btn", text: "Post my score" });
    var close = el("button", { class: "sk-btn sk-ghost", text: opts.againLabel || "Play again" });
    var done = el("button", { class: "sk-btn sk-ghost", text: "Close" });
    var result = "close";
    ini.addEventListener("input", function () { ini.value = ini.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3); });

    function send() {
      var v = ini.value;
      if (!/^[A-Z]{2,3}$/.test(v)) { say("Type 2 or 3 letters.", true); ini.focus(); return; }
      store("smartkit.initials", v);
      post.disabled = true; say("Posting…");
      api("/scores", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ city: cfg.city, mode: mode, initials: v, score: score, player: playerKey() }),
      }).then(function (data) {
        say(data.best ? "Posted to the class board!" : "Posted! Your best score on this device is still higher.");
        boardHost.innerHTML = ""; boardHost.appendChild(boardList(data.board || []));
      }).catch(function (err) {
        if (unavailable(err)) {
          say("The class board isn't switched on here, so your score is saved on this device.", true);
        } else { say(err.message, true); post.disabled = false; }
      });
    }
    function say(t, bad) { msg.textContent = t; msg.className = "sk-msg" + (bad ? " sk-err" : ""); }
    post.addEventListener("click", send);
    ini.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

    d.innerHTML = "";
    d.appendChild(el("div", { class: "sk-dlg-in" }, [
      el("h2", { id: "sk-dlg-title", text: opts.title || "Game over" }),
      el("div", { class: "sk-big", text: String(score) }),
      el("p", { class: "sk-muted", text: local.isNew ? "A new best on this device!" : "Best on this device: " + local.best }),
      opts.lines && opts.lines.length ? el("ul", { class: "sk-lines" }, opts.lines.map(function (l) { return el("li", { text: l }); })) : null,
      el("label", { class: "sk-muted", text: "Put your initials on the class board (no names):" }),
      el("div", { class: "sk-row", style: "margin-top:6px" }, [ini, post]), msg, boardHost,
      el("div", { class: "sk-row", style: "margin-top:16px" }, [close, done]),
    ]));
    return new Promise(function (resolve) {
      close.addEventListener("click", function () { result = "again"; d.close(); });
      done.addEventListener("click", function () { d.close(); });
      d.addEventListener("close", function handler() { d.removeEventListener("close", handler); resolve(result); });
      d.showModal();
      ini.focus();
    });
  }

  window.SmartKit = {
    init: function (c) { cfg.city = c.city; cfg.questions = c.questions || []; injectCss(); },
    mountAnswers: mountAnswers,
    finishGame: finishGame,
    showBoard: showBoard,
  };
})();
