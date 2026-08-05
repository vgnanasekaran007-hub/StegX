"""
StegX Configuration — Central configuration for the application.
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
DB_PATH = BASE_DIR / "stegx.db"

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# File constraints
MAX_FILE_SIZE_MB = 500
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# Supported file types
SUPPORTED_IMAGE_FORMATS = {".png", ".bmp", ".tiff", ".tif", ".jpg", ".jpeg", ".webp"}
SUPPORTED_AUDIO_FORMATS = {".wav", ".mp3", ".flac", ".ogg", ".aac"}
SUPPORTED_VIDEO_FORMATS = {".mp4", ".avi", ".mkv", ".mov", ".webm"}
SUPPORTED_TEXT_FORMATS = {".txt", ".md", ".csv", ".json", ".xml", ".html"}
SUPPORTED_DOCUMENT_FORMATS = {".pdf", ".docx", ".xlsx", ".doc", ".xls"}
SUPPORTED_ARCHIVE_FORMATS = {".zip", ".tar", ".gz", ".7z", ".rar"}

ALL_COVER_FORMATS = SUPPORTED_IMAGE_FORMATS | SUPPORTED_AUDIO_FORMATS | SUPPORTED_VIDEO_FORMATS
ALL_SECRET_FORMATS = (
    SUPPORTED_IMAGE_FORMATS | SUPPORTED_AUDIO_FORMATS | SUPPORTED_VIDEO_FORMATS |
    SUPPORTED_TEXT_FORMATS | SUPPORTED_DOCUMENT_FORMATS | SUPPORTED_ARCHIVE_FORMATS | {".*"}
)

# Steganography algorithms
IMAGE_ALGORITHMS = ["lsb", "dct", "dwt", "hybrid"]
AUDIO_ALGORITHMS = ["lsb", "phase_coding", "echo_hiding", "spread_spectrum"]
VIDEO_ALGORITHMS = ["lsb", "dct", "dwt", "motion_vector", "hybrid"]
TEXT_METHODS = ["whitespace", "unicode", "zero_width", "char_encoding", "synonym"]

# Encryption algorithms
ENCRYPTION_ALGORITHMS = ["aes-128", "aes-192", "aes-256", "rsa", "ecc", "chacha20", "blowfish"]
HASH_ALGORITHMS = ["sha-256", "sha-512", "md5"]

# Quality thresholds
PSNR_GOOD_THRESHOLD = 40.0  # dB — above is considered good
SSIM_GOOD_THRESHOLD = 0.95  # above is considered good

# Temporary file cleanup interval (seconds)
CLEANUP_INTERVAL = 3600  # 1 hour
FILE_MAX_AGE = 86400  # 24 hours

# API settings & CORS (allow wildcard * for production deployment on Render)
API_PREFIX = "/api"
CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "*")
if CORS_ORIGINS_ENV == "*":
    CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_ENV.split(",") if origin.strip()]
