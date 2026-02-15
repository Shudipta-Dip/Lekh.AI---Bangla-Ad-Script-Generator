from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
import uvicorn
import os
import requests
import io
from pypdf import PdfReader
from docx import Document

from inference_engine import generate_lekhAI_script
from routers import scripts, brand_voice
from models.script_model import ScriptModel, ScriptCreate

# Load environment variables
load_dotenv()

app = FastAPI(title="LekhAI API", version="1.0")

# Include Routers
app.include_router(scripts.router)
app.include_router(brand_voice.router)

# CORS — Allow frontend (local dev + production)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
ALLOWED_ORIGINS += [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:3000", "http://localhost:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for HF Spaces (CORS handled by Vercel)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScriptRequest(BaseModel):
    prompt: str
    product_name: Optional[str] = None
    industry: Optional[str] = None
    tones: Optional[List[str]] = None
    duration: Optional[str] = "45 seconds"
    ad_type: Optional[str] = "TVC"
    turbo: bool = True  # Default to Turbo for Latency
    dialect: Optional[str] = None  # 'standard', 'chatgaiya', 'sylhoti', 'barishailla'

# Input model for parsing
class ParseRequest(BaseModel):
    file_url: str

@app.post("/parse-document")
async def parse_document(request: ParseRequest):
    try:
        response = requests.get(request.file_url)
        response.raise_for_status()
        
        file_content = io.BytesIO(response.content)
        text = ""
        
        if request.file_url.lower().endswith(".pdf"):
            reader = PdfReader(file_content)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif request.file_url.lower().endswith(".docx"):
            doc = Document(file_content)
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Only PDF and DOCX are supported.")
            
        return {"text": text.strip()}
    except Exception as e:
        print(f"Error parsing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")

@app.get("/")
def home():
    return {"status": "LekhAI API is running", "version": "1.0"}

@app.post("/generate")
def generate_script(req: ScriptRequest):
    try:
        result = generate_lekhAI_script(
            prompt=req.prompt,
            product=req.product_name,
            industry=req.industry,
            tones=req.tones,
            duration=req.duration,
            ad_type=req.ad_type,
            turbo=req.turbo,
            dialect=req.dialect
        )
        
        # Auto-save to Database
        try:
            # Extract inferred metadata if available
            details = result.get("details", {})
            clf = details.get("classification", {})
            
            final_industry = clf.get("matched_industry") or req.industry or "General"
            
            # Helper to join tones
            raw_tones = clf.get("matched_tones") or req.tones or []
            final_tone = ", ".join(raw_tones) if isinstance(raw_tones, list) else str(raw_tones)
            
            script_data = ScriptCreate(
                prompt=req.prompt,
                script_content=result.get("script", ""),
                industry=final_industry,
                tone=final_tone,
                product=req.product_name,
                duration=req.duration,
                ad_type=req.ad_type
            )
            
            saved = ScriptModel.create(script_data)
            if saved:
                result["db_id"] = saved.get("id")
                print("Generated script saved to DB:", saved.get("id"))
                
        except Exception as db_err:
            print(f"[WARN] Failed to save script to DB: {db_err}")
            # We don't block the response, just warn
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))  # 7860 = HF Spaces default
    uvicorn.run(app, host="0.0.0.0", port=port)
