"""
StegX History Route — Operation history with search and filters.
"""
from fastapi import APIRouter, HTTPException, Query
import database

router = APIRouter(prefix="/api", tags=["History"])


@router.get("/history")
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    operation_type: str = Query(None),
    search: str = Query(None),
):
    """Get paginated operation history."""
    try:
        offset = (page - 1) * per_page
        operations = await database.get_operations(
            limit=per_page, offset=offset,
            operation_type=operation_type, search=search
        )
        total = await database.get_operation_count(operation_type)

        return {
            "operations": operations,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{op_id}")
async def delete_history_entry(op_id: int):
    """Delete a history entry."""
    try:
        await database.delete_operation(op_id)
        return {"success": True, "message": f"Deleted operation {op_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats():
    """Get dashboard statistics."""
    try:
        total = await database.get_operation_count()
        hides = await database.get_operation_count("hide")
        extracts = await database.get_operation_count("extract")
        encrypts = await database.get_operation_count("encrypt")

        return {
            "total_operations": total,
            "total_hides": hides,
            "total_extracts": extracts,
            "total_encryptions": encrypts,
            "total_files_processed": total,
            "total_data_hidden_bytes": 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings")
async def get_settings():
    """Get app settings."""
    return await database.get_settings()


@router.post("/settings")
async def update_settings(key: str = Query(...), value: str = Query(...)):
    """Update a setting."""
    await database.update_setting(key, value)
    return {"success": True, "key": key, "value": value}
