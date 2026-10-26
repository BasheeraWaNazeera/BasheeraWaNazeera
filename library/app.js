// BWN Video Library (BWN J26): folder map of videos, private raw files, YouTube links.
// Texts become Articles on the main site (owner, 26 Oct); each video links to its article.
// Visitors read published posts; the owner signs in with Google for My view.
import { firebaseConfig } from "./config.js";
import { sampleFolders, samplePosts } from "./sample.js";
import { makePopup, setPopups, resetPopups, editorHTML, wireEditor, flushAll } from "./notepane.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const DEMO = !firebaseConfig.apiKey;

const YT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1-5.8 3.1z"/></svg>';
const AU_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---- sample data in the stored shape -------------------------------------
function splitSample(p) {
  const { raw, versions, text, ...pub } = p;
  return {
    pub: { ytUrl: "", audioUrl: "", articleUrl: "", ...pub, text: text.map(([t, s]) => ({ t, s })) },
    priv: { raw: raw.map(([label, name, size, kept]) => ({ label, name, size, kept: !!kept, url: "" })), versions },
  };
}
export const seed = {
  folders: sampleFolders.map((f, i) => ({ private: false, order: i, ...f })),
  posts: samplePosts.map(splitSample),
};

// ---- store: demo (in memory) or Firestore ---------------------------------
let store, user = null;

function demoStore() {
  const folders = structuredClone(seed.folders);
  const posts = seed.posts.map(x => ({ ...structuredClone(x.pub), priv: structuredClone(x.priv) }));
  return {
    async load() { return { folders, posts }; },
    async savePost(id, fields) { Object.assign(posts.find(p => p.id === id), fields); },
    async savePriv(id, priv) { posts.find(p => p.id === id).priv = priv; },
    async addFolder(f) { folders.push(f); },
    async addPost(p) { posts.push({ ...p, priv: { raw: [], versions: [] } }); },
  };
}

async function firestoreStore() {
  const [{ initializeApp }, fs, au] = await Promise.all([
    import(FB + "firebase-app.js"), import(FB + "firebase-firestore.js"), import(FB + "firebase-auth.js")]);
  const app = initializeApp(firebaseConfig);
  const db = fs.getFirestore(app), auth = au.getAuth(app);
  const { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, writeBatch, serverTimestamp } = fs;
  $("signin").onclick = () => au.signInWithPopup(auth, new au.GoogleAuthProvider()).catch(e => toast(e.message));
  $("signout").onclick = () => au.signOut(auth);
  // Who is the owner is decided by the database rules alone (no addresses in the site files):
  // only an owner account may read owner/check.
  au.onAuthStateChanged(auth, async u => {
    user = u; ownerOk = false;
    if (u) { try { await getDoc(doc(db, "owner", "check")); ownerOk = true; } catch { } }
    showAuth(); setView(ownerOk);
  });
  return {
    async load(owner) {
      const fq = owner ? collection(db, "folders") : query(collection(db, "folders"), where("private", "==", false));
      const pq = owner ? collection(db, "posts") : query(collection(db, "posts"), where("status", "==", "pub"));
      const [fs1, ps1] = await Promise.all([getDocs(fq), getDocs(pq)]);
      const folders = fs1.docs.map(d => ({ id: d.id, ...d.data() }));
      const posts = ps1.docs.map(d => ({ id: d.id, ...d.data() }));
      if (owner) {
        const pv = await getDocs(collection(db, "postPrivate"));
        const m = Object.fromEntries(pv.docs.map(d => [d.id, d.data()]));
        posts.forEach(p => p.priv = m[p.id] || { raw: [], versions: [] });
      }
      return { folders, posts };
    },
    async savePost(id, fields) { await updateDoc(doc(db, "posts", id), { ...fields, updated: serverTimestamp() }); },
    async savePriv(id, priv) { await setDoc(doc(db, "postPrivate", id), priv); },
    async addFolder(f) { const { id, ...rest } = f; await setDoc(doc(db, "folders", id), rest); },
    // first run: load the starter folders and talks, all as drafts (owner publishes each one)
    async seed() {
      const b = writeBatch(db);
      seed.folders.forEach(({ id, ...f }) => b.set(doc(db, "folders", id), f));
      seed.posts.forEach(({ pub: { id, ...p }, priv }) => {
        b.set(doc(db, "posts", id), { ...p, status: p.status === "priv" ? "priv" : "draft", updated: serverTimestamp() });
        b.set(doc(db, "postPrivate", id), priv);
      });
      await b.commit();
    },
    async addPost(p) {
      const { id, ...rest } = p;
      await setDoc(doc(db, "posts", id), { ...rest, updated: serverTimestamp() });
      await setDoc(doc(db, "postPrivate", id), { raw: [], versions: [] });
    },
  };
}

// ---- state -----------------------------------------------------------------
let folders = [], posts = [], owner = false, sel = null;
let open = new Set(JSON.parse(safeGet("bwnlib.open") || '["s1","f11","f12"]'));
function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { } }
let ownerOk = false;
const isOwner = () => DEMO || (!!user && ownerOk);

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.range).localeCompare(String(b.range));
const visible = p => owner || p.status === "pub";
const kids = id => folders.filter(f => (f.parent ?? null) === id && (owner || !f.private)).sort(byOrder);
const postsIn = id => posts.filter(p => p.folder === id && visible(p)).sort((a, b) => String(a.no).localeCompare(String(b.no)));
const count = id => postsIn(id).length + kids(id).reduce((n, f) => n + count(f.id), 0);

// the note is stored as HTML; older posts kept the talk as timed lines, shown the same way
const noteHTML = p => p.html ?? (p.text || []).map(({ t, s }) => `<p>${t ? `<span class="ts">${esc(t)}</span>` : ""}${esc(s)}</p>`).join("");

function toast(msg) { const t = $("toast"); if (t) t.textContent = msg; }

// ---- render ----------------------------------------------------------------
function renderTree() {
  const build = pid => kids(pid).map(f => {
    const isOpen = open.has(f.id);
    const inner = kids(f.id).length || postsIn(f.id).length
      ? `<ul ${isOpen ? "" : "hidden"}>${build(f.id)}${postsIn(f.id).map(p => `<li><div class="row ${p.id === sel ? "sel" : ""}" data-post="${esc(p.id)}" tabindex="0"><span class="tw"></span><span class="rng">${esc(p.no)}</span><span class="nm">${esc(p.title)}</span><span class="kind">${esc(p.kind)}</span>${p.status !== "pub" ? `<span class="lock">${p.status === "draft" ? "draft" : "private"}</span>` : ""}</div></li>`).join("")}</ul>` : "";
    return `<li class="${pid === null ? "sec" : ""}"><div class="row" data-folder="${esc(f.id)}" tabindex="0" aria-expanded="${isOpen}"><span class="tw">${isOpen ? "−" : "+"}</span><span class="rng">${esc(f.range)}</span><span class="nm">${esc(f.name)}</span><span class="cnt">(${count(f.id)})</span>${f.private ? '<span class="lock">private</span>' : ""}</div>${inner}</li>`;
  }).join("");
  $("tree").innerHTML = build(null) || '<li class="empty">No folders yet.</li>';
}

function renderPost() {
  const el = $("post");
  let p = posts.find(x => x.id === sel);
  if (!p || !visible(p)) { p = posts.filter(visible).sort((a, b) => String(a.no).localeCompare(String(b.no)))[0]; sel = p && p.id; }
  if (!p) { el.innerHTML = '<p class="empty">No posts yet.</p>'; return; }
  const f = folders.find(x => x.id === p.folder) || { name: "" }, sec = f.parent ? folders.find(x => x.id === f.parent) : null;
  const chip = p.status === "pub" ? '<span class="chip pub">Published</span>' : p.status === "draft" ? '<span class="chip draft">Draft · only you see it</span>' : '<span class="chip priv">Private</span>';
  const links = [
    p.ytUrl && `<a class="btn solid" href="${esc(p.ytUrl)}" target="_blank" rel="noopener">${YT_ICON}Watch on YouTube</a>`,
    p.audioUrl && `<a class="btn" href="${esc(p.audioUrl)}" target="_blank" rel="noopener">${AU_ICON}Listen (audio only)</a>`,
    p.articleUrl && `<a class="btn" href="${esc(p.articleUrl)}">Read the article</a>`,
  ].filter(Boolean).join("");
  const media = links ? `<div class="media">${links}</div>`
    : `<p class="empty">Not on YouTube yet. When you publish it, the YouTube link appears here for visitors.</p>`;
  const options = folders.filter(x => !x.private || owner).sort(byOrder).map(x => `<option value="${esc(x.id)}" ${x.id === p.folder ? "selected" : ""}>${x.parent ? " " : ""}${esc(x.range + " " + x.name)}</option>`).join("");
  const priv = p.priv || { raw: [], versions: [] };
  el.innerHTML = `
    <div class="crumb">${esc((sec ? sec.name + "  ›  " : "") + f.name)}  ›  ${esc(p.no)}</div>
    <h2>${esc(p.title)}</h2>
    <div class="meta">${chip}<span class="chip">${p.kind === "VIDEO" ? "Video" : p.kind === "AUDIO" ? "Audio" : "Text"} · ${esc(p.len)}</span><span class="chip">${esc(p.lang)}</span><span class="chip">${esc(p.date)}</span></div>
    ${media}
    ${owner ? `<div class="bis" lang="ar">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
    <p class="note">Note pane (private). Type straight in; it saves by itself. The talk’s text is published as an Article on the main site, not here.</p>
    <section class="np" aria-label="Note">
      <input class="np-ti" id="np-ti" value="${esc(p.title)}" aria-label="Title">
      ${editorHTML("note", noteHTML(p))}
    </section>` : ""}
    ${owner ? `
    <div class="tools">
      <label for="mv">Move to</label><select id="mv">${options}</select>
      <button class="btn" id="pubtoggle">${p.status === "pub" ? "Unpublish" : "Publish"}</button>
      <span class="toast" id="toast"></span>
    </div>
    <div class="tools">
      <label for="yt">YouTube link</label>
      <input id="yt" class="linkin" placeholder="https://youtu.be/…" value="${esc(p.ytUrl)}">
      <button class="btn" id="saveyt">Save link</button>
    </div>
    <div class="tools">
      <label for="art">Article link</label>
      <input id="art" class="linkin" placeholder="https://basheerawanazeera.github.io/BasheeraWaNazeera/…" value="${esc(p.articleUrl)}">
      <button class="btn" id="saveart">Save link</button>
    </div>
    <section class="privbox" aria-label="Private files">
      <h3>Private · your Google Drive</h3>
      <p class="note">Visitors never see this box. Each link opens the file in Drive; “kept” is the shrunk copy you chose (rule bwnshrink1).</p>
      <div class="tablebox"><table class="files"><tbody>${priv.raw.map(r => `<tr><td>${esc(r.label)}<br><span class="note">${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a>` : esc(r.name)}</span></td><td class="sz">${esc(r.size)}</td><td class="pick">${r.kept ? "✓ kept" : ""}</td></tr>`).join("") || '<tr><td class="note">No files yet.</td></tr>'}</tbody></table></div>
      <h3>Versions of the text</h3>
      <p class="note">${(priv.versions || []).map(esc).join("<br>") || "—"}</p>
    </section>` : ""}
  `;
  if (owner) wireOwnerTools(p);
}

function wireOwnerTools(p) {
  // note pane: autosaves through Siyagah's bounded debounce; no re-render, so the caret stays put
  wireEditor($("post"), "note", async html => { await store.savePost(p.id, { html }); p.html = html; });
  const ti = $("np-ti");
  ti.addEventListener("change", async () => {
    const title = ti.value.trim(); if (!title || title === p.title) return;
    try { await store.savePost(p.id, { title }); p.title = title; renderTree(); $("post").querySelector("h2").textContent = title; }
    catch (e) { toast("Title not saved: " + e.message); }
  });
  $("mv").onchange = async e => {
    const folder = e.target.value;
    await act(() => store.savePost(p.id, { folder }), () => {
      p.folder = folder; open.add(folder); const pf = folders.find(x => x.id === folder); if (pf?.parent) open.add(pf.parent);
    }, "Moved.");
  };
  $("pubtoggle").onclick = async () => {
    const status = p.status === "pub" ? "draft" : "pub";
    await act(() => store.savePost(p.id, { status }), () => { p.status = status; },
      status === "pub" ? "Published: visitors can see it now." : "Unpublished: only you see it.");
  };
  $("saveart").onclick = async () => {
    const articleUrl = $("art").value.trim();
    if (articleUrl && !/^https:\/\//.test(articleUrl)) { toast("Paste the full article link, starting with https://"); return; }
    await act(() => store.savePost(p.id, { articleUrl }), () => { p.articleUrl = articleUrl; }, "Article link saved.");
  };
  $("saveyt").onclick = async () => {
    const ytUrl = $("yt").value.trim();
    if (ytUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(ytUrl)) { toast("That is not a YouTube link. Copy it from YouTube’s Share button."); return; }
    await act(() => store.savePost(p.id, { ytUrl }), () => { p.ytUrl = ytUrl; }, "Link saved.");
  };
}

async function act(write, apply, done) {
  await flushAll();
  try { await write(); apply(); renderTree(); renderPost(); toast(done); }
  catch (e) { toast("Not saved: " + (e.message || e) + ". Check you are signed in, then try again."); }
}

// ---- events ------------------------------------------------------------------
$("tree").addEventListener("click", e => {
  const r = e.target.closest(".row"); if (!r) return;
  if (r.dataset.folder) { const id = r.dataset.folder; open.has(id) ? open.delete(id) : open.add(id); safeSet("bwnlib.open", JSON.stringify([...open])); renderTree(); }
  else { flushAll(); sel = r.dataset.post; renderTree(); renderPost(); if (innerWidth < 860) $("post").scrollIntoView({ behavior: "smooth" }); }
});
$("tree").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.target.click(); } });
$("openall").onclick = () => { folders.forEach(f => open.add(f.id)); renderTree(); };
$("closeall").onclick = () => { open.clear(); renderTree(); };

$("newfolder").onclick = async () => {
  const name = await ask("New folder", [["name", "Folder name", ""], ["range", "Number or range, e.g. (300) or (301–320)", ""], ["parent", "Inside", "folder"]]);
  if (!name) return;
  const f = { id: "f" + Date.now().toString(36), name: name.name, range: name.range || "", parent: name.parent || null, private: false, order: folders.length };
  await act(() => store.addFolder(f), () => { folders.push(f); if (f.parent) open.add(f.parent); }, "Folder added.");
};
$("newpost").onclick = async () => {
  const v = await ask("New post", [["title", "Title", ""], ["no", "Number, e.g. 003", ""], ["folder", "Folder", "folder"], ["kind", "Type", ["VIDEO", "AUDIO"]], ["lang", "Language", "Bangla"]]);
  if (!v || !v.folder) return;
  const p = { id: "p" + Date.now().toString(36), title: v.title, no: v.no, folder: v.folder, kind: v.kind, lang: v.lang, len: "—", status: "draft", date: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Sydney" }), ytUrl: "", audioUrl: "", articleUrl: "", text: [{ t: "", s: "Text to come." }] };
  await act(() => store.addPost(p), () => { posts.push({ ...p, priv: { raw: [], versions: [] } }); sel = p.id; open.add(p.folder); }, "Post added as a draft.");
};

// small in-page form (dialogs like prompt() are avoided)
function ask(title, fields) {
  return new Promise(resolve => {
    const el = $("post");
    const opts = folders.sort(byOrder).map(x => `<option value="${esc(x.id)}">${x.parent ? " " : ""}${esc(x.range + " " + x.name)}</option>`).join("");
    el.innerHTML = `<h2>${esc(title)}</h2><form class="ownerform" id="af">${fields.map(([k, label, def]) =>
      `<label for="af-${k}">${esc(label)}</label>` + (def === "folder" ? `<select id="af-${k}"><option value="">(top level)</option>${opts}</select>`
        : Array.isArray(def) ? `<select id="af-${k}">${def.map(o => `<option>${o}</option>`).join("")}</select>`
          : `<input id="af-${k}" value="${esc(def)}">`)).join("")}
      <div class="tools"><button class="btn solid" type="submit">Add</button><button class="btn" type="button" id="af-cancel">Cancel</button></div></form>`;
    $("af-cancel").onclick = () => { renderPost(); resolve(null); };
    $("af").onsubmit = e => { e.preventDefault(); const v = Object.fromEntries(fields.map(([k]) => [k, $("af-" + k).value.trim()])); renderPost(); resolve(v); };
  });
}

function showAuth() {
  if (DEMO) { $("signin").hidden = $("signout").hidden = true; return; }
  $("signin").hidden = !!user; $("signout").hidden = !user;
  $("who").textContent = user ? user.email : "";
  $("seg").hidden = !isOwner();
}

async function setView(o) {
  await flushAll();
  owner = o && isOwner();
  $("v-pub").setAttribute("aria-pressed", !owner); $("v-own").setAttribute("aria-pressed", owner);
  $("newfolder").hidden = $("newpost").hidden = !owner;
  try { ({ folders, posts } = await store.load(owner)); }
  catch (e) { $("post").innerHTML = `<p class="empty">Could not load the library: ${esc(e.message)}. Refresh to try again.</p>`; return; }
  renderTree(); renderPost();
  if (owner && !folders.length && store.seed) {
    $("post").innerHTML = `<h2>Your library is empty</h2><p class="empty">Load the starter folders and your talks (Intro 2, The Need for Quranic Revival, the 1-minute clip, Hijrah, the voice sample). They come in as drafts; publish each one when its YouTube link is in.</p><div class="tools"><button class="btn solid" id="seedbtn">Load starter videos</button><span class="toast" id="toast"></span></div>`;
    $("seedbtn").onclick = async () => {
      $("seedbtn").disabled = true;
      try { await store.seed(); await setView(true); } catch (e) { toast("Not loaded: " + e.message); $("seedbtn").disabled = false; }
    };
  }
}
$("v-pub").onclick = () => setView(false);
$("v-own").onclick = () => setView(true);

// ---- start -------------------------------------------------------------------
// ---- pop-up windows ----------------------------------------------------------
// windows start just under the page header (and the demo banner when it shows)
const TOP = () => {
  const above = [$("banner"), document.querySelector("header")].find(e => e && !e.hidden);
  return Math.min(Math.round(above.getBoundingClientRect().bottom + 16), innerHeight - 260);
};
makePopup($("mapwin"), "map", "The Map", () => {
  const y = Math.max(8, TOP()), w = Math.max(320, Math.min(400, Math.round(innerWidth * .3)));
  return { x: 16, y, w, h: Math.max(240, innerHeight - y - 16) };
});
makePopup($("postwin"), "note", "Video · note pane", () => {
  const y = Math.max(8, TOP()), x = Math.max(16, Math.min(400, Math.round(innerWidth * .3))) + 32;
  return { x, y, w: Math.max(320, innerWidth - x - 16), h: Math.max(240, innerHeight - y - 16) };
});
let popOn = safeGet("bwnlib.pop") !== "0";
function applyPop() {
  setPopups(popOn);
  $("poptoggle").setAttribute("aria-pressed", popOn);
  $("popreset").hidden = !popOn;
}
$("poptoggle").onclick = () => { popOn = !popOn; safeSet("bwnlib.pop", popOn ? "1" : "0"); applyPop(); };
$("popreset").onclick = () => resetPopups();
applyPop();

(async () => {
  if (DEMO) {
    store = demoStore();
    $("seg").hidden = false;
    const b = $("banner"); b.hidden = false;
    b.innerHTML = "<b>Demo mode.</b> Example videos from the Quran Revival talks (BWN J25). Changes are not saved until the library is connected to its database.";
    showAuth(); setView(false);
  } else {
    store = await firestoreStore();
    showAuth(); setView(false);
  }
})();
