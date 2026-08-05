"""
StegX Capacity Analyzer
Calculates maximum embedding capacity for different algorithms and file types.
"""
import os
import cv2
import numpy as np
from engines.image_steg import LSBImageSteg, DCTImageSteg, DWTImageSteg
from engines.audio_steg import LSBAudioSteg, PhaseCodingSteg, EchoHidingSteg, SpreadSpectrumSteg
from engines.video_steg import VideoSteg


def human_readable_size(size_bytes: int) -> str:
    """Convert bytes to human-readable string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024*1024):.2f} MB"
    return f"{size_bytes / (1024*1024*1024):.2f} GB"


def analyze_capacity(file_path: str, cover_type: str, algorithm: str, bit_depth: int = 1) -> dict:
    """
    Analyze the embedding capacity of a cover file.
    Returns capacity info with quality predictions.
    """
    if not os.path.exists(file_path):
        raise ValueError(f"File not found: {file_path}")

    file_size = os.path.getsize(file_path)
    capacity = 0

    try:
        if cover_type == "image":
            if algorithm == "lsb":
                capacity = LSBImageSteg.capacity(file_path, bit_depth)
            elif algorithm == "dct":
                capacity = DCTImageSteg.capacity(file_path)
            elif algorithm == "dwt":
                capacity = DWTImageSteg.capacity(file_path)
            elif algorithm == "hybrid":
                capacity = LSBImageSteg.capacity(file_path, bit_depth)
            else:
                capacity = LSBImageSteg.capacity(file_path, bit_depth)

        elif cover_type == "audio":
            if algorithm == "lsb":
                capacity = LSBAudioSteg.capacity(file_path)
            elif algorithm == "phase_coding":
                capacity = PhaseCodingSteg.capacity(file_path)
            elif algorithm == "echo_hiding":
                capacity = EchoHidingSteg.capacity(file_path)
            elif algorithm == "spread_spectrum":
                capacity = SpreadSpectrumSteg.capacity(file_path)
            else:
                capacity = LSBAudioSteg.capacity(file_path)

        elif cover_type == "video":
            capacity = VideoSteg.capacity(file_path, algorithm, bit_depth)
        else:
            raise ValueError(f"Unknown cover type: {cover_type}")
    except Exception as e:
        raise ValueError(f"Capacity analysis failed: {str(e)}")

    # Estimate quality impact
    utilization = 0
    estimated_psnr = None
    estimated_ssim = None

    if cover_type == "image" and capacity > 0:
        if algorithm == "lsb":
            # LSB PSNR depends on bit depth
            if bit_depth == 1:
                estimated_psnr = 51.1  # Theoretical max for 1-bit LSB
            elif bit_depth == 2:
                estimated_psnr = 44.0
            elif bit_depth == 3:
                estimated_psnr = 38.0
            else:
                estimated_psnr = 32.0
            estimated_ssim = max(0.90, 1.0 - (bit_depth * 0.02))
        elif algorithm == "dct":
            estimated_psnr = 42.0
            estimated_ssim = 0.96
        elif algorithm == "dwt":
            estimated_psnr = 45.0
            estimated_ssim = 0.97

    return {
        "max_capacity_bytes": capacity,
        "max_capacity_readable": human_readable_size(capacity),
        "file_size_bytes": file_size,
        "file_size_readable": human_readable_size(file_size),
        "estimated_psnr": estimated_psnr,
        "estimated_ssim": estimated_ssim,
        "estimated_ber": 0.0,
        "estimated_mse": round(255**2 / (10**(estimated_psnr/10)), 4) if estimated_psnr else None,
        "algorithm": algorithm,
        "cover_type": cover_type,
        "bit_depth": bit_depth,
    }
