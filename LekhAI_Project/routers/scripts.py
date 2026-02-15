
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from models.script_model import ScriptModel, ScriptCreate, ScriptUpdate

router = APIRouter(prefix="/scripts", tags=["Scripts"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_scripts():
    """Fetch all scripts from the database."""
    try:
        return ScriptModel.find_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{script_id}", response_model=Dict[str, Any])
async def get_script(script_id: str):
    """Fetch a single script by ID."""
    try:
        script = ScriptModel.find_by_id(script_id)
        if not script:
            raise HTTPException(status_code=404, detail=f"Script with ID {script_id} not found")
        return script
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Dict[str, Any])
async def create_script(script: ScriptCreate):
    """Create a new script."""
    try:
        return ScriptModel.create(script)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{script_id}", response_model=Dict[str, Any])
async def update_script(script_id: str, script: ScriptUpdate):
    """Update an existing script."""
    try:
        return ScriptModel.update(script_id, script)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{script_id}")
async def delete_script(script_id: str):
    """Delete a script."""
    try:
        ScriptModel.delete(script_id)
        return {"message": "Script deleted successfully", "id": script_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
