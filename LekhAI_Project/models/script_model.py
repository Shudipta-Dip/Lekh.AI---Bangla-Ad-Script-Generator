
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from config.supabase_client import supabase, supabase_admin

# Use admin client if available to bypass RLS, otherwise fallback to public client
db = supabase_admin if supabase_admin else supabase

# Pydantic Schema for Input/Output
class ScriptBase(BaseModel):
    prompt: str
    script_content: str
    industry: Optional[str] = None
    tone: Optional[str] = None
    product: Optional[str] = None
    duration: Optional[str] = None
    ad_type: Optional[str] = None
    # KPIs
    clicked_copy: Optional[bool] = False
    clicked_markdown: Optional[bool] = False
    clicked_download: Optional[bool] = False

class ScriptCreate(ScriptBase):
    pass

class ScriptUpdate(BaseModel):
    prompt: Optional[str] = None
    script_content: Optional[str] = None
    industry: Optional[str] = None
    tone: Optional[str] = None
    product: Optional[str] = None
    duration: Optional[str] = None
    ad_type: Optional[str] = None
    clicked_copy: Optional[bool] = None
    clicked_markdown: Optional[bool] = None
    clicked_download: Optional[bool] = None

class ScriptResponse(ScriptBase):
    id: str
    created_at: str

# Data Access Object (DAO) / Model Class
class ScriptModel:
    table_name = "Scripts"

    @staticmethod
    def get_table_schema():
        try:
            response = db.table(ScriptModel.table_name).select("*").limit(0).execute()
            return response.data
        except Exception as e:
            print(f"Schema fetch error: {e}")
            raise e

    @staticmethod
    def find_all() -> List[Dict[str, Any]]:
        try:
            print('ScriptModel.find_all: Attempting to fetch all Scripts')
            response = db.table(ScriptModel.table_name).select("*").order("created_at", desc=True).execute()
            return response.data
        except Exception as e:
            print(f"Error in find_all: {e}")
            raise e

    @staticmethod
    def find_by_id(script_id: str) -> Optional[Dict[str, Any]]:
        try:
            print(f'ScriptModel.find_by_id: Fetching Script {script_id}')
            response = db.table(ScriptModel.table_name).select("*").eq("id", script_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error in find_by_id: {e}")
            raise e

    @staticmethod
    def create(script_data: ScriptCreate) -> Dict[str, Any]:
        try:
            data = script_data.dict(exclude_unset=True)
            print(f'ScriptModel.create: Creating Script: {data}')
            response = db.table(ScriptModel.table_name).insert(data).execute()
            if response.data and len(response.data) > 0:
                print('ScriptModel.create: Successfully created Script')
                return response.data[0]
            raise Exception("No data returned from insert")
        except Exception as e:
            print(f"Error in create: {e}")
            raise e

    @staticmethod
    def update(script_id: str, script_data: ScriptUpdate) -> Dict[str, Any]:
        try:
            data = script_data.dict(exclude_unset=True)
            if not data:
                raise Exception("No data to update")
            
            print(f'ScriptModel.update: Updating Script {script_id} with {data}')
            response = db.table(ScriptModel.table_name).update(data).eq("id", script_id).execute()
            if response.data and len(response.data) > 0:
                print(f'ScriptModel.update: Successfully updated Script {script_id}')
                return response.data[0]
            raise Exception("No data returned from update (Script might not exist)")
        except Exception as e:
            print(f"Error in update: {e}")
            raise e

    @staticmethod
    def delete(script_id: str) -> None:
        try:
            print(f'ScriptModel.delete: Deleting Script {script_id}')
            db.table(ScriptModel.table_name).delete().eq("id", script_id).execute()
            print(f'ScriptModel.delete: Successfully deleted Script {script_id}')
        except Exception as e:
            print(f"Error in delete: {e}")
            raise e
