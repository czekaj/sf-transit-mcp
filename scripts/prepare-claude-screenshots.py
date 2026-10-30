"""Export owner-approved lossless crops of the real Claude capture (Pillow required)."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageChops


root = Path(__file__).resolve().parent.parent
source = root / "docs/claude-trip-example.png"
output = root / "assets/claude-submission"
output.mkdir(parents=True, exist_ok=True)
prompt = "How do I get from the Ferry Building to Baker Beach, leaving now?"
crops = [
    ("01-route-options.png", (34, 328, 1498, 1368), "Route alternatives and timing"),
    ("02-journey-details.png", (34, 1388, 1498, 2478), "Expanded journey timeline"),
    ("03-full-widget.png", (34, 328, 1498, 2478), "Full captured app area"),
]
manifest = {
    "source": source.relative_to(root).as_posix(),
    "source_sha256": sha256(source.read_bytes()).hexdigest(),
    "source_kind": "Owner-provided screenshot of a real Claude conversation",
    "operation": "Rectangular crop only; no resizing, redrawing, or generated content",
    "evidence": "Three views of one recorded trip, not three independent tests or current schedules",
    "images": [],
}
with Image.open(source) as original:
    if original.size != (1528, 2478):
        raise ValueError("The source capture changed; review crop coordinates first")
    manifest["source_dimensions"] = list(original.size)
    for name, box, caption in crops:
        left, top, right, bottom = box
        if not (0 <= left < right <= original.width and 0 <= top < bottom <= original.height):
            raise ValueError(f"Crop out of bounds: {name}")
        crop = original.crop(box)
        if crop.width < 1000:
            raise ValueError(f"Submission image is too narrow: {name}")
        target = output / name
        crop.save(target, format="PNG")
        with Image.open(target) as saved:
            if saved.mode != crop.mode or saved.size != crop.size:
                raise ValueError(f"Unexpected image conversion: {name}")
            if any(channel.getbbox() is not None for channel in ImageChops.difference(crop, saved).split()):
                raise ValueError(f"Pixel values changed: {name}")
        manifest["images"].append({
            "file": target.relative_to(root).as_posix(),
            "crop_box": list(box),
            "dimensions": list(crop.size),
            "sha256": sha256(target.read_bytes()).hexdigest(),
            "prompt": prompt,
            "caption": caption,
        })
        print(f"{name}: {crop.width} x {crop.height}; lossless pixels verified")
(output / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
