import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_PROJECT_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Missing credentials in .env")
    exit(1)

supabase: Client = create_client(URL, KEY)

try:
    buckets = supabase.storage.list_buckets()
    print("\n--- Available Buckets ---")
    for b in buckets:
        print(f"- {b.name} (Public: {b.public})")
    print("------------------------\n")
except Exception as e:
    print(f"Error listing buckets: {e}")
