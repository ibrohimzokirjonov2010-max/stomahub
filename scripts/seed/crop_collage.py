"""Crop a 3+2 collage PNG (3 photos on top, 2 below) into 5 square webp images: <out>/<prefix>-1..5.webp.
Usage: python3 crop_collage.py SRC.png OUT_DIR PREFIX
Gutters = run of near-white columns/rows closest to the expected position (h/2; w/3, 2w/3 on top; w/2 below)."""
import sys
from PIL import Image
import numpy as np

def runs(mask):
    out, s = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and s is None: s = i
        if not v and s is not None: out.append((s, i)); s = None
    return out

def gutter(profile, c, r=140):
    lo = c - r
    rs = runs(profile[lo:c + r] > 0.995)
    if not rs:
        k = lo + int(np.argmax(profile[lo:c + r])); return k, k + 1
    s, e = min(rs, key=lambda t: abs((t[0] + t[1]) / 2 - r))
    return lo + s, lo + e

def main(src, out, prefix):
    im = Image.open(src).convert('RGB'); wh = (np.asarray(im).min(2) >= 240); h, w = wh.shape
    y0, y1 = gutter(wh.mean(1), h // 2)
    top, bot = wh[:y0].mean(0), wh[y1:].mean(0)
    a0, a1 = gutter(top, w // 3); b0, b1 = gutter(top, 2 * w // 3); c0, c1 = gutter(bot, w // 2)
    boxes = [(0, 0, a0, y0), (a1, 0, b0, y0), (b1, 0, w, y0), (0, y1, c0, h), (c1, y1, w, h)]
    for i, (l, t, r, b) in enumerate(boxes, 1):
        s = min(r - l, b - t); cx, cy = (l + r) // 2, (t + b) // 2
        im.crop((cx - s // 2, cy - s // 2, cx - s // 2 + s, cy - s // 2 + s)).save(f'{out}/{prefix}-{i}.webp', quality=88)
    print(prefix, 'rows', (y0, y1), 'top', (a0, a1), (b0, b1), 'bottom', (c0, c1))

if __name__ == '__main__':
    main(*sys.argv[1:4])
