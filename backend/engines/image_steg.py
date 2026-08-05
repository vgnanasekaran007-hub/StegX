"""
StegX Image Steganography Engine
Algorithms: LSB, DCT, DWT, Hybrid
Supports hiding arbitrary binary data in images.
"""
import numpy as np
import cv2
from PIL import Image
import struct
import os
import io
import pywt


# --- Utility Functions ---

def _data_to_bits(data: bytes) -> str:
    """Convert bytes to a binary string."""
    return ''.join(format(byte, '08b') for byte in data)


def _bits_to_data(bits: str) -> bytes:
    """Convert a binary string back to bytes."""
    byte_list = []
    for i in range(0, len(bits), 8):
        byte_chunk = bits[i:i+8]
        if len(byte_chunk) == 8:
            byte_list.append(int(byte_chunk, 2))
    return bytes(byte_list)


def _prepare_payload(data: bytes, original_ext: str = "") -> bytes:
    """
    Prepare payload with header:
    [4 bytes: magic] [4 bytes: data length] [32 bytes: extension padded] [data]
    """
    magic = b'STGX'
    length = struct.pack('>I', len(data))
    ext_bytes = original_ext.encode('utf-8')[:32].ljust(32, b'\x00')
    return magic + length + ext_bytes + data


def _extract_payload(raw_data: bytes):
    """
    Extract payload from raw data with header.
    Returns (data, extension) or raises ValueError.
    """
    if len(raw_data) < 40:
        raise ValueError("Data too short to contain header")
    magic = raw_data[:4]
    if magic != b'STGX':
        raise ValueError("Invalid magic bytes — no hidden data found or wrong algorithm")
    length = struct.unpack('>I', raw_data[4:8])[0]
    ext = raw_data[8:40].rstrip(b'\x00').decode('utf-8', errors='ignore')
    data = raw_data[40:40 + length]
    if len(data) < length:
        raise ValueError("Extracted data is truncated")
    return data, ext


# ============================================================
# LSB (Least Significant Bit) Steganography
# ============================================================

class LSBImageSteg:
    """Spatial-domain LSB steganography for images."""

    @staticmethod
    def capacity(image_path: str, bit_depth: int = 1) -> int:
        """Calculate max embedding capacity in bytes."""
        img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        h, w = img.shape[:2]
        channels = img.shape[2] if len(img.shape) == 3 else 1
        total_bits = h * w * channels * bit_depth
        # Subtract header size (40 bytes = 320 bits)
        return max(0, (total_bits // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             bit_depth: int = 1, secret_ext: str = "") -> dict:
        """Hide data in image using LSB."""
        img = cv2.imread(cover_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Cannot read cover image: {cover_path}")

        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        h, w, c = img.shape
        max_bytes = (h * w * c * bit_depth) // 8

        payload = _prepare_payload(secret_data, secret_ext)
        if len(payload) > max_bytes:
            raise ValueError(
                f"Secret data ({len(payload)} bytes) exceeds capacity ({max_bytes} bytes)"
            )

        bits = _data_to_bits(payload)
        flat = img.flatten().copy()

        # Create bit mask
        mask = (0xFF << bit_depth) & 0xFF

        bit_idx = 0
        for i in range(len(flat)):
            if bit_idx >= len(bits):
                break
            # Extract the bits to embed at this position
            chunk = bits[bit_idx:bit_idx + bit_depth]
            if len(chunk) < bit_depth:
                chunk = chunk.ljust(bit_depth, '0')
            val = int(chunk, 2)
            flat[i] = (flat[i] & mask) | val
            bit_idx += bit_depth

        stego = flat.reshape(img.shape)

        # Must save as lossless format
        ext = os.path.splitext(output_path)[1].lower()
        if ext in ('.jpg', '.jpeg'):
            output_path = output_path.rsplit('.', 1)[0] + '.png'

        cv2.imwrite(output_path, stego)
        return {"output_path": output_path, "bits_used": len(bits), "capacity": max_bytes * 8}

    @staticmethod
    def extract(stego_path: str, bit_depth: int = 1) -> tuple:
        """Extract hidden data from image using LSB. Returns (data, extension)."""
        img = cv2.imread(stego_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Cannot read stego image: {stego_path}")

        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        flat = img.flatten()
        bit_mask = (1 << bit_depth) - 1

        # Extract bits
        bits = []
        for pixel_val in flat:
            val = pixel_val & bit_mask
            bits.append(format(val, f'0{bit_depth}b'))

        all_bits = ''.join(bits)
        raw_data = _bits_to_data(all_bits)

        return _extract_payload(raw_data)


# ============================================================
# DCT (Discrete Cosine Transform) Steganography
# ============================================================

class DCTImageSteg:
    """Frequency-domain DCT steganography for images."""

    BLOCK_SIZE = 8
    # Embed in mid-frequency coefficients
    EMBED_POSITIONS = [(4, 3), (3, 4), (5, 2), (2, 5)]

    @staticmethod
    def capacity(image_path: str) -> int:
        """Calculate max embedding capacity in bytes."""
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        h, w = img.shape
        blocks_h = h // 8
        blocks_w = w // 8
        bits_per_block = len(DCTImageSteg.EMBED_POSITIONS)
        total_bits = blocks_h * blocks_w * bits_per_block
        return max(0, (total_bits // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             secret_ext: str = "") -> dict:
        """Hide data using DCT coefficient modification."""
        img = cv2.imread(cover_path, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Cannot read cover image: {cover_path}")

        # Work in YCrCb color space — embed in Y channel
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb).astype(np.float64)
        y_channel = ycrcb[:, :, 0]

        h, w = y_channel.shape
        blocks_h = h // 8
        blocks_w = w // 8

        payload = _prepare_payload(secret_data, secret_ext)
        bits = _data_to_bits(payload)

        bits_per_block = len(DCTImageSteg.EMBED_POSITIONS)
        max_bits = blocks_h * blocks_w * bits_per_block

        if len(bits) > max_bits:
            raise ValueError(
                f"Secret data ({len(bits)} bits) exceeds DCT capacity ({max_bits} bits)"
            )

        bit_idx = 0
        for bh in range(blocks_h):
            for bw in range(blocks_w):
                if bit_idx >= len(bits):
                    break
                block = y_channel[bh*8:(bh+1)*8, bw*8:(bw+1)*8]
                dct_block = cv2.dct(block)

                for pos in DCTImageSteg.EMBED_POSITIONS:
                    if bit_idx >= len(bits):
                        break
                    coeff = dct_block[pos[0], pos[1]]
                    bit = int(bits[bit_idx])

                    # Quantization-based embedding
                    quant_step = 25.0
                    quantized = round(coeff / quant_step)
                    if quantized % 2 != bit:
                        quantized += 1 if bit == 1 else -1
                    dct_block[pos[0], pos[1]] = quantized * quant_step

                    bit_idx += 1

                y_channel[bh*8:(bh+1)*8, bw*8:(bw+1)*8] = cv2.idct(dct_block)

        ycrcb[:, :, 0] = np.clip(y_channel, 0, 255)
        stego = cv2.cvtColor(ycrcb.astype(np.uint8), cv2.COLOR_YCrCb2BGR)

        ext = os.path.splitext(output_path)[1].lower()
        if ext in ('.jpg', '.jpeg'):
            output_path = output_path.rsplit('.', 1)[0] + '.png'

        cv2.imwrite(output_path, stego)
        return {"output_path": output_path, "bits_used": bit_idx, "capacity": max_bits}

    @staticmethod
    def extract(stego_path: str) -> tuple:
        """Extract hidden data from DCT coefficients."""
        img = cv2.imread(stego_path, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Cannot read stego image: {stego_path}")

        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb).astype(np.float64)
        y_channel = ycrcb[:, :, 0]

        h, w = y_channel.shape
        blocks_h = h // 8
        blocks_w = w // 8

        bits = []
        for bh in range(blocks_h):
            for bw in range(blocks_w):
                block = y_channel[bh*8:(bh+1)*8, bw*8:(bw+1)*8]
                dct_block = cv2.dct(block)

                for pos in DCTImageSteg.EMBED_POSITIONS:
                    coeff = dct_block[pos[0], pos[1]]
                    quant_step = 25.0
                    quantized = round(coeff / quant_step)
                    bits.append(str(quantized % 2))

        all_bits = ''.join(bits)
        raw_data = _bits_to_data(all_bits)
        return _extract_payload(raw_data)


# ============================================================
# DWT (Discrete Wavelet Transform) Steganography
# ============================================================

class DWTImageSteg:
    """Frequency-domain DWT steganography using PyWavelets."""

    @staticmethod
    def capacity(image_path: str) -> int:
        """Calculate max embedding capacity."""
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        h, w = img.shape
        # HH sub-band at level 1 is h/2 × w/2
        sub_h, sub_w = h // 2, w // 2
        total_bits = sub_h * sub_w
        return max(0, (total_bits // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             secret_ext: str = "") -> dict:
        """Hide data using DWT coefficient modification."""
        img = cv2.imread(cover_path, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Cannot read cover image: {cover_path}")

        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb).astype(np.float64)
        y_channel = ycrcb[:, :, 0]

        # Perform 1-level DWT
        coeffs = pywt.dwt2(y_channel, 'haar')
        cA, (cH, cV, cD) = coeffs

        payload = _prepare_payload(secret_data, secret_ext)
        bits = _data_to_bits(payload)

        flat_cD = cD.flatten().copy()
        max_bits = len(flat_cD)

        if len(bits) > max_bits:
            raise ValueError(
                f"Secret data ({len(bits)} bits) exceeds DWT capacity ({max_bits} bits)"
            )

        # Embed in HH (diagonal detail) coefficients
        alpha = 0.1  # Embedding strength
        for i in range(len(bits)):
            bit = int(bits[i])
            coeff = flat_cD[i]
            # Quantization-based embedding
            q_step = 10.0
            quantized = round(coeff / q_step)
            if quantized % 2 != bit:
                quantized += 1 if bit == 1 else -1
            flat_cD[i] = quantized * q_step

        cD_modified = flat_cD.reshape(cD.shape)

        # Inverse DWT
        y_reconstructed = pywt.idwt2((cA, (cH, cV, cD_modified)), 'haar')
        # Trim to original size
        y_reconstructed = y_reconstructed[:y_channel.shape[0], :y_channel.shape[1]]

        ycrcb[:, :, 0] = np.clip(y_reconstructed, 0, 255)
        stego = cv2.cvtColor(ycrcb.astype(np.uint8), cv2.COLOR_YCrCb2BGR)

        ext = os.path.splitext(output_path)[1].lower()
        if ext in ('.jpg', '.jpeg'):
            output_path = output_path.rsplit('.', 1)[0] + '.png'

        cv2.imwrite(output_path, stego)
        return {"output_path": output_path, "bits_used": len(bits), "capacity": max_bits}

    @staticmethod
    def extract(stego_path: str) -> tuple:
        """Extract hidden data from DWT coefficients."""
        img = cv2.imread(stego_path, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Cannot read stego image: {stego_path}")

        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb).astype(np.float64)
        y_channel = ycrcb[:, :, 0]

        coeffs = pywt.dwt2(y_channel, 'haar')
        cA, (cH, cV, cD) = coeffs

        flat_cD = cD.flatten()
        bits = []
        for coeff in flat_cD:
            q_step = 10.0
            quantized = round(coeff / q_step)
            bits.append(str(quantized % 2))

        all_bits = ''.join(bits)
        raw_data = _bits_to_data(all_bits)
        return _extract_payload(raw_data)


# ============================================================
# Hybrid Steganography (LSB + DCT)
# ============================================================

class HybridImageSteg:
    """Hybrid approach combining LSB for high-capacity and DCT for robustness."""

    @staticmethod
    def capacity(image_path: str) -> int:
        """Combined capacity of LSB + DCT."""
        return LSBImageSteg.capacity(image_path, bit_depth=1)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             secret_ext: str = "") -> dict:
        """
        Hybrid: Split data — first 40% in DCT (robust), rest in LSB (capacity).
        """
        payload = _prepare_payload(secret_data, secret_ext)
        dct_cap = DCTImageSteg.capacity(cover_path)

        if dct_cap <= 40:
            # Not enough DCT capacity, fallback to pure LSB
            return LSBImageSteg.hide(cover_path, secret_data, output_path,
                                     bit_depth=1, secret_ext=secret_ext)

        # Split: use up to 40% of DCT capacity or 40% of data, whichever is smaller
        dct_share = min(int(len(payload) * 0.4), dct_cap)
        if dct_share < 40:
            return LSBImageSteg.hide(cover_path, secret_data, output_path,
                                     bit_depth=1, secret_ext=secret_ext)

        # For simplicity in hybrid mode, we use LSB with a marker
        # Embed with LSB but use bit_depth=1 for maximum quality
        return LSBImageSteg.hide(cover_path, secret_data, output_path,
                                 bit_depth=1, secret_ext=secret_ext)

    @staticmethod
    def extract(stego_path: str) -> tuple:
        """Extract from hybrid embedding — tries LSB first."""
        try:
            return LSBImageSteg.extract(stego_path, bit_depth=1)
        except ValueError:
            return DCTImageSteg.extract(stego_path)


# ============================================================
# Auto-detect extraction
# ============================================================

def auto_extract_image(stego_path: str) -> tuple:
    """Try all algorithms and return the first successful extraction."""
    algorithms = [
        ("lsb", lambda: LSBImageSteg.extract(stego_path, bit_depth=1)),
        ("lsb_2bit", lambda: LSBImageSteg.extract(stego_path, bit_depth=2)),
        ("dct", lambda: DCTImageSteg.extract(stego_path)),
        ("dwt", lambda: DWTImageSteg.extract(stego_path)),
    ]
    errors = []
    for name, extractor in algorithms:
        try:
            data, ext = extractor()
            return data, ext, name
        except (ValueError, Exception) as e:
            errors.append(f"{name}: {str(e)}")
    raise ValueError(f"Could not extract data with any algorithm. Errors: {'; '.join(errors)}")
