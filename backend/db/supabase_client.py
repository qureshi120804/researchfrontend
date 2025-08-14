import os
from supabase import create_client, Client
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_user_from_token(access_token: str):
    # Validates token with Supabase and returns user object or None
    try:
        res = supabase.auth.get_user(access_token)
        return res.user
    except Exception:
        return None
