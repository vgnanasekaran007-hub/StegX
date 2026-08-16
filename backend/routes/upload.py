"""
StegX Upload Route — File upload with validation and metadata extraction.
"""
import os
import uuid
import hashlib
import mimetypes
from fastapi import APIRouter, UploadFile, File, HTTPException
from config import UPLOAD_DIR, MAX_FILE_SIZE_BYTES, ALL_COVER_FORMATS, ALL_SECRET_FORMATS
from analyzers.metadata import inspect_metadata
import database

router = APIRouter(prefix="/api", tags=["Upload"])

# In-memory file registry (maps file_id -> file_path)
file_registry = {}


def get_file_path(file_id: str) -> str:
    """Get file path from registry."""
    path = file_registry.get(file_id)
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_id}")
    return path


@router.post("/upload")
@router.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file and return its metadata."""
    # Read file content
    content = await file.read()

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {MAX_FILE_SIZE_BYTES / (1024*1024):.0f} MB"
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Generate unique file ID and save
    file_id = str(uuid.uuid4())[:12]
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    safe_name = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, 'wb') as f:
        f.write(content)

    # Register file
    file_registry[file_id] = file_path

    # Get metadata
    try:
        metadata = inspect_metadata(file_path)
    except Exception:
        metadata = {
            "filename": file.filename,
            "file_type": "unknown",
            "mime_type": mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream",
            "size_bytes": len(content),
            "size_readable": f"{len(content)} B",
            "hash_sha256": hashlib.sha256(content).hexdigest(),
        }

    # Store in database
    try:
        await database.add_file_record(
            filename=file.filename or safe_name,
            filepath=file_path,
            file_type=metadata.get("file_type", "unknown"),
            mime_type=metadata.get("mime_type", "application/octet-stream"),
            size_bytes=len(content),
            hash_sha256=metadata.get("hash_sha256", ""),
            metadata=metadata
        )
    except Exception:
        pass  # Non-critical

    return {
        "file_id": file_id,
        "filename": file.filename or safe_name,
        "file_type": metadata.get("file_type", "unknown"),
        "mime_type": metadata.get("mime_type", "application/octet-stream"),
        "size_bytes": len(content),
        "size_readable": metadata.get("size_readable", f"{len(content)} B"),
        "hash_sha256": metadata.get("hash_sha256", ""),
        "metadata": metadata,
    }


@router.post("/upload/multiple")
async def upload_multiple(files: list[UploadFile] = File(...)):
    """Upload multiple files."""
    results = []
    for file in files:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            results.append({"filename": file.filename, "error": "File too large"})
            continue

        file_id = str(uuid.uuid4())[:12]
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        safe_name = f"{file_id}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(file_path, 'wb') as f:
            f.write(content)

        file_registry[file_id] = file_path
        results.append({
            "file_id": file_id,
            "filename": file.filename or safe_name,
            "size_bytes": len(content),
        })

    return {"files": results}
