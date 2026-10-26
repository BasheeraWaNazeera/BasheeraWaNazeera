# How this site was made (Web project)

Free static copy of basheerawanazeera.com (WordPress), address https://basheerawanazeera.github.io/BasheeraWaNazeera/.

Owner's decision (26 Oct 2026): this site is OPEN to search for new content. The ~1,000 pages copied from WordPress
stay hidden (noindex, canonical = the WordPress page) because they are duplicates; the home page, the Video Library
(/library/, from the BWN Architect) and every new article are open and listed in sitemap.xml.

Rebuild of the copied part: `python3 -I wpcrawl.py basheerawanazeera.com mirror 4`, then
`HIDDEN=1 python3 -I wpstatic.py mirror OUT basheerawanazeera.com https://basheerawanazeera.github.io/BasheeraWaNazeera/ posts.json pages.json`, then open the home page
again (remove its noindex, canonical = the address). Check with linkcheck.py and shoot.js.

Move Day kit (26 Oct 2026): `.github/workflows/refresh.yml` rebuilds the copied part every Monday from WordPress
(settings in `site.env`; refuses a copy with fewer than 80% of the pages). The rebuild keeps the folders in
`keep.txt` (library, articles) and then runs `after.py`, which opens the pages in `open.txt` (home, articles)
and adds them to sitemap.xml and the site search. `golive.yml` + MOVE-DAY.md are the move-day steps.
