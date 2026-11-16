// 📲 Install BwN as an app on a phone, tablet or computer (owner, 16 Nov 2026, PCA J117).
// Phones that offer it get the browser's own Install box; iPhone and others get two short steps.
(() => {
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) return; // already opened as the app
  const ua = navigator.userAgent, ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const phone = ios || matchMedia("(pointer: coarse)").matches;
  const st = document.createElement("style");
  st.textContent = `.install-wrap{position:fixed;right:max(14px,env(safe-area-inset-right,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:900;display:flex;gap:6px;align-items:center}
.install-wrap #installBtn{border:0;border-radius:999px;padding:9px 16px;background:#1f5c47;color:#fff;font:600 .9rem system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}
.install-no{border:1px solid rgba(0,0,0,.15);border-radius:999px;padding:7px 12px;background:#fff;color:#1d2a27;font:500 .82rem system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.15);cursor:pointer}
.ins-ov{position:fixed;inset:0;z-index:6000;background:rgba(0,0,0,.45);display:grid;place-items:end center;padding:12px}
.ins-box{width:min(420px,100%);background:#fff;color:#1d2a27;border-radius:16px;padding:18px 18px 14px;font:15px/1.5 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.3)}
.ins-box h3{margin:0 0 8px;font-size:1.05rem;display:flex;gap:10px;align-items:center}.ins-box img{width:36px;height:36px;border-radius:8px}
.ins-box ol{margin:6px 0 12px;padding-left:1.3em}.ins-box li{margin:4px 0}.ins-box button{border:0;border-radius:999px;background:#1f5c47;color:#fff;padding:8px 18px;font-weight:600;float:right}
.ins-box::after{content:"";display:block;clear:both}`;
  document.head.append(st);
  let btn = document.getElementById("installBtn"), wrap = null;
  if (!btn) { // the floating pill (home page): "Not now" hides it for 30 days on this device
    let until = 0; try { until = +localStorage.getItem("bwnInstallSnooze") || 0; } catch { }
    if (Date.now() < until) return;
    wrap = document.createElement("div"); wrap.className = "install-wrap"; wrap.hidden = true;
    btn = document.createElement("button"); btn.id = "installBtn";
    const no = document.createElement("button"); no.type = "button"; no.className = "install-no"; no.textContent = "Not now"; no.title = "Hide for 30 days";
    no.onclick = () => { try { localStorage.setItem("bwnInstallSnooze", String(Date.now() + 30 * 864e5)); } catch { } wrap.remove(); };
    wrap.append(btn, no); document.body.append(wrap);
  }
  btn.type = "button"; btn.textContent = "📲 Install"; btn.title = "Put BwN on this device as an app, with its own icon"; btn.hidden = true;
  const show = on => { btn.hidden = !on; if (wrap) wrap.hidden = !on; };
  let ev = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); ev = e; show(true); }); // our own visible button replaces Chrome's bar, so nothing is lost
  addEventListener("appinstalled", () => { show(false); ev = null; });
  if (phone) show(true);
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
    if (ev) { const e = ev; ev = null; e.prompt(); const r = await e.userChoice.catch(() => null); if (r && r.outcome === "accepted") show(false); return; }
    help();
  };
})();
