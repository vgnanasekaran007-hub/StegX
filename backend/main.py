"""
StegX 3D Universal Steganography Studio — Backend API
FastAPI application entry point.
"""
import os
import sys
import asyncio
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure backend directory is in sys.path for Render / Uvicorn module resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from config import UPLOAD_DIR, OUTPUT_DIR, FILE_MAX_AGE
import database
from routes import upload, hide, extract, encrypt, analysis, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await database.init_db()
    print("✦ StegX Database initialized")
    print("✦ StegX API ready")
    yield
    # Shutdown — cleanup temp files
    _cleanup_old_files(UPLOAD_DIR)
    _cleanup_old_files(OUTPUT_DIR)


def _cleanup_old_files(directory: str, max_age: int = FILE_MAX_AGE):
    """Remove files older than max_age seconds."""
    now = time.time()
    try:
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if os.path.isfile(filepath):
                age = now - os.path.getmtime(filepath)
                if age > max_age:
                    os.remove(filepath)
    except Exception:
        pass


# Create FastAPI app
app = FastAPI(
    title="StegX 3D Universal Steganography Studio",
    description="AI-powered steganography API supporting image, audio, video, and text steganography with encryption and analysis.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow ALL origins so any frontend (Vercel, Netlify, localhost) works.
# This is hardcoded to ["*"] to prevent env-var misconfiguration from blocking requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories (guard existence for fresh Render deploys)
_upload_dir = str(UPLOAD_DIR)
_output_dir = str(OUTPUT_DIR)
os.makedirs(_upload_dir, exist_ok=True)
os.makedirs(_output_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_upload_dir), name="uploads")
app.mount("/outputs", StaticFiles(directory=_output_dir), name="outputs")

# Include route modules
app.include_router(upload.router)
app.include_router(hide.router)
app.include_router(extract.router)
app.include_router(encrypt.router)
app.include_router(analysis.router)
app.include_router(history.router)


@app.post("/upload")
@app.post("/upload/")
@app.post("/api/upload/")
async def upload_file_root(file: UploadFile = File(...)):
    """Root-level upload handler (with and without trailing slashes)."""
    return await upload.upload_file(file)


@app.get("/api/health")
@app.get("/api/health/")
@app.get("/health")
@app.get("/health/")
async def health_check():
    """API health check."""
    return {
        "status": "online",
        "service": "StegX",
        "version": "1.0.2",
        "cors": "wildcard",
        "engines": {
            "image": ["lsb", "dct", "dwt", "hybrid"],
            "audio": ["lsb", "phase_coding", "echo_hiding", "spread_spectrum"],
            "video": ["lsb", "dct", "dwt", "motion_vector", "hybrid"],
            "text": ["whitespace", "unicode", "zero_width", "char_encoding", "synonym"],
        },
        "encryption": ["aes-128", "aes-192", "aes-256", "rsa", "ecc", "chacha20", "blowfish"],
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
