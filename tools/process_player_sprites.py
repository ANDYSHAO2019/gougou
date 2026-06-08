import json
from pathlib import Path

from PIL import Image, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "source-sheets"
SOURCES = {
    "idle": SOURCE_DIR / "player_idle_sheet.png",
    "attack": SOURCE_DIR / "player_attack_sheet.png",
    "lose": SOURCE_DIR / "player_lose_sheet.png",
}
OUT_DIR = ROOT / "assets" / "dogs" / "player"
FRAME_COUNT = 6
CANVAS = 512
MAX_W = 430
MAX_H = 420
BASELINE = 478


def make_alpha(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            is_green_key = g > 145 and g > r * 1.08 and g > b * 1.08
            if is_green_key:
                pixels[x, y] = (r, g, b, 0)
            else:
                if g > r and g > b:
                    g = min(g, round((r + b) * 0.5))
                pixels[x, y] = (r, g, b, a)
    return rgba


def trim_and_fit(frame: Image.Image) -> Image.Image:
    bbox = frame.getchannel("A").getbbox()
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    if not bbox:
        return canvas

    subject = frame.crop(bbox)
    scale = min(MAX_W / subject.width, MAX_H / subject.height, 1.6)
    new_size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(new_size, Image.Resampling.LANCZOS)

    x = (CANVAS - subject.width) // 2
    y = BASELINE - subject.height
    canvas.alpha_composite(subject, (x, y))
    return canvas


def process_action(action: str, source: Path):
    sheet = Image.open(source).convert("RGBA")
    frame_w = sheet.width // FRAME_COUNT
    for index in range(FRAME_COUNT):
        left = index * frame_w
        right = sheet.width if index == FRAME_COUNT - 1 else (index + 1) * frame_w
        frame = sheet.crop((left, 0, right, sheet.height))
        frame = trim_and_fit(make_alpha(frame))
        frame.save(OUT_DIR / f"{action}_{index:03}.png")


def alpha_subject(frame: Image.Image):
    bbox = frame.getchannel("A").getbbox()
    if not bbox:
        return frame
    return frame.crop(bbox)


def place_subject(subject: Image.Image, x_offset=0, y_offset=0, scale=1.0, tint=None) -> Image.Image:
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    if scale != 1:
        subject = subject.resize(
            (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
            Image.Resampling.LANCZOS,
        )
    if tint == "pale":
        subject = ImageEnhance.Color(subject).enhance(0.72)
        subject = ImageEnhance.Brightness(subject).enhance(1.06)
    x = (CANVAS - subject.width) // 2 + x_offset
    y = BASELINE - subject.height + y_offset
    canvas.alpha_composite(subject, (x, y))
    return canvas


def make_derived_actions():
    idle_frames = [Image.open(OUT_DIR / f"idle_{i:03}.png").convert("RGBA") for i in range(6)]
    attack_frames = [Image.open(OUT_DIR / f"attack_{i:03}.png").convert("RGBA") for i in range(6)]
    lose_frames = [Image.open(OUT_DIR / f"lose_{i:03}.png").convert("RGBA") for i in range(6)]

    hit_plan = [
        (attack_frames[0], -14, 0, 1.0),
        (lose_frames[0], -28, 0, 1.0),
        (lose_frames[1], -18, 2, 1.0),
        (idle_frames[1], -8, 0, 1.0),
        (idle_frames[0], 0, 0, 1.0),
        (idle_frames[1], 0, 0, 1.0),
    ]
    for index, (src, x, y, scale) in enumerate(hit_plan):
        place_subject(alpha_subject(src), x, y, scale).save(OUT_DIR / f"hit_{index:03}.png")

    win_plan = [
        (idle_frames[0], 0, 0, 1.0),
        (idle_frames[1], 0, -18, 1.02),
        (idle_frames[5], 0, -38, 1.04),
        (idle_frames[2], 0, -18, 1.02),
        (idle_frames[0], 0, 0, 1.0),
        (attack_frames[2], 0, -8, 1.0),
    ]
    for index, (src, x, y, scale) in enumerate(win_plan):
        place_subject(alpha_subject(src), x, y, scale).save(OUT_DIR / f"win_{index:03}.png")

    tired_plan = [
        (lose_frames[1], 0, 0, 1.0),
        (lose_frames[2], 0, 2, 1.0),
        (lose_frames[3], 0, 4, 1.0),
        (lose_frames[2], 0, 2, 1.0),
        (lose_frames[1], 0, 0, 1.0),
        (idle_frames[3], 0, 2, 0.98),
    ]
    for index, (src, x, y, scale) in enumerate(tired_plan):
        place_subject(alpha_subject(src), x, y, scale, tint="pale").save(OUT_DIR / f"tired_{index:03}.png")


def write_manifest():
    manifest = {
        "actions": {
            "idle": {
                "fps": 6,
                "loop": True,
                "frames": [
                    "idle_000.png",
                    "idle_001.png",
                    "idle_002.png",
                    "idle_003.png",
                    "idle_004.png",
                    "idle_003.png",
                    "idle_002.png",
                    "idle_001.png",
                ],
            },
            "attack": {
                "fps": 12,
                "loop": False,
                "frames": [f"attack_{i:03}.png" for i in range(6)],
            },
            "hit": {
                "fps": 12,
                "loop": False,
                "frames": [f"hit_{i:03}.png" for i in range(6)],
            },
            "tired": {
                "fps": 6,
                "loop": True,
                "frames": [f"tired_{i:03}.png" for i in [0, 1, 2, 3, 2, 1]],
            },
            "win": {
                "fps": 9,
                "loop": True,
                "frames": [f"win_{i:03}.png" for i in range(6)],
            },
            "lose": {
                "fps": 8,
                "loop": False,
                "hold": True,
                "frames": [f"lose_{i:03}.png" for i in range(6)],
            },
        }
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for action, source in SOURCES.items():
        process_action(action, source)
    make_derived_actions()
    write_manifest()


if __name__ == "__main__":
    main()
