import pandas as pd
import re
import numpy as np

def count_scenes(script):
    if not isinstance(script, str): return 0
    # Markers: "Scene", "Visual:", "Audio:"
    # Use reliable Scene/Visual count
    scenes = len(re.findall(r'(?i)(scene\s+\d+|visual:)', script))
    return scenes if scenes > 0 else 1

def count_words(script):
    if not isinstance(script, str): return 0
    return len(script.split())

df = pd.read_excel("Ad Script Dataset.xlsx")
# Ensure duration is int
df['duration'] = pd.to_numeric(df['duration'], errors='coerce').fillna(45).astype(int)
df = df[df['script'].notna()]

df['scene_count'] = df['script'].apply(count_scenes)
df['word_count'] = df['script'].apply(count_words)
df['words_per_sec'] = df['word_count'] / df['duration']

print("\n--- Detailed Duration Stats ---")
stats = df.groupby('duration').agg({
    'scene_count': 'mean',
    'word_count': 'mean',
    'words_per_sec': 'mean',
    'script': 'count'
}).reset_index().sort_values('duration')

stats['scene_count'] = stats['scene_count'].round(1)
stats['word_count'] = stats['word_count'].round(0)
stats['words_per_sec'] = stats['words_per_sec'].round(2)

print(stats)
print("\n--- Speaking Rate (Avg) ---")
print(f"Overall Avg Words/Sec: {df['words_per_sec'].mean():.2f}")
