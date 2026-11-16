// 📲 Install BwN as an app on a phone, tablet or computer (owner, 16 Nov 2026, PCA J117).
// Phones that offer it get the browser's own Install box; iPhone and others get two short steps.
(() => {
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) return; // already opened as the app
  const ua = navigator.userAgent, ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const phone = ios || matchMedia("(pointer: coarse)").matches;
  const st = document.createElement("style");
  st.textContent = `.install-pill{position:fixed;right:max(14px,env(safe-area-inset-right,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:900;border:0;border-radius:999px;padding:9px 16px;background:#1f5c47;color:#fff;font:600 .9rem system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}
.ins-ov{position:fixed;inset:0;z-index:6000;background:rgba(0,0,0,.45);display:grid;place-items:end center;padding:12px}
.ins-box{width:min(420px,100%);background:#fff;color:#1d2a27;border-radius:16px;padding:18px 18px 14px;font:15px/1.5 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.3)}
.ins-box h3{margin:0 0 8px;font-size:1.05rem;display:flex;gap:10px;align-items:center}.ins-box img{width:36px;height:36px;border-radius:8px}
.ins-box ol{margin:6px 0 12px;padding-left:1.3em}.ins-box li{margin:4px 0}.ins-box button{border:0;border-radius:999px;background:#1f5c47;color:#fff;padding:8px 18px;font-weight:600;float:right}
.ins-box::after{content:"";display:block;clear:both}`;
  document.head.append(st);
  let btn = document.getElementById("installBtn");
  if (!btn) { btn = document.createElement("button"); btn.className = "install-pill"; btn.id = "installBtn"; document.body.append(btn); }
  btn.type = "button"; btn.textContent = "📲 Install"; btn.title = "Put BwN on this device as an app, with its own icon"; btn.hidden = true;
  let ev = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); ev = e; btn.hidden = false; });
  addEventListener("appinstalled", () => { btn.hidden = true; ev = null; });
  if (phone) btn.hidden = false;
  const icon = new URL("icons/bwn-192.png", document.currentScript?.src || location.href).href;
  function help() {
    const steps = ios
      ? ["Open this page in <b>Safari</b>.", "Tap <b>Share</b> <span aria-hidden=true>⬆︎</span> at the bottom (or top) of the screen.", "Tap <b>Add to Home Screen</b>, then <b>Add</b>."]
      : ["Open the browser menu <b>⋮</b> (top right).", "Tap <b>Install app</b> or <b>Add to Home screen</b>.", "Tap <b>Install</b>. The BwN icon appears on your home screen."];
    const ov = document.createElement("div"); ov.className = "ins-ov";
    ov.innerHTML = `<div class="ins-box" role="dialog" aria-label="Install BwN"><h3><img src="${icon}" alt="">Install BwN as an app</h3><ol>${steps.map(s => `<li>${s}</li>`).join("")}</ol><button type="button">OK</button></div>`;
    ov.onclick = e => { if (e.target === ov || e.target.tagName === "BUTTON") ov.remove(); };
    document.body.append(ov); ov.querySelector("button").focus();
  }
  btn.onclick = async () => {
    if (ev) { const e = ev; ev = null; e.prompt(); const r = await e.userChoice.catch(() => null); if (r && r.outcome === "accepted") btn.hidden = true; return; }
    help();
  };
})();
