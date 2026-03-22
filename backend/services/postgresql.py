import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
supabase: Client = create_client(url, os.environ.get("SUPABASE_ANON_KEY"))
supabase_admin: Client = create_client(url, os.environ.get("SUPABASE_SERVICE_KEY"))

'''
from services.supabase_client import supabase

def create_conversation(user_id):

    result = supabase.table("conversations").insert({
        "user_id": user_id,
        "topic": "travel"
    }).execute()

    return result.data

messages = supabase.table("messages") \
.select("*") \
.eq("thread_id", thread_id) \
.execute()

'''