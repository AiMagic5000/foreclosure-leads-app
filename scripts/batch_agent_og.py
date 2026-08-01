#!/usr/bin/env python3
"""Regenerate every agent OG with the standard Nikki-style template."""
import os
from build_og import build

APP = "/mnt/c/Users/flowc/Documents/foreclosure-leads-app/public"
# slug: (full_name, phone, ext, face_basename, title)
AGENTS = {
    "charles": ("Charles Evans PhD", "(888) 545-8007", "9", "charles-poster", "Asset Recovery Agent"),
    "danny":   ("Danny Sai", "(888) 907-3234", "24", "danny-poster", "Asset Recovery Agent"),
    "joe":     ("Joe Gonzalez", "(888) 907-3234", "19", "joe-poster", "Asset Recovery Agent"),
    "marie":   ("Marie Daniel", "(888) 545-8007", "8", "marie-poster", "Asset Recovery Agent"),
    "miguel":  ("Miguel A Ramirez", "(888) 907-3234", "28", "miguel-headshot", "Asset Recovery Agent"),
    "nikki":   ("Nikki Coleman", "(888) 545-8007", "3", "nikki-poster", "Asset Recovery Agent"),
    "rebecca": ("Rebecca Young", "(888) 907-3234", "17", "rebecca-poster", "Asset Recovery Agent"),
    "roger":   ("Roger Nwatsok", "(888) 907-3234", "20", "roger-poster", "Asset Recovery Agent"),
    "ron":     ("Ron E Brendahl", "(888) 907-3234", "15", "ron-headshot", "Asset Recovery Agent"),
    "samuel":  ("Samuel Davila", "(888) 907-3234", "20", "samuel-poster", "Executive Assistant"),
}
for slug, (name, phone, ext, face, title) in AGENTS.items():
    src = f"{APP}/images/{face}.jpg"
    if not os.path.exists(src):
        print(f"SKIP {slug}: no {face}.jpg"); continue
    build(src, name, phone, ext, f"{APP}/{slug}-og.jpg", title=title)
print("done")
