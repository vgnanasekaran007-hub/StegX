"""
StegX Quality Analyzer
Metrics: PSNR, SSIM, MSE, BER, Entropy, Histogram comparison
Compares original cover file with stego file to measure quality impact.
"""
import numpy as np
import cv2
from scipy.io import wavfile
from skimage.metrics import structural_similarity as ssim
import math


def compute_mse(original: np.ndarray, stego: np.ndarray) -> float:
    """Compute Mean Squared Error."""
    return float(np.mean((original.astype(np.float64) - stego.astype(np.float64)) ** 2))


def compute_psnr(original: np.ndarray, stego: np.ndarray) -> float:
    """Compute Peak Signal-to-Noise Ratio in dB."""
    mse = compute_mse(original, stego)
    if mse == 0:
        return float('inf')
    max_pixel = 255.0
    return float(20 * math.log10(max_pixel / math.sqrt(mse)))


def compute_ssim(original: np.ndarray, stego: np.ndarray) -> float:
    """Compute Structural Similarity Index."""
    if len(original.shape) == 3:
        return float(ssim(original, stego, channel_axis=2))
    return float(ssim(original, stego))


def compute_ber(original: np.ndarray, stego: np.ndarray) -> float:
    """Compute Bit Error Rate."""
    orig_bits = np.unpackbits(original.flatten().astype(np.uint8))
    steg_bits = np.unpackbits(stego.flatten().astype(np.uint8))
    min_len = min(len(orig_bits), len(steg_bits))
    errors = np.sum(orig_bits[:min_len] != steg_bits[:min_len])
    return float(errors / min_len) if min_len > 0 else 0.0


def compute_entropy(data: np.ndarray) -> float:
    """Compute Shannon entropy."""
    flat = data.flatten().astype(np.uint8)
    hist, _ = np.histogram(flat, bins=256, range=(0, 256))
    probs = hist / hist.sum()
    probs = probs[probs > 0]
    return float(-np.sum(probs * np.log2(probs)))


def compute_histogram(data: np.ndarray) -> list:
    """Compute pixel histogram (per channel for color images)."""
    if len(data.shape) == 3:
        histograms = []
        for c in range(data.shape[2]):
            hist, _ = np.histogram(data[:, :, c], bins=256, range=(0, 256))
            histograms.append(hist.tolist())
        return histograms
    else:
        hist, _ = np.histogram(data, bins=256, range=(0, 256))
        return [hist.tolist()]


# ============================================================
# Image Quality Analysis
# ============================================================

def analyze_image_quality(original_path: str, stego_path: str) -> dict:
    """Compare original and stego images."""
    original = cv2.imread(original_path, cv2.IMREAD_UNCHANGED)
    stego = cv2.imread(stego_path, cv2.IMREAD_UNCHANGED)

    if original is None:
        raise ValueError(f"Cannot read original image: {original_path}")
    if stego is None:
        raise ValueError(f"Cannot read stego image: {stego_path}")

    # Ensure same dimensions
    if original.shape != stego.shape:
        stego = cv2.resize(stego, (original.shape[1], original.shape[0]))

    return {
        "psnr": round(compute_psnr(original, stego), 4),
        "ssim": round(compute_ssim(original, stego), 6),
        "mse": round(compute_mse(original, stego), 6),
        "ber": round(compute_ber(original, stego), 8),
        "entropy_original": round(compute_entropy(original), 4),
        "entropy_stego": round(compute_entropy(stego), 4),
        "histogram_original": compute_histogram(original),
        "histogram_stego": compute_histogram(stego),
    }


# ============================================================
# Audio Quality Analysis
# ============================================================

def analyze_audio_quality(original_path: str, stego_path: str) -> dict:
    """Compare original and stego audio files."""
    rate1, data1 = wavfile.read(original_path)
    rate2, data2 = wavfile.read(stego_path)

    d1 = data1.astype(np.float64).flatten()
    d2 = data2.astype(np.float64).flatten()

    min_len = min(len(d1), len(d2))
    d1 = d1[:min_len]
    d2 = d2[:min_len]

    mse = float(np.mean((d1 - d2) ** 2))
    max_val = 32767.0  # 16-bit audio
    psnr = float(20 * math.log10(max_val / math.sqrt(mse))) if mse > 0 else float('inf')

    # SNR
    signal_power = np.mean(d1 ** 2)
    noise_power = np.mean((d1 - d2) ** 2)
    snr = float(10 * math.log10(signal_power / noise_power)) if noise_power > 0 else float('inf')

    return {
        "psnr": round(psnr, 4),
        "snr": round(snr, 4),
        "mse": round(mse, 6),
        "ssim": None,  # Not applicable for 1D audio
        "ber": round(compute_ber(
            data1.flatten().astype(np.uint8)[:min_len],
            data2.flatten().astype(np.uint8)[:min_len]
        ), 8),
        "entropy_original": round(compute_entropy(data1.astype(np.uint8)), 4),
        "entropy_stego": round(compute_entropy(data2.astype(np.uint8)), 4),
    }


# ============================================================
# Unified Quality Analysis
# ============================================================

def analyze_quality(original_path: str, stego_path: str, cover_type: str) -> dict:
    """Analyze quality based on cover type."""
    if cover_type == "image":
        return analyze_image_quality(original_path, stego_path)
    elif cover_type == "audio":
        return analyze_audio_quality(original_path, stego_path)
    elif cover_type == "video":
        # For video, analyze first frame
        cap_orig = cv2.VideoCapture(original_path)
        cap_stego = cv2.VideoCapture(stego_path)
        ret1, frame1 = cap_orig.read()
        ret2, frame2 = cap_stego.read()
        cap_orig.release()
        cap_stego.release()
        if ret1 and ret2:
            if frame1.shape != frame2.shape:
                frame2 = cv2.resize(frame2, (frame1.shape[1], frame1.shape[0]))
            return {
                "psnr": round(compute_psnr(frame1, frame2), 4),
                "ssim": round(compute_ssim(frame1, frame2), 6),
                "mse": round(compute_mse(frame1, frame2), 6),
                "ber": round(compute_ber(frame1, frame2), 8),
                "entropy_original": round(compute_entropy(frame1), 4),
                "entropy_stego": round(compute_entropy(frame2), 4),
            }
        raise ValueError("Could not read video frames for analysis")
    else:
        raise ValueError(f"Quality analysis not supported for type: {cover_type}")
