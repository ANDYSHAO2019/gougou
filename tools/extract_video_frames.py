from pathlib import Path
import sys

import cv2


def main():
    if len(sys.argv) < 3:
        raise SystemExit("usage: python tools/extract_video_frames.py <video> <out_dir>")

    video_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise SystemExit(f"cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = frame_count / fps if frame_count else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)

    print(f"fps={fps:.2f}")
    print(f"frames={frame_count}")
    print(f"duration={duration:.2f}")
    print(f"size={width}x{height}")

    sample_count = 12
    if duration <= 0:
        times = [0]
    else:
        times = [duration * i / (sample_count - 1) for i in range(sample_count)]

    for index, seconds in enumerate(times):
        cap.set(cv2.CAP_PROP_POS_MSEC, seconds * 1000)
        ok, frame = cap.read()
        if not ok:
            continue
        out = out_dir / f"frame_{index:02}_{seconds:05.2f}s.jpg"
        cv2.imwrite(str(out), frame)
        print(out)

    cap.release()


if __name__ == "__main__":
    main()
