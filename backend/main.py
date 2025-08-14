import os, asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from agent.web_agent import run_agent
from db.supabase_client import supabase, get_user_from_token

load_dotenv()

app = FastAPI()

# CORS for local dev; restrict in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # set your frontend domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/query")
async def query_agent(request: Request):
    body = await request.json()
    user_query = (body.get("query") or "").strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="query is required")

    # Get access token from Authorization header
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else None
    user = get_user_from_token(token) if token else None

    async def streamer():
        # run agent to get results
        buffer = []
        async for chunk in run_agent(user_query, 5):
            # collect final JSON line for DB later
            buffer.append(chunk)
            yield chunk
            await asyncio.sleep(0.02)

        # After streaming to client, persist to DB (non-blocking for client since stream is already sent)
        try:
            # find the last JSON line we appended
            json_line = None
            for line in reversed(buffer):
                if line.strip().startswith("{") and line.strip().endswith("}"):
                    json_line = line
                    break
            if json_line:
                import json
                data = json.loads(json_line)
                articles = data.get("articles", [])
                # If user is authenticated, store their history
                if user:
                    user_id = user.id
                    # create search_history
                    sh = supabase.table("search_history").insert({
                        "user_id": user_id,
                        "query": user_query,
                        "results_count": len(articles)
                    }).execute()
                    search_id = sh.data[0]["id"]
                    # bulk insert articles
                    if articles:
                        rows = [{"search_id": search_id, "title": a.get("title"), "url": a.get("url"), "snippet": a.get("snippet")} for a in articles]
                        supabase.table("articles").insert(rows).execute()
        except Exception as e:
            # log error, but don't break streaming
            print("DB persist error:", str(e))

    return StreamingResponse(streamer(), media_type="text/plain")
