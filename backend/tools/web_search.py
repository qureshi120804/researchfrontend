import os, requests
from dotenv import load_dotenv
load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

def search_web(query: str, num_results: int = 5):
    url = "https://google.serper.dev/search"
    headers = { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" }
    payload = { "q": query, "num": num_results }
    r = requests.post(url, headers=headers, json=payload, timeout=20)
    if r.status_code != 200:
        return []
    data = r.json()
    results = []
    for item in data.get("organic", [])[:num_results]:
        results.append({
            "title": item.get("title"),
            "url": item.get("link"),
            "snippet": item.get("snippet")
        })
    return results
