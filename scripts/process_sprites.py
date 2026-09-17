"""Flood-chroma generated sprites into transparent PNGs.

Backgrounds may be magenta, green, or red-pink; connectivity from the
image border is required so interior leaf / sash / blush pixels stay.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image
import numpy as np

SRC = Path(
    r"C:\Users\wchkl\.cursor\projects\c-Users-wchkl-Documents-game-game-dev-cliff-clash\assets"
)
DST = Path(__file__).resolve().parents[1] / "public" / "assets"

POSES = ("idle", "light", "heavy", "ko")
FIGHTERS = ("bun", "mochi", "bean")
OUT_SIZE = 256
VFX = ("vfx-hit.png", "vfx-ko.png")


def luma(rgb: np.ndarray) -> np.ndarray:
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def is_chroma(rgb: np.ndarray, bg: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dist = np.linalg.norm(rgb - bg, axis=-1)
    magenta = (r > 150) & (b > 70) & (g < 110) & ((r - g) > 50)
    green = (g > 150) & (g > r + 40) & (g > b + 40)
    close = dist < 48
    return close | magenta | green


def flood_chroma(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    arr = np.asarray(rgba).copy()
    h, w = arr.shape[:2]
    rgb = arr[..., :3].astype(np.float32)
    corners = np.stack(
        [rgb[2, 2], rgb[2, w - 3], rgb[h - 3, 2], rgb[h - 3, w - 3]],
        axis=0,
    )
    bg = np.median(corners, axis=0)
    mask = is_chroma(rgb, bg)
    dark = luma(rgb) < 52

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((0, x))
        q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0))
        q.append((y, w - 1))

    while q:
        y, x = q.popleft()
        if y < 0 or y >= h or x < 0 or x >= w or visited[y, x]:
            continue
        visited[y, x] = True
        if dark[y, x] and not mask[y, x]:
            continue
        if not mask[y, x]:
            continue
        arr[y, x, 3] = 0
        q.extend(((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)))

    # Soft fringe: leftover chroma near transparent pixels.
    alpha = arr[..., 3].astype(np.float32)
    chroma = is_chroma(rgb, bg)
    for _ in range(2):
        near = np.zeros_like(alpha, dtype=bool)
        near[1:, :] |= alpha[:-1, :] == 0
        near[:-1, :] |= alpha[1:, :] == 0
        near[:, 1:] |= alpha[:, :-1] == 0
        near[:, :-1] |= alpha[:, 1:] == 0
        fade = chroma & near & (alpha > 0)
        alpha[fade] *= 0.15
    arr[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def crop_and_pad(img: Image.Image, size: int, bottom_align: bool = True) -> Image.Image:
    bbox = img.getbbox()
    if bbox is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cropped = img.crop(bbox)
    w, h = cropped.size
    scale = (size * 0.9) / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - nw) // 2
    y = size - nh - int(size * 0.03) if bottom_align else (size - nh) // 2
    canvas.paste(resized, (x, max(0, y)), resized)
    return canvas


def main() -> None:
    fighters_dir = DST / "fighters"
    sheets_dir = DST / "sheets"
    vfx_dir = DST / "vfx"
    fighters_dir.mkdir(parents=True, exist_ok=True)
    sheets_dir.mkdir(parents=True, exist_ok=True)
    vfx_dir.mkdir(parents=True, exist_ok=True)

    copies = {
        "bun-character-sheet.png": sheets_dir / "bun-character-sheet.png",
        "mochi-character-sheet.png": sheets_dir / "mochi-character-sheet.png",
        "bean-character-sheet.png": sheets_dir / "bean-character-sheet.png",
        "app-icon.png": DST.parent / "icon.png",
    }
    for name, dest in copies.items():
        src = SRC / name
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            Image.open(src).convert("RGB").save(dest, "PNG")
            print(f"copied {src.name} -> {dest}")

    # Keep the already-good production cover/stage if generator copies exist
    # but public cover/stage are the 9:16 art already shipped.

    for fighter in FIGHTERS:
        for pose in POSES:
            src = SRC / f"{fighter}-{pose}.png"
            if not src.exists():
                print(f"missing {src}")
                continue
            keyed = flood_chroma(Image.open(src))
            out = crop_and_pad(keyed, OUT_SIZE, bottom_align=True)
            dest = fighters_dir / f"{fighter}-{pose}.png"
            out.save(dest, "PNG")
            print(f"sprite {dest} alpha={out.getchannel('A').getextrema()}")

    for name in VFX:
        src = SRC / name
        if not src.exists():
            print(f"missing {src}")
            continue
        keyed = flood_chroma(Image.open(src))
        out = crop_and_pad(keyed, 160, bottom_align=False)
        dest = vfx_dir / name
        out.save(dest, "PNG")
        print(f"vfx {dest}")


if __name__ == "__main__":
    main()
