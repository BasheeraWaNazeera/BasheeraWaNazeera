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

## Voice Inbox (BWN J27 trial): `voice.html`

Layout (owner, 1 Nov): full-screen desk with a menu bar (File, Edit, View, Share, Help), one operations
strip (Record EN/BN/AR, Upload Otter files, Take in from Drive) and three panes: the Map (MMJ tree with
counts) · files in the chosen folder (tick boxes, bulk Move / Share / Delete) · the note (player, folder,
Siyagah note editor saving `note` html). Under 1000px the panes become tabs. The Map also opens in a
pop-up window (notepane.js makePopup: drag, resize from every side and corner; full screen on phones).

The owner's recordings come in two ways and land in one Google Drive folder, "To BwN", each filed
under its Mapping My Journey folder (MMJ category id = MMJ folder number, read live from
https://mappingmyjourney.com/wp-json/wp/v2/categories, kept on the device for 7 days).

- Way 1 (keep Otter): pick the Otter audio (and its .txt transcript) on the device, or tick files
  already in Drive with the Google Picker; they go into "To BwN" (nothing deleted).
- Way 2 (MyVoice): record in the page (MediaRecorder); free live transcript from the browser's
  speech recognition (Chrome; en-AU, bn-BD to be tested); audio + transcript .txt saved to Drive.
- Privacy: Firebase Google sign-in with the `drive.file` scope only (the page sees just the files it
  made or the owner picked). Records are owner-only Firestore docs `postPrivate/voice-*`
  {kind:"voice", title, src, lang, at, dur, text, textFrom, mmj, mmjName, mmjPath, files[], shared}.
  Drive files also carry appProperties {bwn, src, title, lang, mmj}, so the later move to
  Siyagah's shared store (WFMD 1A) can rebuild everything from Drive alone.
- One-time owner step: enable the Google Drive API on project basheera-wa-nazeera. Picker
  (optional) also needs the Picker API and that API ticked on the Firebase browser key.
- Try it locally without Google: `voice.html?demo=1`.
