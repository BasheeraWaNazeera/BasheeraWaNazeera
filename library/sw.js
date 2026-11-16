// BwN Library: keeps the Library pages on this device so they open without the internet (owner, 14 Nov 2026, BWN J27).
// Pages and scripts: the internet first, the copy on this device when offline. Firebase and font files: the copy first.
// Files the owner keeps offline (📥) live in the "bwn-offline-v1" store and are served from there.
const V = "bwn-shell-v2";
const SHELL = ["./my.html", "./page.html", "./index.html", "./app.js", "./config.js", "./mmj.js", "./notepane.js", "./sample.js", "./install.js", "./manifest.webmanifest", "./icons/bwn-192.png", "./icons/bwn-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => { })); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("bwn-shell-") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url), base = new URL("./", self.location.href);
  if (u.href.startsWith(base.href + "__bwn_off__/")) { e.respondWith(caches.open("bwn-offline-v1").then(c => c.match(r)).then(m => m || new Response("", { status: 404 }))); return; }
  if (u.href.startsWith(base.href)) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === "navigate" ? caches.match("./my.html") : Response.error()))));
    return; }
  if (/^https:\/\/(www\.gstatic\.com\/firebasejs\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/.test(r.url))
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })));
});
