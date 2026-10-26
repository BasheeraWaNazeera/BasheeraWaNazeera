# BWN Video Library (BWN J26)

Videos only (owner, 26 Oct): texts become Articles on the main site, each video links to its
article. Public part and the owner's private view, built from the
approved demo (https://claude.ai/artifact/PzFKRiU4cSgiqrqZnQwGMg).

- `index.html`, `app.js`: the page. Folder map ("The Map"), posts, Visitor view / My view.
- `config.js`: Firebase web settings (public identifiers, not secrets). Empty `apiKey` = demo mode.
- `sample.js`: example posts (BWN J25 talks), used in demo mode and to seed the database.
- `firestore.rules`: visitors read published posts and public folders; only the owner's Google
  accounts read drafts, private posts and Drive links, or write. It holds the owner addresses, so it
  goes to Firebase only and is NOT copied to the public site; the page finds the owner by trying an
  owner-only read (`owner/check`).

Data (Firestore, project `basheera-wa-nazeera1`): `folders/{id}` {name, range, parent, private, order},
`posts/{id}` {title, no, folder, kind, lang, len, status pub|draft|priv, date, ytUrl, audioUrl, text[{t,s}]},
`postPrivate/{id}` {raw[{label, name, size, kept, url}], versions[]}.

Raw audio and video stay in the owner's Google Drive (rule bwnstore1); only their links are stored,
owner-only. Final videos live on YouTube. Try it locally: `python3 -m http.server` in this folder.
