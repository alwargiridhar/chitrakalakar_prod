
from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
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
import json
import asyncio
import hashlib
import hmac

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

# Razorpay Configuration - lazy initialization
_razorpay_client = None

def get_razorpay_client():
    """Lazy initialization of Razorpay client"""
    global _razorpay_client
    if _razorpay_client is None:
        try:
            import razorpay
            key_id = os.environ.get("RAZORPAY_KEY_ID")
            key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
            if key_id and key_secret:
                _razorpay_client = razorpay.Client(auth=(key_id, key_secret))
        except Exception as e:
            print(f"Razorpay init error: {e}")
    return _razorpay_client

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
    country: Optional[str] = None

class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    folder: str

class ArtworkCreate(BaseModel):
    # Basic Artwork Information (Required)
    title: str
    category: str  # Subject Category (Nature / Portrait / Spiritual / Modern / etc.)
    price: float
    images: Optional[List[str]] = None  # Support multiple images (up to 8)
    image: Optional[str] = None  # Legacy single image support
    description: Optional[str] = None
    
    # Basic Info
    year_of_creation: Optional[int] = None
    medium: Optional[str] = None  # Oil / Acrylic / Watercolor / Mixed Media / Digital / Other
    surface: Optional[str] = None  # Canvas / Paper / Wood / Metal / Other
    dimensions: Optional[dict] = None  # {"height": float, "width": float, "depth": float, "unit": "cm/inches"}
    orientation: Optional[str] = None  # Portrait / Landscape / Square
    style: Optional[str] = None  # Abstract / Realism / Contemporary / Traditional / etc.
    
    # Authenticity & Certification
    artwork_type: Optional[str] = None  # Original / Limited Edition / Open Edition
    edition_number: Optional[str] = None  # e.g., "3 of 25"
    total_edition_size: Optional[int] = None
    certificate_of_authenticity: Optional[bool] = False
    signed_by_artist: Optional[str] = None  # None / Front / Back / Both
    date_signed: Optional[str] = None
    hand_embellished: Optional[bool] = False
    artist_stamp: Optional[bool] = False
    
    # Condition Details
    condition: Optional[str] = None  # Brand New / Excellent / Minor Imperfections / Restored
    condition_notes: Optional[str] = None
    restoration_history: Optional[str] = None
    
    # Framing & Presentation
    framing_status: Optional[str] = None  # Unframed / Framed / Gallery Wrapped / Ready to Hang
    frame_material: Optional[str] = None
    frame_included_in_price: Optional[bool] = True
    
    # Pricing & Availability
    price_type: Optional[str] = None  # Fixed / Negotiable / Auction
    currency: Optional[str] = "INR"
    quantity_available: Optional[int] = 1
    international_shipping: Optional[bool] = False
    
    # Shipping Details
    ships_rolled: Optional[bool] = False
    ships_stretched: Optional[bool] = False
    ships_framed: Optional[bool] = False
    insured_shipping: Optional[bool] = False
    dispatch_time: Optional[str] = None  # Estimated dispatch time
    
    # Ownership & Usage Rights
    ownership_type: Optional[str] = None  # Physical Only / Commercial Rights / Reproduction Rights / Copyright Transfer
    
    # Story & Context
    inspiration: Optional[str] = None
    technique_explanation: Optional[str] = None
    artist_statement: Optional[str] = None
    exhibition_history: Optional[str] = None
    awards_recognition: Optional[str] = None
    
    # Investment / Value Signals
    previously_exhibited: Optional[bool] = False
    featured_in_publication: Optional[bool] = False
    sold_similar_works: Optional[bool] = False
    part_of_series: Optional[bool] = False
    series_name: Optional[str] = None
    collector_interest: Optional[bool] = False

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

# New Models for added features
class MembershipPlanRequest(BaseModel):
    plan_type: str  # 'monthly' or 'annual'

class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class OrderCreate(BaseModel):
    artwork_id: str
    shipping_address: str
    phone: str

class AWBUpdateRequest(BaseModel):
    order_id: str
    awb_number: str
    courier_partner: str
    tracking_url: Optional[str] = None

class CommunityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None

class VideoScreeningRequest(BaseModel):
    painting_id: str
    preferred_date: Optional[str] = None
    message: Optional[str] = None

class ProfileModificationRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    categories: Optional[List[str]] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None

class PushToMarketplaceRequest(BaseModel):
    artwork_ids: List[str]

class CartItemRequest(BaseModel):
    artwork_id: str
    quantity: int = 1

# ============ HEALTH CHECK ============

@app.get("/api/health")
async def health_check():
    supabase = get_supabase_client()
    db_status = "connected" if supabase else "not_configured"
    return {"status": "healthy", "database": db_status}

# ============ LOCATION SERVICES ============

@app.get("/api/locations/search")
async def search_locations(q: str, country: Optional[str] = None):
    """Search locations using OpenStreetMap Nominatim API"""
    import httpx
    
    if len(q) < 2:
        return {"locations": []}
    
    try:
        params = {
            "q": q,
            "format": "json",
            "addressdetails": 1,
            "limit": 10
        }
        
        if country:
            params["countrycodes"] = country.lower()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                headers={"User-Agent": "ChitraKalakar/1.0"}
            )
            data = response.json()
        
        locations = []
        for item in data:
            address = item.get("address", {})
            locations.append({
                "display_name": item.get("display_name"),
                "city": address.get("city") or address.get("town") or address.get("village"),
                "state": address.get("state"),
                "country": address.get("country"),
                "country_code": address.get("country_code", "").upper(),
                "lat": item.get("lat"),
                "lon": item.get("lon")
            })
        
        return {"locations": locations}
    except Exception as e:
        print(f"Location search error: {e}")
        return {"locations": []}

# ============ PUBLIC ROUTES ============

@app.get("/api/public/stats")
async def get_public_stats():
    """Get platform statistics"""
    supabase = get_supabase_client()
    
    if not supabase:
        # Return demo data when Supabase is not configured
        return {
            "total_artists": 0,
            "total_artworks": 0,
            "active_exhibitions": 0,
            "satisfaction_rate": 98
        }
    
    try:
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
    except Exception as e:
        print(f"Stats error: {e}")
        return {
            "total_artists": 0,
            "total_artworks": 0,
            "active_exhibitions": 0,
            "satisfaction_rate": 98
        }

@app.get("/api/public/featured-artists")
async def get_featured_artists():
    """Get featured artists (contemporary and registered with membership)"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"contemporary": [], "registered": []}
    
    try:
        # Get contemporary featured artists
        contemporary = supabase.table('featured_artists').select('*').eq('type', 'contemporary').eq('is_featured', True).execute()
        
        # Get registered featured artists (only those with active membership)
        registered_query = supabase.table('featured_artists').select('*, profiles!artist_id(is_member, membership_expiry)').eq('type', 'registered').eq('is_featured', True).execute()
        
        # Filter registered artists to only include those with active membership
        registered_with_membership = []
        now = datetime.now(timezone.utc)
        for artist in (registered_query.data or []):
            profile = artist.get('profiles', {})
            if profile and profile.get('is_member'):
                expiry = profile.get('membership_expiry')
                if expiry:
                    try:
                        expiry_date = datetime.fromisoformat(expiry.replace('Z', '+00:00'))
                        if expiry_date > now:
                            registered_with_membership.append(artist)
                    except:
                        pass
        
        return {
            "contemporary": contemporary.data or [],
            "registered": registered_with_membership
        }
    except Exception as e:
        print(f"Featured artists error: {e}")
        return {"contemporary": [], "registered": []}

@app.get("/api/public/artists")
async def get_public_artists():
    """Get all approved artists (without contact info for public view)"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"artists": []}
    
    try:
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
    except Exception as e:
        print(f"Artists error: {e}")
        return {"artists": []}

@app.get("/api/public/artist/{artist_id}")
async def get_public_artist_detail(artist_id: str):
    """Get artist detail with artworks (without contact info)"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Get artist without contact info
        artist = supabase.table('profiles').select(
            'id, full_name, bio, categories, location, avatar, created_at'
        ).eq('id', artist_id).eq('role', 'artist').eq('is_approved', True).single().execute()
        
        if not artist.data:
            raise HTTPException(status_code=404, detail="Artist not found")
        
        # Get artist's approved artworks
        artworks = supabase.table('artworks').select('*').eq('artist_id', artist_id).eq('is_approved', True).eq('in_marketplace', True).order('created_at', desc=True).execute()
        
        return {
            "artist": artist.data,
            "artworks": artworks.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Artist detail error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching artist")

@app.get("/api/public/paintings")
async def get_public_paintings():
    """Get all approved artworks for marketplace (without artist contact info)"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"paintings": []}
    
    try:
        # Get all approved artworks that are in marketplace with artist name (but no contact info)
        artworks = supabase.table('artworks').select(
            '*, profiles!inner(id, full_name, avatar, location)'
        ).eq('is_approved', True).eq('in_marketplace', True).eq('is_available', True).order('created_at', desc=True).execute()
        
        return {"paintings": artworks.data or []}
    except Exception as e:
        print(f"Paintings error: {e}")
        return {"paintings": []}

@app.get("/api/public/painting/{painting_id}")
async def get_painting_detail(painting_id: str):
    """Get painting detail with artist info (without contact)"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        painting = supabase.table('artworks').select(
            '*, profiles!inner(id, full_name, avatar, location, bio, categories)'
        ).eq('id', painting_id).single().execute()
        
        if not painting.data:
            raise HTTPException(status_code=404, detail="Painting not found")
        
        # Increment views
        current_views = painting.data.get('views', 0)
        supabase.table('artworks').update({'views': current_views + 1}).eq('id', painting_id).execute()
        
        return {"painting": painting.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Painting detail error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching painting")

@app.get("/api/public/featured-artist/{artist_id}")
async def get_featured_artist_detail(artist_id: str):
    """Get detailed info about a featured artist"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        artist = supabase.table('featured_artists').select('*').eq('id', artist_id).single().execute()
        
        if not artist.data:
            raise HTTPException(status_code=404, detail="Artist not found")
        
        return {"artist": artist.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Featured artist detail error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching artist")

@app.get("/api/public/exhibitions")
async def get_public_exhibitions():
    """Get all approved exhibitions"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"exhibitions": []}
    
    try:
        exhibitions = supabase.table('exhibitions').select('*').eq('is_approved', True).order('created_at', desc=True).execute()
        return {"exhibitions": exhibitions.data or []}
    except Exception as e:
        print(f"Exhibitions error: {e}")
        return {"exhibitions": []}

@app.get("/api/public/exhibitions/active")
async def get_active_exhibitions():
    """Get active exhibitions"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"exhibitions": []}
    
    try:
        exhibitions = supabase.table('exhibitions').select('*').eq('is_approved', True).eq('status', 'active').execute()
        return {"exhibitions": exhibitions.data or []}
    except Exception as e:
        print(f"Active exhibitions error: {e}")
        return {"exhibitions": []}

@app.get("/api/public/exhibitions/archived")
async def get_archived_exhibitions():
    """Get archived exhibitions"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"exhibitions": []}
    
    try:
        exhibitions = supabase.table('exhibitions').select('*').eq('is_approved', True).eq('status', 'archived').execute()
        return {"exhibitions": exhibitions.data or []}
    except Exception as e:
        print(f"Archived exhibitions error: {e}")
        return {"exhibitions": []}

# ============ COMMUNITIES ============

@app.get("/api/public/communities")
async def get_public_communities():
    """Get all approved communities"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"communities": []}
    
    try:
        communities = supabase.table('communities').select('*, profiles!creator_id(full_name, avatar)').eq('is_approved', True).order('created_at', desc=True).execute()
        return {"communities": communities.data or []}
    except Exception as e:
        print(f"Communities error: {e}")
        return {"communities": []}

@app.get("/api/public/community/{community_id}")
async def get_community_detail(community_id: str):
    """Get community details with members"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        community = supabase.table('communities').select('*').eq('id', community_id).eq('is_approved', True).single().execute()
        
        if not community.data:
            raise HTTPException(status_code=404, detail="Community not found")
        
        # Get members
        members = supabase.table('community_members').select('*, profiles!user_id(id, full_name, avatar, location)').eq('community_id', community_id).execute()
        
        return {
            "community": community.data,
            "members": members.data or [],
            "member_count": len(members.data or [])
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Community detail error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching community")

@app.post("/api/communities")
async def create_community(data: CommunityCreate, user: dict = Depends(require_artist)):
    """Create a new community (requires artist role)"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    community_data = {
        "name": data.name,
        "description": data.description,
        "location": data.location,
        "creator_id": user['id'],
        "is_approved": False,  # Requires admin approval
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table('communities').insert(community_data).execute()
    
    return {"success": True, "community": result.data[0], "message": "Community created and pending admin approval"}

@app.post("/api/communities/{community_id}/join")
async def join_community(community_id: str, user: dict = Depends(require_user)):
    """Join a community"""
    supabase = get_supabase_client()
    
    # Check if community exists and is approved
    community = supabase.table('communities').select('id').eq('id', community_id).eq('is_approved', True).single().execute()
    if not community.data:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Check if already a member
    existing = supabase.table('community_members').select('id').eq('community_id', community_id).eq('user_id', user['id']).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member of this community")
    
    # Join community
    member_data = {
        "community_id": community_id,
        "user_id": user['id'],
        "joined_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table('community_members').insert(member_data).execute()
    
    return {"success": True, "message": "Joined community successfully"}

@app.post("/api/communities/{community_id}/leave")
async def leave_community(community_id: str, user: dict = Depends(require_user)):
    """Leave a community"""
    supabase = get_supabase_client()
    
    result = supabase.table('community_members').delete().eq('community_id', community_id).eq('user_id', user['id']).execute()
    
    return {"success": True, "message": "Left community successfully"}

# ============ CHATBOT (CHITRAKAR) ============

@app.post("/api/chat/message")
async def chat_with_chitrakar(data: ChatMessageRequest, user: dict = Depends(require_user)):
    """Send message to Chitrakar chatbot"""
    supabase = get_supabase_client()
    
    session_id = data.session_id or f"chat_{user['id']}_{int(time.time())}"
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Initialize chat with system message
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=session_id,
            system_message="""You are Chitrakar, a helpful assistant for ChitraKalakar - an Indian art marketplace platform.
            You help users with:
            - Finding artists and artworks
            - Understanding art categories and styles
            - Explaining the platform features
            - Answering questions about art classes
            - Guiding users through purchases and orders
            - Explaining membership benefits for artists
            
            Be friendly, helpful, and knowledgeable about Indian art. If you don't know something specific about a user's order or account, 
            politely let them know that an admin will respond within 24 hours. Keep responses concise but helpful."""
        )
        
        chat.with_model("openai", "gpt-4o-mini")
        
        # Create message
        user_message = UserMessage(text=data.message)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Store in database for admin review
        chat_data = {
            "session_id": session_id,
            "user_id": user['id'],
            "user_message": data.message,
            "bot_response": response,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "needs_admin_review": False
        }
        
        # Check if bot couldn't answer - mark for admin review
        if any(phrase in response.lower() for phrase in ["i don't know", "admin will", "cannot help", "contact support"]):
            chat_data["needs_admin_review"] = True
        
        supabase.table('chat_messages').insert(chat_data).execute()
        
        return {
            "success": True,
            "response": response,
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"Chat error: {e}")
        # Fallback response and store for admin
        fallback_response = "Thank you for your message! Our team will review and respond within 24 hours. In the meantime, feel free to browse our artists and artworks."
        
        chat_data = {
            "session_id": session_id,
            "user_id": user['id'],
            "user_message": data.message,
            "bot_response": fallback_response,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "needs_admin_review": True
        }
        
        try:
            supabase.table('chat_messages').insert(chat_data).execute()
        except:
            pass
        
        return {
            "success": True,
            "response": fallback_response,
            "session_id": session_id
        }

@app.get("/api/chat/history")
async def get_chat_history(user: dict = Depends(require_user)):
    """Get user's chat history"""
    supabase = get_supabase_client()
    
    messages = supabase.table('chat_messages').select('*').eq('user_id', user['id']).order('created_at', desc=True).limit(50).execute()
    
    return {"messages": messages.data or []}

# ============ MEMBERSHIP/SUBSCRIPTION ============

MEMBERSHIP_PLANS = {
    "monthly": {
        "name": "Monthly Membership",
        "base_price": 99,
        "gst_rate": 0.18,
        "duration_days": 30
    },
    "annual": {
        "name": "Annual Membership",
        "base_price": 999,
        "gst_rate": 0.18,
        "duration_days": 365
    }
}

@app.get("/api/membership/plans")
async def get_membership_plans():
    """Get available membership plans"""
    plans = []
    for plan_id, plan in MEMBERSHIP_PLANS.items():
        gst_amount = plan["base_price"] * plan["gst_rate"]
        total_price = plan["base_price"] + gst_amount
        plans.append({
            "id": plan_id,
            "name": plan["name"],
            "base_price": plan["base_price"],
            "gst_rate": plan["gst_rate"] * 100,
            "gst_amount": round(gst_amount, 2),
            "total_price": round(total_price, 2),
            "duration_days": plan["duration_days"]
        })
    return {"plans": plans}

@app.post("/api/membership/create-order")
async def create_membership_order(data: MembershipPlanRequest, user: dict = Depends(require_artist)):
    """Create Razorpay order for membership"""
    
    if data.plan_type not in MEMBERSHIP_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    plan = MEMBERSHIP_PLANS[data.plan_type]
    gst_amount = plan["base_price"] * plan["gst_rate"]
    total_price = plan["base_price"] + gst_amount
    amount_in_paise = int(total_price * 100)
    
    razorpay_client = get_razorpay_client()
    
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    try:
        order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "user_id": user['id'],
                "plan_type": data.plan_type
            }
        })
        
        # Store order in database
        supabase = get_supabase_client()
        order_data = {
            "razorpay_order_id": order['id'],
            "user_id": user['id'],
            "plan_type": data.plan_type,
            "amount": total_price,
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table('membership_orders').insert(order_data).execute()
        
        return {
            "success": True,
            "order_id": order['id'],
            "amount": amount_in_paise,
            "currency": "INR",
            "key_id": os.environ.get("RAZORPAY_KEY_ID")
        }
    except Exception as e:
        print(f"Razorpay order error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@app.post("/api/membership/verify-payment")
async def verify_membership_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    user: dict = Depends(require_artist)
):
    """Verify Razorpay payment and activate membership"""
    
    razorpay_client = get_razorpay_client()
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Get order details
        supabase = get_supabase_client()
        order = supabase.table('membership_orders').select('*').eq('razorpay_order_id', razorpay_order_id).eq('user_id', user['id']).single().execute()
        
        if not order.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        plan = MEMBERSHIP_PLANS[order.data['plan_type']]
        expiry_date = datetime.now(timezone.utc) + timedelta(days=plan['duration_days'])
        
        # Update order status
        supabase.table('membership_orders').update({
            "status": "completed",
            "razorpay_payment_id": razorpay_payment_id,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }).eq('razorpay_order_id', razorpay_order_id).execute()
        
        # Activate membership
        supabase.table('profiles').update({
            "is_member": True,
            "membership_type": order.data['plan_type'],
            "membership_expiry": expiry_date.isoformat()
        }).eq('id', user['id']).execute()
        
        return {
            "success": True,
            "message": "Membership activated successfully",
            "expiry_date": expiry_date.isoformat()
        }
        
    except Exception as e:
        print(f"Payment verification error: {e}")
        raise HTTPException(status_code=400, detail="Payment verification failed")

@app.get("/api/membership/status")
async def get_membership_status(user: dict = Depends(require_artist)):
    """Get current membership status"""
    supabase = get_supabase_client()
    
    profile = supabase.table('profiles').select('is_member, membership_type, membership_expiry').eq('id', user['id']).single().execute()
    
    if not profile.data:
        return {"is_member": False}
    
    is_active = False
    if profile.data.get('membership_expiry'):
        expiry = datetime.fromisoformat(profile.data['membership_expiry'].replace('Z', '+00:00'))
        is_active = expiry > datetime.now(timezone.utc)
    
    return {
        "is_member": profile.data.get('is_member', False) and is_active,
        "membership_type": profile.data.get('membership_type'),
        "membership_expiry": profile.data.get('membership_expiry'),
        "is_active": is_active
    }

# ============ VIDEO SCREENING ============

@app.post("/api/video-screening/request")
async def request_video_screening(data: VideoScreeningRequest, user: dict = Depends(require_user)):
    """Request video screening for a painting"""
    supabase = get_supabase_client()
    
    # Check if painting exists
    painting = supabase.table('artworks').select('id, title, artist_id').eq('id', data.painting_id).single().execute()
    if not painting.data:
        raise HTTPException(status_code=404, detail="Painting not found")
    
    screening_data = {
        "painting_id": data.painting_id,
        "user_id": user['id'],
        "artist_id": painting.data['artist_id'],
        "preferred_date": data.preferred_date,
        "message": data.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table('video_screenings').insert(screening_data).execute()
    
    return {"success": True, "screening_id": result.data[0]['id'], "message": "Video screening request submitted. Admin will accommodate your request."}

@app.get("/api/video-screening/my-requests")
async def get_my_video_screenings(user: dict = Depends(require_user)):
    """Get user's video screening requests"""
    supabase = get_supabase_client()
    
    screenings = supabase.table('video_screenings').select('*, artworks!painting_id(title, image, images)').eq('user_id', user['id']).order('created_at', desc=True).execute()
    
    return {"screenings": screenings.data or []}

# ============ ORDERS & CART ============

@app.post("/api/cart/add")
async def add_to_cart(data: CartItemRequest, user: dict = Depends(require_user)):
    """Add item to cart"""
    supabase = get_supabase_client()
    
    # Check if artwork exists and is available
    artwork = supabase.table('artworks').select('*').eq('id', data.artwork_id).eq('is_available', True).single().execute()
    if not artwork.data:
        raise HTTPException(status_code=404, detail="Artwork not found or not available")
    
    # Check if already in cart
    existing = supabase.table('cart_items').select('id, quantity').eq('user_id', user['id']).eq('artwork_id', data.artwork_id).execute()
    
    if existing.data:
        # Update quantity
        new_quantity = existing.data[0]['quantity'] + data.quantity
        supabase.table('cart_items').update({"quantity": new_quantity}).eq('id', existing.data[0]['id']).execute()
    else:
        # Add new item
        cart_data = {
            "user_id": user['id'],
            "artwork_id": data.artwork_id,
            "quantity": data.quantity,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table('cart_items').insert(cart_data).execute()
    
    return {"success": True, "message": "Added to cart"}

@app.get("/api/cart")
async def get_cart(user: dict = Depends(require_user)):
    """Get user's cart"""
    supabase = get_supabase_client()
    
    cart_items = supabase.table('cart_items').select('*, artworks!artwork_id(*)').eq('user_id', user['id']).execute()
    
    total = sum(item['artworks']['price'] * item['quantity'] for item in (cart_items.data or []) if item.get('artworks'))
    
    return {
        "items": cart_items.data or [],
        "total": total,
        "item_count": len(cart_items.data or [])
    }

@app.delete("/api/cart/{item_id}")
async def remove_from_cart(item_id: str, user: dict = Depends(require_user)):
    """Remove item from cart"""
    supabase = get_supabase_client()
    
    supabase.table('cart_items').delete().eq('id', item_id).eq('user_id', user['id']).execute()
    
    return {"success": True, "message": "Removed from cart"}

@app.post("/api/orders/create")
async def create_order(data: OrderCreate, user: dict = Depends(require_user)):
    """Create an order for an artwork"""
    supabase = get_supabase_client()
    
    # Get artwork details
    artwork = supabase.table('artworks').select('*, profiles!artist_id(id, full_name)').eq('id', data.artwork_id).eq('is_available', True).single().execute()
    
    if not artwork.data:
        raise HTTPException(status_code=404, detail="Artwork not found or not available")
    
    # Get user profile
    user_profile = supabase.table('profiles').select('full_name, email').eq('id', user['id']).single().execute()
    
    order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    order_data = {
        "order_number": order_number,
        "artwork_id": data.artwork_id,
        "artwork_title": artwork.data['title'],
        "user_id": user['id'],
        "customer_name": user_profile.data.get('full_name', ''),
        "customer_email": user_profile.data.get('email', ''),
        "artist_id": artwork.data['artist_id'],
        "artist_name": artwork.data['profiles']['full_name'],
        "price": artwork.data['price'],
        "shipping_address": data.shipping_address,
        "phone": data.phone,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table('orders').insert(order_data).execute()
    
    # Create notification for real-time display
    notification_data = {
        "type": "purchase",
        "user_name": user_profile.data.get('full_name', 'Someone'),
        "artist_name": artwork.data['profiles']['full_name'],
        "artwork_title": artwork.data['title'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table('notifications').insert(notification_data).execute()
    
    return {"success": True, "order": result.data[0], "order_number": order_number}

@app.get("/api/orders/my-orders")
async def get_my_orders(user: dict = Depends(require_user)):
    """Get user's orders"""
    supabase = get_supabase_client()
    
    orders = supabase.table('orders').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
    
    return {"orders": orders.data or []}

# ============ NOTIFICATIONS ============

@app.get("/api/notifications/recent")
async def get_recent_notifications():
    """Get recent purchase/order notifications for display"""
    supabase = get_supabase_client()
    
    # Get notifications from last 24 hours
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    
    notifications = supabase.table('notifications').select('*').gte('created_at', cutoff).order('created_at', desc=True).limit(20).execute()
    
    # Format time ago
    result = []
    for notif in (notifications.data or []):
        created = datetime.fromisoformat(notif['created_at'].replace('Z', '+00:00'))
        diff = datetime.now(timezone.utc) - created
        
        if diff.total_seconds() < 60:
            time_ago = "just now"
        elif diff.total_seconds() < 3600:
            time_ago = f"{int(diff.total_seconds() / 60)} min ago"
        elif diff.total_seconds() < 86400:
            time_ago = f"{int(diff.total_seconds() / 3600)} hours ago"
        else:
            time_ago = "within 24 hours"
        
        result.append({
            **notif,
            "time_ago": time_ago
        })
    
    return {"notifications": result}

# ============ COURIER TRACKING ============

COURIER_TRACKING_URLS = {
    "delhivery": "https://www.delhivery.com/track/package/",
    "bluedart": "https://www.bluedart.com/tracking/",
    "dtdc": "https://www.dtdc.in/tracking/",
    "fedex": "https://www.fedex.com/fedextrack/?trknbr=",
    "india_post": "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?ConsignmentNo=",
    "ecom_express": "https://ecomexpress.in/tracking/?awb_field=",
    "xpressbees": "https://www.xpressbees.com/track?awb="
}

@app.post("/api/orders/{order_id}/update-awb")
async def update_awb(order_id: str, data: AWBUpdateRequest, artist: dict = Depends(require_artist)):
    """Update AWB tracking for an order"""
    supabase = get_supabase_client()
    
    # Verify artist owns this order
    order = supabase.table('orders').select('*').eq('id', order_id).eq('artist_id', artist['id']).single().execute()
    
    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Build tracking URL
    courier_lower = data.courier_partner.lower().replace(" ", "_")
    if courier_lower in COURIER_TRACKING_URLS:
        tracking_url = COURIER_TRACKING_URLS[courier_lower] + data.awb_number
    elif data.tracking_url:
        tracking_url = data.tracking_url
    else:
        tracking_url = None
    
    update_data = {
        "awb_number": data.awb_number,
        "courier_partner": data.courier_partner,
        "tracking_url": tracking_url,
        "status": "shipped",
        "shipped_at": datetime.now(timezone.utc).isoformat()
    }
    
    supabase.table('orders').update(update_data).eq('id', order_id).execute()
    
    return {"success": True, "tracking_url": tracking_url}

@app.get("/api/orders/{order_id}/track")
async def track_order(order_id: str, user: dict = Depends(require_user)):
    """Get tracking info for an order"""
    supabase = get_supabase_client()
    
    order = supabase.table('orders').select('awb_number, courier_partner, tracking_url, status, shipped_at').eq('id', order_id).single().execute()
    
    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"tracking": order.data}

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
        budget_ranges = {
            "250-350": (250, 350),
            "350-500": (350, 500)
        }
        if enquiry_data.budget_range in budget_ranges:
            min_rate, max_rate = budget_ranges[enquiry_data.budget_range]
            query = query.gte('teaching_rate', min_rate).lte('teaching_rate', max_rate)
    elif enquiry_data.class_type == "offline":
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
        "user_name": user_profile.data.get('full_name', ''),
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
    if enquiry.data.get('expires_at'):
        expires_at = datetime.fromisoformat(enquiry.data['expires_at'].replace('Z', '+00:00'))
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
    artist = supabase.table('profiles').select('phone, email, full_name').eq('id', request.artist_id).single().execute()
    
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

# ============ PROFILE MODIFICATION WITH APPROVAL ============

@app.post("/api/profile/request-modification")
async def request_profile_modification(data: ProfileModificationRequest, user: dict = Depends(require_user)):
    """Request profile modification - requires admin approval"""
    supabase = get_supabase_client()
    
    modification_data = {
        "user_id": user['id'],
        "requested_changes": data.model_dump(exclude_unset=True),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table('profile_modifications').insert(modification_data).execute()
    
    return {"success": True, "modification_id": result.data[0]['id'], "message": "Profile modification request submitted for admin approval"}

@app.get("/api/profile/pending-modifications")
async def get_pending_modifications(user: dict = Depends(require_user)):
    """Get user's pending profile modifications"""
    supabase = get_supabase_client()
    
    modifications = supabase.table('profile_modifications').select('*').eq('user_id', user['id']).order('created_at', desc=True).execute()
    
    return {"modifications": modifications.data or []}

# ============ ADMIN ROUTES ============

@app.get("/api/admin/dashboard")
async def get_admin_dashboard(admin: dict = Depends(require_admin)):
    """Get admin dashboard statistics"""
    supabase = get_supabase_client()
    
    pending_artists = supabase.table('profiles').select('id', count='exact').eq('role', 'artist').eq('is_approved', False).execute()
    pending_artworks = supabase.table('artworks').select('id', count='exact').eq('is_approved', False).execute()
    pending_exhibitions = supabase.table('exhibitions').select('id', count='exact').eq('is_approved', False).execute()
    total_users = supabase.table('profiles').select('id', count='exact').execute()
    pending_communities = supabase.table('communities').select('id', count='exact').eq('is_approved', False).execute()
    pending_modifications = supabase.table('profile_modifications').select('id', count='exact').eq('status', 'pending').execute()
    pending_screenings = supabase.table('video_screenings').select('id', count='exact').eq('status', 'pending').execute()
    
    return {
        "pending_artists": pending_artists.count or 0,
        "pending_artworks": pending_artworks.count or 0,
        "pending_exhibitions": pending_exhibitions.count or 0,
        "total_users": total_users.count or 0,
        "pending_communities": pending_communities.count or 0,
        "pending_modifications": pending_modifications.count or 0,
        "pending_screenings": pending_screenings.count or 0
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
    
    artworks = supabase.table('artworks').select('*, profiles!artist_id(full_name, email)').eq('is_approved', False).execute()
    
    # Transform for frontend
    result = []
    for artwork in (artworks.data or []):
        result.append({
            **artwork,
            "artist_name": artwork.get('profiles', {}).get('full_name', 'Unknown'),
            "artist_email": artwork.get('profiles', {}).get('email', '')
        })
    
    return {"artworks": result}

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
    
    exhibitions = supabase.table('exhibitions').select('*, profiles!artist_id(full_name)').eq('is_approved', False).execute()
    
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

@app.get("/api/admin/featured-artists")
async def get_admin_featured_artists(admin: dict = Depends(require_admin)):
    """Get all featured artists for admin"""
    supabase = get_supabase_client()
    
    contemporary = supabase.table('featured_artists').select('*').eq('type', 'contemporary').execute()
    registered = supabase.table('featured_artists').select('*').eq('type', 'registered').execute()
    
    return {
        "contemporary": contemporary.data or [],
        "registered": registered.data or []
    }

@app.post("/api/admin/feature-contemporary-artist")
async def feature_contemporary_artist(artist_data: FeaturedArtistCreate, admin: dict = Depends(require_admin)):
    """Add a contemporary featured artist"""
    supabase = get_supabase_client()
    
    featured_artist = {
        "name": artist_data.name,
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
@app.delete("/api/admin/featured-artist/{artist_id}")
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
            "name": artist.data['full_name'],
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
    supabase = get_supabase_client()
    
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
            "user_metadata": {"role": request.role}
        })
        
        if auth_response.user:
            # Update profile
            supabase.table('profiles').update({
                "full_name": request.name,
                "role": request.role,
                "location": request.location,
                "is_approved": True,
                "is_active": True
            }).eq('id', auth_response.user.id).execute()
            
            return {"success": True, "message": f"Sub-admin {request.name} created successfully"}
    except Exception as e:
        print(f"Sub-admin creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create sub-admin: {str(e)}")

@app.get("/api/admin/sub-admins")
async def get_sub_admins(admin: dict = Depends(require_admin)):
    """Get all sub-admin users"""
    supabase = get_supabase_client()
    
    sub_admins = supabase.table('profiles').select('*').in_('role', ['lead_chitrakar', 'kalakar']).execute()
    
    return {"sub_admins": sub_admins.data or []}

# Admin Community Management
@app.get("/api/admin/pending-communities")
async def get_pending_communities(admin: dict = Depends(require_admin)):
    """Get pending communities for approval"""
    supabase = get_supabase_client()
    
    communities = supabase.table('communities').select('*, profiles!creator_id(full_name)').eq('is_approved', False).execute()
    
    return {"communities": communities.data or []}

@app.post("/api/admin/approve-community")
async def approve_community(community_id: str, approved: bool, admin: dict = Depends(require_admin)):
    """Approve or reject a community"""
    supabase = get_supabase_client()
    
    if approved:
        supabase.table('communities').update({"is_approved": True}).eq('id', community_id).execute()
    else:
        supabase.table('communities').delete().eq('id', community_id).execute()
    
    return {"success": True, "message": f"Community {'approved' if approved else 'rejected'}"}

# Admin Profile Modifications
@app.get("/api/admin/pending-profile-modifications")
async def get_pending_profile_modifications(admin: dict = Depends(require_admin)):
    """Get pending profile modification requests"""
    supabase = get_supabase_client()
    
    modifications = supabase.table('profile_modifications').select('*, profiles!user_id(full_name, email, phone)').eq('status', 'pending').execute()
    
    return {"modifications": modifications.data or []}

@app.post("/api/admin/approve-profile-modification")
async def approve_profile_modification(modification_id: str, approved: bool, admin: dict = Depends(require_admin)):
    """Approve or reject profile modification"""
    supabase = get_supabase_client()
    
    modification = supabase.table('profile_modifications').select('*').eq('id', modification_id).single().execute()
    
    if not modification.data:
        raise HTTPException(status_code=404, detail="Modification not found")
    
    if approved:
        # Apply changes to profile
        supabase.table('profiles').update(modification.data['requested_changes']).eq('id', modification.data['user_id']).execute()
        supabase.table('profile_modifications').update({"status": "approved", "processed_at": datetime.now(timezone.utc).isoformat()}).eq('id', modification_id).execute()
    else:
        supabase.table('profile_modifications').update({"status": "rejected", "processed_at": datetime.now(timezone.utc).isoformat()}).eq('id', modification_id).execute()
    
    return {"success": True, "message": f"Profile modification {'approved' if approved else 'rejected'}"}

# Admin Video Screenings
@app.get("/api/admin/pending-video-screenings")
async def get_pending_video_screenings(admin: dict = Depends(require_admin)):
    """Get pending video screening requests"""
    supabase = get_supabase_client()
    
    screenings = supabase.table('video_screenings').select('*, artworks!painting_id(title), profiles!user_id(full_name, email)').eq('status', 'pending').execute()
    
    return {"screenings": screenings.data or []}

@app.post("/api/admin/accommodate-video-screening")
async def accommodate_video_screening(screening_id: str, scheduled_date: str, admin: dict = Depends(require_admin)):
    """Accommodate a video screening request"""
    supabase = get_supabase_client()
    
    supabase.table('video_screenings').update({
        "status": "scheduled",
        "scheduled_date": scheduled_date,
        "processed_at": datetime.now(timezone.utc).isoformat()
    }).eq('id', screening_id).execute()
    
    return {"success": True, "message": "Video screening scheduled"}

# Admin Chat Messages
@app.get("/api/admin/chat-messages")
async def get_admin_chat_messages(admin: dict = Depends(require_admin)):
    """Get chat messages needing admin response"""
    supabase = get_supabase_client()
    
    messages = supabase.table('chat_messages').select('*, profiles!user_id(full_name, email)').eq('needs_admin_review', True).order('created_at', desc=True).execute()
    
    return {"messages": messages.data or []}

@app.post("/api/admin/respond-to-chat")
async def respond_to_chat(message_id: str, response: str, admin: dict = Depends(require_admin)):
    """Admin responds to a chat message"""
    supabase = get_supabase_client()
    
    supabase.table('chat_messages').update({
        "admin_response": response,
        "needs_admin_review": False,
        "responded_at": datetime.now(timezone.utc).isoformat()
    }).eq('id', message_id).execute()
    
    return {"success": True, "message": "Response sent"}

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
    
    exhibitions = supabase.table('exhibitions').select('*').eq('is_approved', True).order('created_at', desc=True).execute()
    
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
        
        if not supabase:
            raise HTTPException(status_code=503, detail="Database not configured")

        update_data = updates.model_dump(exclude_unset=True)

        if not update_data:
            return {"success": True}

        # Log the update for debugging
        print(f"Updating profile for user {user['id']} with data: {update_data}")

        result = supabase.table('profiles') \
            .update(update_data) \
            .eq('id', user['id']) \
            .execute()
        
        print(f"Update result: {result}")

        updated_user = supabase.table('profiles') \
            .select('*') \
            .eq('id', user['id']) \
            .single() \
            .execute()

        return {"success": True, "user": updated_user.data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/artist/artworks")
async def get_artist_artworks(artist: dict = Depends(require_artist)):
    """Get artist's artworks"""
    try:
        supabase = get_supabase_client()
        artworks = supabase.table('artworks').select('*').eq('artist_id', artist['id']).order('created_at', desc=True).execute()
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

        print("ARTWORK PAYLOAD:", artwork.model_dump())
        
        # Handle both single image and multiple images
        images = artwork.images or []
        if artwork.image and not images:
            images = [artwork.image]
        
        # Limit to 8 images
        images = images[:8]
        
        # Build comprehensive artwork data
        artwork_data = {
            "artist_id": artist["id"],
            "title": artwork.title,
            "description": artwork.description or "",
            "category": artwork.category,
            "price": float(artwork.price),
            "image": images[0] if images else None,  # Primary image for backwards compatibility
            "images": images,  # All images
            "is_approved": False,
            "is_available": True,
            "in_marketplace": False,  # Not in marketplace until pushed
            "views": 0,
            
            # Basic Info
            "year_of_creation": artwork.year_of_creation,
            "medium": artwork.medium,
            "surface": artwork.surface,
            "dimensions": artwork.dimensions,
            "orientation": artwork.orientation,
            "style": artwork.style,
            
            # Authenticity & Certification
            "artwork_type": artwork.artwork_type or "Original",
            "edition_number": artwork.edition_number,
            "total_edition_size": artwork.total_edition_size,
            "certificate_of_authenticity": artwork.certificate_of_authenticity,
            "signed_by_artist": artwork.signed_by_artist,
            "date_signed": artwork.date_signed,
            "hand_embellished": artwork.hand_embellished,
            "artist_stamp": artwork.artist_stamp,
            
            # Condition Details
            "condition": artwork.condition or "Brand New",
            "condition_notes": artwork.condition_notes,
            "restoration_history": artwork.restoration_history,
            
            # Framing & Presentation
            "framing_status": artwork.framing_status,
            "frame_material": artwork.frame_material,
            "frame_included_in_price": artwork.frame_included_in_price,
            
            # Pricing & Availability
            "price_type": artwork.price_type or "Fixed",
            "currency": artwork.currency or "INR",
            "quantity_available": artwork.quantity_available or 1,
            "international_shipping": artwork.international_shipping,
            
            # Shipping Details
            "ships_rolled": artwork.ships_rolled,
            "ships_stretched": artwork.ships_stretched,
            "ships_framed": artwork.ships_framed,
            "insured_shipping": artwork.insured_shipping,
            "dispatch_time": artwork.dispatch_time,
            
            # Ownership & Usage Rights
            "ownership_type": artwork.ownership_type or "Physical Only",
            
            # Story & Context
            "inspiration": artwork.inspiration,
            "technique_explanation": artwork.technique_explanation,
            "artist_statement": artwork.artist_statement,
            "exhibition_history": artwork.exhibition_history,
            "awards_recognition": artwork.awards_recognition,
            
            # Investment / Value Signals
            "previously_exhibited": artwork.previously_exhibited,
            "featured_in_publication": artwork.featured_in_publication,
            "sold_similar_works": artwork.sold_similar_works,
            "part_of_series": artwork.part_of_series,
            "series_name": artwork.series_name,
            "collector_interest": artwork.collector_interest,
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

@app.post("/api/artist/push-to-marketplace")
async def push_to_marketplace(data: PushToMarketplaceRequest, artist: dict = Depends(require_artist)):
    """Push approved artworks to marketplace (requires membership)"""
    supabase = get_supabase_client()
    
    # Check membership status
    profile = supabase.table('profiles').select('is_member, membership_expiry').eq('id', artist['id']).single().execute()
    
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    is_active_member = False
    if profile.data.get('is_member') and profile.data.get('membership_expiry'):
        expiry = datetime.fromisoformat(profile.data['membership_expiry'].replace('Z', '+00:00'))
        is_active_member = expiry > datetime.now(timezone.utc)
    
    if not is_active_member:
        raise HTTPException(status_code=403, detail="Active membership required to push to marketplace")
    
    # Update artworks
    for artwork_id in data.artwork_ids:
        # Verify ownership and approval
        artwork = supabase.table('artworks').select('id').eq('id', artwork_id).eq('artist_id', artist['id']).eq('is_approved', True).single().execute()
        if artwork.data:
            supabase.table('artworks').update({"in_marketplace": True}).eq('id', artwork_id).execute()
    
    return {"success": True, "message": f"Pushed {len(data.artwork_ids)} artworks to marketplace"}

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
