/* BABEL ON landing page. No framework, no tracking. */

// The one GitHub link. Change it here. (index.html has the same address as a fallback for no JavaScript.)
const REPO_URL = "https://github.com/BABEL-ON-APP/babel-on";

(() => {
  "use strict";

  // ---------- the GitHub link ----------
  document.querySelectorAll("a[data-repo]").forEach((a) => { a.href = REPO_URL; });
  document.querySelectorAll("[data-repo-clone]").forEach((el) => { el.textContent = REPO_URL + ".git"; });

  // ---------- the GitHub star count ----------
  // One request to the public GitHub API, kept for one hour in this browser.
  // If the request fails (no network, a private repository, a rate limit), the count stays hidden.
  (async () => {
    const KEY = "babelon-stars", HOUR = 3600e3;
    const show = (n) => {
      const text = new Intl.NumberFormat("en", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
      document.querySelectorAll("[data-stars]").forEach((el) => {
        el.textContent = "\u2605 " + text;
        el.setAttribute("aria-label", text + " stars on GitHub");
        el.hidden = false;
      });
    };
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && Date.now() - saved.at < HOUR) { show(saved.n); return; }
    } catch (e) { /* storage is not available: ask the API */ }
    try {
      const res = await fetch("https://api.github.com/repos/" + new URL(REPO_URL).pathname.slice(1), { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) return;
      const n = (await res.json()).stargazers_count;
      if (typeof n !== "number") return;
      show(n);
      try { localStorage.setItem(KEY, JSON.stringify({ n, at: Date.now() })); } catch (e) { /* no storage */ }
    } catch (e) { /* no network: no count */ }
  })();

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionQuery.matches;

  // ---------- the chromatic glow ----------
  const REST_TURN = 3.5;      // seconds for one turn at rest
  const SPEED_GAIN = 1.4;     // rest x 2.4 at full voice
  const glows = new Map();
  let raf = 0;
  let last = 0;

  document.querySelectorAll("[data-glow]").forEach((el) => {
    const wide = el.querySelector(".glow__l--wide");
    const g = {
      el,
      wide,
      rotors: [...el.querySelectorAll("b")],
      wideBase: 0.5,
      grow: Number(el.dataset.grow) || 16,   // px that the wide band grows on each side at full voice
      sim: el.dataset.voice === "sim",
      w: 1, h: 1,
      visible: false,
      angle: Math.random() * 360,
      level: 0, target: 0,
      nextKick: 0, kicksLeft: 0,
    };
    glows.set(el.dataset.glow, g);
    apply(g);
  });

  function apply(g) {
    const rot = "rotate(" + g.angle.toFixed(2) + "deg)";
    for (const b of g.rotors) b.style.transform = rot;
    if (g.wide) {
      const sx = 1 + (2 * g.grow * g.level) / g.w;
      const sy = 1 + (2 * g.grow * g.level) / g.h;
      g.wide.style.transform = "scale(" + sx.toFixed(4) + "," + sy.toFixed(4) + ")";
      g.wide.style.opacity = (g.wideBase + (1 - g.wideBase) * g.level).toFixed(3);
    }
  }

  // A simulated voice: a short burst of syllables every few seconds.
  function simulate(g, now) {
    if (!g.nextKick) g.nextKick = now + 1400 + Math.random() * 1500;
    if (now < g.nextKick) return;
    if (g.kicksLeft === 0) g.kicksLeft = 5 + Math.floor(Math.random() * 4);
    g.target = 0.7 + Math.random() * 0.3;
    g.kicksLeft -= 1;
    g.nextKick = now + (g.kicksLeft > 0 ? 130 + Math.random() * 150 : 3400 + Math.random() * 2200);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const g of glows.values()) {
      if (!g.visible) continue;
      if (g.sim) simulate(g, now);
      g.target *= Math.exp(-dt / 0.3);
      const tau = g.target > g.level ? 0.09 : 0.42;
      g.level += (g.target - g.level) * (1 - Math.exp(-dt / tau));
      g.angle = (g.angle + (dt * 360 / REST_TURN) * (1 + SPEED_GAIN * g.level)) % 360;
      apply(g);
    }
    raf = requestAnimationFrame(frame);
  }

  function syncLoop() {
    let any = false;
    for (const g of glows.values()) any = any || g.visible;
    const run = any && !document.hidden && !reduced;
    if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  const byEl = new Map([...glows.values()].map((g) => [g.el, g]));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) byEl.get(e.target).visible = e.isIntersecting;
      syncLoop();
    }, { rootMargin: "60px" });
    byEl.forEach((g, el) => io.observe(el));
  } else {
    byEl.forEach((g) => { g.visible = true; });
  }
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const g = byEl.get(e.target);
        g.w = Math.max(1, e.contentRect.width);
        g.h = Math.max(1, e.contentRect.height);
      }
    });
    byEl.forEach((g, el) => ro.observe(el));
  }

  // ---------- the live demo ----------
  const RAW = [
    ["um", 1], ["so", 1], ["can", 0], ["you", 0], ["uh", 1], ["move", 0], ["the", 0], ["call", 0], ["to", 0],
    ["three", 1], ["no", 1], ["wait", 1], ["four", 0], ["thirty", 0], ["on", 0], ["thursday", 0],
  ];
  const rawEl = document.getElementById("demo-raw");
  const cleanEl = document.getElementById("demo-clean");
  const statusEl = document.getElementById("demo-status");
  const toggle = document.getElementById("demo-toggle");
  const demoGlow = glows.get("demo");
  const demoWin = document.querySelector(".demo__win");

  let step = -1;          // index of the step that ran last
  let timer = 0;
  let running = false;
  let userPaused = reduced;
  let inView = false;

  function setStatus(text, live) {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-live", !!live);
  }

  const steps = [];
  steps.push([() => {
    rawEl.textContent = "";
    rawEl.classList.remove("is-out");
    cleanEl.classList.remove("is-in");
    setStatus("Listening", true);
    demoGlow.el.classList.remove("is-off");
  }, 700]);
  RAW.forEach(([word, del], i) => {
    steps.push([() => {
      const s = document.createElement("span");
      s.className = "w";
      if (del) s.dataset.del = "1";
      s.textContent = word;
      if (i) rawEl.append(" ");
      rawEl.append(s);
      demoGlow.target = 0.75 + Math.random() * 0.25;
    }, 190 + word.length * 34 + (del ? 120 : 0)]);
  });
  steps.push([() => { setStatus("Cleanup", true); }, 500]);
  steps.push([() => {
    rawEl.querySelectorAll("[data-del]").forEach((s) => s.classList.add("del"));
  }, 1500]);
  steps.push([() => {
    rawEl.querySelectorAll("[data-del]").forEach((s) => s.classList.add("gone"));
  }, 550]);
  steps.push([() => {
    rawEl.classList.add("is-out");
    cleanEl.classList.add("is-in");
    setStatus("Done", false);
    demoGlow.el.classList.add("is-off");
  }, 4200]);

  function runStep() {
    step = (step + 1) % steps.length;
    steps[step][0]();
    timer = setTimeout(() => {
      if (reduced && step === steps.length - 1) { stopAtEnd(); return; }
      runStep();
    }, steps[step][1]);
  }

  function stopAtEnd() {
    running = false;
    userPaused = true;
    step = -1;
    label();
  }

  function label() {
    if (reduced) {
      toggle.textContent = "Play";
      toggle.disabled = running;
      toggle.setAttribute("aria-label", "Play the demo");
    } else {
      toggle.textContent = userPaused ? "Play" : "Pause";
      toggle.disabled = false;
      toggle.setAttribute("aria-label", userPaused ? "Play the demo" : "Pause the demo");
    }
  }

  function syncDemo() {
    const should = !userPaused && inView && !document.hidden;
    if (should && !running) { running = true; runStep(); }
    if (!should && running) { running = false; clearTimeout(timer); }
    label();
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    userPaused = reduced ? false : !userPaused;
    syncDemo();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      syncDemo();
    }, { threshold: 0.35 }).observe(demoWin);
  } else {
    inView = true;
  }
  label();

  document.addEventListener("visibilitychange", () => { syncLoop(); syncDemo(); });

  const onMotion = () => {
    reduced = motionQuery.matches;
    if (reduced && running) { clearTimeout(timer); running = false; }
    if (reduced) {
      // show the final state
      userPaused = true;
      step = -1;
      rawEl.textContent = "";
      cleanEl.classList.add("is-in");
      setStatus("Done", false);
      demoGlow.el.classList.add("is-off");
    } else {
      userPaused = false;
    }
    syncLoop();
    syncDemo();
  };
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotion);

  // ---------- copy the build steps ----------
  const copyBtn = document.getElementById("copy");
  const copyLive = document.getElementById("copy-live");
  const cmd = document.getElementById("build-cmd");
  if (navigator.clipboard && window.isSecureContext) {
    copyBtn.hidden = false;
    let back = 0;
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(cmd.textContent.trim() + "\n");
        copyBtn.textContent = "Copied";
        copyLive.textContent = "The build steps are on the clipboard.";
      } catch (err) {
        copyBtn.textContent = "Failed";
        copyLive.textContent = "The copy failed. Select the text and copy it.";
      }
      clearTimeout(back);
      back = setTimeout(() => { copyBtn.textContent = "Copy"; copyLive.textContent = ""; }, 2200);
    });
  }
})();
