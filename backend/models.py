"""
StegX Pydantic Models — Request/response schemas for all API endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


# --- Enums ---

class CoverType(str, Enum):
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"

class ImageAlgorithm(str, Enum):
    LSB = "lsb"
    DCT = "dct"
    DWT = "dwt"
    HYBRID = "hybrid"

class AudioAlgorithm(str, Enum):
    LSB = "lsb"
    PHASE_CODING = "phase_coding"
    ECHO_HIDING = "echo_hiding"
    SPREAD_SPECTRUM = "spread_spectrum"

class VideoAlgorithm(str, Enum):
    LSB = "lsb"
    DCT = "dct"
    DWT = "dwt"
    MOTION_VECTOR = "motion_vector"
    HYBRID = "hybrid"

class TextMethod(str, Enum):
    WHITESPACE = "whitespace"
    UNICODE = "unicode"
    ZERO_WIDTH = "zero_width"
    CHAR_ENCODING = "char_encoding"
    SYNONYM = "synonym"

class EncryptionAlgorithm(str, Enum):
    AES_128 = "aes-128"
    AES_192 = "aes-192"
    AES_256 = "aes-256"
    RSA = "rsa"
    ECC = "ecc"
    CHACHA20 = "chacha20"
    BLOWFISH = "blowfish"

class HashAlgorithm(str, Enum):
    SHA_256 = "sha-256"
    SHA_512 = "sha-512"
    MD5 = "md5"

class OperationType(str, Enum):
    HIDE = "hide"
    EXTRACT = "extract"
    ENCRYPT = "encrypt"
    DECRYPT = "decrypt"
    ANALYZE = "analyze"


# --- Request Models ---

class HideRequest(BaseModel):
    cover_file_id: str
    secret_file_id: Optional[str] = None
    secret_text: Optional[str] = None
    cover_type: CoverType
    algorithm: str
    encryption: Optional[EncryptionAlgorithm] = None
    password: Optional[str] = None
    bit_depth: int = Field(default=1, ge=1, le=4)
    text_method: Optional[TextMethod] = None

class ExtractRequest(BaseModel):
    stego_file_id: str
    cover_type: CoverType
    algorithm: Optional[str] = None  # None = auto-detect
    password: Optional[str] = None
    encryption: Optional[EncryptionAlgorithm] = None

class EncryptRequest(BaseModel):
    file_id: str
    algorithm: EncryptionAlgorithm
    password: str

class DecryptRequest(BaseModel):
    file_id: str
    algorithm: EncryptionAlgorithm
    password: str

class TextHideRequest(BaseModel):
    cover_text: str
    secret_text: str
    method: TextMethod

class TextExtractRequest(BaseModel):
    stego_text: str
    method: Optional[TextMethod] = None  # None = auto-detect

class CapacityRequest(BaseModel):
    file_id: str
    cover_type: CoverType
    algorithm: str

class RecommendRequest(BaseModel):
    cover_file_id: str
    secret_file_id: Optional[str] = None
    secret_size_bytes: Optional[int] = None
    cover_type: CoverType


# --- Response Models ---

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_type: str
    mime_type: str
    size_bytes: int
    hash_sha256: str

class HideResponse(BaseModel):
    success: bool
    output_file_id: str
    output_filename: str
    download_url: str
    algorithm: str
    quality_metrics: Optional[Dict[str, Any]] = None
    capacity_used: Optional[float] = None
    message: str

class ExtractResponse(BaseModel):
    success: bool
    extracted_type: str  # "text", "image", "audio", etc.
    extracted_text: Optional[str] = None
    download_url: Optional[str] = None
    filename: Optional[str] = None
    algorithm_detected: Optional[str] = None
    message: str

class EncryptResponse(BaseModel):
    success: bool
    output_file_id: str
    download_url: str
    algorithm: str
    hash_verification: str
    message: str

class CapacityResponse(BaseModel):
    max_capacity_bytes: int
    max_capacity_readable: str
    remaining_bytes: Optional[int] = None
    estimated_psnr: Optional[float] = None
    estimated_ssim: Optional[float] = None
    estimated_ber: Optional[float] = None
    estimated_mse: Optional[float] = None
    algorithm: str

class QualityResponse(BaseModel):
    psnr: Optional[float] = None
    ssim: Optional[float] = None
    mse: Optional[float] = None
    ber: Optional[float] = None
    entropy_original: Optional[float] = None
    entropy_stego: Optional[float] = None
    histogram_original: Optional[List[List[int]]] = None
    histogram_stego: Optional[List[List[int]]] = None

class MetadataResponse(BaseModel):
    filename: str
    file_type: str
    mime_type: str
    size_bytes: int
    size_readable: str
    hash_sha256: str
    codec: Optional[str] = None
    resolution: Optional[str] = None
    duration: Optional[float] = None
    bitrate: Optional[int] = None
    channels: Optional[int] = None
    sample_rate: Optional[int] = None
    extra: Optional[Dict[str, Any]] = None

class RecommendResponse(BaseModel):
    best_algorithm: str
    algorithm_reason: str
    capacity_prediction: Dict[str, Any]
    quality_prediction: Dict[str, float]
    compression_recommendation: str
    security_score: int  # 1-100
    recommendations: List[str]

class OperationRecord(BaseModel):
    id: int
    operation_type: str
    algorithm: Optional[str] = None
    cover_file: Optional[str] = None
    secret_file: Optional[str] = None
    output_file: Optional[str] = None
    encryption: Optional[str] = None
    file_type: Optional[str] = None
    cover_type: Optional[str] = None
    status: str
    quality_metrics: Optional[Dict[str, Any]] = None
    timestamp: str
    details: Optional[Dict[str, Any]] = None

class HistoryResponse(BaseModel):
    operations: List[OperationRecord]
    total: int
    page: int
    per_page: int

class StatsResponse(BaseModel):
    total_operations: int
    total_hides: int
    total_extracts: int
    total_encryptions: int
    total_files_processed: int
    total_data_hidden_bytes: int

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
