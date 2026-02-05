import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '') or os.environ.get('SUPABASE_KEY', '')

# Check if Supabase is configured
def is_supabase_configured():
    url = os.environ.get('SUPABASE_URL', '')
    key = os.environ.get('SUPABASE_SERVICE_KEY', '') or os.environ.get('SUPABASE_KEY', '')
    
    if not url or not key:
        return False
    if url == 'your_supabase_url_here' or key == 'your_supabase_service_key_here':
        return False
    if not url.startswith('https://'):
        return False
    return True

# Lazy initialization
_supabase_client: Client = None
_is_configured = None

def get_supabase_client() -> Client:
    """Get Supabase client instance with lazy initialization"""
    global _supabase_client, _is_configured
    
    if _is_configured is None:
        _is_configured = is_supabase_configured()
    
    if not _is_configured:
        return None
    
    if _supabase_client is None:
        url = os.environ.get('SUPABASE_URL', '')
        key = os.environ.get('SUPABASE_SERVICE_KEY', '') or os.environ.get('SUPABASE_KEY', '')
        _supabase_client = create_client(url, key)
    
    return _supabase_client
