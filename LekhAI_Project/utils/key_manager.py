import os
import random
from typing import List

class KeyManager:
    def __init__(self):
        self.apify_keys = self._load_keys("APIFY_KEY", 5)
        self.groq_keys = self._load_keys("GROQ_KEY", 5)
        self.apify_index = 0
        self.groq_index = 0

    def _load_keys(self, prefix: str, count: int) -> List[str]:
        keys = []
        # Try base key
        base = os.getenv(prefix)
        if base:
            keys.append(base)
        
        # Try numbered keys
        for i in range(1, count + 1):
            key = os.getenv(f"{prefix}_{i}")
            if key and key not in keys:
                keys.append(key)
        
        if not keys:
            print(f"[WARN] No keys found for {prefix}")
            return [""] # Return empty to avoid crash, but requests will fail
            
        print(f"[INFO] Loaded {len(keys)} keys for {prefix}")
        return keys

    def get_next_apify_key(self) -> str:
        """Round-robin rotation for Apify"""
        if not self.apify_keys:
            return ""
        key = self.apify_keys[self.apify_index]
        self.apify_index = (self.apify_index + 1) % len(self.apify_keys)
        return key

    def get_next_groq_key(self) -> str:
        """Round-robin rotation for Groq"""
        if not self.groq_keys:
            return ""
        key = self.groq_keys[self.groq_index]
        self.groq_index = (self.groq_index + 1) % len(self.groq_keys)
        return key

# Global instance
key_manager = KeyManager()
