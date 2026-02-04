
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
import time
import boto3
from dotenv import load_dotenv
import uuid
from botocore.config import Config

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# AWS Configuration - lazy initialization
_s3_client = None

def get_s3_client():
    """Lazy initialization of S3 client to avoid startup failures"""
    global _s3_client
    if _s3_client is None:
        region = os.environ.get("AWS_REGION", "ap-south-1")
        _s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
            region_name=region,
            endpoint_url=f"https://s3.{region}.amazonaws.com",
            config=Config(signature_version="s3v4"),
        )
    return _s3_client

# Import Supabase authentication
from auth_utils import (
    require_user, 
    require_artist, 
    require_admin,
    require_lead_chitrakar,
    require_kalakar,
    get_current_user
)
from supabase_client import get_supabase_client

app = FastAPI(title="ChitraKalakar API")
security = HTTPBearer()

# CORS configuration
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ MODELS ============

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    categories: Optional[List[str]] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    teaching_rate: Optional[float] = None
    teaches_online: Optional[bool] = None
    teaches_offline: Optional[bool] = None

class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    folder: str

class ArtworkCreate(BaseModel):
    title: str
    category: str
    price: float
    image: Optional[str] = None
    description: Optional[str] = None

class ArtworkApprovalRequest(BaseModel):
    artwork_id: str
    approved: bool

class ExhibitionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    artwork_ids: List[str] = []
    exhibition_type: str = "Kalakanksh"
    voluntary_platform_fee: float = 0

class ExhibitionApprovalRequest(BaseModel):
    exhibition_id: str
    approved: bool

class FeaturedArtistCreate(BaseModel):
    name: str
    bio: str
    avatar: Optional[str] = None
    categories: List[str]
    location: Optional[str] = None
    artworks: List[dict] = []

class FeatureRegisteredArtistRequest(BaseModel):
    artist_id: str
    featured: bool

class ArtClassEnquiryCreate(BaseModel):
    art_type: str
    skill_level: str
    duration: str
    budget_range: str
    class_type: str
    user_location: Optional[str] = None

class RevealContactRequest(BaseModel):
    enquiry_id: str
    artist_id: str

class CreateSubAdminRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str
    location: Optional[str] = None

# ============ HEALTH CHECK ============

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "database": "supabase"}

# ============ PUBLIC ROUTES ============

@app.get("/api/public/stats")
async def get_public_stats():
    """Get platform statistics"""
    supabase = get_supabase_client()
    
    # Get counts
    artists_response = supabase.table('profiles').select('id', count='exact').eq('role', 'artist').eq('is_approved', True).execute()
    artworks_response = supabase.table('artworks').select('id', count='exact').eq('is_approved', True).execute()
    exhibitions_response = supabase.table('exhibitions').select('id', count='exact').eq('is_approved', True).execute()
    
    return {
        "total_artists": artists_response.count or 0,
        "total_artworks": artworks_response.count or 0,
        "active_exhibitions": exhibitions_response.count or 0,
        "satisfaction_rate": 98
    }

@app.get("/api/public/featured-artists")
async def get_featured_artists():
    """Get featured artists (contemporary and registered)"""
    supabase = get_supabase_client()
    
    # Get contemporary featured artists
    contemporary = supabase.table('featured_artists').select('*').eq('type', 'contemporary').eq('is_featured', True).execute()
    
    # Get registered featured artists
    registered = supabase.table('featured_artists').select('*').eq('type', 'registered').eq('is_featured', True).execute()
    
    return {
        "contemporary": contemporary.data or [],
        "registered": registered.data or []
    }

@app.get("/api/public/artists")
async def get_public_artists():
    """Get all approved artists (without contact info for public view)"""
    supabase = get_supabase_client()
    
    # Get all approved and active artists (including avatar)
    artists = supabase.table('profiles').select(
        'id, full_name, bio, categories, location, avatar, created_at'
    ).eq('role', 'artist').eq('is_approved', True).eq('is_active', True).execute()
    
    # Transform full_name to name for frontend compatibility
    artist_list = []
    for artist in (artists.data or []):
        artist_list.append({
            "id": artist.get("id"),
            "name": artist.get("full_name"),
            "bio": artist.get("bio"),
            "categories": artist.get("categories"),
            "location": artist.get("location"),
            "avatar": artist.get("avatar"),
            "created_at": artist.get("created_at")
        })
    
    return {"artists": artist_list}

@app.get("/api/public/artist/{artist_id}")
async def get_public_artist_detail(artist_id: str):
    """Get artist detail with artworks (without contact info)"""
    supabase = get_supabase_client()
    
    # Get artist without contact info
    artist = supabase.table('profiles').select(
        'id, full_name, bio, categories, location, created_at'
    ).eq('id', artist_id).eq('role', 'artist').eq('is_approved', True).single().execute()
    
    if not artist.data:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    # Get artist's approved artworks
    artworks = supabase.table('artworks').select('*').eq('artist_id', artist_id).eq('is_approved', True).order('created_at', desc=True).execute()
    
    return {
        "artist": artist.data,
        "artworks": artworks.data or []
    }

@app.get("/api/public/paintings")
async def get_public_paintings():
    """Get all approved artworks for marketplace (without artist contact info)"""
    supabase = get_supabase_client()
    
    # Get all approved artworks with artist name (but no contact info)
    artworks = supabase.table('artworks').select(
        '*, profiles.inner(id, full_name, avatar, location)'
    ).eq('is_approved', True).order('created_at', desc=True).execute()
    
    return {"paintings": artworks.data or []}

@app.get("/api/public/painting/{painting_id}")
async def get_painting_detail(painting_id: str):
    """Get painting detail with artist info (without contact)"""
    supabase = get_supabase_client()
    
    painting = supabase.table('artworks').select(
        '*, profiles.inner(id, full_name, avatar, location, bio, categories)'
    ).eq('id', painting_id).eq('is_approved', True).single().execute()
    
    if not painting.data:
        raise HTTPException(status_code=404, detail="Painting not found")
    
    # Increment views
    current_views = painting.data.get('views', 0)
    supabase.table('artworks').update({'views': current_views + 1}).eq('id', painting_id).execute()
    
    return {"painting": painting.data}

@app.get("/api/public/featured-artist/{artist_id}")
async def get_featured_artist_detail(artist_id: str):
    """Get detailed info about a featured artist"""
    supabase = get_supabase_client()
    
    artist = supabase.table('featured_artists').select('*').eq('id', artist_id).single().execute()
    
    if not artist.data:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    return {"artist": artist.data}

@app.get("/api/public/exhibitions")
async def get_public_exhibitions():
    """Get all approved exhibitions"""
    supabase = get_supabase_client()
    
    exhibitions = supabase.table('exhibitions').select('*, users(name)').eq('is_approved', True).order('created_at', desc=True).execute()
    
    return {"exhibitions": exhibitions.data or []}

@app.get("/api/public/exhibitions/active")
async def get_active_exhibitions():
    """Get active exhibitions"""
    supabase = get_supabase_client()
    
    exhibitions = supabase.table('exhibitions').select('*, users(name)').eq('is_approved', True).eq('status', 'active').execute()
    
    return {"exhibitions": exhibitions.data or []}

@app.get("/api/public/exhibitions/archived")
async def get_archived_exhibitions():
    """Get archived exhibitions"""
    supabase = get_supabase_client()
    
    exhibitions = supabase.table('exhibitions').select('*, users(name)').eq('is_approved', True).eq('status', 'archived').execute()
    
    return {"exhibitions": exhibitions.data or []}

# ============ ART CLASS ENQUIRY ROUTES ============

@app.post("/api/public/art-class-enquiry")
async def create_art_class_enquiry(enquiry_data: ArtClassEnquiryCreate, user: dict = Depends(require_user)):
    """Submit art class enquiry - one per month per user"""
    supabase = get_supabase_client()
    
    # Check if user already has an active enquiry in the last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    existing = supabase.table('art_class_enquiries').select('id').eq('user_id', user['id']).gte('created_at', thirty_days_ago).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="You can only submit one enquiry per month")
    
    # Find matching artists
    query = supabase.table('profiles').select('*').eq('role', 'artist').eq('is_approved', True).eq('is_active', True).not_.is_('teaching_rate', 'null')
    
    # Filter by class type
    if enquiry_data.class_type == "online":
        query = query.eq('teaches_online', True)
    elif enquiry_data.class_type == "offline":
        query = query.eq('teaches_offline', True)
        if enquiry_data.user_location:
            query = query.ilike('location', f'%{enquiry_data.user_location}%')
    
    # Filter by budget range - different options for online vs offline
    if enquiry_data.class_type == "online":
        # Online classes: only 250-350 and 350-500 (no 500-1000)
        budget_ranges = {
            "250-350": (250, 350),
            "350-500": (350, 500)
        }
        if enquiry_data.budget_range in budget_ranges:
            min_rate, max_rate = budget_ranges[enquiry_data.budget_range]
            query = query.gte('teaching_rate', min_rate).lte('teaching_rate', max_rate)
    elif enquiry_data.class_type == "offline":
        # Offline/In-person classes: all three budget ranges
        budget_ranges = {
            "250-350": (250, 350),
            "350-500": (350, 500),
            "500-1000": (500, 1000)
        }
        if enquiry_data.budget_range in budget_ranges:
            min_rate, max_rate = budget_ranges[enquiry_data.budget_range]
            query = query.gte('teaching_rate', min_rate).lte('teaching_rate', max_rate)
    
    # Filter by art category
    if enquiry_data.art_type:
        query = query.contains('categories', [enquiry_data.art_type])
    
    matching_artists = query.order('teaching_rate').limit(3).execute()
    matched_ids = [artist['id'] for artist in (matching_artists.data or [])]
    
    # Get user info
    user_profile = supabase.table('profiles').select('full_name, email, location').eq('id', user['id']).single().execute()
    
    # Create enquiry
    enquiry = {
        "user_id": user['id'],
        "user_name": user_profile.data.get('name', ''),
        "user_email": user_profile.data.get('email', ''),
        "user_location": enquiry_data.user_location or user_profile.data.get('location', ''),
        "art_type": enquiry_data.art_type,
        "skill_level": enquiry_data.skill_level,
        "duration": enquiry_data.duration,
        "budget_range": enquiry_data.budget_range,
        "class_type": enquiry_data.class_type,
        "status": "matched" if matched_ids else "pending",
        "matched_artists": matched_ids,
        "contacts_revealed": []
    }
    
    result = supabase.table('art_class_enquiries').insert(enquiry).execute()
    
    return {
        "success": True,
        "enquiry_id": result.data[0]['id'],
        "matched_count": len(matched_ids),
        "message": f"Found {len(matched_ids)} matching artist(s)"
    }

@app.get("/api/public/art-class-matches/{enquiry_id}")
async def get_art_class_matches(enquiry_id: str, user: dict = Depends(require_user)):
    """Get matching artists for an enquiry"""
    supabase = get_supabase_client()
    
    enquiry = supabase.table('art_class_enquiries').select('*').eq('id', enquiry_id).eq('user_id', user['id']).single().execute()
    
    if not enquiry.data:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    # Check if expired
    expires_at = datetime.fromisoformat(enquiry.data['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        supabase.table('art_class_enquiries').update({"status": "expired"}).eq('id', enquiry_id).execute()
        raise HTTPException(status_code=400, detail="This enquiry has expired")
    
    # Get matched artists
    matched_artists = []
    for artist_id in (enquiry.data.get('matched_artists') or []):
        artist = supabase.table('profiles').select('*').eq('id', artist_id).single().execute()
        if artist.data:
            # Get sample artworks
            artworks = supabase.table('artworks').select('*').eq('artist_id', artist_id).eq('is_approved', True).order('views', desc=True).limit(3).execute()
            artist.data['sample_artworks'] = artworks.data or []
            
            # Hide contact if not revealed
            if artist_id not in (enquiry.data.get('contacts_revealed') or []):
                artist.data['phone'] = "***HIDDEN***"
            
            matched_artists.append(artist.data)
    
    return {
        "success": True,
        "enquiry": {
            "id": enquiry.data['id'],
            "art_type": enquiry.data['art_type'],
            "skill_level": enquiry.data['skill_level'],
            "class_type": enquiry.data['class_type'],
            "budget_range": enquiry.data.get('budget_range'),
            "contacts_revealed_count": len(enquiry.data.get('contacts_revealed') or []),
            "contacts_remaining": 3 - len(enquiry.data.get('contacts_revealed') or [])
        },
        "artists": matched_artists
    }

@app.post("/api/public/reveal-contact")
async def reveal_artist_contact(request: RevealContactRequest, user: dict = Depends(require_user)):
    """Reveal artist contact - limited to 3 per enquiry"""
    supabase = get_supabase_client()
    
    enquiry = supabase.table('art_class_enquiries').select('*').eq('id', request.enquiry_id).eq('user_id', user['id']).single().execute()
    
    if not enquiry.data:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    contacts_revealed = enquiry.data.get('contacts_revealed') or []
    if len(contacts_revealed) >= 3:
        raise HTTPException(status_code=400, detail="Contact limit reached")
    
    if request.artist_id not in (enquiry.data.get('matched_artists') or []):
        raise HTTPException(status_code=400, detail="Artist not in matched list")
    
    if request.artist_id in contacts_revealed:
        raise HTTPException(status_code=400, detail="Contact already revealed")
    
    # Reveal contact
    contacts_revealed.append(request.artist_id)
    supabase.table('art_class_enquiries').update({"contacts_revealed": contacts_revealed}).eq('id', request.enquiry_id).execute()
    
    # Get artist contact
    artist = supabase.table('profiles').select('phone, email, name').eq('id', request.artist_id).single().execute()
    
    return {
        "success": True,
        "artist": artist.data,
        "contacts_remaining": 2 - len(contacts_revealed) + 1
    }

# ============ USER ROUTES ============

@app.get("/api/user/my-enquiries")
async def get_my_art_class_enquiries(user: dict = Depends(require_user)):
    """Get user's art class enquiries"""
    supabase = get_supabase_client()
    
    enquiries = supabase.table('art_class_enquiries').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
    
    return {"enquiries": enquiries.data or []}

@app.get("/api/user/profile")
async def get_user_profile(user: dict = Depends(require_user)):
    """Get current user profile"""
    supabase = get_supabase_client()
    
    profile = supabase.table('profiles').select('*').eq('id', user['id']).single().execute()
    
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"profile": profile.data}

# ============ ADMIN ROUTES ============

@app.get("/api/admin/dashboard")
async def get_admin_dashboard(admin: dict = Depends(require_admin)):
    """Get admin dashboard statistics"""
    supabase = get_supabase_client()
    
    pending_artists = supabase.table('profiles').select('id', count='exact').eq('role', 'artist').eq('is_approved', False).execute()
    pending_artworks = supabase.table('artworks').select('id', count='exact').eq('is_approved', False).execute()
    pending_exhibitions = supabase.table('exhibitions').select('id', count='exact').eq('is_approved', False).execute()
    total_users = supabase.table('profiles').select('id', count='exact').execute()
    
    return {
        "pending_artists": pending_artists.count or 0,
        "pending_artworks": pending_artworks.count or 0,
        "pending_exhibitions": pending_exhibitions.count or 0,
        "total_users": total_users.count or 0
    }

@app.get("/api/admin/pending-artists")
async def get_pending_artists(admin: dict = Depends(require_admin)):
    """Get artists awaiting approval"""
    supabase = get_supabase_client()
    
    artists = supabase.table('profiles').select('*').eq('role', 'artist').eq('is_approved', False).execute()
    
    return {"artists": artists.data or []}

@app.post("/api/admin/approve-artist")
async def approve_artist(artist_id: str, approved: bool, admin: dict = Depends(require_admin)):
    """Approve or reject an artist"""
    supabase = get_supabase_client()
    
    if approved:
        result = supabase.table('profiles').update({"is_approved": True, "is_active": True}).eq('id', artist_id).execute()
    else:
        result = supabase.table('profiles').delete().eq('id', artist_id).execute()
    
    return {"success": True, "message": f"Artist {'approved' if approved else 'rejected'}"}

@app.get("/api/admin/pending-artworks")
async def get_pending_artworks(admin: dict = Depends(require_admin)):
    """Get artworks awaiting approval"""
    supabase = get_supabase_client()
    
    artworks = supabase.table('artworks').select('*, users(name)').eq('is_approved', False).execute()
    
    return {"artworks": artworks.data or []}

@app.post("/api/admin/approve-artwork")
async def approve_artwork(request: ArtworkApprovalRequest, admin: dict = Depends(require_admin)):
    """Approve or reject an artwork"""
    supabase = get_supabase_client()
    
    if request.approved:
        result = supabase.table('artworks').update({"is_approved": True}).eq('id', request.artwork_id).execute()
    else:
        result = supabase.table('artworks').delete().eq('id', request.artwork_id).execute()
    
    return {"success": True, "message": f"Artwork {'approved' if request.approved else 'rejected'}"}

@app.get("/api/admin/pending-exhibitions")
async def get_pending_exhibitions(admin: dict = Depends(require_admin)):
    """Get exhibitions awaiting approval"""
    supabase = get_supabase_client()
    
    exhibitions = supabase.table('exhibitions').select('*, users(name)').eq('is_approved', False).execute()
    
    return {"exhibitions": exhibitions.data or []}

@app.post("/api/admin/approve-exhibition")
async def approve_exhibition(request: ExhibitionApprovalRequest, admin: dict = Depends(require_admin)):
    """Approve or reject an exhibition"""
    supabase = get_supabase_client()
    
    if request.approved:
        result = supabase.table('exhibitions').update({"is_approved": True, "status": "active"}).eq('id', request.exhibition_id).execute()
    else:
        result = supabase.table('exhibitions').delete().eq('id', request.exhibition_id).execute()
    
    return {"success": True, "message": f"Exhibition {'approved' if request.approved else 'rejected'}"}

@app.get("/api/admin/all-users")
async def get_all_users(admin: dict = Depends(require_admin)):
    """Get all users"""
    supabase = get_supabase_client()
    
    users = supabase.table('profiles').select('*').execute()
    
    return {"users": users.data or []}

@app.get("/api/admin/approved-artists")
async def get_approved_artists(admin: dict = Depends(require_admin)):
    """Get approved artists for featuring"""
    supabase = get_supabase_client()
    
    artists = supabase.table('profiles').select('*').eq('role', 'artist').eq('is_approved', True).execute()
    
    return {"artists": artists.data or []}

@app.post("/api/admin/feature-contemporary-artist")
async def feature_contemporary_artist(artist_data: FeaturedArtistCreate, admin: dict = Depends(require_admin)):
    """Add a contemporary featured artist"""
    supabase = get_supabase_client()
    
    featured_artist = {
        "name": artist_data.full_name,
        "bio": artist_data.bio,
        "avatar": artist_data.avatar,
        "categories": artist_data.categories,
        "location": artist_data.location,
        "artworks": artist_data.artworks,
        "type": "contemporary",
        "is_featured": True
    }
    
    result = supabase.table('featured_artists').insert(featured_artist).execute()
    
    return {"success": True, "artist": result.data[0]}

@app.delete("/api/admin/feature-contemporary-artist/{artist_id}")
async def delete_contemporary_artist(artist_id: str, admin: dict = Depends(require_admin)):
    """Remove a contemporary featured artist"""
    supabase = get_supabase_client()
    
    result = supabase.table('featured_artists').delete().eq('id', artist_id).execute()
    
    return {"success": True, "message": "Featured artist removed"}

@app.post("/api/admin/feature-registered-artist")
async def feature_registered_artist(request: FeatureRegisteredArtistRequest, admin: dict = Depends(require_admin)):
    """Feature or unfeature a registered artist"""
    supabase = get_supabase_client()
    
    if request.featured:
        # Get artist details
        artist = supabase.table('profiles').select('*').eq('id', request.artist_id).single().execute()
        
        if not artist.data:
            raise HTTPException(status_code=404, detail="Artist not found")
        
        # Get artist's artworks
        artworks = supabase.table('artworks').select('*').eq('artist_id', request.artist_id).eq('is_approved', True).order('views', desc=True).limit(10).execute()
        
        # Create featured entry
        featured_artist = {
            "full_name": artist.data['full_name'],
            "bio": artist.data.get('bio', ''),
            "avatar": artist.data.get('avatar'),
            "categories": artist.data.get('categories', []),
            "location": artist.data.get('location'),
            "artworks": artworks.data or [],
            "type": "registered",
            "artist_id": request.artist_id,
            "is_featured": True
        }
        
        result = supabase.table('featured_artists').insert(featured_artist).execute()
    else:
        # Remove from featured
        result = supabase.table('featured_artists').delete().eq('artist_id', request.artist_id).execute()
    
    return {"success": True, "message": f"Artist {'featured' if request.featured else 'unfeatured'}"}

@app.post("/api/admin/create-sub-admin")
async def create_sub_admin(request: CreateSubAdminRequest, admin: dict = Depends(require_admin)):
    """Admin can create sub-admin users"""
    # Note: This would need to create a Supabase Auth user
    # For now, return instruction to create via Supabase dashboard
    raise HTTPException(status_code=501, detail="Please create sub-admin users via Supabase Auth dashboard and update their role in the users table")

@app.get("/api/admin/sub-admins")
async def get_sub_admins(admin: dict = Depends(require_admin)):
    """Get all sub-admin users"""
    supabase = get_supabase_client()
    
    sub_admins = supabase.table('profiles').select('*').in_('role', ['lead_chitrakar', 'kalakar']).execute()
    
    return {"sub_admins": sub_admins.data or []}

# ============ LEAD CHITRAKAR ROUTES ============

@app.post("/api/admin/lead-chitrakar/approve-artwork")
async def lead_chitrakar_approve_artwork(request: ArtworkApprovalRequest, user: dict = Depends(require_lead_chitrakar)):
    """Lead Chitrakar can approve artworks"""
    supabase = get_supabase_client()
    
    if request.approved:
        result = supabase.table('artworks').update({"is_approved": True}).eq('id', request.artwork_id).execute()
    else:
        result = supabase.table('artworks').delete().eq('id', request.artwork_id).execute()
    
    return {"success": True, "message": f"Artwork {'approved' if request.approved else 'rejected'}"}

# ============ KALAKAR ROUTES ============

@app.get("/api/admin/kalakar/exhibitions-analytics")
async def kalakar_exhibitions_analytics(user: dict = Depends(require_kalakar)):
    """Kalakar can view exhibition analytics"""
    supabase = get_supabase_client()
    
    total = supabase.table('exhibitions').select('id', count='exact').execute()
    active = supabase.table('exhibitions').select('id', count='exact').eq('status', 'active').execute()
    archived = supabase.table('exhibitions').select('id', count='exact').eq('status', 'archived').execute()
    
    # Get revenue
    exhibitions = supabase.table('exhibitions').select('fees, voluntary_platform_fee').execute()
    total_revenue = sum(e.get('fees', 0) for e in (exhibitions.data or []))
    voluntary_fees = sum(e.get('voluntary_platform_fee', 0) for e in (exhibitions.data or []))
    
    return {
        "total_exhibitions": total.count or 0,
        "active_exhibitions": active.count or 0,
        "archived_exhibitions": archived.count or 0,
        "total_revenue": total_revenue,
        "voluntary_platform_fees": voluntary_fees
    }

@app.get("/api/admin/kalakar/payment-records")
async def kalakar_payment_records(user: dict = Depends(require_kalakar)):
    """Kalakar can view payment records"""
    supabase = get_supabase_client()
    
    exhibitions = supabase.table('exhibitions').select('*, users(name)').eq('is_approved', True).order('created_at', desc=True).execute()
    
    return {"payment_records": exhibitions.data or []}

# ============ ARTIST ROUTES ============

@app.get("/api/artist/profile")
async def get_artist_profile(artist: dict = Depends(require_artist)):
    """Get artist profile"""
    supabase = get_supabase_client()
    
    profile = supabase.table('profiles').select('*').eq('id', artist['id']).single().execute()
    
    return {"profile": profile.data}

@app.put("/api/auth/profile")
async def update_profile(
    updates: ProfileUpdateRequest,
    user: dict = Depends(require_user)
):
    try:
        supabase = get_supabase_client()

        update_data = updates.model_dump(exclude_unset=True)

        if not update_data:
            return {"success": True}

        supabase.table('profiles') \
            .update(update_data) \
            .eq('id', user['id']) \
            .execute()

        updated_user = supabase.table('profiles') \
            .select('*') \
            .eq('id', user['id']) \
            .single() \
            .execute()

        return {"success": True, "user": updated_user.data}
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/artist/artworks")
async def get_artist_artworks(artist: dict = Depends(require_artist)):
    """Get artist's artworks"""
    try:
        supabase = get_supabase_client()
        artworks = supabase.table('artworks').select('*').eq('artist_id', artist['id']).execute()
        return {"artworks": artworks.data or []}
    except Exception as e:
        print(f"Error fetching artworks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/artist/portfolio")
@app.post("/api/artist/artworks")
async def create_artwork(
    artwork: ArtworkCreate,
    artist: dict = Depends(require_artist),
):
    try:
        supabase = get_supabase_client()

        if not artist or "id" not in artist:
            raise HTTPException(status_code=401, detail="Invalid artist")

        print("ARTWORK PAYLOAD:", artwork.dict())
        
        artwork_data = {
             "artist_id": artist["id"],
             "title": artwork.title,
             "description": artwork.description or "",
             "category": artwork.category,
             "price": float(artwork.price),
             "image": artwork.image if artwork.image else None,
             "is_approved": False,
             "is_available": True,
             "views": 0,
        } 

        result = supabase.table("artworks").insert(artwork_data).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Insert failed - no data returned")

        return {"success": True, "artwork": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print("CREATE ARTWORK ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/artist/dashboard")
async def get_artist_dashboard(artist: dict = Depends(require_artist)):
    supabase = get_supabase_client()

    artworks = supabase.table("artworks") \
        .select("id", count="exact") \
        .eq("artist_id", artist["id"]) \
        .execute()

    orders = supabase.table("orders") \
        .select("id", count="exact") \
        .eq("artist_id", artist["id"]) \
        .execute()

    views = supabase.table("artworks") \
        .select("views") \
        .eq("artist_id", artist["id"]) \
        .execute()

    total_views = sum(a.get("views", 0) for a in (views.data or []))

    return {
        "total_artworks": artworks.count or 0,
        "completed_orders": orders.count or 0,
        "portfolio_views": total_views,
        "total_earnings": 0
    }

@app.get("/api/artist/orders")
async def get_artist_orders(artist: dict = Depends(require_artist)):
    supabase = get_supabase_client()

    orders = supabase.table("orders") \
        .select("*") \
        .eq("artist_id", artist["id"]) \
        .order("created_at", desc=True) \
        .execute()

    return {"orders": orders.data or []}

@app.delete("/api/artist/artworks/{artwork_id}")
async def delete_artist_artwork(artwork_id: str, artist: dict = Depends(require_artist)):
    """Delete artist's own artwork"""
    supabase = get_supabase_client()
    
    # Verify artwork belongs to artist
    artwork = supabase.table('artworks').select('id').eq('id', artwork_id).eq('artist_id', artist['id']).single().execute()
    
    if not artwork.data:
        raise HTTPException(status_code=404, detail="Artwork not found or not owned by you")
    
    supabase.table('artworks').delete().eq('id', artwork_id).execute()
    
    return {"success": True, "message": "Artwork deleted successfully"}

@app.get("/api/artist/exhibitions")
async def get_artist_exhibitions(artist: dict = Depends(require_artist)):
    """Get artist's exhibitions"""
    supabase = get_supabase_client()
    
    exhibitions = supabase.table('exhibitions').select('*').eq('artist_id', artist['id']).execute()
    
    return {"exhibitions": exhibitions.data or []}

@app.post("/api/artist/exhibitions")
async def create_exhibition(exhibition: ExhibitionCreate, artist: dict = Depends(require_artist)):
    """Create new exhibition"""
    supabase = get_supabase_client()
    
    # Exhibition pricing config
    exhibition_config = {
        "Kalakanksh": {"base_fee": 1000, "days": 3, "max_base_artworks": 10, "max_total_artworks": 15, "extra_artwork_fee": 100},
        "Kalahruday": {"base_fee": 2000, "days": 5, "max_base_artworks": 20, "max_total_artworks": 20, "extra_artwork_fee": 0},
        "KalaDeeksh": {"base_fee": 3000, "days": 10, "max_base_artworks": 30, "max_total_artworks": 30, "extra_artwork_fee": 0}
    }
    
    config = exhibition_config.get(exhibition.exhibition_type, exhibition_config["Kalakanksh"])
    num_artworks = len(exhibition.artwork_ids)
    
    if num_artworks > config["max_total_artworks"]:
        raise HTTPException(status_code=400, detail=f"{exhibition.exhibition_type} allows maximum {config['max_total_artworks']} artworks")
    
    additional_artworks = 0
    additional_artwork_fee = 0
    if exhibition.exhibition_type == "Kalakanksh" and num_artworks > config["max_base_artworks"]:
        additional_artworks = num_artworks - config["max_base_artworks"]
        additional_artwork_fee = additional_artworks * config["extra_artwork_fee"]
    
    total_fees = config["base_fee"] + additional_artwork_fee
    
    exhibition_data = {
        "artist_id": artist['id'],
        "name": exhibition.name,
        "description": exhibition.description,
        "start_date": exhibition.start_date,
        "end_date": exhibition.end_date,
        "artwork_ids": exhibition.artwork_ids,
        "status": "upcoming",
        "views": 0,
        "exhibition_type": exhibition.exhibition_type,
        "fees": total_fees,
        "days_paid": config["days"],
        "max_artworks": config["max_base_artworks"],
        "additional_artworks": additional_artworks,
        "additional_artwork_fee": additional_artwork_fee,
        "voluntary_platform_fee": exhibition.voluntary_platform_fee,
        "is_approved": False
    }
    
    result = supabase.table('exhibitions').insert(exhibition_data).execute()
    
    return {"success": True, "exhibition": result.data[0], "message": f"Exhibition submitted. Total fee: ₹{total_fees}"}

@app.post("/api/upload-url")
async def get_upload_url(
    body: UploadUrlRequest,
    user: dict = Depends(require_user)
):
    try:
        s3 = get_s3_client()
        region = os.environ.get("AWS_REGION", "ap-south-1")
        
        ext = body.filename.split('.')[-1]
        key = f"{body.folder}/{user['id']}/{uuid.uuid4()}.{ext}"

        bucket_name = os.environ.get("AWS_S3_BUCKET") or os.environ.get("AWS_BUCKET_NAME")
        
        if not bucket_name:
            raise HTTPException(status_code=500, detail="AWS_S3_BUCKET not configured")
        
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": bucket_name,
                "Key": key,
                "ContentType": body.content_type,
            },
            ExpiresIn=300,
        )

        public_url = (
            f"https://{bucket_name}"
            f".s3.{region}.amazonaws.com/{key}"
        )

        return {
            "uploadUrl": upload_url,
            "publicUrl": public_url,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("UPLOAD URL ERROR:", e)
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
