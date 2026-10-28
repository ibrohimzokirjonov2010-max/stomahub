"""Crop a 2x2 grid PNG into 4 square webp images: <out>/<prefix>-1..4.webp.
Usage: python3 crop_grid.py SRC.png OUT_DIR PREFIX
Gutter = whitest column/row within ±14 px of the image centre (bottom/right half profile)."""
import sys
from PIL import Image
import numpy as np

def gutter(profile, c, r=14):
    lo, hi = c - r, c + r
    seg = profile[lo:hi]
    white = np.where(seg >= 235)[0]
    if len(white):
        return lo + white[0], lo + white[-1] + 1
    k = lo + int(np.argmax(seg)); return k, k + 1

def main(src, out, prefix):
    im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(float).mean(2); h, w = a.shape
    x0, x1 = gutter(a[h // 2:, :].mean(0), w // 2)
    y0, y1 = gutter(a[:, w // 2:].mean(1), h // 2)
    boxes = [(0, 0, x0, y0), (x1, 0, w, y0), (0, y1, x0, h), (x1, y1, w, h)]
    for i, (l, t, r, b) in enumerate(boxes, 1):
        s = min(r - l, b - t); cx, cy = (l + r) // 2, (t + b) // 2
        im.crop((cx - s // 2, cy - s // 2, cx - s // 2 + s, cy - s // 2 + s)).save(f'{out}/{prefix}-{i}.webp', quality=88)

if __name__ == '__main__':
    main(*sys.argv[1:4])
