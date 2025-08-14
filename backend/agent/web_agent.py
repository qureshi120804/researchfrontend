from tools.web_search import search_web

async def run_agent(query: str, n: int = 5):
    # fetch once, then stream out chunks
    articles = search_web(query, n)
    yield f"🔎 Searching for: **{query}**\n\n"
    if not articles:
        yield "No articles found.\n"
    else:
        for i, a in enumerate(articles, 1):
            yield f"**{i}. {a['title']}**\n{a['url']}\n{(a.get('snippet') or '')}\n\n"

    # also emit a final JSON line so the frontend can parse structured results
    import json
    payload = {
        "query": query,
        "total_results": len(articles),
        "articles": articles
    }
    yield json.dumps(payload) + "\n"
