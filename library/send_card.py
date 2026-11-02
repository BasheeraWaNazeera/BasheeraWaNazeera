#!/usr/bin/env python3
"""Send a card to the BwN Video Library Inbox (BWN J27, owner's A 2 Nov 2026).

Every Architect uses this instead of writing to the PMS MyDatabase. The card lands in
My view -> WorkFlow -> Inbox with a New mark; only the owner can read it. Sending the same
pid + cid again updates the same card (no duplicates). Free; no keys or sign-in.

    python3 send_card.py card.json          # one card (a JSON object)
    python3 send_card.py cards.json         # or a JSON list of cards

Card fields: pid (bwn|mmsa|siy|web|khutbah|pl|qr), cid (your card id), name (required),
what, url, kind (Demo|List|Report|Database|Other), status (todo|working|done), ver, by,
at (UTC ISO), projects [..], topics [..]; optional mmj (Mapping My Journey folder number)
or wf (bwn|mmsa|siy|web|khutbah|pl) to file it straight away, items [{n,topic,q,a,note}].
"""
import json, re, sys, urllib.request, urllib.error

PROJECT = "basheera-wa-nazeera"
KEY = "AIzaSyAGj5Vf3dyxRcBeAVEt8q54zLcSdePoB0E"  # public web identifier from library/config.js, not a secret
FIELDS = {"pid", "cid", "name", "what", "url", "kind", "status", "ver", "by", "at", "projects", "topics", "items", "mmj", "wf", "new"}


def val(v):
    if isinstance(v, bool): return {"booleanValue": v}
    if isinstance(v, int): return {"integerValue": str(v)}
    if isinstance(v, float): return {"doubleValue": v}
    if v is None: return {"nullValue": None}
    if isinstance(v, list): return {"arrayValue": {"values": [val(x) for x in v]}}
    if isinstance(v, dict): return {"mapValue": {"fields": {k: val(x) for k, x in v.items()}}}
    return {"stringValue": str(v)}


def send(card):
    extra = set(card) - FIELDS
    if extra: raise SystemExit(f"Unknown field(s): {', '.join(sorted(extra))}")
    if not card.get("name"): raise SystemExit("Every card needs a name.")
    doc = re.sub(r"[^A-Za-z0-9_-]", "", f"{card.get('pid', 'x')}-{card.get('cid', '')}")[:120]
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/inbox/{doc}?key={KEY}"
    body = json.dumps({"fields": {k: val(v) for k, v in card.items()}}).encode()
    req = urllib.request.Request(url, data=body, method="PATCH", headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=30).read()
        print(f"sent: {doc}  ({card['name']})")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"not sent: {doc}: {e.code} {e.read().decode()[:300]}")


if __name__ == "__main__":
    if len(sys.argv) != 2: raise SystemExit(__doc__)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    for c in data if isinstance(data, list) else [data]:
        send(c)
