from pathlib import Path
import sys

from PIL import Image, ImageDraw


def main():
    if len(sys.argv) < 3:
        raise SystemExit("usage: python tools/make_contact_sheet.py <frame_dir> <out>")

    frame_dir = Path(sys.argv[1])
    out = Path(sys.argv[2])
    files = sorted(frame_dir.glob("*.jpg"))
    thumb_w, thumb_h = 320, 180
    label_h = 28
    cols = 3
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "white")
    draw = ImageDraw.Draw(sheet)

    for index, file in enumerate(files):
        image = Image.open(file).convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = (index % cols) * thumb_w
        y = (index // cols) * (thumb_h + label_h)
        sheet.paste(image, (x, y))
        draw.text((x + 6, y + thumb_h + 6), file.name, fill=(0, 0, 0))

    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(out)


if __name__ == "__main__":
    main()
