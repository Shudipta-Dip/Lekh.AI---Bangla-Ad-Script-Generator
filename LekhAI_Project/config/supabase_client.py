
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from both local and parent directories
load_dotenv() # Loads project local .env
load_dotenv("../.env") # Loads root .env (if it exists)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_PROJECT_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[WARN] Supabase credentials missing in .env")
    supabase: Client = None
else:
    try:
        # Initialize Supabase Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Initialize Admin Client (Optional)
        if SUPABASE_SERVICE_ROLE_KEY:
            supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        else:
            supabase_admin = None
            
        print("[INFO] Supabase client initialized.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Supabase: {e}")
        supabase = None
        supabase_admin = None

if __name__ == "__main__":
    if supabase:
        print(f"[SUCCESS] Connected to Supabase Project: {SUPABASE_URL}")
        # Try a simple fetch to verify auth (if table exists, or just check client)
        # print(supabase.table("test").select("*").execute())
    else:
        print("[FAILURE] Could not connect to Supabase.")
