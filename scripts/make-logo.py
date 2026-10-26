from PIL import Image

src = r"C:\Users\aveks\.cursor\projects\c-Users-aveks-Desktop-4\assets\c__Users_aveks_AppData_Roaming_Cursor_User_workspaceStorage_6359495887e7fbdf921ec5aae68cdd51_images_image-e4f9eed9-d779-41f3-bec0-385d0bc77a1e.png"
im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

# Near-black background (including JPEG-ish leftovers) becomes transparent.
# "Stoma" is dark navy, so keep anything with a visible blue/green channel.
def is_bg(r, g, b, a):
    return max(r, g, b) <= 22 and (b - r) < 12 and (g - r) < 10

minx, miny, maxx, maxy = w, h, 0, 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if is_bg(r, g, b, a):
            px[x, y] = (0, 0, 0, 0)
        elif a:
            if x < minx: minx = x
            if y < miny: miny = y
            if x > maxx: maxx = x
            if y > maxy: maxy = y

pad = 4
minx = max(0, minx - pad)
miny = max(0, miny - pad)
maxx = min(w - 1, maxx + pad)
maxy = min(h - 1, maxy + pad)
crop = im.crop((minx, miny, maxx + 1, maxy + 1))
out_dir = r"C:\Users\aveks\Desktop\Новая папка (4)\public"
crop.save(out_dir + r"\images\logo.png", "PNG")

# Computer favicon: full lockup fitted on a square, white so the dark wordmark stays readable in a tab.
side = 256
canvas = Image.new("RGBA", (side, side), (255, 255, 255, 255))
cw, ch = crop.size
scale = (side - 28) / cw
nw, nh = int(cw * scale), int(ch * scale)
fitted = crop.resize((nw, nh), Image.Resampling.LANCZOS)
canvas.alpha_composite(fitted, ((side - nw) // 2, (side - nh) // 2))
icons = out_dir + r"\icons"
canvas.save(icons + r"\favicon-256.png", "PNG")
canvas.resize((48, 48), Image.Resampling.LANCZOS).save(icons + r"\favicon-48.png", "PNG")
canvas.resize((32, 32), Image.Resampling.LANCZOS).save(icons + r"\favicon-32.png", "PNG")

# Report darkest remaining pixels so navy letters were not wiped.
dark = []
cp = crop.load()
for y in range(0, crop.size[1], 2):
    for x in range(0, crop.size[0], 2):
        r, g, b, a = cp[x, y]
        if a > 200:
            dark.append((r + g + b, r, g, b))
dark.sort()
print("crop", crop.size, "bbox", minx, miny, maxx, maxy)
print("darkest", dark[:8])
print("mid", dark[len(dark)//2] if dark else None)
