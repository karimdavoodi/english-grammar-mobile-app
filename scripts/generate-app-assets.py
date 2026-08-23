#!/usr/bin/env python3
"""
Generate the English Grammar Review app-identity assets.

Draws a single master icon (1024x1024) and derives every platform artifact
from it so the icon is consistent across Android (legacy + adaptive) and iOS.

Motif: a polished open book with a depth page block, soft fold shading and a
crisp spine crease; a subtle "text line" stack on each page (one green,
hinting at the correct answer); and a green checkmark badge with a white rim,
radial body and top gloss. All on a deep radial brand-blue gradient.

The motif is rendered at 4x supersampling and downsampled with Lanczos so
edges are anti-aliased. Brand colors come from src/theme/themes.ts
(primary #2563eb, primaryPressed #1d4ed8, success #16a34a).

Outputs:
  assets/icon-master.png                          master (store listing, re-edit)
  android/app/src/main/res/mipmap-*/ic_launcher.png        (+ _round)
  android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml (+ _round)
  android/app/src/main/res/drawable/ic_launcher_foreground.xml
  ios/EnglishGrammarReview/Images.xcassets/AppIcon.appiconset/icon-*.png

Run:  python3 scripts/generate-app-assets.py
Requires: Pillow (pip install Pillow)
"""

from __future__ import annotations

import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SIZE = 1024
SS = 4  # supersample factor for the motif
MSIZE = SIZE * SS

WHITE = (255, 255, 255, 255)
DEEP_INDIGO = (30, 58, 138)  # #1e3a8a
SHADOW_COLOR = (15, 23, 42)  # slate-900, for soft drop shadows
LINE_COLOR = (165, 180, 252)  # #a5b4fc soft indigo "ink"
LINE_GREEN = (34, 197, 94)  # #22c55e, the "correct" line

# Radial gradient stops, listed light -> dark. The radial masks below are 0 at
# their centre and 255 at the edge, so stop 0 is the centre colour.
BG_STOPS = [
    (0.00, (147, 197, 253)),  # #93c5fd
    (0.45, (59, 130, 246)),  # #3b82f6
    (0.80, (37, 99, 235)),  # #2563eb
    (1.00, (30, 58, 138)),  # #1e3a8a
]

GREEN_STOPS = [
    (0.00, (74, 222, 128)),  # #4ade80
    (0.55, (34, 197, 94)),  # #22c55e
    (1.00, (21, 128, 61)),  # #15803d
]

# ── Canonical motif geometry (1024-space) ────────────────────────────────
SPINE_TOP = (512, 384)
SPINE_BOTTOM = (512, 692)
LEFT_PAGE = [(300, 428), (512, 384), (512, 692), (332, 706)]
RIGHT_PAGE = [(724, 428), (512, 384), (512, 692), (692, 706)]
PAGE_BLOCK = (276, 668, 748, 716)  # book thickness, peeks out under the pages
SPINE_SOFT = (492, 396, 532, 690)  # soft fold shading along the crease
TEXT_LINES = [  # (x0, y0, x1), drawn as ~13px-tall pills on each page
    (340, 470, 462), (340, 516, 448), (340, 562, 466), (340, 608, 452),
    (556, 470, 684), (572, 516, 684), (556, 562, 664), (556, 608, 684),
]
BADGE_CENTER = (512, 686)
BADGE_RIM = 116
BADGE_RADIUS = 98
CHECK_POINTS = [(470, 666), (504, 704), (562, 640)]
CHECK_STROKE = 38


# ── Gradient helpers ─────────────────────────────────────────────────────
def radial_mask(size: tuple[int, int], center: tuple[int, int], radius: float) -> Image.Image:
    """0 at `center`, ramping to 255 at `radius` (bilinearly upscaled)."""
    gw = gh = 256
    w, h = size
    cxp = center[0] / w * gw
    cyp = center[1] / h * gh
    rp = max(1.0, radius / w * gw)
    img = Image.new("L", (gw, gh))
    px = img.load()
    for y in range(gh):
        for x in range(gw):
            d = math.hypot(x - cxp, y - cyp) / rp
            px[x, y] = int(min(1.0, d) * 255)
    return img.resize(size, Image.BILINEAR)


def linear_mask(size: tuple[int, int], direction: str) -> Image.Image:
    """Top (tb) or bottom (bt) is 255, fading to 0 at the far edge."""
    w, h = size
    gw, gh = 4, 256
    img = Image.new("L", (gw, gh))
    px = img.load()
    for y in range(gh):
        t = y / (gh - 1)
        v = int((1 - t) * 255) if direction == "tb" else int(t * 255)
        for x in range(gw):
            px[x, y] = v
    return img.resize(size, Image.BILINEAR)


def palette_from_stops(stops):
    lut = []
    for i in range(256):
        t = i / 255.0
        colour = stops[0][1]
        for (pa, ca), (pb, cb) in zip(stops, stops[1:]):
            if t <= pb:
                seg = (t - pa) / max(1e-6, pb - pa)
                colour = tuple(int(ca[k] + (cb[k] - ca[k]) * seg) for k in range(3))
                break
        lut.extend(colour)
    return lut


def map_mask_to_rgb(mask: Image.Image, stops) -> Image.Image:
    p = mask.convert("P")
    p.putpalette(palette_from_stops(stops))
    return p.convert("RGB")


def rgba_tint(alpha: Image.Image, colour: tuple[int, int, int], max_alpha: int) -> Image.Image:
    a = alpha.point(lambda v: int(v * max_alpha / 255))
    return Image.merge(
        "RGBA",
        (
            Image.new("L", alpha.size, colour[0]),
            Image.new("L", alpha.size, colour[1]),
            Image.new("L", alpha.size, colour[2]),
            a,
        ),
    )


# ── Background (final 1024-space) ────────────────────────────────────────
def build_background() -> Image.Image:
    size = (SIZE, SIZE)
    bg = map_mask_to_rgb(radial_mask(size, (512, 400), 900), BG_STOPS).convert("RGBA")
    sheen = rgba_tint(linear_mask(size, "tb"), WHITE[:3], max_alpha=42)
    bg = Image.alpha_composite(bg, sheen)
    vignette = rgba_tint(linear_mask(size, "bt"), SHADOW_COLOR, max_alpha=72)
    bg = Image.alpha_composite(bg, vignette)
    return bg


# ── Motif (drawn at MSIZE, downsampled) ──────────────────────────────────
def _P(pt: tuple[float, float], ss: int = SS) -> tuple[int, int]:
    return (int(round(pt[0] * ss)), int(round(pt[1] * ss)))


def build_badge() -> Image.Image:
    s = SS
    size = (MSIZE, MSIZE)
    cx, cy = BADGE_CENTER
    layer = Image.new("RGBA", size, (0, 0, 0, 0))

    # White rim.
    ImageDraw.Draw(layer).ellipse(
        [_P((cx - BADGE_RIM, cy - BADGE_RIM)), _P((cx + BADGE_RIM, cy + BADGE_RIM))],
        fill=WHITE,
    )

    # Green radial body clipped to the inner circle.
    m = radial_mask(size, (cx * s, cy * s), BADGE_RADIUS * s)
    grad = map_mask_to_rgb(m, GREEN_STOPS)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).ellipse(
        [_P((cx - BADGE_RADIUS, cy - BADGE_RADIUS)), _P((cx + BADGE_RADIUS, cy + BADGE_RADIUS))],
        fill=255,
    )
    layer.paste(grad, (0, 0), mask)

    # Checkmark with rounded caps.
    d = ImageDraw.Draw(layer)
    pts = [_P(p) for p in CHECK_POINTS]
    w = CHECK_STROKE * s
    d.line(pts, fill=WHITE, width=w, joint="curve")
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0] - w // 2, p[1] - w // 2, p[0] + w // 2, p[1] + w // 2], fill=WHITE)
    return layer


def build_motif_overlay() -> Image.Image:
    s = SS
    size = (MSIZE, MSIZE)

    # 1) Soft drop shadows under the book and badge.
    shadows = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(shadows)
    d.ellipse([_P((512 - 330, 700)), _P((512 + 330, 890))], fill=SHADOW_COLOR + (80,))
    d.ellipse([_P((512 - 120, 692)), _P((512 + 120, 814))], fill=SHADOW_COLOR + (70,))
    shadows = shadows.filter(ImageFilter.GaussianBlur(42 * s))

    # 2) Page block (book thickness) behind the pages.
    block = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(block).rounded_rectangle(
        [_P((PAGE_BLOCK[0], PAGE_BLOCK[1])), _P((PAGE_BLOCK[2], PAGE_BLOCK[3]))],
        radius=16 * s,
        fill=DEEP_INDIGO + (255,),
    )

    # 3) Open pages + crisp spine crease.
    pages = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(pages)
    d.polygon([_P(p) for p in LEFT_PAGE], fill=WHITE)
    d.polygon([_P(p) for p in RIGHT_PAGE], fill=WHITE)
    d.line(
        [_P(SPINE_TOP), _P(SPINE_BOTTOM)],
        fill=DEEP_INDIGO + (200,),
        width=12 * s,
        joint="curve",
    )

    # 4) Soft fold shading hugging the crease.
    fold = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(fold).rectangle(
        [_P((SPINE_SOFT[0], SPINE_SOFT[1])), _P((SPINE_SOFT[2], SPINE_SOFT[3]))],
        fill=(37, 99, 235, 90),
    )
    fold = fold.filter(ImageFilter.GaussianBlur(38 * s))

    # 5) Text-line pills on the pages.
    lines = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lines)
    for i, (x0, y0, x1) in enumerate(TEXT_LINES):
        colour = LINE_GREEN + (255,) if i == 7 else LINE_COLOR + (255,)
        d.rounded_rectangle([_P((x0, y0)), _P((x1, y0 + 13))], radius=7 * s, fill=colour)

    # 6) Badge.
    badge = build_badge()

    # 7) Badge top gloss.
    gloss = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(gloss).ellipse(
        [_P((512 - 74, 648)), _P((512 + 74, 692))], fill=(255, 255, 255, 120)
    )
    gloss = gloss.filter(ImageFilter.GaussianBlur(14 * s))

    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    for layer in (shadows, block, pages, fold, lines, badge, gloss):
        overlay = Image.alpha_composite(overlay, layer)
    return overlay.resize((SIZE, SIZE), Image.LANCZOS)


def build_master() -> Image.Image:
    return Image.alpha_composite(build_background(), build_motif_overlay()).convert("RGB")


# ── Platform outputs ─────────────────────────────────────────────────────
def save_android_legacy(master: Image.Image) -> None:
    """Write full-bleed legacy launcher PNGs for every density."""
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in densities.items():
        base = os.path.join(ROOT, "android", "app", "src", "main", "res", folder)
        img = master.resize((size, size), Image.LANCZOS).convert("RGB")
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            img.save(os.path.join(base, name))


def write_adaptive_xml() -> None:
    """API 26+ adaptive icon wiring (color background + vector foreground)."""
    res = os.path.join(ROOT, "android", "app", "src", "main", "res")
    v26 = os.path.join(res, "mipmap-anydpi-v26")
    os.makedirs(v26, exist_ok=True)
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        with open(os.path.join(v26, name), "w") as f:
            f.write(
                '<?xml version="1.0" encoding="utf-8"?>\n'
                '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                '    <background android:drawable="@color/ic_launcher_background"/>\n'
                '    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
                '</adaptive-icon>\n'
            )


def build_foreground_vector() -> str:
    """Vector foreground matching the master motif, mapped into the 108dp safe zone."""
    bbox_w = 748 - 276
    bbox_h = 802 - 384
    scale = 56.0 / bbox_w  # leave a little margin inside the 66-unit safe circle
    tx = 54 - 512 * scale
    ty = 54 - 593 * scale

    def V(pts):
        return " ".join(f"{x * scale + tx:.1f},{y * scale + ty:.1f}" for (x, y) in pts)

    def S(v):
        return f"{v * scale:.1f}"

    def rounded_rect(x0, y0, x1, y1, r):
        r = min(r, (x1 - x0) / 2, (y1 - y0) / 2)
        return (
            f"M{x0 + r},{y0} "
            f"H{x1 - r} A{r},{r} 0 0 1 {x1},{y0 + r} "
            f"V{y1 - r} A{r},{r} 0 0 1 {x1 - r},{y1} "
            f"H{x0 + r} A{r},{r} 0 0 1 {x0},{y1 - r} "
            f"V{y0 + r} A{r},{r} 0 0 1 {x0 + r},{y0} Z"
        )

    def circle(cx, cy, r):
        return (
            f"M{cx - r},{cy} A{r},{r} 0 1,0 {cx + r},{cy} "
            f"A{r},{r} 0 1,0 {cx - r},{cy} Z"
        )

    bx, by = BADGE_CENTER[0] * scale + tx, BADGE_CENTER[1] * scale + ty
    rim_r = BADGE_RIM * scale
    body_r = BADGE_RADIUS * scale
    chk = [(x * scale + tx, y * scale + ty) for (x, y) in CHECK_POINTS]
    check_path = f"M{chk[0][0]:.1f},{chk[0][1]:.1f} L{chk[1][0]:.1f},{chk[1][1]:.1f} L{chk[2][0]:.1f},{chk[2][1]:.1f}"
    check_w = CHECK_STROKE * scale

    pb = (PAGE_BLOCK[0] * scale + tx, PAGE_BLOCK[1] * scale + ty,
          PAGE_BLOCK[2] * scale + tx, PAGE_BLOCK[3] * scale + ty)
    pb_path = rounded_rect(*pb, 16 * scale)

    # Text-line pills in the adaptive icon too (subtle, light strokes).
    line_xml = []
    line_w = 13 * scale
    for i, (x0, y0, x1) in enumerate(TEXT_LINES):
        colour = "#22C55E" if i == 7 else "#A5B4FC"
        line_xml.append(
            f'    <path android:strokeColor="{colour}" android:strokeWidth="{line_w:.1f}"\n'
            f'          android:strokeLineCap="round" android:fillColor="#00000000"\n'
            f'          android:pathData="M{x0 * scale + tx:.1f},{y0 * scale + ty + line_w / 2:.1f} '
            f'L{x1 * scale + tx:.1f},{y0 * scale + ty + line_w / 2:.1f}"/>\n'
        )
    lines = "".join(line_xml)

    return f"""<?xml version="1.0" encoding="utf-8"?>
<!-- Open book + checkmark badge in the 108dp adaptive-icon safe zone, matching assets/icon-master.png. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- page thickness block -->
    <path
        android:fillColor="#1E3A8A"
        android:pathData="{pb_path}"/>
    <!-- left page -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M{V(LEFT_PAGE).replace(' ', ' L')} Z"/>
    <!-- right page -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M{V(RIGHT_PAGE).replace(' ', ' L')} Z"/>
    <!-- text lines -->
{lines}    <!-- badge rim -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="{circle(bx, by, rim_r)}"/>
    <!-- badge body -->
    <path
        android:fillColor="#16A34A"
        android:pathData="{circle(bx, by, body_r)}"/>
    <!-- checkmark -->
    <path
        android:strokeColor="#FFFFFF"
        android:strokeWidth="{check_w:.1f}"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:fillColor="#00000000"
        android:pathData="{check_path}"/>
</vector>
"""


def write_foreground_vector() -> None:
    res = os.path.join(ROOT, "android", "app", "src", "main", "res")
    drawable = os.path.join(res, "drawable")
    os.makedirs(drawable, exist_ok=True)
    with open(os.path.join(drawable, "ic_launcher_foreground.xml"), "w") as f:
        f.write(build_foreground_vector())


# iOS AppIcon set: size points -> pixel size at scale (@2x / @3x).
IOS_ICONS = [
    ("icon-40.png", 40),    # 20pt @2x
    ("icon-60.png", 60),    # 20pt @3x
    ("icon-58.png", 58),    # 29pt @2x
    ("icon-87.png", 87),    # 29pt @3x
    ("icon-80.png", 80),    # 40pt @2x
    ("icon-120.png", 120),  # 40pt @3x
    ("icon-120-60.png", 120),  # 60pt @2x
    ("icon-180.png", 180),  # 60pt @3x
    ("icon-1024.png", 1024),  # App Store marketing
]

IOS_CONTENTS_JSON = """{
  "images" : [
    { "idiom" : "iphone", "scale" : "2x", "size" : "20x20", "filename" : "icon-40.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "20x20", "filename" : "icon-60.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "29x29", "filename" : "icon-58.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "29x29", "filename" : "icon-87.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "40x40", "filename" : "icon-80.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "40x40", "filename" : "icon-120.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "60x60", "filename" : "icon-120-60.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "60x60", "filename" : "icon-180.png" },
    { "idiom" : "ios-marketing", "scale" : "1x", "size" : "1024x1024", "filename" : "icon-1024.png" }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
"""


def save_ios_icons(master: Image.Image) -> None:
    appicon = os.path.join(
        ROOT,
        "ios",
        "EnglishGrammarReview",
        "Images.xcassets",
        "AppIcon.appiconset",
    )
    os.makedirs(appicon, exist_ok=True)
    for filename, size in IOS_ICONS:
        img = master.resize((size, size), Image.LANCZOS).convert("RGB")
        img.save(os.path.join(appicon, filename))
    with open(os.path.join(appicon, "Contents.json"), "w") as f:
        f.write(IOS_CONTENTS_JSON)


def main() -> None:
    master = build_master()

    assets = os.path.join(ROOT, "assets")
    os.makedirs(assets, exist_ok=True)
    master.save(os.path.join(assets, "icon-master.png"))

    save_android_legacy(master)
    write_adaptive_xml()
    write_foreground_vector()
    save_ios_icons(master)
    print("Wrote master, Android (legacy + adaptive) and iOS app icon assets.")


if __name__ == "__main__":
    main()
