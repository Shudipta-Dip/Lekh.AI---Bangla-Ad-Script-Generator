from duckduckgo_search import DDGS
import json
import sys
import codecs

# Force UTF-8 for Windows console
if sys.platform == "win32":
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

def get_web_context(topic: str, industry: str = None) -> str:
    """
    Searches DuckDuckGo for context about a product/topic and its advertising tropes in Bangladesh.
    Returns a summarized string of findings.
    """
    if not topic or topic == "[Brand]":
        return ""

    print(f"[INFO] Searching web for: {topic} ({industry})...")
    
    results = []
    
    # query 1: product usage/description (to prevent "eating condoms" errors)
    query_usage = f"what is {topic} product description usage"
    
    # query 2: advertising style in Bangladesh
    query_ads = f"{topic} advertisement tropes bangladesh"
    
    if industry:
        query_ads += f" {industry}"

    try:
        with DDGS() as ddgs:
            # Search Usage
            usage_res = list(ddgs.text(query_usage, max_results=2))
            for r in usage_res:
                results.append(f"- FACT: {r['body']}")

            # Search Ad Style
            ad_res = list(ddgs.text(query_ads, max_results=2))
            for r in ad_res:
                results.append(f"- AD_STYLE: {r['body']}")
                
    except Exception as e:
        print(f"[WARN] Web Search failed: {e}")
        return ""

    if not results:
        return ""

    return "\n".join(results)

if __name__ == "__main__":
    # Test
    try:
        # Safe print for Windows Console
        result = get_web_context("Condom", "Healthcare")
        print(result.encode('cp1252', errors='replace').decode('cp1252'))
    except Exception as e:
        print(f"Test failed: {e}")
