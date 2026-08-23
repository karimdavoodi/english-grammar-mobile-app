#!/usr/bin/env python3
"""
Generate the English Grammar Game app-identity assets.

Draws a single master icon (1024x1024) and derives every platform artifact
from it so the icon is consistent across Android (legacy + adaptive) and iOS.

Motif: an open book on the brand-blue gradient, sealed with a green
"correct" checkmark badge. Brand colors are taken from src/theme/themes.ts
(primary #2563eb, primaryPressed #1d4ed8, success #16a34a).

Outputs:
  assets/icon-master.png                          master (store listing, re-edit)
  android/app/src/main/res/mipmap-*/ic_launcher.png        (+ _round)
  android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml (+ _round)
  android/app/src/main/res/drawable/ic_launcher_foreground.xml
  ios/EnglishGrammarGame/Images.xcassets/AppIcon.appiconset/icon-*.png

Run:  python3 scripts/generate-app-assets.py
Requires: Pillow (pip install Pillow)
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BRAND_TOP = (37, 99, 235)      # #2563eb  primary
BRAND_BOTTOM = (29, 78, 216)   # #1d4ed8  primaryPressed
BRAND_SUCCESS = (22, 163, 74)  # #16a34a  success
WHITE = (255, 255, 255, 255)

# ── Motif geometry (master 1024x1024 coordinate space) ────────────────
SPINE_TOP = (512, 448)
SPINE_BOTTOM = (512, 688)
LEFT_PAGE = [(332, 478), (512, 448), (512, 688), (360, 706)]
RIGHT_PAGE = [(692, 478), (512, 448), (512, 688), (664, 706)]
BADGE_CENTER = (512, 700)
BADGE_RADIUS = 92
CHECK_POINTS = [(468, 690), (500, 724), (560, 656)]
CHECK_STROKE = 30


def diagonal_gradient(size: tuple[int, int], c1, c2) -> Image.Image:
    """RGB gradient interpolating from c1 (top-left) to c2 (bottom-right)."""
    w, h = size
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        for x in range(w):
            s = x / (w - 1)
            u = (s + t) / 2  # diagonal
            px[x, y] = (
                int(c1[0] + (c2[0] - c1[0]) * u),
                int(c1[1] + (c2[1] - c1[1]) * u),
                int(c1[2] + (c2[2] - c1[2]) * u),
            )
    return img


def draw_motif(draw: ImageDraw.ImageDraw, scale: float, offset: tuple[float, float]) -> None:
    """Draw the open-book + checkmark motif through a scale/offset transform."""
    ox, oy = offset

    def P(pt):
        return (pt[0] * scale + ox, pt[1] * scale + oy)

    def Pn(pts):
        return [P(pt) for pt in pts]

    draw.polygon(Pn(LEFT_PAGE), fill=WHITE)
    draw.polygon(Pn(RIGHT_PAGE), fill=WHITE)

    cx, cy = P(BADGE_CENTER)
    r = BADGE_RADIUS * scale
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BRAND_SUCCESS)

    pts = Pn(CHECK_POINTS)
    draw.line(pts, fill=WHITE, width=max(1, int(CHECK_STROKE * scale)), joint="curve")


def build_master() -> Image.Image:
    img = diagonal_gradient((1024, 1024), BRAND_TOP, BRAND_BOTTOM)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw_motif(ImageDraw.Draw(overlay), scale=1.0, offset=(0.0, 0.0))
    return Image.alpha_composite(img.convert("RGBA"), overlay)


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


# Viewport-space (108x108) paths for the adaptive foreground, hand-derived from
# the master motif geometry (1024 / 108 ≈ 9.48) so the two always match.
FOREGROUND_VECTOR = """<?xml version="1.0" encoding="utf-8"?>
<!-- Open book + checkmark badge, drawn in a 108dp adaptive-icon safe zone. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M35.0,50.4 L54.0,47.3 L54.0,72.6 L38.0,74.5 Z"/>
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M73.0,50.4 L54.0,47.3 L54.0,72.6 L70.0,74.5 Z"/>
    <path
        android:fillColor="#16A34A"
        android:pathData="M54,64.2 A9.7,9.7 0 1,1 54,83.6 A9.7,9.7 0 1,1 54,64.2 Z"/>
    <path
        android:strokeColor="#FFFFFF"
        android:strokeWidth="3.5"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:fillColor="#00000000"
        android:pathData="M49.4,72.8 L52.8,76.4 L59.1,69.2"/>
</vector>
"""


def write_foreground_vector() -> None:
    res = os.path.join(ROOT, "android", "app", "src", "main", "res")
    drawable = os.path.join(res, "drawable")
    os.makedirs(drawable, exist_ok=True)
    with open(os.path.join(drawable, "ic_launcher_foreground.xml"), "w") as f:
        f.write(FOREGROUND_VECTOR)


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
        "EnglishGrammarGame",
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
