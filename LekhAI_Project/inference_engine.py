import os
import time
import json
import json
import pandas as pd
import numpy as np
import google.genai as genai
from google.genai import types
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import sys
from utils.web_search import get_web_context
from utils.dialect_loader import get_dialect_examples, get_dialect_label

# Force UTF-8 for Windows console just in case
try:
    sys.stdout.reconfigure(encoding='utf-8')
except:
    pass

# Load environment variables
load_dotenv()

# ==========================================
# CONFIGURATION & HARDWARE CHECK
# ==========================================
DATASET_PATH = "Ad Script Dataset.xlsx"

print("[INFO] LekhAI Inference Engine Starting (Lightweight Mode)...")

# Hardware Check
try:
    import torch
    HAS_GPU = torch.cuda.is_available()
    if HAS_GPU:
        vram = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"[INFO] GPU Detected: {torch.cuda.get_device_name(0)} ({vram:.1f} GB VRAM)")
        USE_LOCAL_LLM = vram >= 5.0
    else:
        print("[WARN] No GPU detected. Running in CPU (Turbo) Mode.")
        USE_LOCAL_LLM = False
except:
    USE_LOCAL_LLM = False

# ==========================================
# 1. SETUP GEMINI API (ROTATION)
# ==========================================
# ==========================================
# 1. SETUP GEMINI API (TIERED ROTATION)
# ==========================================
tier1_keys = []
tier2_keys = []

# Tier 1: Keys 1-13 (Gemini 2.5 Flash)
for i in range(1, 14):
    k = os.getenv(f"GEMINI_KEY_{i}")
    if k: tier1_keys.append(k)

# Tier 2: Keys 14-15 (Gemini Flash Latest - High Quota)
for i in range(14, 16):
    k = os.getenv(f"GEMINI_KEY_{i}")
    if k: tier2_keys.append(k)

# Tier 3: Keys 16-20 (Dedicated Dialect Keys)
dialect_keys = []
for i in range(16, 21):
    k = os.getenv(f"GEMINI_KEY_{i}")
    if k: dialect_keys.append(k)

# Fallback: Main key belongs to Tier 2 if not present
main_key = os.getenv("GEMINI_API_KEY")
if main_key and main_key not in tier1_keys and main_key not in tier2_keys:
    tier2_keys.append(main_key)

tier1_clients = [genai.Client(api_key=k) for k in tier1_keys]
tier2_clients = [genai.Client(api_key=k) for k in tier2_keys]
dialect_clients = [genai.Client(api_key=k) for k in dialect_keys]

print(f"[INFO] Tier 1 Keys (Gemini 2.5): {len(tier1_clients)}")
print(f"[INFO] Tier 2 Keys (Gemini Flash): {len(tier2_clients)}")
print(f"[INFO] Dialect Keys (Gemini 2.5): {len(dialect_clients)}")

t1_idx = 0
t2_idx = 0
dialect_idx = 0

def call_gemini_rotating(prompt):
    global t1_idx, t2_idx
    
    # --- TIER 1: High Quality (Gemini 2.5 Flash) ---
    if tier1_clients:
        for _ in range(len(tier1_clients)):
            client = tier1_clients[t1_idx % len(tier1_clients)]
            t1_idx += 1
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash", 
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.7)
                )
                return response.text, None
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    continue
                continue
    
    # --- TIER 2: High Quota Fallback (Gemini Flash Latest) ---
    if tier2_clients:
        for _ in range(len(tier2_clients)):
            client = tier2_clients[t2_idx % len(tier2_clients)]
            t2_idx += 1
            try:
                response = client.models.generate_content(
                    model="gemini-flash-latest", 
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.7)
                )
                return response.text, "AI quota exhausted, reverting to basic model"
            except Exception as e:
                 if "429" in str(e) or "quota" in str(e).lower():
                    continue
                 time.sleep(0.5)

    return None, "AI quota exhausted for the day. Please come back at later."


def call_gemini_dialect(prompt):
    """Dedicated Gemini call using dialect-specific keys (Tier 3: Keys 16-20)."""
    global dialect_idx
    
    if dialect_clients:
        for _ in range(len(dialect_clients)):
            client = dialect_clients[dialect_idx % len(dialect_clients)]
            dialect_idx += 1
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.7)
                )
                return response.text, None
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    continue
                continue
    
    # Fallback to regular rotation if dialect keys are exhausted
    return call_gemini_rotating(prompt)

# ==========================================
# 2. SETUP VECTOR SEARCH (PANDAS + NUMPY)
# ==========================================
print("[INFO] Loading Dataset & Embeddings...")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

df = pd.DataFrame()
embeddings = None

if os.path.exists(DATASET_PATH):
    df = pd.read_excel(DATASET_PATH)
    # Basic cleaning — columns are lowercase: script, industry, tone_1, tone_2, product, duration, type
    df = df[df['script'].notna() & (df['script'].str.len() > 10)].copy()
    df['industry'] = df['industry'].fillna('General')
    df['tone_1'] = df['tone_1'].fillna('Neutral')
    df['tone_2'] = df['tone_2'].fillna('')
    df['product'] = df['product'].fillna('Unknown')
    # Combined tone column for convenience
    df['tone'] = df.apply(lambda r: (r['tone_1'] + (', ' + r['tone_2'] if r['tone_2'] else '')).strip(), axis=1)
    
    # Create search text
    df['search_text'] = df['industry'] + " " + df['tone'] + " " + df['product'] + " " + df['script'].str[:200]
    
    print(f"[INFO] Generating embeddings for {len(df)} scripts...")
    embeddings = embed_model.encode(df['search_text'].tolist(), show_progress_bar=False)
    # Normalize for cosine similarity
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    print("[INFO] Embeddings ready.")
else:
    print(f"[ERROR] Dataset {DATASET_PATH} not found!")

def search_vectors(query, top_k=5):
    if embeddings is None or len(df) == 0: return []
    
    query_vec = embed_model.encode([query])[0]
    query_vec = query_vec / np.linalg.norm(query_vec)
    
    # Cosine similarity
    scores = np.dot(embeddings, query_vec)
    top_indices = np.argsort(scores)[::-1][:top_k]
    
    results = []
    for idx in top_indices:
        row = df.iloc[idx]
        results.append({
            "script": row['script'],
            "metadata": {
                "industry": row['industry'],
                "tone": row['tone'],
                "product": row['product']
            },
            "score": float(scores[idx])
        })
    return results

# ==========================================
# 3. SMART RETRIEVAL LOGIC
# ==========================================
def smart_retrieve(user_prompt, product_name=None, selected_industry=None, selected_tones=None):
    # Same logic but uses search_vectors instead of chroma
    clf_prompt = f"""Classify: "{user_prompt}" (Product: {product_name})
     Industries: Real Estate, FMCG, Tech, Fashion, Banking
     Tones: Emotional, Energetic, Humorous
     Return JSON: {{"matched_industry": "...", "matched_tones": ["..."]}}"""
    
    try:
        clf_raw, _ = call_gemini_rotating(clf_prompt) # Ignore warning for classification
        clf = json.loads(clf_raw.replace("```json", "").replace("```", "").strip())
    except:
        clf = {"matched_industry": "General", "matched_tones": []}

    target_ind = selected_industry or clf.get("matched_industry", "")
    target_tone = " ".join(selected_tones or clf.get("matched_tones", []))
    
    query = f"{target_ind} {target_tone} {user_prompt}"
    refs = search_vectors(query, top_k=5)
    
    return {
        "references": {"industry_refs": refs[:3], "tone_refs": refs[3:]},
        "classification": clf
    }

def build_turbo_prompt(product, industry, tone, duration_str, ad_type, rag_refs, structure=None, web_context="", dialect=None):
    refs_text = "\n".join([f"--- REF ({r['metadata']['industry']}) ---\n{r['script'][:600]}" for r in rag_refs.get("industry_refs", [])])
    
    structure_instruction = ""
    if structure:
        structure_instruction = f"""
STRICT LAYOUT REQUIREMENTS:
- Target Duration: {structure['duration']} seconds
- Total Scenes: Approximately {structure['target_scenes']} (Change visuals every ~12s)
- Word Count: Approximately {structure['target_words']} words (Dialogue + VO)
"""

    # Dialect instruction
    dialect_instruction = ""
    if dialect and dialect != "standard":
        dialect_label = get_dialect_label(dialect)
        dialect_examples = get_dialect_examples(dialect, n=8)
        dialect_instruction = f"""

DIALECT REQUIREMENT (CRITICAL):
All DIALOGUE lines in this script MUST be written in {dialect_label} dialect.
Voiceover (VO) and stage directions should remain in Standard Bangla.

Here are examples of Standard Bangla → {dialect_label} translation from the ONUBAD Dataset:

{dialect_examples}

Use these examples to understand the dialect's unique vocabulary, grammar, and pronunciation patterns.
Do NOT simply transliterate — use authentic {dialect_label} phrasing.
"""

    return f"""You are LekhAI. Write a {duration_str} {ad_type} script for '{product}'.
Industry: {industry}. Tone: {tone}. Format: Visual|Audio table.

CRITICAL INSTRUCTION:
1. USE 'REAL-WORLD CONTEXT' below for the PRODUCT USAGE, LOGIC, and FACTS. (e.g., If it's a condom, do NOT make them eat it).
2. USE 'REFERENCES' below ONLY for the SCRIPT STRUCTURE, PACING, and FORMATTING. Do NOT copy the specific product actions from references if they don't match the current product.
{dialect_instruction}
REAL-WORLD CONTEXT (LOGIC SOURCE):
{web_context}

{structure_instruction}
REFERENCES (FORMAT SOURCE):
{refs_text}

Write in fluent Bangla."""

# ==========================================
# 4. SMART CONTEXT LOGIC (Duration + Brand)
# ==========================================
class SmartContext:
    @staticmethod
    def parse_duration(prompt):
        """Extract duration from prompt (e.g. '1 min', '30s'). Returns seconds."""
        import re
        prompt = prompt.lower()
        
        # Explicit mentions
        if '1 min' in prompt or 'one min' in prompt: return 60
        if '2 min' in prompt or 'two min' in prompt: return 120
        
        # Regex for seconds
        sec_match = re.search(r'(\d+)\s*(sec|second|s\b)', prompt)
        if sec_match: return int(sec_match.group(1))
        
        # Regex for minutes
        min_match = re.search(r'(\d+)\s*(min|minute|m\b)', prompt)
        if min_match: return int(min_match.group(1)) * 60
        
        return None

    @staticmethod
    def detect_product(prompt, existing_product=None):
        """Extract product/brand name or return placeholder."""
        if existing_product and existing_product.lower() not in ['none', 'null', '']:
            return existing_product
            
        import re
        # Regex patterns for Brand/Product
        patterns = [
            r"brand\s+[:is]+\s*([a-zA-Z0-9\s]+?)(?:[\.,]|$)",
            r"product\s+[:is]+\s*([a-zA-Z0-9\s]+?)(?:[\.,]|$)",
            r"promote\s+([a-zA-Z0-9\s]+?)(?:[\.,]|$)",
            r"for\s+([A-Z][a-zA-Z0-9]+)"  # Capitalized word after 'for'
        ]
        
        for p in patterns:
            match = re.search(p, prompt, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                if len(candidate) > 2 and candidate.lower() not in ["a", "an", "the", "my"]:
                    return candidate
        
        # FALLBACK: Use Gemini to extract the main subject if Regex fails
        # This is cheap on Flash and ensures we don't miss "funny condom ad"
        try:
           extraction_prompt = f"Extract ONLY the main physical product or service from this request: '{prompt}'. Return ONLY the word. If none, return '[Brand]'."
           extracted, _ = call_gemini_rotating(extraction_prompt)
           if extracted and "[Brand]" not in extracted:
               return extracted.strip().replace("'", "").replace('"', "").replace(".", "")
        except:
            pass

        return "[Brand]"

    @staticmethod
    def calculate_structure(seconds):
        """Heuristic: ~12s per scene, ~4 words per second."""
        if not seconds: return None
        
        # Scene Count Rule: Duration / 12 (Clamped 1-15)
        target_scenes = max(1, min(15, int(seconds / 12)))
        
        # Word Count Rule: Duration * 4.0 (Conservative speaking rate)
        target_words = int(seconds * 4.0)
        
        return {
            "duration": seconds,
            "target_scenes": target_scenes,
            "target_words": target_words,
            "pacing_guide": f"~{target_scenes} Scenes, ~{target_words} Words"
        }

# ==========================================
# 5. ORCHESTRATOR
# ==========================================
def generate_lekhAI_script(prompt, product, industry=None, tones=None, duration="45s", ad_type="TVC", turbo=True, dialect=None):
    start = time.time()
    
    # 1. Smart Context: Duration & Product
    detected_sec = SmartContext.parse_duration(prompt)
    smart_product = SmartContext.detect_product(prompt, product)
    
    structure = None
    if detected_sec:
        print(f"[SmartContext] Detected constraint: {detected_sec}s for {smart_product}")
        structure = SmartContext.calculate_structure(detected_sec)
        duration = f"{detected_sec} seconds" 
    else:
        print(f"[SmartContext] Product detected: {smart_product}")

    if dialect and dialect != "standard":
        print(f"[Dialect] Requested: {get_dialect_label(dialect)}")

    retrieval = smart_retrieve(prompt, smart_product, industry, tones)
    clf = retrieval["classification"]
    
    # Web Context
    final_industry = industry or clf.get("matched_industry")
    web_context = get_web_context(smart_product, final_industry)
    
    final_prompt = build_turbo_prompt(
        smart_product, final_industry, 
        " & ".join(tones or clf.get("matched_tones", [])), 
        duration, ad_type, retrieval["references"],
        structure=structure,
        web_context=web_context,
        dialect=dialect
    )
    
    # Use dedicated dialect keys if dialect is selected
    if dialect and dialect != "standard":
        script, warning = call_gemini_dialect(final_prompt)
    else:
        script, warning = call_gemini_rotating(final_prompt)
    
    if not script:
        script = warning
        warning = "CRITICAL_QUOTA_EXHAUSTED"

    return {
        "script": script,
        "warning": warning,
        "mode": "turbo_cpu" if not USE_LOCAL_LLM else "turbo_manual",
        "dialect": dialect or "standard",
        "time": time.time() - start,
        "details": retrieval
    }
