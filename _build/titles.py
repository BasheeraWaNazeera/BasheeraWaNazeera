#!/usr/bin/env python3
"""Titles across sites (Web J01): add the shared title list to a built site.

usage: titles.py ROOT SITE_ID
  - every category and tag page gets a "From our other sites" box (titles the owner ticked for it)
  - more/index.html, made from the site's own search page, lists all of them by category
The list itself lives in one place: https://forthegoodhearts.github.io/titles/titles.json
Safe to run again (it replaces what it added before). Run by refresh.sh when site.env has SITE_ID.
"""
import os, re, sys

root, site = sys.argv[1:3]
JS = 'https://forthegoodhearts.github.io/titles/more.js'
TAG = re.compile(r'<script src="%s"[^>]*></script>\n?' % re.escape(JS))

def put(fp, attrs):
    h = open(fp, encoding='utf-8').read()
    h = TAG.sub('', h)
    s = '<script src="%s" data-site="%s"%s defer></script>\n' % (JS, site, attrs)
    h = h.replace('</body>', s + '</body>', 1) if '</body>' in h else h + s
    open(fp, 'w', encoding='utf-8').write(h)

n = 0
for kind, attr in (('category', 'cat'), ('tag', 'tag')):
    top = os.path.join(root, kind)
    for d, _, fs in os.walk(top):
        rel = os.path.relpath(d, top).replace(os.sep, '/')
        if rel == '.' or 'index.html' not in fs:
            continue
        slug = rel.split('/page/')[0].split('/')[-1]  # category/a/b/page/2 -> b
        if '/page/' in '/' + rel + '/':
            continue  # only the first page of each list
        depth = len((kind + '/' + rel).split('/'))
        put(os.path.join(d, 'index.html'), ' data-%s="%s" data-more="%smore/"' % (attr, slug, '../' * depth))
        n += 1

sp = os.path.join(root, 'search', 'index.html')
if os.path.exists(sp):
    h = open(sp, encoding='utf-8').read()
    h = re.sub(r'(<li class="breadcrumb-item fff">)Search(</li>)', r'\1From our other sites\2', h)
    h = h.replace('<h2 class="entry-title">Search</h2>', '<h2 class="entry-title">From our other sites</h2>')
    h = re.sub(r'<title>[^<]*</title>', lambda m: '<title>From our other sites</title>', h, count=1)
    h = re.sub(r'<form role="search" class="search-form" onsubmit="return false">.*?</script>',
               '<p>Articles from our other sites, by topic. Each title opens the article where it was published.</p>\n'
               '<div id="more-titles"></div>\n\t</div>', h, count=1, flags=re.S)
    h = re.sub(r'<link rel=["\']canonical["\'][^>]*>\s*', '', h)
    os.makedirs(os.path.join(root, 'more'), exist_ok=True)
    open(os.path.join(root, 'more', 'index.html'), 'w', encoding='utf-8').write(h)
    put(os.path.join(root, 'more', 'index.html'), ' data-all="1"')
print('titles: %d category/tag pages, more page %s' % (n, 'made' if os.path.exists(sp) else 'missing'))
