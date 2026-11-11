#!/usr/bin/env python3
"""Prepare photos for the site. Run after adding or replacing photos:

    python3 tools/prepare_photos.py [--force]

For every public/photos/*.jpg this:
  1. Rewrites the file's hidden data WITHOUT re-compressing the picture: removes camera and
     lens serial numbers, DxO/Lightroom work history, file paths and other leftovers, keeps the
     colour profile, and stamps in the copyright notice (EXIF + XMP).
  2. Makes the small grid copy in public/photos/thumbs/ (long side 1000px) with the same notice.

Safe to re-run: files that are already prepared are left untouched.
Needs Pillow (pip install pillow). Edit ARTIST / RIGHTS / SITE below to change the notice."""
import struct
import sys
from pathlib import Path
from PIL import Image, ImageOps

ARTIST = "Elliot Lowe"
RIGHTS = "© Elliot Lowe, elowe.co. All rights reserved."
SITE = "https://elowe.co/"

root = Path(__file__).resolve().parent.parent / "public" / "photos"
thumbs = root / "thumbs"
force = "--force" in sys.argv


def build_exif(orientation):
    """Minimal EXIF block: optional Orientation, Artist, Copyright."""
    entries = []  # (tag, type, count, value-bytes)
    if orientation and orientation != 1:
        entries.append((0x0112, 3, 1, struct.pack("<H", orientation) + b"\0\0"))
    artist = ARTIST.encode("utf-8") + b"\0"
    rights = RIGHTS.encode("utf-8") + b"\0"
    entries.append((0x013B, 2, len(artist), artist))
    entries.append((0x8298, 2, len(rights), rights))
    ifd_len = 2 + 12 * len(entries) + 4
    data_off = 8 + ifd_len
    ifd, data = struct.pack("<H", len(entries)), b""
    for tag, typ, cnt, val in entries:
        if len(val) <= 4:
            ifd += struct.pack("<HHI", tag, typ, cnt) + val.ljust(4, b"\0")
        else:
            ifd += struct.pack("<HHII", tag, typ, cnt, data_off + len(data))
            data += val + (b"\0" if len(val) % 2 else b"")
    tiff = b"II*\0" + struct.pack("<I", 8) + ifd + struct.pack("<I", 0) + data
    return b"Exif\0\0" + tiff


def build_xmp():
    xml = (
        '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>'
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
        '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">'
        f"<dc:creator><rdf:Seq><rdf:li>{ARTIST}</rdf:li></rdf:Seq></dc:creator>"
        f'<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">{RIGHTS}</rdf:li></rdf:Alt></dc:rights>'
        f"<xmpRights:Marked>True</xmpRights:Marked><xmpRights:WebStatement>{SITE}</xmpRights:WebStatement>"
        '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>'
    )
    return b"http://ns.adobe.com/xap/1.0/\0" + xml.encode("utf-8")


def segment(marker, payload):
    return b"\xff" + bytes([marker]) + struct.pack(">H", len(payload) + 2) + payload


def stamp(path, orientation=None):
    """Lossless rewrite: keep image data + colour profile, replace all other hidden data."""
    b = Path(path).read_bytes()
    if b[:2] != b"\xff\xd8":
        raise ValueError(f"{path} is not a JPEG")
    keep, i = [], 2
    while i < len(b) - 4 and b[i] == 0xFF:
        m = b[i + 1]
        if m == 0xDA:  # start of scan: the rest is picture data
            break
        n = struct.unpack(">H", b[i + 2:i + 4])[0]
        payload = b[i + 4:i + 2 + n]
        drop = (
            m == 0xFE                                   # comments
            or m == 0xE1                                # EXIF / XMP
            or m == 0xED                                # Photoshop / IPTC
            or (0xE3 <= m <= 0xEC)                      # other app data
            or m == 0xEF
            or (m == 0xE2 and not payload.startswith(b"ICC_PROFILE"))
        )
        if not drop:
            keep.append((m, payload))
        i += 2 + n
    out = b"\xff\xd8"
    inserted = False
    for m, payload in keep:
        out += segment(m, payload)
        if m == 0xE0 and not inserted:   # right after JFIF
            out += segment(0xE1, build_exif(orientation)) + segment(0xE1, build_xmp())
            inserted = True
    if not inserted:
        out = b"\xff\xd8" + segment(0xE1, build_exif(orientation)) + segment(0xE1, build_xmp()) + out[2:]
    out += b[i:]
    if out != b:
        Path(path).write_bytes(out)
        return True
    return False


thumbs.mkdir(exist_ok=True)
for f in sorted(root.glob("*.jpg")):
    with Image.open(f) as im0:
        orient = im0.getexif().get(0x0112)
    changed = stamp(f, orient)
    if changed:
        print("cleaned", f.name)
    out = thumbs / f.name
    if out.exists() and not force and not changed and out.stat().st_mtime >= f.stat().st_mtime:
        continue
    with Image.open(f) as im:
        icc = im.info.get("icc_profile")
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((1000, 1000), Image.LANCZOS)
        kw = {"quality": 82, "optimize": True, "progressive": True}
        if icc:
            kw["icc_profile"] = icc
        im.save(out, "JPEG", **kw)
    stamp(out)
    print("thumb", out.name, im.size)
