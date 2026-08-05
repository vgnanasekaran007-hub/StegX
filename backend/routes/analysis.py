"""
StegX Analysis Routes — Metadata, capacity, quality analysis, and AI recommendations.
"""
from fastapi import APIRouter, HTTPException, Form
from routes.upload import get_file_path
from analyzers.metadata import inspect_metadata
from analyzers.capacity import analyze_capacity
from analyzers.quality import analyze_quality
from analyzers.ai_recommend import recommend

router = APIRouter(prefix="/api", tags=["Analysis"])


@router.post("/metadata")
async def get_metadata(file_id: str = Form(...)):
    """Get file metadata."""
    try:
        path = get_file_path(file_id)
        return inspect_metadata(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/capacity")
async def get_capacity(
    file_id: str = Form(...),
    cover_type: str = Form(...),
    algorithm: str = Form("lsb"),
    bit_depth: int = Form(1),
):
    """Analyze embedding capacity."""
    try:
        path = get_file_path(file_id)
        return analyze_capacity(path, cover_type, algorithm, bit_depth)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analysis")
async def quality_analysis(
    original_file_id: str = Form(...),
    stego_file_id: str = Form(...),
    cover_type: str = Form(...),
):
    """Compare quality between original and stego files."""
    try:
        original_path = get_file_path(original_file_id)
        stego_path = get_file_path(stego_file_id)
        return analyze_quality(original_path, stego_path, cover_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend")
async def get_recommendation(
    cover_file_id: str = Form(...),
    cover_type: str = Form(...),
    secret_file_id: str = Form(None),
    secret_size: int = Form(None),
):
    """Get AI-powered algorithm recommendation."""
    try:
        cover_path = get_file_path(cover_file_id)
        secret_path = None
        if secret_file_id:
            secret_path = get_file_path(secret_file_id)
        return recommend(cover_path, cover_type, secret_size, secret_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
