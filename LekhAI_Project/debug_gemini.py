
import os
import google.genai as genai
from dotenv import load_dotenv

load_dotenv()

def test_keys():
    print("--- Debugging Gemini Keys ---")
    keys = []
    for i in range(1, 6):
        k = os.getenv(f"GEMINI_KEY_{i}")
        if k: keys.append(k)
    if not keys and os.getenv("GEMINI_API_KEY"):
        keys.append(os.getenv("GEMINI_API_KEY"))

    print(f"Found {len(keys)} keys.")
    if not keys:
        print("[ERROR] No keys found in .env")
        return

    # Check Key 1
    client = genai.Client(api_key=keys[0])
    
    models_to_test = ["gemini-flash-latest"]
    
    for m in models_to_test:
        print(f"\nTesting Model: {m}")
        try:
            response = client.models.generate_content(
                model=m, contents="Hello, are you working?",
            )
            print(f"[SUCCESS] {m} works! Response: {response.text[:20]}...")
        except Exception as e:
            print(f"[FAIL] {m} failed: {e}")

if __name__ == "__main__":
    test_keys()
