"""
StegX Encrypt/Decrypt Routes — Standalone encryption and decryption.
"""
import os
import uuid
from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import FileResponse
from config import OUTPUT_DIR
from routes.upload import file_registry, get_file_path
from engines.encryption import encrypt_data, decrypt_data, compute_hash
import database

router = APIRouter(prefix="/api", tags=["Encryption"])


@router.post("/encrypt")
async def encrypt_file(
    file_id: str = Form(...),
    algorithm: str = Form("aes-256"),
    password: str = Form(...),
):
    """Encrypt a file."""
    try:
        file_path = get_file_path(file_id)

        with open(file_path, 'rb') as f:
            data = f.read()

        encrypted = encrypt_data(data, password, algorithm)

        out_id = str(uuid.uuid4())[:12]
        ext = os.path.splitext(file_path)[1]
        out_filename = f"encrypted_{out_id}{ext}.enc"
        out_path = os.path.join(OUTPUT_DIR, out_filename)

        with open(out_path, 'wb') as f:
            f.write(encrypted)

        file_registry[out_id] = out_path

        await database.add_operation(
            operation_type="encrypt",
            algorithm=algorithm,
            cover_file=os.path.basename(file_path),
            output_file=out_filename,
            encryption=algorithm,
        )

        return {
            "success": True,
            "output_file_id": out_id,
            "download_url": f"/api/download/{out_id}",
            "algorithm": algorithm,
            "hash_verification": compute_hash(data, "sha-256"),
            "encrypted_size": len(encrypted),
            "message": f"Successfully encrypted with {algorithm.upper()}",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")


@router.post("/decrypt")
async def decrypt_file(
    file_id: str = Form(...),
    algorithm: str = Form("aes-256"),
    password: str = Form(...),
):
    """Decrypt a file."""
    try:
        file_path = get_file_path(file_id)

        with open(file_path, 'rb') as f:
            data = f.read()

        decrypted = decrypt_data(data, password, algorithm)

        out_id = str(uuid.uuid4())[:12]
        # Remove .enc extension if present
        base_name = os.path.basename(file_path)
        if base_name.endswith('.enc'):
            base_name = base_name[:-4]
        out_filename = f"decrypted_{out_id}_{base_name}"
        out_path = os.path.join(OUTPUT_DIR, out_filename)

        with open(out_path, 'wb') as f:
            f.write(decrypted)

        file_registry[out_id] = out_path

        await database.add_operation(
            operation_type="decrypt",
            algorithm=algorithm,
            cover_file=os.path.basename(file_path),
            output_file=out_filename,
            encryption=algorithm,
        )

        return {
            "success": True,
            "output_file_id": out_id,
            "download_url": f"/api/download/{out_id}",
            "algorithm": algorithm,
            "hash_verification": compute_hash(decrypted, "sha-256"),
            "decrypted_size": len(decrypted),
            "message": f"Successfully decrypted with {algorithm.upper()}",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")
