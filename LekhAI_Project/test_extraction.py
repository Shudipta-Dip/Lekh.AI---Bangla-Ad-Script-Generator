from inference_engine import SmartContext

test_prompts = [
    "Write a funny condom ad",
    "I need a script for a condom brand",
    "Create a commercial for condoms",
    "Write a script for BrandX condoms",
    "condom brand ad"
]

print("Testing SmartContext.detect_product()...")
for p in test_prompts:
    detected = SmartContext.detect_product(p)
    print(f"Prompt: '{p}' -> Detected: '{detected}'")
