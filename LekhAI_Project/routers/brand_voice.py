from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
from apify_client import ApifyClient
from groq import Groq
from utils.key_manager import key_manager

router = APIRouter()

class BrandAnalyzeRequest(BaseModel):
    url: str

class StructureInfo(BaseModel):
    emoji_usage: str
    sentence_length: str
    hashtag_style: str

class BrandAnalysisResult(BaseModel):
    tone: str
    tone_explanation: str
    keywords: List[str]
    keywords_explanation: str
    structure: StructureInfo
    structure_explanation: str
    banglish_vs_bangla: str
    banglish_explanation: str
    language_style: str  # kept for backward compat with frontend "Apply"
    hook_style: str

@router.post("/analyze-brand", response_model=BrandAnalysisResult)
async def analyze_brand(request: BrandAnalyzeRequest):
    """
    Analyzes a Facebook Page to extract Brand Voice DNA (Detailed).
    """
    try:
        # STEP 1: SCRAPE via Apify
        apify_token = key_manager.get_next_apify_key()
        if not apify_token:
            raise HTTPException(status_code=500, detail="No Apify API keys available.")
            
        apify_client = ApifyClient(apify_token)
        
        run_input = {
            "startUrls": [{"url": request.url}],
            "resultsLimit": 5,
            "onlyPosts": True,
            "useProxies": True,
        }
        
        print(f"[INFO] Scraping {request.url} with Apify...")
        run = apify_client.actor("apify/facebook-posts-scraper").call(run_input=run_input)
        
        dataset_items = apify_client.dataset(run["defaultDatasetId"]).list_items().items
        
        if not dataset_items:
             raise HTTPException(status_code=400, detail="No posts found. The page might be private, empty, or the URL is invalid.")
             
        posts_text = []
        for item in dataset_items:
            text = item.get("text") or item.get("postText")
            if text:
                posts_text.append(text[:500])
                
        if not posts_text:
             raise HTTPException(status_code=400, detail="Found posts but no text content (maybe only images/videos).")

        combined_text = "\n---\n".join(posts_text)

        # STEP 2: ANALYZE via Groq (Llama-3) — DETAILED prompt
        groq_key = key_manager.get_next_groq_key()
        if not groq_key:
             raise HTTPException(status_code=500, detail="No Groq API keys available.")
             
        client = Groq(api_key=groq_key)
        
        system_prompt = """You are a senior Brand Strategist specializing in Bangladeshi digital marketing.
Analyze these Facebook posts and produce a DETAILED Brand Voice DNA report.

Output MUST be valid JSON with this EXACT structure:
{
  "tone": "e.g. Friendly and Informative",
  "tone_explanation": "2-3 sentences explaining WHY this tone was detected, with examples from the posts.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "keywords_explanation": "2-3 sentences explaining what these recurring words/hooks indicate about the brand's focus.",
  "structure": {
    "emoji_usage": "None/Minimal/Moderate/Heavy",
    "sentence_length": "Short/Medium/Long/Mixed",
    "hashtag_style": "Bengali only/English only/Bengali and English mixed/None"
  },
  "structure_explanation": "2-3 sentences about how the post structure affects readability and engagement.",
  "banglish_vs_bangla": "Pure Bengali script/Banglish (Romanized Bengali)/English Only/Mixed Bengali and English",
  "banglish_explanation": "2-3 sentences about the brand's language choice and what it implies about their audience.",
  "language_style": "Banglish (Mixed)/Pure Bangla/English Only",
  "hook_style": "Short questions/Storytelling/Direct Offer/Educational/Emotional Appeal"
}

IMPORTANT:
- Keywords should include Bengali/Bangla words if the posts use them.
- Be specific and cite actual phrases from the posts in your explanations.
- Do NOT add markdown formatting. Return raw JSON only."""
        
        print(f"[INFO] Analyzing {len(posts_text)} posts with Groq (detailed)...")
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here are the recent posts:\n{combined_text}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        result_json_str = chat_completion.choices[0].message.content
        result_data = json.loads(result_json_str)
        
        # Parse structure
        structure_raw = result_data.get("structure", {})
        structure = StructureInfo(
            emoji_usage=structure_raw.get("emoji_usage", "Moderate"),
            sentence_length=structure_raw.get("sentence_length", "Medium"),
            hashtag_style=structure_raw.get("hashtag_style", "Mixed")
        )
        
        return BrandAnalysisResult(
            tone=result_data.get("tone", "Friendly"),
            tone_explanation=result_data.get("tone_explanation", ""),
            keywords=result_data.get("keywords", []),
            keywords_explanation=result_data.get("keywords_explanation", ""),
            structure=structure,
            structure_explanation=result_data.get("structure_explanation", ""),
            banglish_vs_bangla=result_data.get("banglish_vs_bangla", "Mixed"),
            banglish_explanation=result_data.get("banglish_explanation", ""),
            language_style=result_data.get("language_style", "Banglish"),
            hook_style=result_data.get("hook_style", "Direct")
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[ERROR] Brand Analysis Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
