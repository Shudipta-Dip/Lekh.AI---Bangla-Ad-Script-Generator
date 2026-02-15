
from config.supabase_client import supabase
import os

def test_insert():
    print("--- Debugging Supabase Connection ---")
    
    # Check if client exists
    if not supabase:
        print("[ERROR] Supabase client is None. Check .env keys.")
        return

    # payload matching our schema
    test_data = {
        "prompt": "DEBUG_PROMPT",
        "script_content": "This is a test script.",
        "industry": "Test",
        "tone": "Test",
        "product": "TestProduct",
        "duration": "15s",
        "ad_type": "TestType"
    }

    # Try 'scripts' (lowercase)
    try:
        print("\nAttempting INSERT into 'scripts' (lowercase)...")
        res = supabase.table("scripts").insert(test_data).execute()
        print("[SUCCESS] Inserted into 'scripts':", res.data)
    except Exception as e:
        print(f"[FAIL] Error inserting into 'scripts': {e}")

    # Try 'Scripts' (Capitalized)
    try:
        print("\nAttempting INSERT into 'Scripts' (Capitalized)...")
        res = supabase.table("Scripts").insert(test_data).execute()
        print("[SUCCESS] Inserted into 'Scripts':", res.data)
    except Exception as e:
        print(f"[FAIL] Error inserting into 'Scripts': {e}")

if __name__ == "__main__":
    test_insert()
