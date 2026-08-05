"""
StegX Hide Route — Perform steganographic embedding.
"""
import os
import uuid
from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from fastapi.responses import JSONResponse
from config import OUTPUT_DIR, UPLOAD_DIR
from routes.upload import file_registry, get_file_path
from engines.image_steg import LSBImageSteg, DCTImageSteg, DWTImageSteg, HybridImageSteg
from engines.audio_steg import LSBAudioSteg, PhaseCodingSteg, EchoHidingSteg, SpreadSpectrumSteg
from engines.video_steg import VideoSteg
from engines.text_steg import (WhitespaceSteg, UnicodeSteg, ZeroWidthSteg,
                                CharEncodingSteg, SynonymSteg)
from engines.encryption import encrypt_data
from analyzers.quality import analyze_quality
import database

router = APIRouter(prefix="/api", tags=["Hide"])


@router.post("/hide")
async def hide_data(
    cover_file_id: str = Form(...),
    cover_type: str = Form(...),
    algorithm: str = Form(...),
    secret_file_id: str = Form(None),
    secret_text: str = Form(None),
    encryption: str = Form(None),
    password: str = Form(None),
    bit_depth: int = Form(1),
):
    """Hide secret data inside a cover file."""
    try:
        cover_path = get_file_path(cover_file_id)

        # Get secret data
        if secret_file_id:
            secret_path = get_file_path(secret_file_id)
            with open(secret_path, 'rb') as f:
                secret_data = f.read()
            secret_ext = os.path.splitext(secret_path)[1]
            secret_name = os.path.basename(secret_path)
        elif secret_text:
            secret_data = secret_text.encode('utf-8')
            secret_ext = ".txt"
            secret_name = "text_message"
        else:
            raise HTTPException(status_code=400, detail="No secret data provided")

        # Apply encryption if requested
        if encryption and password:
            secret_data = encrypt_data(secret_data, password, encryption)
            secret_ext = f".enc{secret_ext}"

        # Generate output path
        out_id = str(uuid.uuid4())[:12]
        cover_ext = os.path.splitext(cover_path)[1]
        output_path = os.path.join(OUTPUT_DIR, f"stego_{out_id}{cover_ext}")

        # Perform steganography
        result = {}
        if cover_type == "image":
            if algorithm == "lsb":
                result = LSBImageSteg.hide(cover_path, secret_data, output_path,
                                           bit_depth=bit_depth, secret_ext=secret_ext)
            elif algorithm == "dct":
                result = DCTImageSteg.hide(cover_path, secret_data, output_path,
                                           secret_ext=secret_ext)
            elif algorithm == "dwt":
                result = DWTImageSteg.hide(cover_path, secret_data, output_path,
                                           secret_ext=secret_ext)
            elif algorithm == "hybrid":
                result = HybridImageSteg.hide(cover_path, secret_data, output_path,
                                              secret_ext=secret_ext)
            else:
                raise HTTPException(status_code=400, detail=f"Unknown image algorithm: {algorithm}")

        elif cover_type == "audio":
            if algorithm == "lsb":
                result = LSBAudioSteg.hide(cover_path, secret_data, output_path,
                                           secret_ext=secret_ext)
            elif algorithm == "phase_coding":
                result = PhaseCodingSteg.hide(cover_path, secret_data, output_path,
                                              secret_ext=secret_ext)
            elif algorithm == "echo_hiding":
                result = EchoHidingSteg.hide(cover_path, secret_data, output_path,
                                             secret_ext=secret_ext)
            elif algorithm == "spread_spectrum":
                result = SpreadSpectrumSteg.hide(cover_path, secret_data, output_path,
                                                 secret_ext=secret_ext)
            else:
                raise HTTPException(status_code=400, detail=f"Unknown audio algorithm: {algorithm}")

        elif cover_type == "video":
            result = VideoSteg.hide(cover_path, secret_data, output_path,
                                    algorithm=algorithm, bit_depth=bit_depth,
                                    secret_ext=secret_ext)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown cover type: {cover_type}")

        actual_output = result.get("output_path", output_path)
        out_filename = os.path.basename(actual_output)

        # Register output file
        file_registry[out_id] = actual_output

        # Quality analysis
        quality_metrics = None
        try:
            quality_metrics = analyze_quality(cover_path, actual_output, cover_type)
        except Exception:
            pass

        # Record in history
        await database.add_operation(
            operation_type="hide",
            algorithm=algorithm,
            cover_file=os.path.basename(cover_path),
            secret_file=secret_name,
            output_file=out_filename,
            encryption=encryption,
            file_type=secret_ext,
            cover_type=cover_type,
            quality_metrics=quality_metrics,
        )

        return {
            "success": True,
            "output_file_id": out_id,
            "output_filename": out_filename,
            "download_url": f"/api/download/{out_id}",
            "algorithm": algorithm,
            "quality_metrics": quality_metrics,
            "capacity_used": result.get("bits_used", 0),
            "message": f"Successfully hid data using {algorithm.upper()} in {cover_type}",
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Steganography failed: {str(e)}")


@router.post("/hide/text")
async def hide_text_in_text(
    cover_text: str = Form(...),
    secret_text: str = Form(...),
    method: str = Form("zero_width"),
):
    """Hide text within text using text steganography methods."""
    try:
        methods = {
            "whitespace": WhitespaceSteg.hide,
            "unicode": UnicodeSteg.hide,
            "zero_width": ZeroWidthSteg.hide,
            "char_encoding": CharEncodingSteg.hide,
            "synonym": SynonymSteg.hide,
        }

        hide_fn = methods.get(method)
        if not hide_fn:
            raise HTTPException(status_code=400, detail=f"Unknown text method: {method}")

        stego_text = hide_fn(cover_text, secret_text)

        await database.add_operation(
            operation_type="hide",
            algorithm=method,
            cover_type="text",
            file_type="text",
        )

        return {
            "success": True,
            "stego_text": stego_text,
            "method": method,
            "message": f"Successfully hid text using {method} method",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
