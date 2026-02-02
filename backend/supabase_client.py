import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://lurvhgzauuzwftfymjym.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Lazy initialization
_supabase_client: Client = None

def get_supabase_client() -> Client:
    """Get Supabase client instance with lazy initialization"""
    global _supabase_client
    
    if _supabase_client is None:
        key = os.environ.get('SUPABASE_SERVICE_KEY', '')
        if not key:
            raise Exception("Supabase client not initialized. Set SUPABASE_SERVICE_KEY environment variable.")
        
        _supabase_client = create_client(SUPABASE_URL, key)
    
    return _supabase_client
