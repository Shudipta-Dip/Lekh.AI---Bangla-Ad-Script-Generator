"""
Dialect Loader — Loads ONUBAD dataset examples for Few-Shot prompting.
Provides random samples of Standard Bangla → Dialect translations.
"""
import os
import random
import pandas as pd

BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "dialects")

# Column mapping (matches ONUBAD xlsx headers)
DIALECT_COLUMNS = {
    "chatgaiya": "Chittagong Language",
    "sylhoti":   "Sylhet Language",
    "barishailla": "Barisal Language",
}

STANDARD_COL = "Standard Bangla Lanuguage"  # Note: typo in original dataset

# Cache loaded DataFrames
_cache = {}

def _load_all():
    """Load and merge all 3 xlsx files (Word, Clause, Sentence) into one DataFrame."""
    if "merged" in _cache:
        return _cache["merged"]

    frames = []
    for fname in ["Word.xlsx", "Clause.xlsx", "Sentence.xlsx"]:
        fpath = os.path.join(BASE_DIR, fname)
        if os.path.exists(fpath):
            try:
                df = pd.read_excel(fpath)
                # Only keep rows where Standard Bangla is not empty
                df = df[df[STANDARD_COL].notna() & (df[STANDARD_COL].str.len() > 0)]
                frames.append(df)
            except Exception as e:
                print(f"[DialectLoader] Warning: Could not load {fname}: {e}")

    if frames:
        merged = pd.concat(frames, ignore_index=True)
        _cache["merged"] = merged
        print(f"[DialectLoader] Loaded {len(merged)} examples from ONUBAD Dataset.")
        return merged
    
    print("[DialectLoader] WARNING: No dialect data found!")
    return pd.DataFrame()


def get_dialect_examples(dialect_key: str, n: int = 8) -> str:
    """
    Returns a formatted string of n random Standard Bangla → Dialect examples.
    Used for Few-Shot injection into the system prompt.
    
    Args:
        dialect_key: One of 'chatgaiya', 'sylhoti', 'barishailla'
        n: Number of examples to include
    
    Returns:
        Formatted string of translation pairs
    """
    if dialect_key not in DIALECT_COLUMNS:
        return ""
    
    df = _load_all()
    if df.empty:
        return ""
    
    dialect_col = DIALECT_COLUMNS[dialect_key]
    
    # Filter rows where both Standard and Dialect columns have values
    valid = df[
        df[STANDARD_COL].notna() & (df[STANDARD_COL].str.len() > 0) &
        df[dialect_col].notna() & (df[dialect_col].str.len() > 0)
    ].copy()
    
    if valid.empty:
        return ""
    
    # Sample n random examples (or all if fewer than n)
    sample_size = min(n, len(valid))
    samples = valid.sample(sample_size, random_state=random.randint(0, 9999))
    
    # Format as translation pairs
    lines = []
    for _, row in samples.iterrows():
        std = str(row[STANDARD_COL]).strip()
        dial = str(row[dialect_col]).strip()
        lines.append(f"Standard: {std}\n{dialect_key.capitalize()}: {dial}")
    
    return "\n\n".join(lines)


def get_dialect_label(dialect_key: str) -> str:
    """Returns a human-readable label for the dialect."""
    labels = {
        "chatgaiya": "Chatgaiya (চাটগাঁইয়া / Chittagonian)",
        "sylhoti": "Sylhoti (সিলটি / Sylheti)",
        "barishailla": "Barishailla (বরিশাইল্লা / Barisali)",
        "standard": "Standard Bangla (শুদ্ধ বাংলা)",
    }
    return labels.get(dialect_key, "Standard Bangla")
