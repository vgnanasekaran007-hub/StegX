"""
StegX Metadata Inspector
Extracts comprehensive metadata from image, audio, and video files.
"""
import os
import hashlib
import mimetypes
import cv2
import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS


def human_readable_size(size_bytes: int) -> str:
    """Convert bytes to human-readable string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024*1024):.2f} MB"
    return f"{size_bytes / (1024*1024*1024):.2f} GB"


def compute_file_hash(file_path: str, algorithm: str = "sha-256") -> str:
    """Compute hash of a file."""
    h = hashlib.new(algorithm.replace('-', ''))
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def get_image_metadata(file_path: str) -> dict:
    """Extract image metadata."""
    result = {}

    # OpenCV info
    img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
    if img is not None:
        h, w = img.shape[:2]
        channels = img.shape[2] if len(img.shape) == 3 else 1
        result["resolution"] = f"{w}x{h}"
        result["width"] = w
        result["height"] = h
        result["channels"] = channels
        result["bit_depth"] = img.dtype.itemsize * 8
        result["color_space"] = "BGR" if channels == 3 else "BGRA" if channels == 4 else "Grayscale"

    # PIL/EXIF info
    try:
        pil_img = Image.open(file_path)
        result["mode"] = pil_img.mode
        result["format"] = pil_img.format

        exif_data = pil_img._getexif()
        if exif_data:
            exif = {}
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                if isinstance(value, bytes):
                    try:
                        value = value.decode('utf-8', errors='replace')
                    except Exception:
                        value = str(value)
                exif[str(tag)] = str(value)
            result["exif"] = exif
    except Exception:
        pass

    return result


def get_audio_metadata(file_path: str) -> dict:
    """Extract audio metadata."""
    result = {}
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.wav':
        import wave
        try:
            with wave.open(file_path, 'rb') as wf:
                result["channels"] = wf.getnchannels()
                result["sample_rate"] = wf.getframerate()
                result["sample_width"] = wf.getsampwidth() * 8  # bits
                result["frame_count"] = wf.getnframes()
                result["duration"] = round(wf.getnframes() / wf.getframerate(), 2)
                result["codec"] = "PCM"
                result["bitrate"] = wf.getframerate() * wf.getnchannels() * wf.getsampwidth() * 8
        except Exception:
            pass
    else:
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(file_path)
            result["channels"] = audio.channels
            result["sample_rate"] = audio.frame_rate
            result["sample_width"] = audio.sample_width * 8
            result["duration"] = round(len(audio) / 1000.0, 2)
            result["frame_count"] = audio.frame_count()
            result["codec"] = ext.replace('.', '').upper()
        except Exception:
            pass

    return result


def get_video_metadata(file_path: str) -> dict:
    """Extract video metadata."""
    result = {}

    cap = cv2.VideoCapture(file_path)
    if cap.isOpened():
        result["width"] = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        result["height"] = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        result["resolution"] = f"{result['width']}x{result['height']}"
        result["fps"] = round(cap.get(cv2.CAP_PROP_FPS), 2)
        result["frame_count"] = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        fps = result["fps"] or 30
        if result["frame_count"] > 0:
            result["duration"] = round(result["frame_count"] / fps, 2)

        fourcc = int(cap.get(cv2.CAP_PROP_FOURCC))
        codec = "".join([chr((fourcc >> 8 * i) & 0xFF) for i in range(4)])
        result["codec"] = codec.strip()

        file_size = os.path.getsize(file_path)
        if result.get("duration", 0) > 0:
            result["bitrate"] = int(file_size * 8 / result["duration"])

        cap.release()

    return result


def inspect_metadata(file_path: str) -> dict:
    """
    Full metadata inspection for any supported file.
    Returns comprehensive metadata dict.
    """
    if not os.path.exists(file_path):
        raise ValueError(f"File not found: {file_path}")

    filename = os.path.basename(file_path)
    ext = os.path.splitext(filename)[1].lower()
    file_size = os.path.getsize(file_path)
    mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"

    # Determine file type category
    image_exts = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif', '.webp', '.gif'}
    audio_exts = {'.wav', '.mp3', '.flac', '.ogg', '.aac', '.wma'}
    video_exts = {'.mp4', '.avi', '.mkv', '.mov', '.webm', '.flv', '.wmv'}

    if ext in image_exts:
        file_type = "image"
    elif ext in audio_exts:
        file_type = "audio"
    elif ext in video_exts:
        file_type = "video"
    else:
        file_type = "other"

    result = {
        "filename": filename,
        "file_type": file_type,
        "mime_type": mime_type,
        "size_bytes": file_size,
        "size_readable": human_readable_size(file_size),
        "extension": ext,
        "hash_sha256": compute_file_hash(file_path, "sha-256"),
    }

    # Add type-specific metadata
    extra = {}
    if file_type == "image":
        extra = get_image_metadata(file_path)
    elif file_type == "audio":
        extra = get_audio_metadata(file_path)
    elif file_type == "video":
        extra = get_video_metadata(file_path)

    # Merge standard fields
    for key in ["codec", "resolution", "duration", "bitrate", "channels", "sample_rate"]:
        if key in extra:
            result[key] = extra.pop(key)

    result["extra"] = extra if extra else None
    return result
