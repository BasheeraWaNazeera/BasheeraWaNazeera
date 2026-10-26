// Pop-up windows and the note editor, taken from Siyagah's note pane
// (siyagah.github.io v05.49: _fwCreate / _fwResizeStart / _fwAddResizeHandles /
// _fwWireDragHandle / _fwSavePos / _fwEc / _fwFb / _fwScheduleAutoSave / _ntFind*),
// with Siyagah's database calls taken out (BWN J26, Siyagah J78).
// Panels are keyed by a panel id instead of a note id.

const GEO_KEY = "bwnlib.geo";
const MIN_W = 320, MIN_H = 240;
const AUTOSAVE_MS = 1200, AUTOSAVE_MAX_MS = 2500;   // Siyagah _ED_AUTOSAVE_MS / _MAX_MS
let zTop = 50;

export const popTier = () => (window.innerWidth < 640 ? "sheet" : "window");   // Siyagah _popTier

function geoAll() { try { return JSON.parse(localStorage.getItem(GEO_KEY) || "{}"); } catch { return {}; } }
function geoPut(id, g) { try { const all = geoAll(); all[id] = g; localStorage.setItem(GEO_KEY, JSON.stringify(all)); } catch { } }

function ptrDown(move, up) {
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);
}
function ptrUp(move, up) {
  document.removeEventListener("pointermove", move);
  document.removeEventListener("pointerup", up);
  document.removeEventListener("pointercancel", up);
}

function savePos(win) {
  // a sheet's size is the screen's, not a choice anyone made: sheets remember nothing
  if (popTier() === "sheet" || !win.classList.contains("float-win")) return;
  const r = win.getBoundingClientRect();
  geoPut(win.dataset.pane, { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) });
}

// clamp a remembered frame into the current viewport
function place(win, def) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const s = geoAll()[win.dataset.pane];
  let w, h, x, y;
  if (s && s.width && s.height) {
    w = Math.min(s.width, vw - 8); h = Math.min(s.height, vh - 8);
    x = Math.max(0, Math.min(s.left, vw - w)); y = Math.max(0, Math.min(s.top, vh - h));
  } else ({ w, h, x, y } = def());
  win.style.left = x + "px"; win.style.top = y + "px"; win.style.width = w + "px"; win.style.height = h + "px";
}

function resizeStart(ev, win, dir) {
  if (ev.button !== 0) return;
  ev.preventDefault();
  const r = win.getBoundingClientRect();
  const st = { x: ev.clientX, y: ev.clientY, l: r.left, t: r.top, w: r.width, h: r.height };
  function move(e) {
    let l = st.l, t = st.t, w = st.w, h = st.h;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (dir.includes("r")) w = Math.max(MIN_W, st.w + dx);
    if (dir.includes("l")) { w = Math.max(MIN_W, st.w - dx); l = st.l + (st.w - w); }
    if (dir.includes("b")) h = Math.max(MIN_H, st.h + dy);
    if (dir.includes("t")) { h = Math.max(MIN_H, st.h - dy); t = Math.max(0, st.t + (st.h - h)); }
    win.style.width = w + "px"; win.style.height = h + "px"; win.style.left = l + "px"; win.style.top = t + "px";
  }
  function up() {
    ptrUp(move, up);
    document.body.style.cursor = ""; document.body.style.userSelect = "";
    savePos(win);
  }
  ptrDown(move, up);
  document.body.style.userSelect = "none";
  document.body.style.cursor = dir.length === 1 ? (dir === "l" || dir === "r" ? "ew-resize" : "ns-resize") : (dir === "tr" || dir === "bl" ? "nesw-resize" : "nwse-resize");
}

// all four edges and all four corners (Siyagah has r/b/l + four corners; the top edge is added here)
function addHandles(win) {
  [["t", "modal-resize-t"], ["r", "modal-resize-r"], ["b", "modal-resize-b"], ["l", "modal-resize-l"],
   ["tr", "modal-corner modal-corner-tr"], ["tl", "modal-corner modal-corner-tl"],
   ["bl", "modal-corner modal-corner-bl"], ["br", "modal-corner modal-corner-br"]].forEach(([dir, cls]) => {
    const el = document.createElement("div");
    el.className = cls + " fw-grip";
    el.addEventListener("pointerdown", ev => resizeStart(ev, win, dir));
    win.appendChild(el);
  });
}

function wireDrag(handle, win) {
  let sx, sy, sl, st;
  function move(e) {
    win.style.left = Math.max(0, Math.min(sl + (e.clientX - sx), window.innerWidth - 60)) + "px";
    win.style.top = Math.max(0, Math.min(st + (e.clientY - sy), window.innerHeight - 40)) + "px";
  }
  function up() { ptrUp(move, up); savePos(win); }
  handle.addEventListener("pointerdown", e => {
    if (!win.classList.contains("float-win") || e.button !== 0 || e.target.closest("button,input,select,a")) return;
    sx = e.clientX; sy = e.clientY;
    const r = win.getBoundingClientRect(); sl = r.left; st = r.top;
    ptrDown(move, up);
    e.preventDefault();
  });
}

const panes = [];

// Turn an existing panel into a pop-up window (or back into a docked panel).
export function makePopup(win, id, title, defGeom) {
  win.dataset.pane = id;
  const hd = document.createElement("div");
  hd.className = "fw-hd";
  hd.innerHTML = `<span class="fw-drag" aria-hidden="true">⠿</span><span class="fw-title-disp"></span>`;
  hd.querySelector(".fw-title-disp").textContent = title;
  win.prepend(hd);
  addHandles(win);
  wireDrag(hd, win);
  win.addEventListener("pointerdown", () => { if (win.classList.contains("float-win")) win.style.zIndex = ++zTop; }, { capture: true });
  if (typeof ResizeObserver !== "undefined") {
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => savePos(win), 400); }).observe(win);
  }
  panes.push({ win, defGeom });
}

export function setPopups(on) {
  document.body.classList.toggle("pop-on", on);
  panes.forEach(({ win, defGeom }) => {
    win.classList.toggle("float-win", on);
    if (on && popTier() === "window") { place(win, defGeom); win.style.zIndex = ++zTop; }
    else { win.style.left = win.style.top = win.style.width = win.style.height = win.style.zIndex = ""; }
  });
}
export function resetPopups() {
  try { localStorage.removeItem(GEO_KEY); } catch { }
  setPopups(document.body.classList.contains("pop-on"));
}
addEventListener("resize", () => { if (document.body.classList.contains("pop-on")) setPopups(true); });

// ---- editor (Siyagah E5/E6 commands, C4 autosave, N8 find) -------------------

export function editorHTML(id, html) {
  const b = (cmd, label, title, val) => `<button type="button" class="et" data-cmd="${cmd}"${val ? ` data-val="${val}"` : ""} title="${title}">${label}</button>`;
  return `<div class="fw-tb" role="toolbar" aria-label="Formatting">
      ${b("bold", "<b>B</b>", "Bold (Ctrl+B)")}${b("italic", "<i>I</i>", "Italic (Ctrl+I)")}${b("underline", "<u>U</u>", "Underline (Ctrl+U)")}
      <span class="tb-sep"></span>${b("h:h2", "H1", "Heading")}${b("h:h3", "H2", "Sub-heading")}${b("h:blockquote", "❝", "Quote")}
      <span class="tb-sep"></span>${b("insertUnorderedList", "•", "Bullet list")}${b("insertOrderedList", "1.", "Numbered list")}
      <span class="tb-sep"></span>${b("undo", "↶", "Undo (Ctrl+Z)")}${b("redo", "↷", "Redo (Ctrl+Y)")}${b("clear", "T̸", "Clear formatting")}${b("find", "⌕", "Find in note (Ctrl+F)")}
      <span class="fw-saved" id="fw-saved-${id}" aria-live="polite"></span>
    </div>
    <div class="fw-find" id="fw-find-${id}" hidden>
      <input class="fw-find-q" id="fw-find-q-${id}" placeholder="Find in note…" aria-label="Find in note">
      <span class="fw-find-n" id="fw-find-n-${id}"></span>
      <button type="button" class="et" data-f="-1" title="Previous match (Shift+Enter)">▲</button>
      <button type="button" class="et" data-f="1" title="Next match (Enter)">▼</button>
      <button type="button" class="et" data-f="x" title="Close find (Esc)">✕</button>
    </div>
    <div class="fw-ed" id="fw-ed-${id}" contenteditable="true" lang="bn" spellcheck="true">${html}</div>`;
}

const timers = {}, since = {}, flushers = {};

// Wire the editor rendered by editorHTML. onSave(html) returns a promise.
export function wireEditor(host, id, onSave) {
  const ed = host.querySelector("#fw-ed-" + id), chip = host.querySelector("#fw-saved-" + id);
  let last = ed.innerHTML;
  const flash = t => { if (chip) chip.textContent = t; };
  async function flush() {
    clearTimeout(timers[id]); delete since[id];
    const html = ed.innerHTML;
    if (html === last) return;   // only a real change is written
    last = html;
    try { await onSave(html); flash("Saved ✓"); } catch (e) { last = null; flash("Not saved: " + (e.message || e)); }
  }
  flushers[id] = flush;
  function schedule() {   // Siyagah's bounded debounce: a fast typist still commits every 2.5 s
    clearTimeout(timers[id]);
    const now = Date.now();
    if (!since[id]) since[id] = now;
    flash("Saving…");
    timers[id] = setTimeout(flush, Math.max(0, Math.min(AUTOSAVE_MS, AUTOSAVE_MAX_MS - (now - since[id]))));
  }
  ed.addEventListener("input", schedule);
  ed.addEventListener("blur", flush);
  ed.addEventListener("paste", e => {   // paste as plain text, so no outside styling comes in
    const t = e.clipboardData && e.clipboardData.getData("text/plain");
    if (t == null) return;
    e.preventDefault(); document.execCommand("insertText", false, t);
  });
  const tb = host.querySelector(".fw-tb");
  tb.addEventListener("mousedown", e => { if (e.target.closest("[data-cmd]")) e.preventDefault(); });   // keep the caret in the note
  tb.addEventListener("click", e => {   // a click, or Enter / Space on a focused button
    const btn = e.target.closest("[data-cmd]"); if (!btn) return;
    const cmd = btn.dataset.cmd;
    if (cmd === "find") { findToggle(host, id); return; }
    ed.focus();
    if (cmd.startsWith("h:")) {   // Siyagah _fwFb: the same heading again turns it back into text
      const tag = cmd.slice(2);
      let cur = null;
      try {
        const s = getSelection(); let n = s.rangeCount && s.getRangeAt(0).startContainer;
        n = n && (n.nodeType === 1 ? n : n.parentElement);
        const blk = n && ed.contains(n) && n.closest("h2,h3,blockquote"); if (blk) cur = blk.tagName.toLowerCase();
      } catch { }
      document.execCommand("formatBlock", false, "<" + (cur === tag ? "p" : tag) + ">");
    } else if (cmd === "clear") {
      document.execCommand("removeFormat"); document.execCommand("formatBlock", false, "<p>");
    } else document.execCommand(cmd, false, btn.dataset.val || null);
    schedule();
  });
  ed.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); findToggle(host, id); } });
  const q = host.querySelector("#fw-find-q-" + id);
  q.addEventListener("input", () => findRun(ed, host, id, q.value));
  q.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); findStep(host, id, e.shiftKey ? -1 : 1); }
    else if (e.key === "Escape") { e.preventDefault(); findClose(host, id); ed.focus(); }
  });
  host.querySelector(".fw-find").addEventListener("click", e => {
    const f = e.target.closest("[data-f]"); if (!f) return;
    if (f.dataset.f === "x") findClose(host, id); else findStep(host, id, +f.dataset.f);
  });
  return flush;
}

// commit every editor with a pending change (before re-rendering, leaving, or closing)
export async function flushAll() { await Promise.all(Object.values(flushers).map(f => f())); }
addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushAll(); });

// find: Ranges + CSS Custom Highlight, mutates nothing (so no search marks can be saved into a note)
let F = null;
function findToggle(host, id) {
  const bar = host.querySelector("#fw-find-" + id);
  if (!bar.hidden) { findClose(host, id); return; }
  bar.hidden = false;
  const q = host.querySelector("#fw-find-q-" + id); q.value = ""; q.focus();
  host.querySelector("#fw-find-n-" + id).textContent = "";
}
function findRun(ed, host, id, term) {
  term = (term || "").trim();
  const ranges = [];
  if (term) {
    const needle = term.toLowerCase(), w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const t = (n.nodeValue || "").toLowerCase();
      for (let i = t.indexOf(needle); i > -1; i = t.indexOf(needle, i + needle.length)) {
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + needle.length); ranges.push(r);
      }
    }
  }
  F = { id, ranges, idx: -1 };
  paint();
  host.querySelector("#fw-find-n-" + id).textContent = term ? (ranges.length ? "" : "0 / 0") : "";
  if (ranges.length) findStep(host, id, 1);
}
function findStep(host, id, dir) {
  if (!F || F.id !== id || !F.ranges.length) return;
  const n = F.ranges.length;
  F.idx = (F.idx + dir + n) % n;
  const r = F.ranges[F.idx];
  try {
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const el = r.startContainer.parentElement; if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  } catch { }
  host.querySelector("#fw-find-n-" + id).textContent = (F.idx + 1) + " / " + n;
}
function findClose(host, id) {
  const bar = host.querySelector("#fw-find-" + id); if (bar) bar.hidden = true;
  if (F && F.id === id) F = null;
  paint();
}
function paint() {
  try {
    if (!window.CSS || !CSS.highlights) return;
    CSS.highlights.delete("nt-find");
    if (F && F.ranges.length) CSS.highlights.set("nt-find", new Highlight(...F.ranges));
  } catch { }
}
