// Reader of Siyagah's shared Mapping My Journey copy (BWN J27 Stage 2, Siyagah R1, MMJ-SHARE.md).
// Reads the copy; writes ONLY new request documents notebooks/{nb}/mmjin/{reqId} (Siyagah R2, v05.68, "Writing (R2)"),
// never anything else of Siyagah's, and never changes a request after creating it.
// Siyagah's Firebase web settings and notebook id come from config.js (siyagah), given by the owner.
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";

export async function startMMJ({ cfg, nb, idToken, onTree, onNotes, onState }) {
  if (!cfg || !cfg.apiKey || !nb) { onState("unset"); return null; }
  const [{ initializeApp, getApps }, fs, au] = await Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-firestore.js"), import(FB + "firebase-auth.js")]);
  const app = getApps().find(a => a.name === "siyagah") || initializeApp(cfg, "siyagah");
  const db = fs.getFirestore(app), auth = au.getAuth(app);
  const notes = new Map(); let cursor = null, unsub = null, retried = false;
  const base = `notebooks/${nb}`;

  async function readTree() {
    const t0 = await fs.getDoc(fs.doc(db, base + "/mmj/t~0"));
    if (!t0.exists()) return onTree([], null);
    const d = t0.data();
    if (Array.isArray(d.folders)) return onTree(d.folders, d.sec || null);
    for (let attempt = 0; attempt < 3; attempt++) {
      const parts = await Promise.all(Array.from({ length: d.n || 0 }, (_, i) => fs.getDoc(fs.doc(db, `${base}/mmj/t~${i + 1}`))));
      if (parts.every(p => p.exists() && p.data().g === d.g)) return onTree(parts.flatMap(p => p.data().folders || []), d.sec || null);
      const again = await fs.getDoc(fs.doc(db, base + "/mmj/t~0")); Object.assign(d, again.data() || {});
    }
  }
  async function fullNote(n) {
    if (!n.parts) return n;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ps = await Promise.all(Array.from({ length: n.parts }, (_, i) => fs.getDoc(fs.doc(db, `${base}/mmjparts/n~${encodeURIComponent(n.id).replace(/\./g, "%2E")}~${n.g}~${i}`))));
      if (ps.every(p => p.exists() && p.data().g === n.g)) return { ...n, content: ps.map(p => p.data().d).join("") };
      const again = await fs.getDoc(fs.doc(db, `${base}/mmj/n~${encodeURIComponent(n.id).replace(/\./g, "%2E")}`)); if (!again.exists()) return null; n = again.data(); if (!n.parts) return n;
    }
    return { ...n, content: "" };
  }
  function listen() {
    const q = cursor ? fs.query(fs.collection(db, base + "/mmj"), fs.where("at", ">", cursor), fs.orderBy("at")) : fs.query(fs.collection(db, base + "/mmj"), fs.orderBy("at"));
    unsub = fs.onSnapshot(q, async snap => {
      let tree = false, changed = false;
      for (const ch of snap.docChanges()) {
        const id = ch.doc.id, d = ch.doc.data();
        if (d.at && (!cursor || d.at > cursor)) cursor = d.at;
        if (id.startsWith("t~")) { tree = true; continue; }
        if (!id.startsWith("n~")) continue;
        if (d.gone) { notes.delete(d.id); changed = true; continue; }
        const full = await fullNote(d); if (full) { notes.set(full.id, full); changed = true; }
      }
      if (tree) await readTree();
      if (changed) onNotes([...notes.values()]);
      onState("live");
    }, e => fail(e));
  }
  function fail(e) {
    if (unsub) { unsub(); unsub = null; }
    if (/permission/i.test(e?.code || e?.message || "")) { onState("denied"); if (!retried) { retried = true; setTimeout(go, 60000); } }
    else onState("error", e?.message || String(e));
  }
  async function go() { try { await readTree(); listen(); } catch (e) { fail(e); } }

  // sign in to Siyagah's project with the owner's same Google account
  if (!auth.currentUser && idToken) { try { await au.signInWithCredential(auth, au.GoogleAuthProvider.credential(idToken)); } catch { } }
  au.onAuthStateChanged(auth, u => { if (u) { if (!unsub) go(); } else onState("signin"); });
  return {
    async connect() { await au.signInWithPopup(auth, new au.GoogleAuthProvider()); },
    // R2: ask Siyagah to make a change. Returns the request id; watch(id, cb) reports st new → work → done | refused.
    async request(op, fields) {
      const id = "bwn-" + Date.now().toString(36) + "-" + crypto.getRandomValues(new Uint32Array(2)).reduce((a, x) => a + x.toString(36), "");
      const body = { v: 1, op, from: "bwn", at: fs.serverTimestamp(), st: "new" };
      for (const [k, v] of Object.entries(fields || {})) if (v !== undefined) body[k] = v;
      await fs.setDoc(fs.doc(db, `${base}/mmjin/${id}`), body); return id;
    },
    watch(id, cb) { const un = fs.onSnapshot(fs.doc(db, `${base}/mmjin/${id}`), d => { const x = d.data(); if (!x) return; cb(x); if (x.st === "done" || x.st === "refused") un(); }, e => cb({ st: "error", why: e.message })); return un; },
    // a picture inside a note: fetched from Siyagah and shown only when its sha256 matches (as Siyagah's _picFetch)
    async pic(sha) {
      const m = await fs.getDoc(fs.doc(db, `${base}/pics/${sha}`)); if (!m.exists()) return null;
      const meta = m.data(), want = meta.sm === "s2" && meta.s2 ? meta.s2 : sha;
      const ps = await Promise.all(Array.from({ length: meta.p || 1 }, (_, i) => fs.getDoc(fs.doc(db, `${base}/picparts/${sha}~${i}`))));
      if (!ps.every(p => p.exists())) return null;
      const chunks = ps.map(p => p.data().d.toUint8Array()), len = chunks.reduce((s, c) => s + c.length, 0), bytes = new Uint8Array(len);
      let o = 0; chunks.forEach(c => { bytes.set(c, o); o += c.length; });
      const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join("");
      if (h !== want) return null;
      return URL.createObjectURL(new Blob([bytes], { type: meta.t || "image/jpeg" }));
    },
  };
}
