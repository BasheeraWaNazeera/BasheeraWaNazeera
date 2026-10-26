# Move Day: basheerawanazeera.com → this free site

Do this before 17 Sep 2029 (when the Hostinger plan or domain would need paying again).
About 15 minutes. Keep Hostinger auto-renewal ON until the last step is checked.

## Before you start
- This repo: https://github.com/BasheeraWaNazeera/BasheeraWaNazeera
- Free site now: https://basheerawanazeera.github.io/BasheeraWaNazeera/ (home page and new articles
  are open to Google, the Video Library joins when it is in the menu; the pages copied from WordPress stay hidden until move day)
- New content kept safe by every refresh: the folders in _build/keep.txt (library, articles);
  pages opened to Google: _build/open.txt
- It refreshes itself from WordPress every Monday (Actions tab → "Weekly refresh from WordPress").
  Check the newest run has a green tick. If not, press "Run workflow" on it once.

## Step 1. Press "Go live with my domain" (GitHub), while WordPress is still on
1. Open https://github.com/BasheeraWaNazeera/BasheeraWaNazeera/actions/workflows/golive.yml
2. Press **Run workflow** → type **basheerawanazeera.com** in the box → **Run workflow**.
3. Wait for the green tick (30–60 minutes, about 1,000 pages). This copies the latest WordPress posts one last time,
   removes the hidden note and sets the name basheerawanazeera.com for this site.

## Step 2. Point the name at GitHub (Hostinger)
1. Open https://hpanel.hostinger.com → **Domains** → basheerawanazeera.com → **DNS / Nameservers**.
2. Delete the existing **A** record(s) for **@** and the **CNAME** (or A) record for **www**.
   Do not touch MX, TXT or other email records.
3. Add these records (TTL: leave the default):

| Type  | Name | Points to |
|-------|------|-----------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | basheerawanazeera.github.io |

## Step 3. Switch on the padlock (GitHub)
1. After 15–60 minutes open https://github.com/BasheeraWaNazeera/BasheeraWaNazeera/settings/pages
2. Under Custom domain you should see basheerawanazeera.com with a green "DNS check successful".
3. Tick **Enforce HTTPS** (if it is greyed out, wait an hour and try again).

## Step 4. Check
- Open https://basheerawanazeera.com/ on your phone: it is the same site, same addresses.
- Open an old post link from Google: it still works.

## If something goes wrong
Put the old records back in Hostinger (Step 2 in reverse): WordPress is back within minutes.

## After the move
- WordPress for this site is no longer needed. Keep paying only the yearly domain fee
  (move the name to Cloudflare, about US$10/yr, when it comes up).
- New articles are published on this free site (by the Web Architect, or the project's Architect).
