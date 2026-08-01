#!/usr/bin/env python3
"""Standard USFR agent OG card (1200x630) — matches the Nikki Coleman template:
white card, red top/bottom bars, Foreclosure Recovery Inc eagle logo, YOUR RECOVERY
AGENT / name / title / company / phone+ext, red 'Watch my message' button, and a
rounded rectangular headshot with a red play button. One look for every agent."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

LOGO = "/mnt/c/Users/flowc/Documents/foreclosure-leads-app/public/assets/foreclosure-recovery-inc-logo.png"
NAVY = (23, 54, 93); RED = (198, 33, 42); GRAY = (107, 114, 128); WHITE = (255, 255, 255)
TEAL = (150, 190, 214); NAVY_BTN = (198, 33, 42)
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def F(sz, bold=True): return ImageFont.truetype(FB if bold else FR, sz)

def rounded(im, rad):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0], im.size[1]], rad, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), m)
    return out

def build(headshot, full_name, phone, ext, out, title="Asset Recovery Agent"):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    # red top/bottom bars
    d.rectangle([0, 0, W, 9], fill=RED); d.rectangle([0, H - 9, W, H], fill=RED)

    # logo (preserve aspect, target width 300)
    lg = Image.open(LOGO).convert("RGBA")
    lw = 300; lh = int(lg.size[1] * lw / lg.size[0])
    lg = lg.resize((lw, lh), Image.LANCZOS)
    img.paste(lg, (60, 48), lg)

    LX = 62
    y = 48 + lh + 34
    d.text((LX, y), "Y O U R   R E C O V E R Y   A G E N T", font=F(22), fill=RED)
    y += 40
    # name — auto-shrink to fit column (max width 620)
    nsz = 68
    while d.textlength(full_name, font=F(nsz)) > 620 and nsz > 40:
        nsz -= 2
    d.text((LX, y), full_name, font=F(nsz), fill=NAVY); y += nsz + 16
    d.text((LX, y), title, font=F(32, False), fill=GRAY); y += 44
    d.text((LX, y), "Foreclosure Recovery Inc.", font=F(32), fill=NAVY); y += 62
    ph = phone
    d.text((LX, y), ph, font=F(44), fill=NAVY)
    pw = d.textlength(ph, font=F(44))
    d.text((LX + pw + 20, y + 12), f"ext. {ext}", font=F(28), fill=GRAY); y += 78

    # red "Watch my message" pill button
    bx0, by0 = LX, y
    label = "Watch my message"
    tw = d.textlength(label, font=F(26))
    bw, bh = int(tw + 96), 60
    d.rounded_rectangle([bx0, by0, bx0 + bw, by0 + bh], bh // 2, fill=RED)
    # play triangle
    tx = bx0 + 30; tcy = by0 + bh // 2
    d.polygon([(tx, tcy - 11), (tx, tcy + 11), (tx + 19, tcy)], fill=WHITE)
    d.text((bx0 + 58, by0 + 15), label, font=F(26), fill=WHITE)

    # headshot card (right) — rounded rect, teal border, red play button
    PW, PH = 400, 452
    PX, PY = W - PW - 70, (H - PH) // 2
    face = Image.open(headshot).convert("RGB")
    fw, fh = face.size
    # cover-crop to PW:PH aspect, biased slightly toward the top (face)
    target = PW / PH
    if fw / fh > target:
        nw = int(fh * target); left = (fw - nw) // 2; face = face.crop((left, 0, left + nw, fh))
    else:
        nh = int(fw / target); top = int((fh - nh) * 0.15); face = face.crop((0, top, fw, top + nh))
    face = face.resize((PW, PH), Image.LANCZOS)
    fr = rounded(face, 26)
    # teal border behind
    d.rounded_rectangle([PX - 6, PY - 6, PX + PW + 6, PY + PH + 6], 30, fill=TEAL)
    img.paste(fr, (PX, PY), fr)
    # red circular play button centered
    d2 = ImageDraw.Draw(img)
    cx, cy, r = PX + PW // 2, PY + PH // 2, 46
    d2.ellipse([cx - r, cy - r, cx + r, cy + r], fill=RED, outline=WHITE, width=5)
    d2.polygon([(cx - 15, cy - 22), (cx - 15, cy + 22), (cx + 24, cy)], fill=WHITE)

    img.save(out, quality=94)
    print("wrote", out, img.size)

if __name__ == "__main__":
    # args: headshot full_name phone ext out
    build(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
