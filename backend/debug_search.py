from dotenv import load_dotenv
load_dotenv()

import httpx

original_send = httpx.Client.send

def patched_send(self, request, *args, **kwargs):
    print("URL:", request.url)
    print("METHOD:", request.method)
    return original_send(self, request, *args, **kwargs)

httpx.Client.send = patched_send

from utils.supabase_client import supabase

try:
    r = supabase.table("colleges").select("id,name,is_active").ilike("name", "%Sai%").execute()
    print("SUCCESS:", r.data)
except Exception as e:
    print("FAILED:", type(e).__name__, str(e)[:300])