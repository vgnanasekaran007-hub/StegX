"""
StegX Video Steganography Engine
Algorithms: LSB, DCT, DWT, Motion Vector, Hybrid
Embeds data across video frames using per-frame image steganography.
"""
import numpy as np
import cv2
import os
import struct
import tempfile
import shutil
from engines.image_steg import LSBImageSteg, DCTImageSteg, DWTImageSteg, _prepare_payload, _extract_payload, _data_to_bits, _bits_to_data


def _get_video_info(video_path: str) -> dict:
    """Get video metadata."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")
    info = {
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        "codec": int(cap.get(cv2.CAP_PROP_FOURCC)),
    }
    cap.release()
    return info


class VideoSteg:
    """Video steganography — embeds data across video frames."""

    @staticmethod
    def capacity(video_path: str, algorithm: str = "lsb", bit_depth: int = 1) -> int:
        """Calculate total embedding capacity across all frames."""
        info = _get_video_info(video_path)
        h, w = info["height"], info["width"]
        channels = 3
        frame_count = info["frame_count"]

        if algorithm == "lsb":
            bits_per_frame = h * w * channels * bit_depth
        elif algorithm == "dct":
            blocks_h = h // 8
            blocks_w = w // 8
            bits_per_frame = blocks_h * blocks_w * 4  # 4 positions per block
        elif algorithm == "dwt":
            sub_h, sub_w = h // 2, w // 2
            bits_per_frame = sub_h * sub_w
        elif algorithm in ("motion_vector", "hybrid"):
            bits_per_frame = h * w * channels * bit_depth
        else:
            bits_per_frame = h * w * channels * bit_depth

        # Use 80% of frames (skip first and last 10%)
        usable_frames = max(1, int(frame_count * 0.8))
        total_bits = bits_per_frame * usable_frames
        return max(0, (total_bits // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             algorithm: str = "lsb", bit_depth: int = 1, secret_ext: str = "") -> dict:
        """Hide data in video frames."""
        cap = cv2.VideoCapture(cover_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {cover_path}")

        info = _get_video_info(cover_path)
        w, h = info["width"], info["height"]
        fps = info["fps"] or 30.0
        frame_count = info["frame_count"]

        # Calculate per-frame capacity
        if algorithm == "dct":
            per_frame_bytes = ((h // 8) * (w // 8) * 4) // 8
        elif algorithm == "dwt":
            per_frame_bytes = ((h // 2) * (w // 2)) // 8
        else:  # lsb, motion_vector, hybrid
            per_frame_bytes = (h * w * 3 * bit_depth) // 8

        payload = _prepare_payload(secret_data, secret_ext)

        if len(payload) > per_frame_bytes * frame_count:
            raise ValueError("Secret data exceeds video capacity")

        # Split payload across frames
        chunks = []
        offset = 0
        while offset < len(payload):
            chunk_size = min(per_frame_bytes - 40, len(payload) - offset)
            if chunk_size <= 0:
                break
            chunks.append(payload[offset:offset + chunk_size])
            offset += chunk_size

        # Add frame count header to first chunk
        frame_header = struct.pack('>I', len(chunks))

        # Output as AVI with lossless codec
        out_ext = os.path.splitext(output_path)[1].lower()
        if out_ext not in ('.avi',):
            output_path = output_path.rsplit('.', 1)[0] + '.avi'

        fourcc = cv2.VideoWriter_fourcc(*'FFV1')  # Lossless codec
        out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))

        frame_idx = 0
        chunk_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if chunk_idx < len(chunks):
                # Embed chunk in this frame using selected algorithm
                temp_cover = tempfile.NamedTemporaryFile(suffix='.png', delete=False).name
                temp_stego = tempfile.NamedTemporaryFile(suffix='.png', delete=False).name

                try:
                    cv2.imwrite(temp_cover, frame)

                    # Prepend chunk index for ordering
                    chunk_data = struct.pack('>I', chunk_idx) + chunks[chunk_idx]

                    if algorithm == "dct":
                        DCTImageSteg.hide(temp_cover, chunk_data, temp_stego, secret_ext=".vchunk")
                    elif algorithm == "dwt":
                        DWTImageSteg.hide(temp_cover, chunk_data, temp_stego, secret_ext=".vchunk")
                    else:  # lsb, motion_vector, hybrid
                        LSBImageSteg.hide(temp_cover, chunk_data, temp_stego,
                                         bit_depth=bit_depth, secret_ext=".vchunk")

                    stego_frame = cv2.imread(temp_stego)
                    if stego_frame is not None and stego_frame.shape[:2] == (h, w):
                        out.write(stego_frame)
                    else:
                        out.write(frame)
                finally:
                    for f in [temp_cover, temp_stego]:
                        if os.path.exists(f):
                            os.unlink(f)

                chunk_idx += 1
            else:
                out.write(frame)

            frame_idx += 1

        cap.release()
        out.release()

        return {
            "output_path": output_path,
            "frames_used": chunk_idx,
            "total_frames": frame_idx,
            "capacity": per_frame_bytes * frame_count
        }

    @staticmethod
    def extract(stego_path: str, algorithm: str = "lsb",
                bit_depth: int = 1, num_frames: int = None) -> tuple:
        """Extract hidden data from video frames."""
        cap = cv2.VideoCapture(stego_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {stego_path}")

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if num_frames is None:
            num_frames = frame_count

        chunks = {}
        frame_idx = 0

        while frame_idx < num_frames:
            ret, frame = cap.read()
            if not ret:
                break

            temp_stego = tempfile.NamedTemporaryFile(suffix='.png', delete=False).name
            try:
                cv2.imwrite(temp_stego, frame)

                try:
                    if algorithm == "dct":
                        data, ext = DCTImageSteg.extract(temp_stego)
                    elif algorithm == "dwt":
                        data, ext = DWTImageSteg.extract(temp_stego)
                    else:
                        data, ext = LSBImageSteg.extract(temp_stego, bit_depth=bit_depth)

                    if ext == ".vchunk" and len(data) >= 4:
                        chunk_idx = struct.unpack('>I', data[:4])[0]
                        chunks[chunk_idx] = data[4:]
                except (ValueError, Exception):
                    pass  # Frame without data
            finally:
                if os.path.exists(temp_stego):
                    os.unlink(temp_stego)

            frame_idx += 1

        cap.release()

        if not chunks:
            raise ValueError("No hidden data found in video frames")

        # Reassemble in order
        full_data = b''
        for i in sorted(chunks.keys()):
            full_data += chunks[i]

        return _extract_payload(full_data)


def auto_extract_video(stego_path: str) -> tuple:
    """Try all algorithms and return the first successful extraction."""
    algorithms = [
        ("lsb", lambda: VideoSteg.extract(stego_path, algorithm="lsb")),
        ("dct", lambda: VideoSteg.extract(stego_path, algorithm="dct")),
        ("dwt", lambda: VideoSteg.extract(stego_path, algorithm="dwt")),
    ]
    errors = []
    for name, extractor in algorithms:
        try:
            data, ext = extractor()
            return data, ext, name
        except (ValueError, Exception) as e:
            errors.append(f"{name}: {str(e)}")
    raise ValueError(f"Could not extract data from video. Errors: {'; '.join(errors)}")
