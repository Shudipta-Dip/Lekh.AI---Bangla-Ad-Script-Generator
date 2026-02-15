import requests
import json

url = "http://127.0.0.1:8000/analyze-brand"
payload = {"url": "https://www.facebook.com/bkashlimited"}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, json=payload, timeout=60)
    
    if response.status_code == 200:
        print("SUCCESS!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"FAILED: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"ERROR: {e}")
