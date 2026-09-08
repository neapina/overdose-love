"""Slice the sprite sheets from the source assets into individual PNGs.

Usage: python3 tools/slice_assets.py "<dir with source pngs>"
Writes into public/assets/.
"""
import sys
import os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets")


def components(path, pad=12, min_area=900):
    im = Image.open(path).convert("RGBA")
    a = np.array(im)[:, :, 3] > 8
    a = ndimage.binary_dilation(a, iterations=pad)
    labels, n = ndimage.label(a)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        if sl is None:
            continue
        ys, xs = sl
        h, w = ys.stop - ys.start, xs.stop - xs.start
        if h * w < min_area:
            continue
        boxes.append((xs.start, ys.start, xs.stop, ys.stop))
    return im, boxes


def save(im, box, name, sub):
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    crop = im.crop(box)
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    crop.save(os.path.join(OUT, sub, name + ".png"))


def grid_names(path, sub, names, cols):
    """Sort components into row-major reading order and assign names."""
    im, boxes = components(path)
    # cluster rows by centre y
    boxes.sort(key=lambda b: ((b[1] + b[3]) / 2, (b[0] + b[2]) / 2))
    rows = []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if rows and abs(rows[-1][0] - cy) < 120:
            rows[-1][1].append(b)
        else:
            rows.append([cy, [b]])
    ordered = []
    for _, r in rows:
        r.sort(key=lambda b: b[0])
        ordered.extend(r)
    if len(ordered) != len(names):
        print(f"WARN {path}: found {len(ordered)} comps, expected {len(names)}")
    for b, n in zip(ordered, names):
        save(im, b, n, sub)
    return ordered


grid_names(
    os.path.join(SRC, "windows 7 asset 1.png"),
    "icons",
    ["computer", "user", "folder-documents", "folder-pictures",
     "folder-music", "network", "control-panel"],
    4,
)
grid_names(
    os.path.join(SRC, "windows 7 asset 2.png"),
    "icons",
    ["recycle-empty", "recycle-full", "browser",
     "media-player", "paint", "calculator",
     "notepad", "sticky-notes", "snipping"],
    3,
)
grid_names(
    os.path.join(SRC, "windows 7 asset 3.png"),
    "icons",
    ["folder", "folder-2", "folder-docs",
     "folder-pics", "folder-audio", "folder-downloads",
     "folder-star", "folder-lock", "folder-blue"],
    3,
)

# meromero icon: whole image
Image.open(os.path.join(SRC, "mero mero icon.png")).convert("RGBA").save(
    os.path.join(OUT, "icons", "meromero.png")
)

# UI sheets: save whole sheets, we crop with CSS/manual coords where needed
for src, name in [
    ("windows 7 asset 4.png", "ui-win7"),
    ("windows 7 asset 5.png", "ui-taskbar"),
    ("windows 7 asset 6.png", "ui-cursors"),
    ("mero mero assets.png", "ui-meromero"),
]:
    Image.open(os.path.join(SRC, src)).convert("RGBA").save(
        os.path.join(OUT, "sheets", name + ".png")
    ) if os.makedirs(os.path.join(OUT, "sheets"), exist_ok=True) is None else None

# Cursors
grid_names(
    os.path.join(SRC, "windows 7 asset 6.png"),
    "cursors",
    ["arrow", "hand", "text", "move",
     "resize-h", "resize-v", "resize-nwse", "resize-nesw",
     "busy", "arrow-busy", "no"],
    4,
)
print("done")
