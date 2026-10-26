#!/usr/bin/env python3
"""Merge-safe step for sites that have their own new content (used by refresh.sh after each rebuild).

usage: after.py ROOT BASE_URL MODE
Reads ROOT/_build/open.txt, one path per line:
  .          the home page only (index.html at the root)
  articles   that folder and every page in it (new content that is not on WordPress)
Each listed page is opened to search (no noindex, canonical = its own address), added to
sitemap.xml and to the site search. The folders must also be listed in _build/keep.txt,
so the rebuild keeps them. Lines starting with # are notes.
"""
import html, json, os, re, sys
from datetime import datetime, timezone

root, base, mode = sys.argv[1:4]
lst = os.path.join(root, '_build', 'open.txt')
if not os.path.exists(lst):
    sys.exit(0)
paths = [l.strip().strip('/') for l in open(lst) if l.strip() and not l.startswith('#')]

pages = []  # (relative folder, file)
for p in paths:
    if p in ('', '.'):
        pages.append(('.', os.path.join(root, 'index.html')))
        continue
    for d, _, fs in os.walk(os.path.join(root, p)):
        if 'index.html' in fs:
            pages.append((os.path.relpath(d, root).replace(os.sep, '/'), os.path.join(d, 'index.html')))

def url(rel):
    return base + ('' if rel == '.' else rel + '/')

def first(rx, h):
    m = re.search(rx, h, re.S | re.I)
    return html.unescape(re.sub(r'<[^>]+>|\s+', ' ', m.group(1))).strip() if m else ''

found = []
for rel, fp in pages:
    if not os.path.exists(fp):
        continue
    h = open(fp, encoding='utf-8').read()
    own = url(rel)
    h = re.sub(r'<meta name=["\']robots["\'][^>]*noindex[^>]*>\s*', '', h)
    h = re.sub(r'<link rel=["\']canonical["\'][^>]*>\s*', '', h)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + own, h)
    h = re.sub(r'(<head(?:\s[^>]*)?>)', lambda m: m.group(1) + '\n<link rel="canonical" href="%s">' % own, h, count=1)
    open(fp, 'w', encoding='utf-8').write(h)
    found.append((rel, first(r'<h1[^>]*>(.*?)</h1>', h) or first(r'<title>(.*?)</title>', h),
                  first(r'<meta name="description" content="([^"]*)"', h)))

# sitemap: keep what the rebuild listed (live mode lists every page), add the open pages
sm = os.path.join(root, 'sitemap.xml')
old = re.findall(r'<url>.*?</url>', open(sm).read(), re.S) if os.path.exists(sm) else []
have = set(re.findall(r'<loc>(.*?)</loc>', ''.join(old)))
now = datetime.now(timezone.utc).strftime('%Y-%m-%d')
new = ['<url><loc>%s</loc><lastmod>%s</lastmod></url>' % (url(r), now) for r, _, _ in found if url(r) not in have]
with open(sm, 'w') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in old + new:
        f.write('  %s\n' % u)
    f.write('</urlset>\n')
open(os.path.join(root, 'robots.txt'), 'w').write('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % base)

# site search: add the new pages (not the home page)
si = os.path.join(root, 'search', 'index.json')
if os.path.exists(si):
    idx = json.load(open(si, encoding='utf-8'))
    us = {d.get('u') for d in idx}
    for r, t, e in found:
        if r != '.' and r + '/' not in us and t:
            idx.append({'t': t, 'u': r + '/', 'e': e})
    json.dump(idx, open(si, 'w', encoding='utf-8'), ensure_ascii=False)
print('opened', len(found), 'pages; sitemap', len(old) + len(new))
