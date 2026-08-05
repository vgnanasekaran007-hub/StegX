"""
StegX Extract Route — Extract hidden data from stego files.
"""
import os
import uuid
from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import FileResponse
from config import OUTPUT_DIR
from routes.upload import file_registry, get_file_path
from engines.image_steg import LSBImageSteg, DCTImageSteg, DWTImageSteg, auto_extract_image
from engines.audio_steg import LSBAudioSteg, PhaseCodingSteg, EchoHidingSteg, SpreadSpectrumSteg, auto_extract_audio
from engines.video_steg import VideoSteg, auto_extract_video
from engines.text_steg import text_extract
from engines.encryption import decrypt_data
import database

router = APIRouter(prefix="/api", tags=["Extract"])


@router.post("/extract")
async def extract_data(
    stego_file_id: str = Form(...),
    cover_type: str = Form(...),
    algorithm: str = Form(None),
    password: str = Form(None),
    encryption: str = Form(None),
    bit_depth: int = Form(1),
):
    """Extract hidden data from a stego file."""
    try:
        stego_path = get_file_path(stego_file_id)
        detected_algo = algorithm

        # Extract based on cover type
        if cover_type == "image":
            if algorithm and algorithm != "auto":
                if algorithm == "lsb":
                    data, ext = LSBImageSteg.extract(stego_path, bit_depth=bit_depth)
                elif algorithm == "dct":
                    data, ext = DCTImageSteg.extract(stego_path)
                elif algorithm == "dwt":
                    data, ext = DWTImageSteg.extract(stego_path)
                elif algorithm == "hybrid":
                    try:
                        data, ext = LSBImageSteg.extract(stego_path, bit_depth=bit_depth)
                    except ValueError:
                        data, ext = DCTImageSteg.extract(stego_path)
                else:
                    raise HTTPException(status_code=400, detail=f"Unknown algorithm: {algorithm}")
            else:
                data, ext, detected_algo = auto_extract_image(stego_path)

        elif cover_type == "audio":
            if algorithm and algorithm != "auto":
                if algorithm == "lsb":
                    data, ext = LSBAudioSteg.extract(stego_path)
                elif algorithm == "phase_coding":
                    data, ext = PhaseCodingSteg.extract(stego_path)
                elif algorithm == "echo_hiding":
                    data, ext = EchoHidingSteg.extract(stego_path)
                elif algorithm == "spread_spectrum":
                    data, ext = SpreadSpectrumSteg.extract(stego_path)
                else:
                    raise HTTPException(status_code=400, detail=f"Unknown algorithm: {algorithm}")
            else:
                data, ext, detected_algo = auto_extract_audio(stego_path)

        elif cover_type == "video":
            algo = algorithm if algorithm and algorithm != "auto" else "lsb"
            try:
                data, ext = VideoSteg.extract(stego_path, algorithm=algo, bit_depth=bit_depth)
                detected_algo = algo
            except ValueError:
                data, ext, detected_algo = auto_extract_video(stego_path)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown cover type: {cover_type}")

        # Decrypt if needed
        if password and encryption:
            # Check if extension indicates encryption
            if ext.startswith(".enc"):
                ext = ext[4:]  # Remove .enc prefix
            data = decrypt_data(data, password, encryption)

        # Determine output type
        text_exts = {".txt", ".md", ".csv", ".json", ".xml", ".html"}
        is_text = ext.lower() in text_exts

        # Save extracted file
        out_id = str(uuid.uuid4())[:12]
        out_filename = f"extracted_{out_id}{ext}"
        out_path = os.path.join(OUTPUT_DIR, out_filename)

        with open(out_path, 'wb') as f:
            f.write(data)

        file_registry[out_id] = out_path

        # Record history
        await database.add_operation(
            operation_type="extract",
            algorithm=detected_algo,
            cover_file=os.path.basename(stego_path),
            output_file=out_filename,
            encryption=encryption,
            file_type=ext,
            cover_type=cover_type,
        )

        response = {
            "success": True,
            "extracted_type": ext.replace(".", "") if ext else "unknown",
            "download_url": f"/api/download/{out_id}",
            "filename": out_filename,
            "size_bytes": len(data),
            "algorithm_detected": detected_algo,
            "message": f"Successfully extracted {ext or 'data'} using {detected_algo}",
        }

        if is_text:
            try:
                response["extracted_text"] = data.decode('utf-8')
            except UnicodeDecodeError:
                pass

        return response

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.post("/extract/text")
async def extract_text_from_text(
    stego_text: str = Form(...),
    method: str = Form(None),
):
    """Extract hidden text from stego text."""
    try:
        extracted = text_extract(stego_text, method)

        await database.add_operation(
            operation_type="extract",
            algorithm=method or "auto",
            cover_type="text",
        )

        return {
            "success": True,
            "extracted_text": extracted,
            "method_detected": method or "auto",
            "message": "Successfully extracted hidden text",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download an output file."""
    path = get_file_path(file_id)
    filename = os.path.basename(path)
    return FileResponse(path, filename=filename, media_type="application/octet-stream")
