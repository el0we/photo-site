#!/usr/bin/env python3
"""Make grid thumbnails: public/photos/*.jpg -> public/photos/thumbs/*.jpg (long side 1000px).
Run after adding or replacing photos:  python3 tools/make_thumbs.py [--force]
Needs Pillow (pip install pillow). Thumbs that are already up to date are skipped."""
import sys
from pathlib import Path
from PIL import Image, ImageOps

src = Path(__file__).resolve().parent.parent / "public" / "photos"
dst = src / "thumbs"
dst.mkdir(exist_ok=True)
force = "--force" in sys.argv
for f in sorted(src.glob("*.jpg")):
    out = dst / f.name
    if out.exists() and not force and out.stat().st_mtime >= f.stat().st_mtime:
        continue
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    im.thumbnail((1000, 1000), Image.LANCZOS)
    im.save(out, "JPEG", quality=82, optimize=True, progressive=True)
    print("thumb", out.name, im.size)
