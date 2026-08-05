"""
StegX Audio Steganography Engine
Algorithms: LSB, Phase Coding, Echo Hiding, Spread Spectrum
Supports hiding arbitrary binary data in audio files.
"""
import numpy as np
import struct
import os
import wave
import io
from scipy.io import wavfile
from scipy.fft import fft, ifft


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
    """Prepare payload with header."""
    magic = b'STGX'
    length = struct.pack('>I', len(data))
    ext_bytes = original_ext.encode('utf-8')[:32].ljust(32, b'\x00')
    return magic + length + ext_bytes + data


def _extract_payload(raw_data: bytes):
    """Extract payload from raw data."""
    if len(raw_data) < 40:
        raise ValueError("Data too short to contain header")
    if raw_data[:4] != b'STGX':
        raise ValueError("Invalid magic bytes — no hidden data found")
    length = struct.unpack('>I', raw_data[4:8])[0]
    ext = raw_data[8:40].rstrip(b'\x00').decode('utf-8', errors='ignore')
    data = raw_data[40:40 + length]
    if len(data) < length:
        raise ValueError("Extracted data is truncated")
    return data, ext


def _ensure_wav(input_path: str) -> tuple:
    """
    Ensure we're working with WAV. If input is not WAV, convert it.
    Returns (sample_rate, samples_array, n_channels).
    """
    ext = os.path.splitext(input_path)[1].lower()
    if ext == '.wav':
        rate, data = wavfile.read(input_path)
        if len(data.shape) == 1:
            return rate, data.astype(np.int16), 1
        return rate, data.astype(np.int16), data.shape[1]
    else:
        # Use pydub for format conversion
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_sample_width(2)  # 16-bit
        raw = np.array(audio.get_array_of_samples(), dtype=np.int16)
        channels = audio.channels
        if channels > 1:
            raw = raw.reshape(-1, channels)
        return audio.frame_rate, raw, channels


def _save_wav(output_path: str, rate: int, data: np.ndarray, channels: int):
    """Save audio data as WAV."""
    out_path = output_path
    ext = os.path.splitext(output_path)[1].lower()
    if ext != '.wav':
        out_path = output_path.rsplit('.', 1)[0] + '.wav'

    data = np.clip(data, -32768, 32767).astype(np.int16)
    wavfile.write(out_path, rate, data)
    return out_path


# ============================================================
# LSB Audio Steganography
# ============================================================

class LSBAudioSteg:
    """LSB steganography for audio files."""

    @staticmethod
    def capacity(audio_path: str) -> int:
        """Calculate max embedding capacity in bytes."""
        rate, data, channels = _ensure_wav(audio_path)
        total_samples = data.size  # Total samples across all channels
        total_bits = total_samples  # 1 bit per sample
        return max(0, (total_bits // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             secret_ext: str = "") -> dict:
        """Hide data in audio using LSB of samples."""
        rate, data, channels = _ensure_wav(cover_path)
        flat = data.flatten().copy().astype(np.int16)

        payload = _prepare_payload(secret_data, secret_ext)
        bits = _data_to_bits(payload)

        if len(bits) > len(flat):
            raise ValueError(
                f"Secret data ({len(bits)} bits) exceeds audio capacity ({len(flat)} bits)"
            )

        for i in range(len(bits)):
            sample = int(flat[i])
            bit = int(bits[i])
            sample = (sample & 0xFFFE) | bit
            flat[i] = np.int16(sample)

        stego = flat.reshape(data.shape)
        out_path = _save_wav(output_path, rate, stego, channels)
        return {"output_path": out_path, "bits_used": len(bits), "capacity": len(flat)}

    @staticmethod
    def extract(stego_path: str) -> tuple:
        """Extract hidden data from audio LSB."""
        rate, data, channels = _ensure_wav(stego_path)
        flat = data.flatten()

        bits = []
        for sample in flat:
            bits.append(str(int(sample) & 1))

        all_bits = ''.join(bits)
        raw_data = _bits_to_data(all_bits)
        return _extract_payload(raw_data)


# ============================================================
# Phase Coding Steganography
# ============================================================

class PhaseCodingSteg:
    """Phase coding steganography modifies phase of frequency components."""

    SEGMENT_SIZE = 1024

    @staticmethod
    def capacity(audio_path: str) -> int:
        """Calculate capacity (1 bit per segment)."""
        rate, data, channels = _ensure_wav(audio_path)
        if len(data.shape) > 1:
            data = data[:, 0]  # Use first channel
        n_segments = len(data) // PhaseCodingSteg.SEGMENT_SIZE
        return max(0, (n_segments // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             secret_ext: str = "") -> dict:
        """Hide data using phase coding."""
        rate, data, channels = _ensure_wav(cover_path)
        original_shape = data.shape

        if len(data.shape) > 1:
            audio = data[:, 0].astype(np.float64)
        else:
            audio = data.astype(np.float64)

        seg_size = PhaseCodingSteg.SEGMENT_SIZE
        n_segments = len(audio) // seg_size

        payload = _prepare_payload(secret_data, secret_ext)
        bits = _data_to_bits(payload)

        if len(bits) > n_segments:
            raise ValueError(
                f"Secret data ({len(bits)} bits) exceeds phase coding capacity ({n_segments} bits)"
            )

        # Process first segment specially to set phase reference
        for i in range(len(bits)):
            start = i * seg_size
            end = start + seg_size
            segment = audio[start:end]

            spectrum = fft(segment)
            magnitude = np.abs(spectrum)
            phase = np.angle(spectrum)

            bit = int(bits[i])
            # Modify phase of DC component
            if bit == 1:
                phase[0] = np.pi / 2
            else:
                phase[0] = -np.pi / 2

            # Reconstruct
            modified_spectrum = magnitude * np.exp(1j * phase)
            audio[start:end] = np.real(ifft(modified_spectrum))

        if len(original_shape) > 1:
            stego_data = data.copy().astype(np.float64)
            stego_data[:len(audio), 0] = audio
        else:
            stego_data = audio

        out_path = _save_wav(output_path, rate, stego_data.astype(np.int16), channels)
        return {"output_path": out_path, "bits_used": len(bits), "capacity": n_segments}

    @staticmethod
    def extract(stego_path: str) -> tuple:
        """Extract hidden data from phase coding."""
        rate, data, channels = _ensure_wav(stego_path)

        if len(data.shape) > 1:
            audio = data[:, 0].astype(np.float64)
        else:
            audio = data.astype(np.float64)

        seg_size = PhaseCodingSteg.SEGMENT_SIZE
        n_segments = len(audio) // seg_size

        bits = []
        for i in range(n_segments):
            start = i * seg_size
            end = start + seg_size
            segment = audio[start:end]

            spectrum = fft(segment)
            phase = np.angle(spectrum)

            if phase[0] > 0:
                bits.append('1')
            else:
                bits.append('0')

        all_bits = ''.join(bits)
        raw_data = _bits_to_data(all_bits)
        return _extract_payload(raw_data)


# ============================================================
# Echo Hiding Steganography
# ============================================================

class EchoHidingSteg:
    """Echo hiding embeds data by introducing echoes with different delays."""

    DELAY_0 = 50     # Delay for bit 0 (samples)
    DELAY_1 = 100    # Delay for bit 1 (samples)
    AMPLITUDE = 0.4  # Echo amplitude
    SEGMENT_SIZE = 8192

    @staticmethod
    def capacity(audio_path: str) -> int:
        """Calculate capacity."""
        rate, data, channels = _ensure_wav(audio_path)
        if len(data.shape) > 1:
            data = data[:, 0]
        n_segments = len(data) // EchoHidingSteg.SEGMENT_SIZE
        return max(0, (n_segments // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             secret_ext: str = "") -> dict:
        """Hide data using echo insertion."""
        rate, data, channels = _ensure_wav(cover_path)
        original_shape = data.shape

        if len(data.shape) > 1:
            audio = data[:, 0].astype(np.float64)
        else:
            audio = data.astype(np.float64)

        seg_size = EchoHidingSteg.SEGMENT_SIZE
        n_segments = len(audio) // seg_size

        payload = _prepare_payload(secret_data, secret_ext)
        bits = _data_to_bits(payload)

        if len(bits) > n_segments:
            raise ValueError(f"Secret data exceeds echo hiding capacity")

        result = audio.copy()

        for i in range(len(bits)):
            start = i * seg_size
            end = start + seg_size
            segment = audio[start:end]

            bit = int(bits[i])
            delay = EchoHidingSteg.DELAY_1 if bit == 1 else EchoHidingSteg.DELAY_0

            echo = np.zeros_like(segment)
            echo[delay:] = segment[:-delay] * EchoHidingSteg.AMPLITUDE
            result[start:end] = segment + echo

        if len(original_shape) > 1:
            stego_data = data.copy().astype(np.float64)
            stego_data[:len(result), 0] = result
        else:
            stego_data = result

        out_path = _save_wav(output_path, rate, stego_data.astype(np.int16), channels)
        return {"output_path": out_path, "bits_used": len(bits), "capacity": n_segments}

    @staticmethod
    def extract(stego_path: str) -> tuple:
        """Extract hidden data by detecting echo delays."""
        rate, data, channels = _ensure_wav(stego_path)

        if len(data.shape) > 1:
            audio = data[:, 0].astype(np.float64)
        else:
            audio = data.astype(np.float64)

        seg_size = EchoHidingSteg.SEGMENT_SIZE
        n_segments = len(audio) // seg_size

        bits = []
        for i in range(n_segments):
            start = i * seg_size
            end = start + seg_size
            segment = audio[start:end]

            # Compute autocorrelation at both delay values
            autocorr = np.correlate(segment, segment, mode='full')
            mid = len(autocorr) // 2

            d0 = EchoHidingSteg.DELAY_0
            d1 = EchoHidingSteg.DELAY_1

            val_0 = abs(autocorr[mid + d0]) if mid + d0 < len(autocorr) else 0
            val_1 = abs(autocorr[mid + d1]) if mid + d1 < len(autocorr) else 0

            bits.append('1' if val_1 > val_0 else '0')

        all_bits = ''.join(bits)
        raw_data = _bits_to_data(all_bits)
        return _extract_payload(raw_data)


# ============================================================
# Spread Spectrum Steganography
# ============================================================

class SpreadSpectrumSteg:
    """Spread spectrum steganography spreads data across the frequency spectrum."""

    CHIP_RATE = 100  # Spreading factor
    AMPLITUDE = 0.02

    @staticmethod
    def capacity(audio_path: str) -> int:
        """Calculate capacity."""
        rate, data, channels = _ensure_wav(audio_path)
        total_samples = data.size
        total_bits = total_samples // SpreadSpectrumSteg.CHIP_RATE
        return max(0, (total_bits // 8) - 40)

    @staticmethod
    def hide(cover_path: str, secret_data: bytes, output_path: str,
             secret_ext: str = "") -> dict:
        """Hide data using spread spectrum."""
        rate, data, channels = _ensure_wav(cover_path)
        original_shape = data.shape

        if len(data.shape) > 1:
            audio = data[:, 0].astype(np.float64)
        else:
            audio = data.astype(np.float64)

        payload = _prepare_payload(secret_data, secret_ext)
        bits = _data_to_bits(payload)

        chip_rate = SpreadSpectrumSteg.CHIP_RATE
        max_bits = len(audio) // chip_rate

        if len(bits) > max_bits:
            raise ValueError(f"Secret data exceeds spread spectrum capacity")

        # Generate pseudo-random spreading sequence (deterministic seed)
        np.random.seed(42)
        pn_sequence = np.random.choice([-1, 1], size=len(audio))

        result = audio.copy()
        amplitude = SpreadSpectrumSteg.AMPLITUDE * np.max(np.abs(audio))

        for i in range(len(bits)):
            bit = 1 if bits[i] == '1' else -1
            start = i * chip_rate
            end = start + chip_rate
            result[start:end] += amplitude * bit * pn_sequence[start:end]

        if len(original_shape) > 1:
            stego_data = data.copy().astype(np.float64)
            stego_data[:len(result), 0] = result
        else:
            stego_data = result

        out_path = _save_wav(output_path, rate, stego_data.astype(np.int16), channels)
        return {"output_path": out_path, "bits_used": len(bits), "capacity": max_bits}

    @staticmethod
    def extract(stego_path: str) -> tuple:
        """Extract data using spread spectrum correlation."""
        rate, data, channels = _ensure_wav(stego_path)

        if len(data.shape) > 1:
            audio = data[:, 0].astype(np.float64)
        else:
            audio = data.astype(np.float64)

        chip_rate = SpreadSpectrumSteg.CHIP_RATE
        max_bits = len(audio) // chip_rate

        # Same PN sequence
        np.random.seed(42)
        pn_sequence = np.random.choice([-1, 1], size=len(audio))

        bits = []
        for i in range(max_bits):
            start = i * chip_rate
            end = start + chip_rate
            correlation = np.sum(audio[start:end] * pn_sequence[start:end])
            bits.append('1' if correlation > 0 else '0')

        all_bits = ''.join(bits)
        raw_data = _bits_to_data(all_bits)
        return _extract_payload(raw_data)


# ============================================================
# Auto-detect extraction
# ============================================================

def auto_extract_audio(stego_path: str) -> tuple:
    """Try all algorithms and return the first successful extraction."""
    algorithms = [
        ("lsb", lambda: LSBAudioSteg.extract(stego_path)),
        ("phase_coding", lambda: PhaseCodingSteg.extract(stego_path)),
        ("spread_spectrum", lambda: SpreadSpectrumSteg.extract(stego_path)),
        ("echo_hiding", lambda: EchoHidingSteg.extract(stego_path)),
    ]
    errors = []
    for name, extractor in algorithms:
        try:
            data, ext = extractor()
            return data, ext, name
        except (ValueError, Exception) as e:
            errors.append(f"{name}: {str(e)}")
    raise ValueError(f"Could not extract data with any algorithm. Errors: {'; '.join(errors)}")
