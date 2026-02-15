import os
import sys
import io
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types

# Force UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

# Setup Gemini
api_key = os.getenv("GEMINI_KEY_10") or os.getenv("GEMINI_API_KEY") # Try Key 10
client = genai.Client(api_key=api_key)

Standard_Bangla = "ভাই, কেমন আছেন? আপনার কি মন খারাপ? চলেন আজকে বিরিয়নী খাই।"

prompts = [
    f"Translate this Standard Bangla to Chatgaya (Chittagonian) dialect: '{Standard_Bangla}'",
    f"Translate this Standard Bangla to Sylheti dialect: '{Standard_Bangla}'",
    f"Translate this Standard Bangla to Borishailla (Barisal) dialect: '{Standard_Bangla}'"
]

print(f"Original: {Standard_Bangla}\n")

for p in prompts:
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest", 
            contents=p
        )
        print(f"Prompt: {p}")
        print(f"Output: {response.text.strip()}\n")
    except Exception as e:
        print(f"Error: {e}")


