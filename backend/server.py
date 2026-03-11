
from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
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
import smtplib
from email.message import EmailMessage

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
raw_cors_origins = os.environ.get('CORS_ORIGINS', '*').strip()
if raw_cors_origins == '*':
    cors_origins = ['*']
    cors_allow_credentials = False
else:
    cors_origins = [origin.strip() for origin in raw_cors_origins.split(',') if origin.strip()]
    cors_allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_allow_credentials,
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
    bucket_key: Optional[str] = None
    entity_id: Optional[str] = None

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

    # Optional image projection controls per image (artist-managed)
    image_display_settings: Optional[List[dict]] = None

# Pricing Management Models
class MembershipPlanUpdate(BaseModel):
    plan_id: str  # 'basic', 'premium', 'annual'
    name: str
    price: float
    duration_days: int
    features: List[str]
    is_active: bool = True

class VoucherCreate(BaseModel):
    code: str
    discount_type: str  # 'percentage', 'fixed'
    discount_value: float
    valid_from: str
    valid_until: str
    max_uses: int = 100
    applicable_plans: List[str] = []  # Empty means all plans
    description: Optional[str] = None

class VoucherApply(BaseModel):
    voucher_code: str
    plan_id: str

# Featured Request Models
class FeaturedRequest(BaseModel):
    payment_reference: Optional[str] = None
    duration_days: int = 5

class FeaturedRequestApproval(BaseModel):
    request_id: str
    approved: bool
    rejection_reason: Optional[str] = None

# Community Models
class CommunityCreate(BaseModel):
    name: str
    description: str
    image: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    invite_criteria: Optional[dict] = None  # {"location": "Mumbai", "categories": ["Abstract"]}

class CommunityPostCreate(BaseModel):
    community_id: str
    content: str
    images: List[str] = []
    post_type: str = "text"  # 'text', 'image', 'announcement'

class CommunityInvite(BaseModel):
    community_id: str
    artist_ids: List[str]
    message: Optional[str] = None

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
    exhibition_images: List[str] = []
    primary_exhibition_image: Optional[str] = None
    payment_method: str = "manual"  # manual | razorpay
    payment_screenshot_url: Optional[str] = None
    payment_reference: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


class ExhibitionAdminCreate(BaseModel):
    artist_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    artwork_ids: List[str] = []
    exhibition_type: str = "Kalakanksh"
    exhibition_images: List[str] = []
    exhibition_paintings: List[dict] = []

class ExhibitionApprovalRequest(BaseModel):
    exhibition_id: str
    approved: bool


class ArtistExhibitionActionRequest(BaseModel):
    action: str  # pause | delete
    reason: Optional[str] = None


class AdminExhibitionActionReviewRequest(BaseModel):
    exhibition_id: str
    approved: bool
    admin_note: Optional[str] = None


class AdminExhibitionExtendRequest(BaseModel):
    exhibition_id: str
    extra_days: int = Field(gt=0, le=30)


class AdminExhibitionUpdateRequest(BaseModel):
    exhibition_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None  # active, paused, archived


# AI Pricing Engine Models
class ArtworkPricingRequest(BaseModel):
    width: float  # in inches
    height: float  # in inches
    medium: str  # oil, acrylic, watercolor, charcoal, mixed media, etc.
    realism_level: str  # abstract, impressionistic, realism, hyperrealism
    detailing_level: str  # average, high_accuracy, excellent
    uniqueness: str  # original, limited_edition, multiple_copies
    artist_experience: str  # beginner, intermediate, professional
    hours_spent: Optional[int] = None
    material_cost: Optional[float] = None
    artist_price: float  # The price the artist is quoting


class ArtworkPricingResponse(BaseModel):
    suggested_price_range: dict  # {"min": value, "max": value}
    pricing_evaluation: str  # fair, slightly_high, overpriced, underpriced
    pricing_badge: str  # green, yellow, red
    buyer_message: str
    artist_suggestion: Optional[str] = None


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


class CommissionCreate(BaseModel):
    art_category: str
    medium: str
    width_ft: float = Field(gt=0)
    height_ft: float = Field(gt=0)
    budget: float = Field(gt=0)
    skill_level: str  # Average / Advanced
    detail_level: str = "Basic"
    subjects: int = Field(default=1, ge=1)
    pricing_type: Optional[str] = None  # derived from negotiation_allowed for backward compatibility
    offer_price: Optional[float] = None
    negotiation_allowed: bool = False
    selected_artist_ids: List[str] = []
    reference_image_urls: List[str] = []
    special_instructions: Optional[str] = None
    deadline: Optional[str] = None
    framing_option: Optional[str] = None
    contact_phone: Optional[str] = None


class CommissionArtistUpdate(BaseModel):
    status: str
    note: Optional[str] = None
    image_url: Optional[str] = None


class CommissionAdminAction(BaseModel):
    commission_id: str
    artist_id: Optional[str] = None
    status: Optional[str] = None
    admin_note: Optional[str] = None


class ArtistRequestResponse(BaseModel):
    action: str  # accept_offer | counter_offer | reject
    counter_offer: Optional[float] = None


COMMISSION_STATUSES = [
    "Requested",
    "Accepted",
    "In Progress",
    "WIP Shared",
    "Completed",
    "Delivered",
]

COMMISSION_STATUS_TO_DEAL = {
    "Requested": "accepted",
    "Accepted": "accepted",
    "In Progress": "in_progress",
    "WIP Shared": "wip_shared",
    "Completed": "completed",
    "Delivered": "delivered",
}

DEAL_TO_COMMISSION_STATUS = {
    "accepted": "Accepted",
    "in_progress": "In Progress",
    "wip_shared": "WIP Shared",
    "completed": "Completed",
    "delivered": "Delivered",
}

COMMISSION_CATEGORY_PRICING = {
    "Acrylic Colors": {
        "model": "sqft",
        "average": {"min": 1500, "max": 4000},
        "advanced": {"min": 4000, "max": 10000},
    },
    "Watercolors": {
        "model": "sqft",
        "average": {"min": 1200, "max": 3000},
        "advanced": {"min": 3000, "max": 6000},
    },
    "Pencil & Pen Work": {
        "model": "sqft",
        "average": {"min": 800, "max": 2000},
        "advanced": {"min": 2000, "max": 5000},
    },
    "Pastels": {
        "model": "sqft",
        "average": {"min": 1200, "max": 3500},
        "advanced": {"min": 3500, "max": 7000},
    },
    "Indian Ink": {
        "model": "sqft",
        "average": {"min": 1000, "max": 2500},
        "advanced": {"min": 2500, "max": 5500},
    },
    "Illustrations": {
        "model": "flat",
        "average": {"min": 2000, "max": 8000},
        "advanced": {"min": 8000, "max": 25000},
    },
    "Visual Art": {
        "model": "sqft",
        "average": {"min": 2000, "max": 7000},
        "advanced": {"min": 7000, "max": 18000},
    },
    "Digital Art": {
        "model": "flat",
        "average": {"min": 1000, "max": 6000},
        "advanced": {"min": 6000, "max": 20000},
    },
    "Mixed Media": {
        "model": "sqft",
        "average": {"min": 2500, "max": 8000},
        "advanced": {"min": 8000, "max": 20000},
    },
    "Sculpture": {
        "model": "flat",
        "average": {"min": 10000, "max": 80000},
        "advanced": {"min": 80000, "max": 400000},
    },
    "Photography": {
        "model": "flat",
        "average": {"min": 2000, "max": 15000},
        "advanced": {"min": 15000, "max": 100000},
    },
    "Printmaking": {
        "model": "sqft",
        "average": {"min": 1500, "max": 5000},
        "advanced": {"min": 5000, "max": 12000},
    },
}

COMMISSION_MEDIUM_PRICING = {
    "Pencil / Charcoal": {
        "average": {"min": 800, "max": 2000},
        "advanced": {"min": 2000, "max": 5000},
    },
    "Watercolor": {
        "average": {"min": 1200, "max": 3000},
        "advanced": {"min": 3000, "max": 6000},
    },
    "Acrylic on Canvas": {
        "average": {"min": 1500, "max": 4000},
        "advanced": {"min": 4000, "max": 10000},
    },
    "Oil on Canvas": {
        "average": {"min": 2500, "max": 6000},
        "advanced": {"min": 6000, "max": 15000},
    },
    "Hyper-Realism / Museum Replica": {
        "average": {"min": 5000, "max": 12000},
        "advanced": {"min": 12000, "max": 30000},
    },
}

COMMISSION_DETAIL_MULTIPLIERS = {
    "Basic": 1.0,
    "Detailed": 1.25,
    "Hyper Realistic": 1.5,
}

COMMISSION_ART_CATEGORIES = [
    "Acrylic Colors",
    "Watercolors",
    "Pencil & Pen Work",
    "Pastels",
    "Indian Ink",
    "Illustrations",
    "Visual Art",
    "Digital Art",
    "Mixed Media",
    "Sculpture",
    "Photography",
    "Printmaking",
]

EXHIBITION_PLAN_CONFIG = {
    "Kalakanksh": {"base_fee": 500, "days": 1, "max_artworks": 10},
    "Kalahruday": {"base_fee": 1000, "days": 3, "max_artworks": 20},
    "KalaDeeksh": {"base_fee": 2500, "days": 10, "max_artworks": 25},
}


def _normalize_skill_level(value: str) -> str:
    normalized = (value or "").strip().lower()
    if normalized in ["average", "average professional artist"]:
        return "average"
    if normalized in ["advanced", "advanced / expert artist", "advanced/expert", "expert"]:
        return "advanced"
    raise HTTPException(status_code=400, detail="Invalid skill level")


def _normalize_detail_level(value: str) -> str:
    normalized = (value or "").strip().lower()
    detail_map = {
        "basic": "Basic",
        "detailed": "Detailed",
        "hyper realistic": "Hyper Realistic",
        "hyper-realistic": "Hyper Realistic",
    }
    detail = detail_map.get(normalized)
    if not detail:
        raise HTTPException(status_code=400, detail="Invalid detail level")
    return detail


def calculate_commission_estimate(payload: CommissionCreate) -> Dict[str, float]:
    category_pricing = COMMISSION_CATEGORY_PRICING.get(payload.art_category)
    if not category_pricing:
        raise HTTPException(status_code=400, detail="Invalid artwork category")

    skill_level = _normalize_skill_level(payload.skill_level)
    detail_level = _normalize_detail_level(payload.detail_level)
    price_band = category_pricing[skill_level]
    pricing_model = category_pricing["model"]

    sqft = payload.width_ft * payload.height_ft
    detail_multiplier = COMMISSION_DETAIL_MULTIPLIERS[detail_level]
    subject_multiplier = 1 + max(0, payload.subjects - 1) * 0.15

    if pricing_model == "flat":
        # For digital/photo/sculpture style categories: ignore width/height by requirement
        min_price = price_band["min"] * detail_multiplier * subject_multiplier
        max_price = price_band["max"] * detail_multiplier * subject_multiplier
    else:
        min_price = sqft * price_band["min"] * detail_multiplier * subject_multiplier
        max_price = sqft * price_band["max"] * detail_multiplier * subject_multiplier
    avg_price = (min_price + max_price) / 2

    return {
        "square_feet": round(sqft, 2),
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "average_price": round(avg_price, 2),
        "normalized_skill": "Average" if skill_level == "average" else "Advanced",
        "normalized_detail": detail_level,
        "pricing_model": pricing_model,
    }


def _send_commission_admin_email(admin_emails: List[str], subject: str, body: str):
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_username = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    from_email = os.environ.get("ADMIN_NOTIFICATION_FROM_EMAIL")

    if not smtp_host or not smtp_port or not smtp_username or not smtp_password or not from_email:
        print("Email notification skipped: SMTP environment is not configured")
        return

    if not admin_emails:
        print("Email notification skipped: no admin email recipients found")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = ", ".join(admin_emails)
    msg.set_content(body)

    with smtplib.SMTP(smtp_host, int(smtp_port)) as smtp:
        smtp.starttls()
        smtp.login(smtp_username, smtp_password)
        smtp.send_message(msg)


def _get_commission_updates(supabase, commission_id: str):
    updates = (
        supabase.table("commission_updates")
        .select("*, profiles!artist_id(full_name, avatar)")
        .eq("commission_id", commission_id)
        .order("created_at", desc=False)
        .execute()
    )
    return updates.data or []


def _normalize_exhibition_type(value: str) -> str:
    raw = (value or "Kalakanksh").strip().lower()
    mapping = {
        "kalakanksh": "Kalakanksh",
        "kalahruday": "Kalahruday",
        "kaladeeksh": "KalaDeeksh",
    }
    return mapping.get(raw, "Kalakanksh")


def _get_exhibition_plan(exhibition_type: str):
    normalized = _normalize_exhibition_type(exhibition_type)
    return normalized, EXHIBITION_PLAN_CONFIG[normalized]


def _parse_iso_date(value: str):
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _sync_exhibition_statuses(supabase):
    now = datetime.now(timezone.utc)
    rows = supabase.table('exhibitions').select('id, start_date, days_paid, exhibition_type, status, is_approved').eq('is_approved', True).execute()
    for exhibition in (rows.data or []):
        try:
            if (exhibition.get('status') or '').lower() in ['paused', 'deleted']:
                continue
            start = _parse_iso_date(exhibition['start_date'])
        except Exception:
            continue

        _, plan = _get_exhibition_plan(exhibition.get('exhibition_type'))
        days_paid = int(exhibition.get('days_paid') or plan['days'])

        active_end = start + timedelta(days=days_paid)
        archive_end = active_end + timedelta(days=days_paid)

        if now < start:
            next_status = 'upcoming'
        elif start <= now < active_end:
            next_status = 'active'
        elif active_end <= now < archive_end:
            next_status = 'archived'
        else:
            next_status = 'expired'

        if exhibition.get('status') != next_status:
            supabase.table('exhibitions').update({
                'status': next_status,
                'updated_at': datetime.now(timezone.utc).isoformat(),
            }).eq('id', exhibition['id']).execute()


def _resolve_upload_bucket(bucket_key: Optional[str]):
    artworks_bucket = os.environ.get("AWS_BUCKET_ARTWORKS") or os.environ.get("AWS_BUCKET_ARTIST_ARTWORKS")
    shared_bucket = os.environ.get("AWS_BUCKET_NAME") or os.environ.get("AWS_S3_BUCKET")
    mapping = {
        "artist-artworks": artworks_bucket,
        "artworks": artworks_bucket,
        "commission-references": os.environ.get("AWS_BUCKET_COMMISSION_REFERENCES"),
        "commission-deliveries": os.environ.get("AWS_BUCKET_COMMISSION_DELIVERIES"),
        "exhibition-payment-proofs": os.environ.get("AWS_BUCKET_EXHIBITION_PAYMENT_PROOFS"),
        "avatars": os.environ.get("AWS_BUCKET_AVATARS"),
        "communities": os.environ.get("AWS_BUCKET_COMMUNITIES"),
        "exhibitions": os.environ.get("AWS_BUCKET_EXHIBITIONS"),
    }

    if not bucket_key:
        raise HTTPException(status_code=400, detail="bucket_key is required")

    selected = mapping.get(bucket_key)
    if selected:
        return selected

    # Single-bucket compatibility mode: use one shared bucket with folder prefixes
    if shared_bucket:
        return shared_bucket

    raise HTTPException(status_code=500, detail=f"Bucket not configured for {bucket_key}")


def _compute_commission_display_status(request_row: dict, deal_row: Optional[dict]) -> str:
    if deal_row and deal_row.get("status"):
        return DEAL_TO_COMMISSION_STATUS.get(deal_row["status"], "Accepted")

    request_status = request_row.get("status", "pending")
    if request_status == "locked":
        return "Accepted"
    if request_status == "closed":
        return "Delivered"
    return "Requested"


def _commission_public_artist_profile(profile: dict, category_row: dict, artworks: list):
    return {
        "id": profile.get("id"),
        "name": profile.get("full_name"),
        "rating": profile.get("rating") or 0,
        "delivery_days": profile.get("delivery_days") or 14,
        "negotiation_allowed": bool(profile.get("negotiation_allowed")),
        "availability_status": profile.get("availability_status") or "available",
        "commission_price_range": {
            "min": category_row.get("min_price"),
            "max": category_row.get("max_price"),
            "pricing_model": category_row.get("pricing_model"),
        },
        "artworks": artworks,
    }


def _get_commission_matching_artists_sync(supabase, category: str, budget: float):
    matching_categories = (
        supabase.table("artist_categories")
        .select("*")
        .eq("category", category)
        .lte("min_price", budget)
        .gte("max_price", budget)
        .execute()
    )

    artists = []
    for category_row in (matching_categories.data or []):
        artist_id = category_row.get("artist_id")
        if not artist_id:
            continue

        profile = (
            supabase.table("profiles")
            .select("id, full_name, role, is_approved, is_active, rating, delivery_days, negotiation_allowed, availability_status")
            .eq("id", artist_id)
            .single()
            .execute()
        )
        if not profile.data:
            continue

        availability = (profile.data.get("availability_status") or "available").lower()
        if profile.data.get("role") != "artist" or not profile.data.get("is_active", True) or not profile.data.get("is_approved", False):
            continue
        if availability in ["busy", "not_accepting"]:
            continue

        artworks = (
            supabase.table("artworks")
            .select("id, title, category, image")
            .eq("artist_id", artist_id)
            .eq("is_approved", True)
            .order("created_at", desc=True)
            .limit(3)
            .execute()
        )

        artists.append(_commission_public_artist_profile(profile.data, category_row, artworks.data or []))

    return artists[:10]

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

    def fallback_locations(search_query: str):
        """Fallback city suggestions when geocoder is blocked/rate-limited."""
        city_state_pairs = [
            ("Chennai", "Tamil Nadu"), ("Coimbatore", "Tamil Nadu"), ("Madurai", "Tamil Nadu"),
            ("Salem", "Tamil Nadu"), ("Trichy", "Tamil Nadu"), ("Erode", "Tamil Nadu"),
            ("Bengaluru", "Karnataka"), ("Mysuru", "Karnataka"), ("Mangaluru", "Karnataka"),
            ("Hyderabad", "Telangana"), ("Warangal", "Telangana"), ("Vijayawada", "Andhra Pradesh"),
            ("Visakhapatnam", "Andhra Pradesh"), ("Mumbai", "Maharashtra"), ("Pune", "Maharashtra"),
            ("Nagpur", "Maharashtra"), ("Nashik", "Maharashtra"), ("Ahmedabad", "Gujarat"),
            ("Surat", "Gujarat"), ("Vadodara", "Gujarat"), ("Jaipur", "Rajasthan"),
            ("Udaipur", "Rajasthan"), ("Delhi", "Delhi"), ("Noida", "Uttar Pradesh"),
            ("Lucknow", "Uttar Pradesh"), ("Kanpur", "Uttar Pradesh"), ("Kolkata", "West Bengal"),
            ("Howrah", "West Bengal"), ("Bhubaneswar", "Odisha"), ("Cuttack", "Odisha"),
            ("Bhopal", "Madhya Pradesh"), ("Indore", "Madhya Pradesh"), ("Patna", "Bihar"),
            ("Ranchi", "Jharkhand"), ("Kochi", "Kerala"), ("Thiruvananthapuram", "Kerala"),
            ("Kozhikode", "Kerala"), ("Chandigarh", "Chandigarh"), ("Amritsar", "Punjab"),
            ("Ludhiana", "Punjab"), ("Guwahati", "Assam"), ("Shillong", "Meghalaya"),
            ("Panaji", "Goa"), ("Dehradun", "Uttarakhand"),
        ]

        term = (search_query or "").strip().lower()
        matches = []
        for city, state in city_state_pairs:
            if term in city.lower() or term in state.lower():
                matches.append({
                    "display_name": f"{city}, {state}, India",
                    "city": city,
                    "state": state,
                    "country": "India",
                    "country_code": "IN",
                    "lat": None,
                    "lon": None,
                })
        return {"locations": matches[:10]}
    
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
        
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                headers={
                    "User-Agent": "ChitraKalakar/1.0 (support@chitrakalakar.com)",
                    "Accept": "application/json",
                }
            )

            if response.status_code != 200:
                return fallback_locations(q)

            try:
                data = response.json()
            except Exception:
                return fallback_locations(q)

            if not isinstance(data, list):
                return fallback_locations(q)
        
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
        
        if locations:
            return {"locations": locations}

        # Secondary attempt without country restriction
        if country:
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    response = await client.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={"q": q, "format": "json", "addressdetails": 1, "limit": 10},
                        headers={"User-Agent": "ChitraKalakar/1.0 (support@chitrakalakar.com)", "Accept": "application/json"},
                    )
                    if response.status_code == 200:
                        data = response.json() if response.text else []
                        if isinstance(data, list):
                            for item in data:
                                address = item.get("address", {})
                                locations.append({
                                    "display_name": item.get("display_name"),
                                    "city": address.get("city") or address.get("town") or address.get("village"),
                                    "state": address.get("state"),
                                    "country": address.get("country"),
                                    "country_code": address.get("country_code", "").upper(),
                                    "lat": item.get("lat"),
                                    "lon": item.get("lon"),
                                })
            except Exception:
                pass

        if locations:
            return {"locations": locations[:10]}

        return fallback_locations(q)
    except Exception as e:
        print(f"Location search error: {e}")
        return fallback_locations(q)

# ============ PUBLIC ROUTES ============

@app.get("/api/public/stats")
async def get_public_stats():
    """Get platform statistics - optimized for fast loading"""
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
        # Run all counts in parallel for faster loading
        import asyncio
        
        async def get_artist_count():
            try:
                return supabase.table('profiles').select('id', count='exact').eq('role', 'artist').eq('is_approved', True).execute().count or 0
            except:
                return 0
                
        async def get_artwork_count():
            try:
                return supabase.table('artworks').select('id', count='exact').eq('is_approved', True).execute().count or 0
            except:
                return 0
                
        async def get_exhibition_count():
            try:
                return supabase.table('exhibitions').select('id', count='exact').eq('is_approved', True).execute().count or 0
            except:
                return 0
        
        # Execute all queries in parallel
        artists_count, artworks_count, exhibitions_count = await asyncio.gather(
            get_artist_count(),
            get_artwork_count(),
            get_exhibition_count()
        )
        
        return {
            "total_artists": artists_count,
            "total_artworks": artworks_count,
            "active_exhibitions": exhibitions_count,
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
    """Get all approved and registered artists (without contact info for public view)"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"artists": []}
    
    try:
        # Get all approved and active artists
        artists = supabase.table('profiles').select(
            'id, full_name, bio, categories, location, avatar, created_at, is_member, membership_expiry'
        ).eq('role', 'artist').eq('is_approved', True).eq('is_active', True).execute()
        
        # Return ALL registered artists (not filtered by membership)
        artist_list = []
        now = datetime.now(timezone.utc)
        
        for artist in (artists.data or []):
            # Check membership status for display purposes
            is_active_member = False
            if artist.get('is_member') and artist.get('membership_expiry'):
                try:
                    expiry = datetime.fromisoformat(artist['membership_expiry'].replace('Z', '+00:00'))
                    is_active_member = expiry > now
                except:
                    pass
            
            # Include ALL registered artists
            artist_list.append({
                "id": artist.get("id"),
                "name": artist.get("full_name"),
                "bio": artist.get("bio"),
                "categories": artist.get("categories"),
                "location": artist.get("location"),
                "avatar": artist.get("avatar"),
                "created_at": artist.get("created_at"),
                "is_member": is_active_member
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

def _enrich_exhibition_with_artworks(supabase, exhibition: dict) -> dict:
    """Enrich exhibition with artwork data if artwork_ids exist but exhibition_paintings is empty"""
    enriched = dict(exhibition)
    
    # If exhibition_paintings already has data, use it
    if enriched.get('exhibition_paintings') and len(enriched.get('exhibition_paintings', [])) > 0:
        return enriched
    
    # If exhibition_images already has data, use it as primary
    if enriched.get('exhibition_images') and len(enriched.get('exhibition_images', [])) > 0:
        if not enriched.get('primary_exhibition_image'):
            enriched['primary_exhibition_image'] = enriched['exhibition_images'][0]
        return enriched
    
    # Try to fetch artworks via artwork_ids
    artwork_ids = enriched.get('artwork_ids', [])
    if artwork_ids and len(artwork_ids) > 0:
        try:
            artworks_result = supabase.table('artworks').select('id, title, image, images, price, description').in_('id', artwork_ids).execute()
            if artworks_result.data:
                paintings = []
                images = []
                for artwork in artworks_result.data:
                    img = artwork.get('images', [None])[0] if artwork.get('images') else artwork.get('image')
                    if img:
                        images.append(img)
                        paintings.append({
                            'image_url': img,
                            'title': artwork.get('title', ''),
                            'description': artwork.get('description', ''),
                            'price': artwork.get('price'),
                            'artwork_id': artwork.get('id'),
                            'on_sale': True
                        })
                enriched['exhibition_paintings'] = paintings
                enriched['exhibition_images'] = images
                if images:
                    enriched['primary_exhibition_image'] = images[0]
        except Exception as e:
            print(f"Error enriching exhibition with artworks: {e}")
    
    return enriched


@app.get("/api/public/exhibitions")
async def get_public_exhibitions():
    """Get all approved exhibitions"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"exhibitions": []}
    
    try:
        _sync_exhibition_statuses(supabase)
        exhibitions = supabase.table('exhibitions').select('*').eq('is_approved', True).order('created_at', desc=True).execute()
        
        # Enrich each exhibition with artwork data
        enriched_exhibitions = []
        for ex in (exhibitions.data or []):
            enriched_exhibitions.append(_enrich_exhibition_with_artworks(supabase, ex))
        
        return {"exhibitions": enriched_exhibitions}
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
        _sync_exhibition_statuses(supabase)
        exhibitions = supabase.table('exhibitions').select('*').eq('is_approved', True).eq('status', 'active').execute()
        
        # Enrich each exhibition with artwork data
        enriched_exhibitions = []
        for ex in (exhibitions.data or []):
            enriched_exhibitions.append(_enrich_exhibition_with_artworks(supabase, ex))
        
        return {"exhibitions": enriched_exhibitions}
    except Exception as e:
        print(f"Active exhibitions error: {e}")
        return {"exhibitions": []}


@app.get("/api/public/active-exhibitions")
async def get_active_exhibitions_alias():
    return await get_active_exhibitions()

@app.get("/api/public/exhibitions/archived")
async def get_archived_exhibitions():
    """Get archived exhibitions"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"exhibitions": []}
    
    try:
        _sync_exhibition_statuses(supabase)
        exhibitions = supabase.table('exhibitions').select('*').eq('is_approved', True).eq('status', 'archived').execute()
        
        # Enrich each exhibition with artwork data
        enriched_exhibitions = []
        for ex in (exhibitions.data or []):
            enriched_exhibitions.append(_enrich_exhibition_with_artworks(supabase, ex))
        
        return {"exhibitions": enriched_exhibitions}
    except Exception as e:
        print(f"Archived exhibitions error: {e}")
        return {"exhibitions": []}


@app.get("/api/public/archived-exhibitions")
async def get_archived_exhibitions_alias():
    return await get_archived_exhibitions()

# ============ COMMUNITIES ============

@app.get("/api/public/communities")
async def get_public_communities():
    """Get all approved communities"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"communities": []}
    
    try:
        communities = supabase.table('communities').select('*').eq('is_approved', True).order('created_at', desc=True).execute()

        enriched = []
        for community in (communities.data or []):
            creator_id = community.get('created_by') or community.get('creator_id')
            creator_profile = None
            if creator_id:
                try:
                    profile = supabase.table('profiles').select('full_name, avatar').eq('id', creator_id).single().execute()
                    creator_profile = profile.data
                except Exception:
                    creator_profile = None

            enriched.append({
                **community,
                "profiles": creator_profile,
            })

        return {"communities": enriched}
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
async def create_community_legacy(data: CommunityCreate, user: dict = Depends(require_artist)):
    """Create a new community (requires artist role)"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    # Use only columns that exist in the DB schema
    community_data = {
        "name": data.name,
        "description": data.description,
        "image": data.image,
        "category": data.category,
        "created_by": user['id'],
        "member_count": 1,
        "is_approved": False,  # Requires admin approval
    }

    try:
        result = supabase.table('communities').insert(community_data).execute()
    except Exception as e:
        msg = str(e)
        fallback = dict(community_data)
        for optional_field in ["category", "image"]:
            if optional_field in fallback:
                fallback.pop(optional_field, None)
        result = supabase.table('communities').insert(fallback).execute()
    
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
@app.post("/api/community/{community_id}/leave")
async def leave_community(community_id: str, user: dict = Depends(require_user)):
    """Leave a community"""
    supabase = get_supabase_client()
    
    result = supabase.table('community_members').delete().eq('community_id', community_id).eq('user_id', user['id']).execute()
    
    # Update member count
    try:
        community = supabase.table('communities').select('member_count').eq('id', community_id).single().execute()
        if community.data:
            new_count = max(0, (community.data.get('member_count') or 1) - 1)
            supabase.table('communities').update({'member_count': new_count}).eq('id', community_id).execute()
    except:
        pass
    
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
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"add_to_cart error: {e}")
        raise HTTPException(status_code=500, detail="Unable to add to cart right now. Please try again.")

@app.get("/api/cart")
async def get_cart(user: dict = Depends(require_user)):
    """Get user's cart"""
    supabase = get_supabase_client()
    if not supabase:
        return {"items": [], "total": 0, "item_count": 0}
    
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
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
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
    if not supabase:
        return {"notifications": []}

    try:
        # Get notifications from last 24 hours
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        notifications = (
            supabase.table('notifications')
            .select('*')
            .gte('created_at', cutoff)
            .order('created_at', desc=True)
            .limit(20)
            .execute()
        )

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
    except Exception as e:
        print("notifications fetch error", e)
        return {"notifications": []}

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


@app.get("/api/public/commission-config")
async def get_commission_config():
    """Get commission calculator configuration aligned to existing categories + pricing models."""
    return {
        "categories": COMMISSION_ART_CATEGORIES,
        "medium_pricing": COMMISSION_MEDIUM_PRICING,
        "category_pricing": COMMISSION_CATEGORY_PRICING,
        "detail_multipliers": COMMISSION_DETAIL_MULTIPLIERS,
        "statuses": COMMISSION_STATUSES,
    }


@app.get("/api/public/commission/matching-artists")
async def get_matching_artists(category: str, budget: float):
    """Discover artists by category + budget with contact-hidden cards."""
    if category not in COMMISSION_ART_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid artwork category")

    supabase = get_supabase_client()
    if not supabase:
        return {"artists": []}

    artists = _get_commission_matching_artists_sync(supabase, category, budget)
    return {"artists": artists}


@app.post("/api/commissions")
async def create_commission_request(
    payload: CommissionCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(require_user),
):
    """Create commission request and send to up to 3 selected/matched artists."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    if payload.art_category not in COMMISSION_ART_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid artwork category")
    if len(payload.selected_artist_ids) > 3:
        raise HTTPException(status_code=400, detail="You can send request to maximum 3 artists")

    estimate = calculate_commission_estimate(payload)

    requester_profile = (
        supabase.table("profiles")
        .select("full_name, email, phone")
        .eq("id", user["id"])
        .single()
        .execute()
    )

    requester_data = requester_profile.data or {}
    if not requester_data.get("full_name") or not requester_data.get("email") or not requester_data.get("phone"):
        raise HTTPException(
            status_code=400,
            detail="Complete your registration profile (full name, email, phone) before commissioning.",
        )

    effective_pricing_type = "negotiable" if payload.negotiation_allowed else "fixed"
    effective_offer_price = payload.offer_price if payload.negotiation_allowed else None

    commission_doc = {
        "user_id": user["id"],
        "category": payload.art_category,
        "medium": payload.medium,
        "description": payload.special_instructions,
        "reference_image": payload.reference_image_urls[0] if payload.reference_image_urls else None,
        "reference_images": payload.reference_image_urls,
        "width": payload.width_ft,
        "height": payload.height_ft,
        "budget": payload.budget,
        "deadline": payload.deadline,
        "negotiation_allowed": payload.negotiation_allowed,
        "pricing_type": effective_pricing_type,
        "offer_price": effective_offer_price,
        "skill_level": estimate["normalized_skill"],
        "detail_level": estimate["normalized_detail"],
        "subjects": payload.subjects,
        "price_min": estimate["min_price"],
        "price_max": estimate["max_price"],
        "estimated_price": estimate["average_price"],
        "framing_option": payload.framing_option,
        "contact_name": requester_data.get("full_name"),
        "contact_email": requester_data.get("email"),
        "contact_phone": requester_data.get("phone"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    created = supabase.table("commission_requests").insert(commission_doc).execute()
    if not created.data:
        raise HTTPException(status_code=500, detail="Failed to create commission request")

    commission = created.data[0]

    artists_to_notify = payload.selected_artist_ids
    if not artists_to_notify:
        matches = _get_commission_matching_artists_sync(supabase, payload.art_category, payload.budget)
        artists_to_notify = [artist["id"] for artist in matches[:3]]

    for artist_id in artists_to_notify[:3]:
        existing = (
            supabase.table("artist_requests")
            .select("id")
            .eq("commission_id", commission["id"])
            .eq("artist_id", artist_id)
            .execute()
        )
        if existing.data:
            continue

        supabase.table("artist_requests").insert(
            {
                "commission_id": commission["id"],
                "artist_id": artist_id,
                "offer_price": effective_offer_price,
                "pricing_type": effective_pricing_type,
                "status": "pending",
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()

    supabase.table("commission_updates").insert(
        {
            "commission_id": commission["id"],
            "artist_id": artists_to_notify[0] if artists_to_notify else None,
            "note": "Commission request submitted",
            "previous_status": None,
            "new_status": "Requested",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()

    admin_emails_res = (
        supabase.table("profiles")
        .select("email")
        .eq("role", "admin")
        .eq("is_active", True)
        .not_.is_("email", "null")
        .execute()
    )
    admin_emails = [a.get("email") for a in (admin_emails_res.data or []) if a.get("email")]

    email_subject = f"New Commission Request #{commission['id'][:8]}"
    email_body = (
        f"A new commission request has been submitted.\n\n"
        f"Requester: {(requester_profile.data or {}).get('full_name', 'N/A')}\n"
        f"Category: {payload.art_category}\n"
        f"Medium: {payload.medium}\n"
        f"Estimated Range: ₹{estimate['min_price']} - ₹{estimate['max_price']}\n"
        f"Budget: ₹{payload.budget}\n"
        f"Negotiation Allowed: {'Yes' if payload.negotiation_allowed else 'No'}\n"
        f"Status: pending\n"
    )
    background_tasks.add_task(_send_commission_admin_email, admin_emails, email_subject, email_body)

    return {
        "success": True,
        "commission": commission,
        "artist_requests_sent": len(artists_to_notify[:3]),
        "estimated": {
            "minimum": estimate["min_price"],
            "maximum": estimate["max_price"],
            "average": estimate["average_price"],
        },
    }


@app.get("/api/user/commissions")
async def get_user_commissions(user: dict = Depends(require_user)):
    supabase = get_supabase_client()
    if not supabase:
        return {"commissions": []}

    commissions = (
        supabase.table("commission_requests")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )

    enriched = []
    for commission in (commissions.data or []):
        deal = (
            supabase.table("commission_deals")
            .select("*")
            .eq("commission_id", commission["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        deal_row = deal.data[0] if deal.data else None

        active_artist_id = deal_row.get("artist_id") if deal_row else None
        if not active_artist_id:
            first_request = (
                supabase.table("artist_requests")
                .select("artist_id")
                .eq("commission_id", commission["id"])
                .in_("status", ["accepted", "pending"])
                .order("sent_at", desc=False)
                .limit(1)
                .execute()
            )
            active_artist_id = first_request.data[0]["artist_id"] if first_request.data else None

        artist_profile = None
        if active_artist_id:
            artist_profile = (
                supabase.table("profiles")
                .select("id, full_name, avatar")
                .eq("id", active_artist_id)
                .single()
                .execute()
            )

        item = {
            "id": commission.get("id"),
            "art_category": commission.get("category"),
            "medium": commission.get("medium"),
            "width_ft": commission.get("width"),
            "height_ft": commission.get("height"),
            "price_min": commission.get("price_min"),
            "price_max": commission.get("price_max"),
            "status": _compute_commission_display_status(commission, deal_row),
            "artist": artist_profile.data if artist_profile and artist_profile.data else None,
            "reference_image_urls": commission.get("reference_images") or [],
            "special_instructions": commission.get("description"),
            "deadline": commission.get("deadline"),
            "updates": _get_commission_updates(supabase, commission["id"]),
        }
        enriched.append(item)

    return {"commissions": enriched}


@app.get("/api/artist/commissions")
async def get_artist_commissions(artist: dict = Depends(require_artist)):
    supabase = get_supabase_client()
    if not supabase:
        return {"commissions": []}

    artist_requests = (
        supabase.table("artist_requests")
        .select("*")
        .eq("artist_id", artist["id"])
        .order("sent_at", desc=True)
        .execute()
    )

    enriched = []
    for request_row in (artist_requests.data or []):
        commission_res = (
            supabase.table("commission_requests")
            .select("*")
            .eq("id", request_row["commission_id"])
            .single()
            .execute()
        )
        if not commission_res.data:
            continue
        commission = commission_res.data

        requester_profile = (
            supabase.table("profiles")
            .select("id, full_name")
            .eq("id", commission["user_id"])
            .single()
            .execute()
        )

        deal = (
            supabase.table("commission_deals")
            .select("*")
            .eq("commission_id", commission["id"])
            .eq("artist_id", artist["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        deal_row = deal.data[0] if deal.data else None

        item = {
            "id": commission.get("id"),
            "artist_request_id": request_row.get("id"),
            "artist_request_status": request_row.get("status"),
            "art_category": commission.get("category"),
            "medium": commission.get("medium"),
            "width_ft": commission.get("width"),
            "height_ft": commission.get("height"),
            "price_min": commission.get("price_min"),
            "price_max": commission.get("price_max"),
            "status": _compute_commission_display_status(commission, deal_row),
            "requester": requester_profile.data if requester_profile else None,
            "special_instructions": commission.get("description"),
            "deadline": commission.get("deadline"),
            "updates": _get_commission_updates(supabase, commission["id"]),
        }
        enriched.append(item)

    return {"commissions": enriched}


@app.get("/api/admin/commissions")
async def get_admin_commissions(admin: dict = Depends(require_lead_chitrakar)):
    supabase = get_supabase_client()
    if not supabase:
        return {"commissions": []}

    commissions = (
        supabase.table("commission_requests")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    enriched = []
    for commission in (commissions.data or []):
        user_profile = (
            supabase.table("profiles")
            .select("id, full_name, email")
            .eq("id", commission["user_id"])
            .single()
            .execute()
        )

        artist_profile = None
        artist_requests = (
            supabase.table("artist_requests")
            .select("artist_id, status")
            .eq("commission_id", commission["id"])
            .execute()
        )

        accepted_request = next((r for r in (artist_requests.data or []) if r.get("status") == "accepted"), None)
        active_artist_id = accepted_request.get("artist_id") if accepted_request else None
        if active_artist_id:
            artist_profile = (
                supabase.table("profiles")
                .select("id, full_name, email")
                .eq("id", active_artist_id)
                .single()
                .execute()
            )

        deal = (
            supabase.table("commission_deals")
            .select("*")
            .eq("commission_id", commission["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        deal_row = deal.data[0] if deal.data else None

        item = {
            "id": commission.get("id"),
            "art_category": commission.get("category"),
            "medium": commission.get("medium"),
            "budget": commission.get("budget"),
            "deadline": commission.get("deadline"),
            "status": _compute_commission_display_status(commission, deal_row),
            "user": user_profile.data if user_profile else None,
            "artist": artist_profile.data if artist_profile else None,
            "artist_requests": artist_requests.data or [],
            "updates": _get_commission_updates(supabase, commission["id"]),
        }
        enriched.append(item)

    return {"commissions": enriched}


@app.post("/api/artist/commissions/{commission_id}/update")
async def update_commission_by_artist(
    commission_id: str,
    payload: CommissionArtistUpdate,
    artist: dict = Depends(require_artist),
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    deal_res = (
        supabase.table("commission_deals")
        .select("*")
        .eq("artist_id", artist["id"])
        .eq("commission_id", commission_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not deal_res.data:
        raise HTTPException(status_code=404, detail="Commission deal not found for this artist")

    commission_res = (
        supabase.table("commission_requests")
        .select("*")
        .eq("id", commission_id)
        .single()
        .execute()
    )
    if not commission_res.data:
        raise HTTPException(status_code=404, detail="Commission not found")

    if payload.status not in COMMISSION_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid commission status")

    current_status = _compute_commission_display_status(commission_res.data, deal_res.data[0])
    if current_status == "Delivered":
        raise HTTPException(status_code=400, detail="Delivered commission cannot be updated")

    deal_status = COMMISSION_STATUS_TO_DEAL.get(payload.status, "in_progress")
    update_doc = {
        "status": deal_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.image_url:
        update_doc["latest_update_image"] = payload.image_url
    if payload.note:
        update_doc["latest_update_note"] = payload.note

    supabase.table("commission_deals").update(update_doc).eq("id", deal_res.data[0]["id"]).execute()

    request_update = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.status == "Delivered":
        request_update["status"] = "closed"
    elif payload.status in ["Accepted", "In Progress", "WIP Shared", "Completed"]:
        request_update["status"] = "locked"
    supabase.table("commission_requests").update(request_update).eq("id", commission_id).execute()

    status_update = {
        "commission_id": commission_id,
        "artist_id": artist["id"],
        "image_url": payload.image_url,
        "note": payload.note,
        "previous_status": current_status,
        "new_status": payload.status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    inserted_update = supabase.table("commission_updates").insert(status_update).execute()

    return {
        "success": True,
        "message": "Commission update posted",
        "update": inserted_update.data[0] if inserted_update.data else status_update,
    }


@app.post("/api/admin/commissions/action")
async def admin_action_on_commission(
    payload: CommissionAdminAction,
    admin: dict = Depends(require_lead_chitrakar),
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    commission_res = (
        supabase.table("commission_requests")
        .select("*")
        .eq("id", payload.commission_id)
        .single()
        .execute()
    )
    if not commission_res.data:
        raise HTTPException(status_code=404, detail="Commission not found")

    request_update = {"updated_at": datetime.now(timezone.utc).isoformat()}

    if payload.artist_id:
        artist = (
            supabase.table("profiles")
            .select("id, role")
            .eq("id", payload.artist_id)
            .single()
            .execute()
        )
        if not artist.data or artist.data.get("role") != "artist":
            raise HTTPException(status_code=404, detail="Artist not found")

        existing_artist_request = (
            supabase.table("artist_requests")
            .select("id")
            .eq("commission_id", payload.commission_id)
            .eq("artist_id", payload.artist_id)
            .execute()
        )
        if not existing_artist_request.data:
            supabase.table("artist_requests").insert(
                {
                    "commission_id": payload.commission_id,
                    "artist_id": payload.artist_id,
                    "status": "pending",
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                }
            ).execute()

    if payload.status:
        if payload.status not in COMMISSION_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid commission status")
        if payload.status in ["Accepted", "In Progress", "WIP Shared", "Completed", "Delivered"]:
            request_update["status"] = "locked" if payload.status != "Delivered" else "closed"

    if payload.admin_note:
        request_update["admin_note"] = payload.admin_note

    supabase.table("commission_requests").update(request_update).eq("id", payload.commission_id).execute()

    if payload.status and payload.artist_id:
        existing_deal = (
            supabase.table("commission_deals")
            .select("id")
            .eq("commission_id", payload.commission_id)
            .eq("artist_id", payload.artist_id)
            .execute()
        )
        deal_status = COMMISSION_STATUS_TO_DEAL.get(payload.status, "accepted")
        deal_payload = {
            "commission_id": payload.commission_id,
            "artist_id": payload.artist_id,
            "status": deal_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if existing_deal.data:
            supabase.table("commission_deals").update(deal_payload).eq("id", existing_deal.data[0]["id"]).execute()
        else:
            deal_payload["created_at"] = datetime.now(timezone.utc).isoformat()
            supabase.table("commission_deals").insert(deal_payload).execute()

    if payload.status:
        supabase.table("commission_updates").insert(
            {
                "commission_id": payload.commission_id,
                "artist_id": payload.artist_id,
                "note": payload.admin_note,
                "previous_status": _compute_commission_display_status(commission_res.data, None),
                "new_status": payload.status,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()

    return {"success": True, "message": "Commission updated by admin"}


@app.post("/api/artist/commission-requests/{artist_request_id}/respond")
async def respond_to_artist_request(
    artist_request_id: str,
    payload: ArtistRequestResponse,
    artist: dict = Depends(require_artist),
):
    """Artist can accept/counter/reject an incoming commission request."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    if payload.action not in ["accept_offer", "counter_offer", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    request_res = (
        supabase.table("artist_requests")
        .select("*")
        .eq("id", artist_request_id)
        .eq("artist_id", artist["id"])
        .single()
        .execute()
    )
    if not request_res.data:
        raise HTTPException(status_code=404, detail="Artist request not found")

    artist_request = request_res.data
    commission_id = artist_request["commission_id"]

    if payload.action == "reject":
        supabase.table("artist_requests").update({"status": "rejected"}).eq("id", artist_request_id).execute()
        return {"success": True, "message": "Request rejected"}

    if payload.action == "counter_offer":
        if not payload.counter_offer or payload.counter_offer <= 0:
            raise HTTPException(status_code=400, detail="counter_offer is required")
        supabase.table("artist_requests").update(
            {"status": "pending", "counter_offer": payload.counter_offer}
        ).eq("id", artist_request_id).execute()
        return {"success": True, "message": "Counter offer sent"}

    # accept_offer flow
    existing_accepted = (
        supabase.table("artist_requests")
        .select("id")
        .eq("commission_id", commission_id)
        .eq("status", "accepted")
        .execute()
    )
    if existing_accepted.data and existing_accepted.data[0]["id"] != artist_request_id:
        raise HTTPException(status_code=400, detail="Another artist already accepted this commission")

    now_iso = datetime.now(timezone.utc).isoformat()
    supabase.table("artist_requests").update(
        {"status": "accepted", "accepted_at": now_iso}
    ).eq("id", artist_request_id).execute()

    supabase.table("artist_requests").update(
        {"status": "expired"}
    ).eq("commission_id", commission_id).neq("id", artist_request_id).eq("status", "pending").execute()

    final_price = payload.counter_offer or artist_request.get("offer_price")
    if not final_price:
        commission_req = (
            supabase.table("commission_requests")
            .select("estimated_price")
            .eq("id", commission_id)
            .single()
            .execute()
        )
        final_price = (commission_req.data or {}).get("estimated_price")

    existing_deal = (
        supabase.table("commission_deals")
        .select("id")
        .eq("commission_id", commission_id)
        .execute()
    )

    deal_payload = {
        "commission_id": commission_id,
        "artist_id": artist["id"],
        "final_price": final_price,
        "status": "accepted",
        "updated_at": now_iso,
    }
    if existing_deal.data:
        supabase.table("commission_deals").update(deal_payload).eq("id", existing_deal.data[0]["id"]).execute()
    else:
        deal_payload["created_at"] = now_iso
        supabase.table("commission_deals").insert(deal_payload).execute()

    supabase.table("commission_requests").update({"status": "locked", "updated_at": now_iso}).eq("id", commission_id).execute()

    supabase.table("commission_updates").insert(
        {
            "commission_id": commission_id,
            "artist_id": artist["id"],
            "note": "Artist accepted the commission",
            "previous_status": "Requested",
            "new_status": "Accepted",
            "created_at": now_iso,
        }
    ).execute()

    return {"success": True, "message": "Commission accepted and locked"}

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
async def get_admin_dashboard(admin: dict = Depends(require_lead_chitrakar)):
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
async def get_pending_artists(admin: dict = Depends(require_lead_chitrakar)):
    """Get artists awaiting approval"""
    supabase = get_supabase_client()
    
    artists = supabase.table('profiles').select('*').eq('role', 'artist').eq('is_approved', False).execute()
    
    return {"artists": artists.data or []}

@app.post("/api/admin/approve-artist")
async def approve_artist(artist_id: str, approved: bool, admin: dict = Depends(require_lead_chitrakar)):
    """Approve or reject an artist"""
    supabase = get_supabase_client()
    
    if approved:
        result = supabase.table('profiles').update({"is_approved": True, "is_active": True}).eq('id', artist_id).execute()
    else:
        result = supabase.table('profiles').delete().eq('id', artist_id).execute()
    
    return {"success": True, "message": f"Artist {'approved' if approved else 'rejected'}"}

@app.get("/api/admin/pending-artworks")
async def get_pending_artworks(admin: dict = Depends(require_lead_chitrakar)):
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
async def approve_artwork(request: ArtworkApprovalRequest, admin: dict = Depends(require_lead_chitrakar)):
    """Approve or reject an artwork"""
    supabase = get_supabase_client()
    
    if request.approved:
        result = supabase.table('artworks').update({"is_approved": True}).eq('id', request.artwork_id).execute()
    else:
        result = supabase.table('artworks').delete().eq('id', request.artwork_id).execute()
    
    return {"success": True, "message": f"Artwork {'approved' if request.approved else 'rejected'}"}

@app.get("/api/admin/pending-exhibitions")
async def get_pending_exhibitions(admin: dict = Depends(require_lead_chitrakar)):
    """Get exhibitions awaiting approval"""
    supabase = get_supabase_client()

    pending_approval = supabase.table('exhibitions').select('*, profiles!artist_id(full_name)').eq('is_approved', False).execute()
    
    # Try to get pending artist actions, but handle missing column gracefully
    pending_actions_data = []
    try:
        pending_actions = supabase.table('exhibitions').select('*, profiles!artist_id(full_name)').eq('artist_action_status', 'pending').execute()
        pending_actions_data = pending_actions.data or []
    except Exception as e:
        # Column might not exist - skip this query
        print(f"artist_action_status query skipped: {e}")

    merged = {}
    for row in (pending_approval.data or []):
        merged[row['id']] = row
    for row in pending_actions_data:
        merged[row['id']] = row

    return {"exhibitions": list(merged.values())}

@app.post("/api/admin/approve-exhibition")
async def approve_exhibition(request: ExhibitionApprovalRequest, admin: dict = Depends(require_lead_chitrakar)):
    """Approve or reject an exhibition"""
    supabase = get_supabase_client()
    
    if request.approved:
        update_payload = {
            "is_approved": True,
            "status": "upcoming",
            "payment_status": "approved_manual",
            "request_status": "approved",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            result = supabase.table('exhibitions').update(update_payload).eq('id', request.exhibition_id).execute()
        except Exception as e:
            msg = str(e)
            fallback = dict(update_payload)
            for optional_field in ["payment_status", "request_status", "updated_at"]:
                if optional_field in fallback and (optional_field in msg or "column" in msg.lower()):
                    fallback.pop(optional_field, None)
            result = supabase.table('exhibitions').update(fallback).eq('id', request.exhibition_id).execute()

        try:
            _sync_exhibition_statuses(supabase)
        except Exception:
            pass
    else:
        reject_payload = {
            "is_approved": False,
            "status": "rejected",
            "request_status": "rejected",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            result = supabase.table('exhibitions').update(reject_payload).eq('id', request.exhibition_id).execute()
        except Exception as e:
            msg = str(e)
            fallback = {"is_approved": False, "status": "rejected"}
            if "request_status" in msg.lower():
                fallback.pop("request_status", None)
            result = supabase.table('exhibitions').update(fallback).eq('id', request.exhibition_id).execute()
    
    return {"success": True, "message": f"Exhibition {'approved' if request.approved else 'rejected'}"}


@app.post("/api/admin/exhibitions/review-action")
async def review_exhibition_action(request: AdminExhibitionActionReviewRequest, admin: dict = Depends(require_lead_chitrakar)):
    """Admin reviews artist pause/delete request for exhibitions."""
    supabase = get_supabase_client()

    exhibition = supabase.table('exhibitions').select('*').eq('id', request.exhibition_id).single().execute()
    if not exhibition.data:
        raise HTTPException(status_code=404, detail="Exhibition not found")

    action = exhibition.data.get('artist_action_request')
    if action not in ['pause', 'delete']:
        raise HTTPException(status_code=400, detail="No pending artist action request")

    if request.approved:
        next_status = 'paused' if action == 'pause' else 'deleted'
        update_payload = {
            "status": next_status,
            "artist_action_status": "approved",
            "artist_action_admin_note": request.admin_note,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    else:
        update_payload = {
            "artist_action_status": "rejected",
            "artist_action_admin_note": request.admin_note,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    try:
        supabase.table('exhibitions').update(update_payload).eq('id', request.exhibition_id).execute()
    except Exception:
        fallback = {k: v for k, v in update_payload.items() if k in ['status', 'artist_action_status']}
        supabase.table('exhibitions').update(fallback).eq('id', request.exhibition_id).execute()

    return {"success": True, "message": "Exhibition action reviewed"}

@app.get("/api/admin/all-users")
async def get_all_users(admin: dict = Depends(require_lead_chitrakar)):
    """Get all users"""
    supabase = get_supabase_client()
    
    users = supabase.table('profiles').select('*').execute()
    
    return {"users": users.data or []}

@app.get("/api/admin/approved-artists")
async def get_approved_artists(admin: dict = Depends(require_lead_chitrakar)):
    """Get approved artists for featuring"""
    supabase = get_supabase_client()
    
    artists = supabase.table('profiles').select('*').eq('role', 'artist').eq('is_approved', True).execute()
    
    return {"artists": artists.data or []}

@app.get("/api/admin/featured-artists")
async def get_admin_featured_artists(admin: dict = Depends(require_lead_chitrakar)):
    """Get all featured artists for admin"""
    supabase = get_supabase_client()
    
    # Get all featured artists
    all_featured = supabase.table('featured_artists').select('*').execute()
    
    contemporary = [a for a in (all_featured.data or []) if a.get('type') == 'contemporary']
    registered = [a for a in (all_featured.data or []) if a.get('type') == 'registered']
    paid = [a for a in (all_featured.data or []) if a.get('type') == 'paid']
    
    return {
        "contemporary": contemporary,
        "registered": registered,
        "paid": paid,
        "all": all_featured.data or []
    }

@app.post("/api/admin/feature-contemporary-artist")
async def feature_contemporary_artist(artist_data: FeaturedArtistCreate, admin: dict = Depends(require_lead_chitrakar)):
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
async def delete_contemporary_artist(artist_id: str, admin: dict = Depends(require_lead_chitrakar)):
    """Remove a contemporary featured artist"""
    supabase = get_supabase_client()
    
    result = supabase.table('featured_artists').delete().eq('id', artist_id).execute()
    
    return {"success": True, "message": "Featured artist removed"}

@app.post("/api/admin/feature-registered-artist")
async def feature_registered_artist(request: FeatureRegisteredArtistRequest, admin: dict = Depends(require_lead_chitrakar)):
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
        
        # Also update the profiles table
        supabase.table('profiles').update({"is_featured": True}).eq('id', request.artist_id).execute()
    else:
        # Remove from featured
        result = supabase.table('featured_artists').delete().eq('artist_id', request.artist_id).execute()
        
        # Also update the profiles table
        supabase.table('profiles').update({"is_featured": False}).eq('id', request.artist_id).execute()
    
    return {"success": True, "message": f"Artist {'featured' if request.featured else 'unfeatured'}"}

# ============ FEATURED REQUEST SYSTEM ============

@app.post("/api/artist/request-featured")
async def request_featured(request: FeaturedRequest, user: dict = Depends(require_user)):
    """Artist requests to be featured (after payment)"""
    supabase = get_supabase_client()
    
    # Check if artist already has a pending request
    existing = supabase.table('featured_requests').select('*').eq('artist_id', user['id']).eq('status', 'pending').execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="You already have a pending featured request")
    
    # Check if already featured
    featured = supabase.table('featured_artists').select('id').eq('artist_id', user['id']).execute()
    if featured.data:
        raise HTTPException(status_code=400, detail="You are already a featured artist")
    
    # Create featured request
    request_data = {
        "artist_id": user['id'],
        "payment_reference": request.payment_reference,
        "duration_days": request.duration_days,
        "amount": 100,  # ₹100 fixed fee
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    result = supabase.table('featured_requests').insert(request_data).execute()
    
    return {"success": True, "message": "Featured request submitted. Admin will review shortly.", "request_id": result.data[0]['id'] if result.data else None}

@app.get("/api/artist/featured-request-status")
async def get_featured_request_status(user: dict = Depends(require_user)):
    """Get artist's featured request status"""
    supabase = get_supabase_client()
    
    request = supabase.table('featured_requests').select('*').eq('artist_id', user['id']).order('created_at', desc=True).limit(1).execute()
    
    # Check if currently featured
    featured = supabase.table('featured_artists').select('id, created_at, expires_at').eq('artist_id', user['id']).execute()
    
    return {
        "request": request.data[0] if request.data else None,
        "is_featured": len(featured.data) > 0,
        "featured_until": featured.data[0].get('expires_at') if featured.data else None
    }

@app.get("/api/admin/featured-requests")
async def get_featured_requests(admin: dict = Depends(require_lead_chitrakar)):
    """Admin gets all pending featured requests"""
    supabase = get_supabase_client()
    
    try:
        # Try with foreign key join first
        requests = supabase.table('featured_requests').select('*, profiles(full_name, avatar, email)').eq('status', 'pending').order('created_at', desc=True).execute()
        return {"requests": requests.data or []}
    except Exception as e:
        # Fallback: fetch without join, then manually add profile data
        print(f"featured_requests join failed, using fallback: {e}")
        requests = supabase.table('featured_requests').select('*').eq('status', 'pending').order('created_at', desc=True).execute()
        
        result = []
        for req in (requests.data or []):
            artist_id = req.get('artist_id')
            profile_data = None
            if artist_id:
                try:
                    profile = supabase.table('profiles').select('full_name, avatar, email').eq('id', artist_id).single().execute()
                    profile_data = profile.data
                except:
                    pass
            result.append({**req, "profiles": profile_data})
        
        return {"requests": result}

@app.post("/api/admin/approve-featured-request")
async def approve_featured_request(request: FeaturedRequestApproval, admin: dict = Depends(require_lead_chitrakar)):
    """Admin approves or rejects featured request"""
    supabase = get_supabase_client()
    
    # Get the request
    req = supabase.table('featured_requests').select('*').eq('id', request.request_id).single().execute()
    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.approved:
        # Get artist details
        artist = supabase.table('profiles').select('*').eq('id', req.data['artist_id']).single().execute()
        if not artist.data:
            raise HTTPException(status_code=404, detail="Artist not found")
        
        # Get artist's artworks
        artworks = supabase.table('artworks').select('*').eq('artist_id', req.data['artist_id']).eq('is_approved', True).order('views', desc=True).limit(10).execute()
        
        # Calculate expiry (5 days from now)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=req.data.get('duration_days', 5))).isoformat()
        
        # Create featured entry
        featured_artist = {
            "name": artist.data['full_name'],
            "bio": artist.data.get('bio', ''),
            "avatar": artist.data.get('avatar'),
            "categories": artist.data.get('categories', []),
            "location": artist.data.get('location'),
            "artworks": artworks.data or [],
            "type": "paid",
            "artist_id": req.data['artist_id'],
            "is_featured": True,
            "expires_at": expires_at,
            "paid_amount": req.data.get('amount', 100),
        }
        
        supabase.table('featured_artists').insert(featured_artist).execute()
        
        # Update profiles
        supabase.table('profiles').update({"is_featured": True}).eq('id', req.data['artist_id']).execute()
        
        # Update request status
        supabase.table('featured_requests').update({
            "status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin['id'],
            "expires_at": expires_at,
        }).eq('id', request.request_id).execute()
        
        return {"success": True, "message": "Featured request approved", "expires_at": expires_at}
    else:
        # Reject request
        supabase.table('featured_requests').update({
            "status": "rejected",
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": request.rejection_reason,
        }).eq('id', request.request_id).execute()
        
        return {"success": True, "message": "Featured request rejected"}

@app.delete("/api/admin/remove-featured/{artist_id}")
async def admin_remove_featured(artist_id: str, admin: dict = Depends(require_lead_chitrakar)):
    """Admin manually removes featured artist"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Try to remove by artist_id first (for registered artists)
        result = supabase.table('featured_artists').delete().eq('artist_id', artist_id).execute()
        
        # If nothing was deleted, try by id (for contemporary artists)
        if not result.data or len(result.data) == 0:
            result = supabase.table('featured_artists').delete().eq('id', artist_id).execute()
        
        # Update profiles if artist_id exists
        try:
            supabase.table('profiles').update({"is_featured": False}).eq('id', artist_id).execute()
        except:
            pass  # Ignore if profile doesn't exist (contemporary artists)
        
        return {"success": True, "message": "Artist removed from featured"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove featured artist: {str(e)}")

# Background task to auto-expire featured artists (called via cron or on each request)
@app.get("/api/system/cleanup-expired-featured")
async def cleanup_expired_featured():
    """Remove expired featured artists"""
    supabase = get_supabase_client()
    if not supabase:
        return {"cleaned": 0}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Find expired featured artists
    expired = supabase.table('featured_artists').select('id, artist_id').lt('expires_at', now).execute()
    
    if expired.data:
        for artist in expired.data:
            # Remove from featured
            supabase.table('featured_artists').delete().eq('id', artist['id']).execute()
            # Update profile
            supabase.table('profiles').update({"is_featured": False}).eq('id', artist['artist_id']).execute()
    
    return {"cleaned": len(expired.data) if expired.data else 0}

@app.post("/api/admin/create-sub-admin")
async def create_sub_admin(request: CreateSubAdminRequest, admin: dict = Depends(require_lead_chitrakar)):
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
async def get_sub_admins(admin: dict = Depends(require_lead_chitrakar)):
    """Get all sub-admin users"""
    supabase = get_supabase_client()
    
    sub_admins = supabase.table('profiles').select('*').in_('role', ['lead_chitrakar', 'kalakar']).execute()
    
    return {"sub_admins": sub_admins.data or []}

# Admin Community Management
@app.get("/api/admin/pending-communities")
async def get_pending_communities(admin: dict = Depends(require_lead_chitrakar)):
    """Get pending communities for approval (admin or lead_chitrakar)"""
    supabase = get_supabase_client()
    
    print(f"[DEBUG] Fetching pending communities for user: {admin.get('id')} role: {admin.get('role')}")

    communities = supabase.table('communities').select('*').eq('is_approved', False).order('created_at', desc=True).execute()
    
    print(f"[DEBUG] Found {len(communities.data or [])} pending communities")

    result = []
    for community in (communities.data or []):
        creator_id = community.get('created_by') or community.get('creator_id')
        creator_name = None
        if creator_id:
            try:
                profile = supabase.table('profiles').select('full_name').eq('id', creator_id).single().execute()
                creator_name = (profile.data or {}).get('full_name')
            except Exception:
                creator_name = None

        result.append({
            **community,
            "creator_name": creator_name,
        })

    return {"communities": result}

@app.post("/api/admin/approve-community")
async def approve_community(community_id: str, approved: bool, admin: dict = Depends(require_lead_chitrakar)):
    """Approve or reject a community (admin or lead_chitrakar)"""
    supabase = get_supabase_client()
    
    if approved:
        supabase.table('communities').update({"is_approved": True}).eq('id', community_id).execute()
    else:
        supabase.table('communities').delete().eq('id', community_id).execute()
    
    return {"success": True, "message": f"Community {'approved' if approved else 'rejected'}"}

# Admin Profile Modifications
@app.get("/api/admin/pending-profile-modifications")
async def get_pending_profile_modifications(admin: dict = Depends(require_lead_chitrakar)):
    """Get pending profile modification requests"""
    supabase = get_supabase_client()
    
    modifications = supabase.table('profile_modifications').select('*, profiles!user_id(full_name, email, phone)').eq('status', 'pending').execute()
    
    return {"modifications": modifications.data or []}

@app.post("/api/admin/approve-profile-modification")
async def approve_profile_modification(modification_id: str, approved: bool, admin: dict = Depends(require_lead_chitrakar)):
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

# ============ ADMIN ARTIST MANAGEMENT (Members vs Non-Members) ============

@app.get("/api/admin/artists-by-membership")
async def get_artists_by_membership(admin: dict = Depends(require_lead_chitrakar)):
    """Get all artists separated by membership status"""
    supabase = get_supabase_client()
    
    # Get all approved artists
    artists = supabase.table('profiles').select('*').eq('role', 'artist').eq('is_approved', True).execute()
    
    members = []
    non_members = []
    now = datetime.now(timezone.utc)
    
    for artist in (artists.data or []):
        # Check membership status
        is_active_member = False
        if artist.get('is_member') and artist.get('membership_expiry'):
            try:
                expiry = datetime.fromisoformat(artist['membership_expiry'].replace('Z', '+00:00'))
                is_active_member = expiry > now
            except:
                pass
        
        artist_data = {
            "id": artist.get("id"),
            "full_name": artist.get("full_name"),
            "email": artist.get("email"),
            "phone": artist.get("phone"),
            "bio": artist.get("bio"),
            "categories": artist.get("categories"),
            "location": artist.get("location"),
            "avatar": artist.get("avatar"),
            "is_member": is_active_member,
            "membership_expiry": artist.get("membership_expiry"),
            "membership_plan": artist.get("membership_plan"),
            "created_at": artist.get("created_at"),
            "role": artist.get("role"),
            "is_active": artist.get("is_active")
        }
        
        if is_active_member:
            members.append(artist_data)
        else:
            non_members.append(artist_data)
    
    return {
        "members": members,
        "non_members": non_members,
        "total_members": len(members),
        "total_non_members": len(non_members)
    }

class UpdateUserRoleRequest(BaseModel):
    user_id: str
    new_role: str  # 'user', 'artist', 'admin', 'lead_chitrakar', 'kalakar'

@app.post("/api/admin/update-user-role")
async def update_user_role(request: UpdateUserRoleRequest, admin: dict = Depends(require_lead_chitrakar)):
    """Admin can change user roles"""
    supabase = get_supabase_client()
    
    valid_roles = ['user', 'artist', 'admin', 'lead_chitrakar', 'kalakar']
    if request.new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Prevent demoting self
    if request.user_id == admin['id'] and request.new_role != 'admin':
        raise HTTPException(status_code=400, detail="Cannot change your own admin role")
    
    result = supabase.table('profiles').update({
        "role": request.new_role,
        "is_approved": True if request.new_role in ['admin', 'lead_chitrakar', 'kalakar'] else None
    }).eq('id', request.user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": f"User role updated to {request.new_role}"}

class GrantMembershipRequest(BaseModel):
    artist_id: str
    plan: str  # 'basic', 'premium', 'annual'
    duration_days: int = 30

@app.post("/api/admin/grant-membership")
async def admin_grant_membership(request: GrantMembershipRequest, admin: dict = Depends(require_lead_chitrakar)):
    """Admin can grant membership to an artist"""
    supabase = get_supabase_client()
    
    expiry_date = datetime.now(timezone.utc) + timedelta(days=request.duration_days)
    
    result = supabase.table('profiles').update({
        "is_member": True,
        "membership_plan": request.plan,
        "membership_started_at": datetime.now(timezone.utc).isoformat(),
        "membership_expiry": expiry_date.isoformat()
    }).eq('id', request.artist_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    return {"success": True, "message": f"Membership granted until {expiry_date.strftime('%Y-%m-%d')}"}

@app.post("/api/admin/revoke-membership")
async def admin_revoke_membership(artist_id: str, admin: dict = Depends(require_lead_chitrakar)):
    """Admin can revoke membership from an artist"""
    supabase = get_supabase_client()
    
    result = supabase.table('profiles').update({
        "is_member": False,
        "membership_expiry": None
    }).eq('id', artist_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    return {"success": True, "message": "Membership revoked"}

@app.post("/api/admin/toggle-user-status")
async def toggle_user_status(user_id: str, admin: dict = Depends(require_lead_chitrakar)):
    """Admin can activate/deactivate users"""
    supabase = get_supabase_client()
    
    # Get current status
    user = supabase.table('profiles').select('is_active').eq('id', user_id).single().execute()
    
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.data.get('is_active', True)
    
    supabase.table('profiles').update({"is_active": new_status}).eq('id', user_id).execute()
    
    return {"success": True, "message": f"User {'activated' if new_status else 'deactivated'}", "is_active": new_status}

# ============ PRICING & VOUCHER MANAGEMENT ============

@app.get("/api/admin/membership-plans")
async def get_membership_plans(admin: dict = Depends(require_lead_chitrakar)):
    """Get all membership plans"""
    supabase = get_supabase_client()
    
    try:
        plans = supabase.table('membership_plans').select('*').order('price').execute()
        return {"plans": plans.data or []}
    except:
        # Return default plans if table doesn't exist
        return {"plans": [
            {"id": "basic", "name": "Basic", "price": 999, "duration_days": 30, "features": ["Appear in Artists Directory", "Upload up to 10 artworks", "Basic portfolio page", "Email support"], "is_active": True},
            {"id": "premium", "name": "Premium", "price": 2499, "duration_days": 90, "features": ["Everything in Basic", "Upload unlimited artworks", "Featured artist placement", "Priority support", "Analytics dashboard"], "is_active": True},
            {"id": "annual", "name": "Annual", "price": 7999, "duration_days": 365, "features": ["Everything in Premium", "Custom portfolio URL", "Exhibition priority", "Dedicated account manager", "Marketing features", "2 months FREE"], "is_active": True}
        ]}

@app.post("/api/admin/update-membership-plan")
async def update_membership_plan(plan: MembershipPlanUpdate, admin: dict = Depends(require_lead_chitrakar)):
    """Update a membership plan"""
    supabase = get_supabase_client()
    
    plan_data = {
        "id": plan.plan_id,
        "name": plan.name,
        "price": plan.price,
        "duration_days": plan.duration_days,
        "features": plan.features,
        "is_active": plan.is_active,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin['id']
    }
    
    # Upsert the plan
    result = supabase.table('membership_plans').upsert(plan_data).execute()
    
    return {"success": True, "message": f"Plan {plan.name} updated successfully", "plan": result.data[0] if result.data else plan_data}

@app.get("/api/admin/vouchers")
async def get_vouchers(admin: dict = Depends(require_lead_chitrakar)):
    """Get all vouchers"""
    supabase = get_supabase_client()
    
    try:
        vouchers = supabase.table('vouchers').select('*').order('created_at', desc=True).execute()
        return {"vouchers": vouchers.data or []}
    except:
        return {"vouchers": []}

@app.post("/api/admin/create-voucher")
async def create_voucher(voucher: VoucherCreate, admin: dict = Depends(require_lead_chitrakar)):
    """Create a new voucher"""
    supabase = get_supabase_client()
    
    voucher_data = {
        "code": voucher.code.upper(),
        "discount_type": voucher.discount_type,
        "discount_value": voucher.discount_value,
        "valid_from": voucher.valid_from,
        "valid_until": voucher.valid_until,
        "max_uses": voucher.max_uses,
        "current_uses": 0,
        "applicable_plans": voucher.applicable_plans,
        "description": voucher.description,
        "is_active": True,
        "created_by": admin['id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table('vouchers').insert(voucher_data).execute()
    
    return {"success": True, "message": f"Voucher {voucher.code} created", "voucher": result.data[0] if result.data else voucher_data}

@app.delete("/api/admin/voucher/{voucher_id}")
async def delete_voucher(voucher_id: str, admin: dict = Depends(require_lead_chitrakar)):
    """Delete a voucher"""
    supabase = get_supabase_client()
    
    supabase.table('vouchers').delete().eq('id', voucher_id).execute()
    
    return {"success": True, "message": "Voucher deleted"}

@app.post("/api/admin/toggle-voucher/{voucher_id}")
async def toggle_voucher(voucher_id: str, admin: dict = Depends(require_lead_chitrakar)):
    """Toggle voucher active status"""
    supabase = get_supabase_client()
    
    voucher = supabase.table('vouchers').select('is_active').eq('id', voucher_id).single().execute()
    
    if not voucher.data:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    new_status = not voucher.data.get('is_active', True)
    supabase.table('vouchers').update({"is_active": new_status}).eq('id', voucher_id).execute()
    
    return {"success": True, "is_active": new_status}

@app.post("/api/public/apply-voucher")
async def apply_voucher(request: VoucherApply):
    """Apply a voucher code and get discount"""
    supabase = get_supabase_client()
    
    # Find voucher
    voucher = supabase.table('vouchers').select('*').eq('code', request.voucher_code.upper()).eq('is_active', True).single().execute()
    
    if not voucher.data:
        raise HTTPException(status_code=404, detail="Invalid or expired voucher code")
    
    v = voucher.data
    now = datetime.now(timezone.utc)
    
    # Check validity
    valid_from = datetime.fromisoformat(v['valid_from'].replace('Z', '+00:00'))
    valid_until = datetime.fromisoformat(v['valid_until'].replace('Z', '+00:00'))
    
    if now < valid_from or now > valid_until:
        raise HTTPException(status_code=400, detail="Voucher is not valid at this time")
    
    if v['current_uses'] >= v['max_uses']:
        raise HTTPException(status_code=400, detail="Voucher has reached maximum uses")
    
    # Check if applicable to plan
    if v['applicable_plans'] and request.plan_id not in v['applicable_plans']:
        raise HTTPException(status_code=400, detail="Voucher is not applicable to this plan")
    
    return {
        "success": True,
        "discount_type": v['discount_type'],
        "discount_value": v['discount_value'],
        "description": v['description'],
        "code": v['code']
    }

# ============ TRENDING ARTISTS ============

@app.get("/api/public/trending-artists")
async def get_trending_artists():
    """Get trending artists based on artwork views and sales"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"artists": [], "period": "This Week"}
    
    try:
        # Get artists with their artwork stats
        # Calculate trending score based on views and sales
        artists_query = supabase.table('profiles').select(
            'id, full_name, bio, categories, location, avatar, is_member, membership_expiry'
        ).eq('role', 'artist').eq('is_approved', True).eq('is_active', True).execute()
        
        if not artists_query.data:
            return {"artists": [], "period": "This Week"}
        
        trending_artists = []
        now = datetime.now(timezone.utc)
        
        for artist in artists_query.data:
            # Only include artists with active membership
            is_active_member = False
            if artist.get('is_member') and artist.get('membership_expiry'):
                try:
                    expiry = datetime.fromisoformat(artist['membership_expiry'].replace('Z', '+00:00'))
                    is_active_member = expiry > now
                except:
                    pass
            
            if not is_active_member:
                continue
            
            # Get artwork stats for this artist
            artworks = supabase.table('artworks').select(
                'id, views, title, image, images, price'
            ).eq('artist_id', artist['id']).eq('is_approved', True).execute()
            
            total_views = sum(a.get('views', 0) for a in (artworks.data or []))
            artwork_count = len(artworks.data or [])
            
            # Get sales count from orders
            orders = supabase.table('orders').select('id').eq('artist_id', artist['id']).execute()
            sales_count = len(orders.data or [])
            
            # Calculate trending score (views * 1 + sales * 10)
            trending_score = total_views + (sales_count * 10)
            
            if trending_score > 0 or artwork_count > 0:
                # Get top artwork for display
                top_artwork = None
                if artworks.data:
                    sorted_artworks = sorted(artworks.data, key=lambda x: x.get('views', 0), reverse=True)
                    top_artwork = sorted_artworks[0] if sorted_artworks else None
                
                trending_artists.append({
                    "id": artist['id'],
                    "name": artist.get('full_name'),
                    "avatar": artist.get('avatar'),
                    "location": artist.get('location'),
                    "categories": artist.get('categories', []),
                    "bio": artist.get('bio', '')[:150] + '...' if artist.get('bio') and len(artist.get('bio', '')) > 150 else artist.get('bio'),
                    "total_views": total_views,
                    "sales_count": sales_count,
                    "artwork_count": artwork_count,
                    "trending_score": trending_score,
                    "top_artwork": {
                        "title": top_artwork.get('title'),
                        "image": top_artwork.get('images', [None])[0] or top_artwork.get('image'),
                        "price": top_artwork.get('price')
                    } if top_artwork else None
                })
        
        # Sort by trending score and get top 6
        trending_artists.sort(key=lambda x: x['trending_score'], reverse=True)
        top_trending = trending_artists[:6]
        
        return {
            "artists": top_trending,
            "period": "This Week",
            "total_trending": len(trending_artists)
        }
        
    except Exception as e:
        print(f"Trending artists error: {e}")
        return {"artists": [], "period": "This Week"}

# ============ CONTEMPORARY ARTIST OF THE DAY ============

@app.get("/api/public/artist-of-the-day")
async def get_artist_of_the_day():
    """Get the contemporary artist of the day (rotates daily)"""
    supabase = get_supabase_client()
    
    if not supabase:
        return {"artist": None}
    
    try:
        # Get all contemporary featured artists
        artists = supabase.table('featured_artists').select('*').eq('type', 'contemporary').eq('is_featured', True).execute()
        
        if not artists.data:
            return {"artist": None}
        
        # Use day of year to rotate through artists
        day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
        index = day_of_year % len(artists.data)
        
        artist = artists.data[index]
        
        return {
            "artist": artist,
            "rotation_info": {
                "total_artists": len(artists.data),
                "current_index": index,
                "next_rotation": "Tomorrow"
            }
        }
    except Exception as e:
        print(f"Artist of the day error: {e}")
        return {"artist": None}

# ============ COMMUNITY MANAGEMENT ============

@app.post("/api/community/create")
async def create_community_managed(community: CommunityCreate, artist: dict = Depends(require_artist)):
    """Create a new community (requires membership)"""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    # Check if artist has membership
    profile = supabase.table('profiles').select('is_member, membership_expiry').eq('id', artist['id']).single().execute()
    
    if not profile.data.get('is_member'):
        raise HTTPException(status_code=403, detail="Active membership required to create communities")
    
    # Use only columns that exist in the DB schema
    community_data = {
        "name": community.name,
        "description": community.description,
        "image": community.image,
        "category": community.category,
        "created_by": artist['id'],
        "member_count": 1,
        "is_approved": False,  # Needs admin approval
    }

    # Keep backward compatibility with older table schemas
    result = None
    try:
        result = supabase.table('communities').insert(community_data).execute()
    except Exception as e:
        msg = str(e)
        fallback_data = dict(community_data)
        # Remove optional fields that might not exist
        for optional_field in ["category", "image"]:
            if optional_field in fallback_data:
                fallback_data.pop(optional_field, None)

        try:
            result = supabase.table('communities').insert(fallback_data).execute()
        except Exception as final_error:
            print(f"create_community schema mismatch: {final_error}")
            raise HTTPException(status_code=500, detail="Community table schema mismatch. Please sync columns and retry.")
    
    if result and result.data:
        # Add creator as owner/admin member
        member_payload = {
            "community_id": result.data[0]['id'],
            "user_id": artist['id'],
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            # Try with role column
            member_payload["role"] = "owner"
            supabase.table('community_members').insert(member_payload).execute()
        except Exception as member_error:
            # Fallback without role column
            member_payload.pop("role", None)
            try:
                supabase.table('community_members').insert(member_payload).execute()
            except Exception as e:
                print(f"Failed to add creator as member: {e}")
    
    return {"success": True, "message": "Community created and pending approval", "community": result.data[0] if result and result.data else None}


@app.get("/api/artist/my-communities")
async def get_my_communities(artist: dict = Depends(require_artist)):
    """Get communities created by or joined by the artist"""
    supabase = get_supabase_client()
    
    # Get communities created by the artist
    created = supabase.table('communities').select('*').eq('created_by', artist['id']).order('created_at', desc=True).execute()
    
    # Get communities the artist is a member of
    memberships = supabase.table('community_members').select('community_id').eq('user_id', artist['id']).execute()
    joined_ids = [m['community_id'] for m in (memberships.data or [])]
    
    joined = []
    if joined_ids:
        joined_result = supabase.table('communities').select('*').in_('id', joined_ids).eq('is_approved', True).execute()
        # Exclude communities the artist created
        created_ids = [c['id'] for c in (created.data or [])]
        joined = [c for c in (joined_result.data or []) if c['id'] not in created_ids]
    
    return {
        "created_communities": created.data or [],
        "joined_communities": joined
    }

@app.get("/api/communities")
async def get_communities():
    """Get all approved communities"""
    supabase = get_supabase_client()
    
    communities = supabase.table('communities').select('*, profiles!created_by(full_name, avatar)').eq('is_approved', True).order('member_count', desc=True).execute()
    
    return {"communities": communities.data or []}

@app.get("/api/community/{community_id}")
async def get_community_details(community_id: str):
    """Get community details with recent posts"""
    supabase = get_supabase_client()
    
    community = supabase.table('communities').select('*, profiles!created_by(full_name, avatar)').eq('id', community_id).single().execute()
    
    if not community.data:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Get members
    members = supabase.table('community_members').select('*, profiles!user_id(full_name, avatar, location)').eq('community_id', community_id).order('joined_at').execute()
    
    # Get recent posts
    posts = supabase.table('community_posts').select('*, profiles!user_id(full_name, avatar)').eq('community_id', community_id).order('created_at', desc=True).limit(20).execute()
    
    return {
        "community": community.data,
        "members": members.data or [],
        "posts": posts.data or []
    }

@app.post("/api/community/{community_id}/join")
async def request_to_join_community(community_id: str, artist: dict = Depends(require_artist)):
    """Request to join a community - direct join for approved communities"""
    supabase = get_supabase_client()
    
    # Check if community exists and is approved
    community = supabase.table('communities').select('id, name, is_approved').eq('id', community_id).single().execute()
    if not community.data:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if not community.data.get('is_approved'):
        raise HTTPException(status_code=400, detail="Community is not yet approved")
    
    # Check if already a member
    existing = supabase.table('community_members').select('id').eq('community_id', community_id).eq('user_id', artist['id']).execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member of this community")
    
    # Direct join (no approval needed for approved communities)
    member_data = {
        "community_id": community_id,
        "user_id": artist['id'],
        "joined_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Try to add role column if it exists
    try:
        member_data["role"] = "member"
        supabase.table('community_members').insert(member_data).execute()
    except Exception:
        # Fallback without role
        member_data.pop("role", None)
        supabase.table('community_members').insert(member_data).execute()
    
    # Update member count
    try:
        current = supabase.table('communities').select('member_count').eq('id', community_id).single().execute()
        new_count = (current.data.get('member_count') or 0) + 1
        supabase.table('communities').update({'member_count': new_count}).eq('id', community_id).execute()
    except:
        pass
    
    return {"success": True, "message": f"Successfully joined {community.data.get('name')}"}

@app.get("/api/community/{community_id}/join-requests")
async def get_join_requests(community_id: str, artist: dict = Depends(require_artist)):
    """Get pending join requests for community (admin/creator only)"""
    supabase = get_supabase_client()
    
    # Check if user is admin of community
    member = supabase.table('community_members').select('role').eq('community_id', community_id).eq('user_id', artist['id']).single().execute()
    
    if not member.data or member.data['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only community admins can view join requests")
    
    requests = supabase.table('community_join_requests').select('*, profiles!user_id(full_name, avatar, location, categories)').eq('community_id', community_id).eq('status', 'pending').execute()
    
    return {"requests": requests.data or []}

@app.post("/api/community/{community_id}/approve-join/{request_id}")
async def approve_join_request(community_id: str, request_id: str, approved: bool, artist: dict = Depends(require_artist)):
    """Approve or reject a join request"""
    supabase = get_supabase_client()
    
    # Check if user is admin of community
    member = supabase.table('community_members').select('role').eq('community_id', community_id).eq('user_id', artist['id']).single().execute()
    
    if not member.data or member.data['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only community admins can approve requests")
    
    # Get request
    join_request = supabase.table('community_join_requests').select('*').eq('id', request_id).single().execute()
    
    if not join_request.data:
        raise HTTPException(status_code=404, detail="Join request not found")
    
    if approved:
        # Add member
        supabase.table('community_members').insert({
            "community_id": community_id,
            "user_id": join_request.data['user_id'],
            "role": "member",
            "joined_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Update member count
        supabase.rpc('increment_community_members', {"community_id": community_id}).execute()
    
    # Update request status
    supabase.table('community_join_requests').update({
        "status": "approved" if approved else "rejected",
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "processed_by": artist['id']
    }).eq('id', request_id).execute()
    
    return {"success": True, "message": f"Join request {'approved' if approved else 'rejected'}"}

@app.post("/api/community/{community_id}/invite")
async def invite_to_community(community_id: str, invite: CommunityInvite, artist: dict = Depends(require_artist)):
    """Invite artists to join community"""
    supabase = get_supabase_client()
    
    # Check if user is admin of community
    member = supabase.table('community_members').select('role').eq('community_id', community_id).eq('user_id', artist['id']).single().execute()
    
    if not member.data or member.data['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only community admins can send invites")
    
    invited = 0
    for artist_id in invite.artist_ids:
        # Check if already member
        existing = supabase.table('community_members').select('id').eq('community_id', community_id).eq('user_id', artist_id).execute()
        
        if not existing.data:
            # Create invite
            supabase.table('community_invites').insert({
                "community_id": community_id,
                "user_id": artist_id,
                "invited_by": artist['id'],
                "message": invite.message,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            invited += 1
    
    return {"success": True, "message": f"{invited} invites sent"}

@app.post("/api/community/{community_id}/post")
async def create_community_post(community_id: str, post: CommunityPostCreate, artist: dict = Depends(require_artist)):
    """Create a post in a community"""
    supabase = get_supabase_client()
    
    # Check membership
    member = supabase.table('community_members').select('id').eq('community_id', community_id).eq('user_id', artist['id']).execute()
    
    if not member.data:
        raise HTTPException(status_code=403, detail="Must be a community member to post")
    
    post_data = {
        "community_id": community_id,
        "user_id": artist['id'],
        "content": post.content,
        "images": post.images,
        "post_type": post.post_type,
        "likes": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table('community_posts').insert(post_data).execute()
    
    return {"success": True, "post": result.data[0] if result.data else None}

@app.get("/api/community/my-communities")
async def get_my_communities(artist: dict = Depends(require_artist)):
    """Get communities the artist is a member of"""
    supabase = get_supabase_client()
    
    memberships = supabase.table('community_members').select('community_id, role, communities!community_id(*)').eq('user_id', artist['id']).execute()
    
    return {"communities": memberships.data or []}

@app.get("/api/community/invites")
async def get_my_invites(artist: dict = Depends(require_artist)):
    """Get pending community invites"""
    supabase = get_supabase_client()
    
    invites = supabase.table('community_invites').select('*, communities!community_id(name, image, description)').eq('user_id', artist['id']).eq('status', 'pending').execute()
    
    return {"invites": invites.data or []}

@app.post("/api/community/respond-invite/{invite_id}")
async def respond_to_invite(invite_id: str, accept: bool, artist: dict = Depends(require_artist)):
    """Accept or decline a community invite"""
    supabase = get_supabase_client()
    
    invite = supabase.table('community_invites').select('*').eq('id', invite_id).eq('user_id', artist['id']).single().execute()
    
    if not invite.data:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if accept:
        # Add as member
        supabase.table('community_members').insert({
            "community_id": invite.data['community_id'],
            "user_id": artist['id'],
            "role": "member",
            "joined_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Update member count
        supabase.rpc('increment_community_members', {"community_id": invite.data['community_id']}).execute()
    
    # Update invite status
    supabase.table('community_invites').update({
        "status": "accepted" if accept else "declined",
        "responded_at": datetime.now(timezone.utc).isoformat()
    }).eq('id', invite_id).execute()
    
    return {"success": True, "message": f"Invite {'accepted' if accept else 'declined'}"}

# Admin Video Screenings
@app.get("/api/admin/pending-video-screenings")
async def get_pending_video_screenings(admin: dict = Depends(require_lead_chitrakar)):
    """Get pending video screening requests"""
    supabase = get_supabase_client()
    
    screenings = supabase.table('video_screenings').select('*, artworks!painting_id(title), profiles!user_id(full_name, email)').eq('status', 'pending').execute()
    
    return {"screenings": screenings.data or []}

@app.post("/api/admin/accommodate-video-screening")
async def accommodate_video_screening(screening_id: str, scheduled_date: str, admin: dict = Depends(require_lead_chitrakar)):
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
async def get_admin_chat_messages(admin: dict = Depends(require_lead_chitrakar)):
    """Get chat messages needing admin response"""
    supabase = get_supabase_client()
    
    messages = supabase.table('chat_messages').select('*, profiles!user_id(full_name, email)').eq('needs_admin_review', True).order('created_at', desc=True).execute()
    
    return {"messages": messages.data or []}

@app.post("/api/admin/respond-to-chat")
async def respond_to_chat(message_id: str, response: str, admin: dict = Depends(require_lead_chitrakar)):
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
            "image_display_settings": (artwork.image_display_settings or [])[:8],
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

        try:
            result = supabase.table("artworks").insert(artwork_data).execute()
        except Exception as e:
            # Backward compatibility if column is not yet migrated
            if "image_display_settings" in str(e):
                fallback_data = {k: v for k, v in artwork_data.items() if k != "image_display_settings"}
                result = supabase.table("artworks").insert(fallback_data).execute()
            else:
                raise

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


# AI Pricing Engine
@app.post("/api/artwork/pricing-analysis")
async def analyze_artwork_pricing(request: ArtworkPricingRequest):
    """
    AI-powered artwork pricing analysis.
    Analyzes artwork attributes and provides fair market price estimate.
    """
    import os
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI pricing service not configured")
    
    # System prompt for the Chitrakalakar pricing advisor
    system_prompt = """You are the Chitrakalakar Art Pricing Advisor for an Indian art marketplace.

Your role is to estimate a fair price range for a painting based on its attributes and help maintain transparency between artists and buyers.

Pricing considerations:
1. Larger artworks typically justify higher prices. Base rate: ₹50-150 per square inch depending on medium and skill.
2. Oil paintings command highest prices, followed by acrylic, then watercolor, then charcoal.
3. Hyperrealism or extremely detailed works should increase the price range by 50-100%.
4. Completely original works with no copies should increase value by 20-30%.
5. Professional artists can command 2-3x higher prices than beginners.
6. Material costs and time investment should be factored in.
7. Indian art market prices are typically lower than Western markets.

Output ONLY valid JSON with this exact structure:
{
  "suggested_price_range": {
    "min": number,
    "max": number
  },
  "pricing_evaluation": "fair" | "slightly_high" | "overpriced" | "underpriced",
  "buyer_message": "short explanation for buyers",
  "artist_suggestion": "if price is high, ask artist to justify the premium, otherwise null"
}"""
    
    # Build the analysis prompt
    analysis_prompt = f"""Analyze this artwork and provide pricing:

ARTWORK DETAILS:
- Size: {request.width}" x {request.height}" ({request.width * request.height} sq inches)
- Medium: {request.medium}
- Realism Level: {request.realism_level}
- Detailing Level: {request.detailing_level}
- Uniqueness: {request.uniqueness}
- Artist Experience: {request.artist_experience}
- Hours Spent: {request.hours_spent or 'Not specified'}
- Material Cost: ₹{request.material_cost or 'Not specified'}
- Artist's Quoted Price: ₹{request.artist_price}

Provide your analysis as JSON only."""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"pricing-{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=analysis_prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        # Clean up response if needed
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        pricing_data = json.loads(response_text.strip())
        
        # Determine badge color
        evaluation = pricing_data.get("pricing_evaluation", "fair")
        if evaluation == "fair" or evaluation == "underpriced":
            badge = "green"
        elif evaluation == "slightly_high":
            badge = "yellow"
        else:  # overpriced
            badge = "red"
        
        return {
            "suggested_price_range": pricing_data.get("suggested_price_range", {"min": 0, "max": 0}),
            "pricing_evaluation": evaluation,
            "pricing_badge": badge,
            "buyer_message": pricing_data.get("buyer_message", ""),
            "artist_suggestion": pricing_data.get("artist_suggestion")
        }
        
    except json.JSONDecodeError as e:
        print(f"AI Pricing JSON error: {e}, Response: {response}")
        # Fallback calculation based on size and medium
        base_rate = {"oil": 120, "acrylic": 80, "watercolor": 60, "charcoal": 40, "mixed media": 70}.get(request.medium.lower(), 60)
        sq_inches = request.width * request.height
        min_price = int(sq_inches * base_rate * 0.8)
        max_price = int(sq_inches * base_rate * 1.5)
        
        if request.artist_price < min_price:
            evaluation = "underpriced"
            badge = "green"
        elif request.artist_price <= max_price:
            evaluation = "fair"
            badge = "green"
        elif request.artist_price <= max_price * 1.3:
            evaluation = "slightly_high"
            badge = "yellow"
        else:
            evaluation = "overpriced"
            badge = "red"
        
        return {
            "suggested_price_range": {"min": min_price, "max": max_price},
            "pricing_evaluation": evaluation,
            "pricing_badge": badge,
            "buyer_message": f"Based on size and medium, this artwork is {evaluation}.",
            "artist_suggestion": "Consider providing details about materials, time invested, or unique aspects." if badge != "green" else None
        }
    except Exception as e:
        print(f"AI Pricing error: {e}")
        raise HTTPException(status_code=500, detail="Pricing analysis failed")


@app.get("/api/artwork/{artwork_id}/pricing-badge")
async def get_artwork_pricing_badge(artwork_id: str):
    """Get the pricing transparency badge for a specific artwork"""
    supabase = get_supabase_client()
    
    artwork = supabase.table('artworks').select('*').eq('id', artwork_id).single().execute()
    if not artwork.data:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    # Check if pricing analysis exists
    if artwork.data.get('pricing_badge'):
        return {
            "pricing_badge": artwork.data.get('pricing_badge'),
            "pricing_evaluation": artwork.data.get('pricing_evaluation'),
            "buyer_message": artwork.data.get('pricing_buyer_message'),
            "suggested_range": artwork.data.get('pricing_suggested_range')
        }
    
    return {"pricing_badge": None, "message": "Pricing analysis not available for this artwork"}


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


@app.post("/api/artist/exhibitions/{exhibition_id}/request-action")
async def request_exhibition_action(
    exhibition_id: str,
    payload: ArtistExhibitionActionRequest,
    artist: dict = Depends(require_artist),
):
    """Artist can request pause/delete; admin must review."""
    supabase = get_supabase_client()

    if payload.action not in ["pause", "delete"]:
        raise HTTPException(status_code=400, detail="action must be pause or delete")

    exhibition = supabase.table('exhibitions').select('*').eq('id', exhibition_id).eq('artist_id', artist['id']).single().execute()
    if not exhibition.data:
        raise HTTPException(status_code=404, detail="Exhibition not found")

    update_payload = {
        "artist_action_request": payload.action,
        "artist_action_reason": payload.reason,
        "artist_action_status": "pending",
        "artist_action_requested_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        supabase.table('exhibitions').update(update_payload).eq('id', exhibition_id).execute()
    except Exception as e:
        msg = str(e)
        fallback = {k: v for k, v in update_payload.items() if k not in ["artist_action_reason", "artist_action_requested_at", "updated_at"]}
        if "artist_action_request" in msg.lower() or "artist_action_status" in msg.lower() or "column" in msg.lower():
            raise HTTPException(status_code=500, detail="Exhibition action columns missing. Please run exhibition workflow migration.")
        supabase.table('exhibitions').update(fallback).eq('id', exhibition_id).execute()

    return {"success": True, "message": f"{payload.action.title()} request submitted for admin review"}


@app.delete("/api/artist/exhibitions/{exhibition_id}")
async def delete_artist_exhibition(exhibition_id: str, artist: dict = Depends(require_artist)):
    """Artist can delete their own exhibition if it's not yet approved or active"""
    supabase = get_supabase_client()
    
    # Get the exhibition
    exhibition = supabase.table('exhibitions').select('*').eq('id', exhibition_id).eq('artist_id', artist['id']).single().execute()
    
    if not exhibition.data:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    
    # Only allow deletion if not yet active
    status = exhibition.data.get('status', '').lower()
    if status == 'active':
        raise HTTPException(status_code=400, detail="Cannot delete an active exhibition. Please request to pause/delete instead.")
    
    # Delete the exhibition
    supabase.table('exhibitions').delete().eq('id', exhibition_id).execute()
    
    return {"success": True, "message": "Exhibition deleted successfully"}


@app.put("/api/artist/exhibitions/{exhibition_id}")
async def update_artist_exhibition(exhibition_id: str, updates: dict, artist: dict = Depends(require_artist)):
    """Artist can update their exhibition details (name, description) before approval"""
    supabase = get_supabase_client()
    
    # Get the exhibition
    exhibition = supabase.table('exhibitions').select('*').eq('id', exhibition_id).eq('artist_id', artist['id']).single().execute()
    
    if not exhibition.data:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    
    # Only allow updates if not yet approved
    if exhibition.data.get('is_approved'):
        raise HTTPException(status_code=400, detail="Cannot update an approved exhibition")
    
    # Only allow certain fields to be updated
    allowed_fields = ['name', 'description', 'exhibition_images', 'exhibition_paintings', 'primary_exhibition_image']
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not update_data:
        return {"success": False, "message": "No valid fields to update"}
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    try:
        supabase.table('exhibitions').update(update_data).eq('id', exhibition_id).execute()
    except Exception as e:
        update_data.pop('updated_at', None)
        if update_data:
            supabase.table('exhibitions').update(update_data).eq('id', exhibition_id).execute()
    
    return {"success": True, "message": "Exhibition updated successfully"}


@app.get("/api/artist/exhibitions/pricing")
async def get_exhibition_pricing_config(artist: dict = Depends(require_artist)):
    return {"config": EXHIBITION_PLAN_CONFIG}


@app.post("/api/artist/exhibitions/payment-order")
async def create_exhibition_payment_order(exhibition_type: str, artist: dict = Depends(require_artist)):
    exhibition_type, config = _get_exhibition_plan(exhibition_type)
    razorpay_client = get_razorpay_client()
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Razorpay is not configured")

    amount_paise = int(config['base_fee'] * 100)
    order = razorpay_client.order.create({
        'amount': amount_paise,
        'currency': 'INR',
        'receipt': f"exh_{artist['id'][:8]}_{int(datetime.now(timezone.utc).timestamp())}",
    })

    key_id = os.environ.get('RAZORPAY_KEY_ID')
    return {
        "success": True,
        "exhibition_type": exhibition_type,
        "amount": config['base_fee'],
        "days": config['days'],
        "max_artworks": config['max_artworks'],
        "razorpay_key": key_id,
        "razorpay_order_id": order['id'],
    }

@app.post("/api/artist/exhibitions")
async def create_exhibition(exhibition: ExhibitionCreate, artist: dict = Depends(require_artist)):
    """Create new exhibition request. Artists with validated terms can proceed faster; others need manual admin payment approval."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    exhibition_type, config = _get_exhibition_plan(exhibition.exhibition_type)
    num_artworks = len(exhibition.artwork_ids)
    
    if num_artworks > config["max_artworks"]:
        raise HTTPException(status_code=400, detail=f"{exhibition_type} allows maximum {config['max_artworks']} artworks")

    if len(exhibition.exhibition_images) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 exhibition images allowed")

    if len(exhibition.exhibition_images) == 0:
        raise HTTPException(status_code=400, detail="At least 1 exhibition image is required")

    primary_image = exhibition.primary_exhibition_image or (exhibition.exhibition_images[0] if exhibition.exhibition_images else None)
    if primary_image and primary_image not in exhibition.exhibition_images:
        raise HTTPException(status_code=400, detail="Primary exhibition image must be one of uploaded images")

    total_fees = config["base_fee"] + float(exhibition.voluntary_platform_fee or 0)

    try:
        start_date = _parse_iso_date(exhibition.start_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid start date")

    computed_end = start_date + timedelta(days=int(config["days"]))
    computed_end_iso = computed_end.date().isoformat()

    payment_method = (exhibition.payment_method or "manual").strip().lower()
    if payment_method not in ["manual", "razorpay"]:
        raise HTTPException(status_code=400, detail="payment_method must be manual or razorpay")

    if payment_method == "manual" and not exhibition.payment_screenshot_url:
        raise HTTPException(status_code=400, detail="Manual payment screenshot is required")

    if payment_method == "razorpay":
        if not (exhibition.razorpay_order_id and exhibition.razorpay_payment_id and exhibition.razorpay_signature):
            raise HTTPException(status_code=400, detail="Razorpay payment details are required")
        razorpay_client = get_razorpay_client()
        if not razorpay_client:
            raise HTTPException(status_code=503, detail="Razorpay is not configured")
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': exhibition.razorpay_order_id,
                'razorpay_payment_id': exhibition.razorpay_payment_id,
                'razorpay_signature': exhibition.razorpay_signature
            })
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid Razorpay signature")

    profile = supabase.table('profiles').select('is_member').eq('id', artist['id']).single().execute()
    is_member = bool((profile.data or {}).get('is_member'))

    if payment_method == "razorpay":
        payment_status = "paid_razorpay"
        request_status = "pending_admin_approval"
    else:
        payment_status = "paid_manual_pending_validation" if exhibition.payment_screenshot_url else "pending_manual_approval"
        request_status = "pending_admin_payment_review"

    if is_member and payment_method == "manual":
        request_status = "pending_admin_approval"
    
    exhibition_data = {
        "artist_id": artist['id'],
        "name": exhibition.name,
        "description": exhibition.description,
        "start_date": exhibition.start_date,
        "end_date": computed_end_iso,
        "artwork_ids": exhibition.artwork_ids,
        "status": "upcoming",
        "views": 0,
        "exhibition_images": exhibition.exhibition_images,
        "primary_exhibition_image": primary_image,
        "exhibition_type": exhibition_type,
        "fees": total_fees,
        "days_paid": config["days"],
        "max_artworks": config["max_artworks"],
        "additional_artworks": 0,
        "additional_artwork_fee": 0,
        "voluntary_platform_fee": exhibition.voluntary_platform_fee,
        "payment_method": payment_method,
        "payment_screenshot_url": exhibition.payment_screenshot_url,
        "payment_reference": exhibition.payment_reference,
        "razorpay_order_id": exhibition.razorpay_order_id,
        "razorpay_payment_id": exhibition.razorpay_payment_id,
        "payment_status": payment_status,
        "request_status": request_status,
        "is_approved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        result = supabase.table('exhibitions').insert(exhibition_data).execute()
    except Exception as e:
        msg = str(e)
        fallback = dict(exhibition_data)
        for optional_field in ["exhibition_images", "primary_exhibition_image", "payment_method", "payment_screenshot_url", "payment_reference", "razorpay_order_id", "razorpay_payment_id", "payment_status", "request_status", "updated_at"]:
            if optional_field in fallback and (optional_field in msg or "column" in msg.lower()):
                fallback.pop(optional_field, None)
        result = supabase.table('exhibitions').insert(fallback).execute()
    
    return {"success": True, "exhibition": result.data[0], "message": f"Exhibition submitted. Total fee: ₹{total_fees}"}


@app.post("/api/admin/exhibitions/create")
async def admin_create_exhibition(payload: ExhibitionAdminCreate, admin: dict = Depends(require_lead_chitrakar)):
    """Admin can directly create and publish exhibitions without payment."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    target_artist_id = payload.artist_id or admin['id']
    exhibition_type, plan = _get_exhibition_plan(payload.exhibition_type)

    try:
        start_date = _parse_iso_date(payload.start_date)
        computed_end = start_date + timedelta(days=int(plan['days']))
        computed_end_iso = computed_end.date().isoformat()
    except Exception:
        computed_end_iso = payload.end_date

    exhibition_images = payload.exhibition_images or []
    painting_images = [p.get('image_url') for p in (payload.exhibition_paintings or []) if p.get('image_url')]
    if painting_images:
        exhibition_images = list(dict.fromkeys([*exhibition_images, *painting_images]))

    if len(exhibition_images) == 0:
        raise HTTPException(status_code=400, detail="At least one exhibition painting image is required")

    exhibition_data = {
        "artist_id": target_artist_id,
        "name": payload.name,
        "description": payload.description,
        "start_date": payload.start_date,
        "end_date": computed_end_iso,
        "artwork_ids": payload.artwork_ids,
        "exhibition_images": exhibition_images,
        "exhibition_paintings": payload.exhibition_paintings,
        "primary_exhibition_image": exhibition_images[0] if exhibition_images else None,
        "status": "active",
        "views": 0,
        "exhibition_type": exhibition_type,
        "fees": 0,
        "days_paid": plan['days'],
        "max_artworks": plan['max_artworks'],
        "additional_artworks": 0,
        "additional_artwork_fee": 0,
        "voluntary_platform_fee": 0,
        "payment_status": "waived_admin",
        "request_status": "admin_created",
        "is_approved": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        result = supabase.table('exhibitions').insert(exhibition_data).execute()
    except Exception as e:
        msg = str(e)
        fallback = dict(exhibition_data)
        for optional_field in ["exhibition_images", "exhibition_paintings", "primary_exhibition_image", "payment_status", "request_status", "updated_at"]:
            if optional_field in fallback and (optional_field in msg or "column" in msg.lower()):
                fallback.pop(optional_field, None)
        result = supabase.table('exhibitions').insert(fallback).execute()

    return {"success": True, "exhibition": result.data[0] if result.data else None, "message": "Exhibition created by admin"}


@app.get("/api/admin/exhibitions/all")
async def admin_get_all_exhibitions(admin: dict = Depends(require_lead_chitrakar)):
    supabase = get_supabase_client()
    if not supabase:
        return {"exhibitions": []}

    try:
        _sync_exhibition_statuses(supabase)
    except Exception:
        pass

    exhibitions = supabase.table('exhibitions').select('*').order('created_at', desc=True).execute()

    result = []
    for exhibition in (exhibitions.data or []):
        artist_name = None
        artist_id = exhibition.get('artist_id')
        if artist_id:
            try:
                profile = supabase.table('profiles').select('full_name').eq('id', artist_id).single().execute()
                artist_name = (profile.data or {}).get('full_name')
            except Exception:
                artist_name = None
        result.append({
            **exhibition,
            "artist_name": artist_name,
        })

    return {"exhibitions": result}


@app.post("/api/admin/exhibitions/extend")
async def admin_extend_exhibition(payload: AdminExhibitionExtendRequest, admin: dict = Depends(require_lead_chitrakar)):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    exhibition = supabase.table('exhibitions').select('*').eq('id', payload.exhibition_id).single().execute()
    if not exhibition.data:
        raise HTTPException(status_code=404, detail="Exhibition not found")

    current_days = int(exhibition.data.get('days_paid') or 0)
    update_payload = {
        'days_paid': current_days + payload.extra_days,
        'status': 'active' if exhibition.data.get('status') == 'expired' else exhibition.data.get('status'),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }

    try:
        supabase.table('exhibitions').update(update_payload).eq('id', payload.exhibition_id).execute()
    except Exception:
        fallback = {k: v for k, v in update_payload.items() if k in ['days_paid', 'status']}
        supabase.table('exhibitions').update(fallback).eq('id', payload.exhibition_id).execute()

    try:
        _sync_exhibition_statuses(supabase)
    except Exception:
        pass

    return {"success": True, "message": f"Exhibition extended by {payload.extra_days} day(s)"}


@app.delete("/api/admin/exhibitions/{exhibition_id}")
async def admin_delete_exhibition(exhibition_id: str, admin: dict = Depends(require_lead_chitrakar)):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        supabase.table('exhibitions').update({
            'status': 'deleted',
            'is_approved': False,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }).eq('id', exhibition_id).execute()
    except Exception:
        supabase.table('exhibitions').update({
            'status': 'deleted',
            'is_approved': False,
        }).eq('id', exhibition_id).execute()

    return {"success": True, "message": "Exhibition deleted"}


@app.put("/api/admin/exhibitions/{exhibition_id}")
async def admin_update_exhibition(exhibition_id: str, payload: AdminExhibitionUpdateRequest, admin: dict = Depends(require_lead_chitrakar)):
    """Admin can update exhibition details including name, description, end_date, and status"""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    # Get current exhibition
    exhibition = supabase.table('exhibitions').select('*').eq('id', exhibition_id).single().execute()
    if not exhibition.data:
        raise HTTPException(status_code=404, detail="Exhibition not found")

    # Build update payload with only changed fields
    update_data = {}
    if payload.name is not None:
        update_data['name'] = payload.name
    if payload.description is not None:
        update_data['description'] = payload.description
    if payload.end_date is not None:
        update_data['end_date'] = payload.end_date
    if payload.status is not None and payload.status in ['active', 'paused', 'archived', 'upcoming']:
        update_data['status'] = payload.status

    if not update_data:
        return {"success": True, "message": "No changes to apply"}

    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()

    try:
        supabase.table('exhibitions').update(update_data).eq('id', exhibition_id).execute()
    except Exception as e:
        # Fallback without updated_at if column doesn't exist
        update_data.pop('updated_at', None)
        if update_data:
            supabase.table('exhibitions').update(update_data).eq('id', exhibition_id).execute()

    return {"success": True, "message": "Exhibition updated"}

@app.post("/api/upload-url")
async def get_upload_url(
    body: UploadUrlRequest,
    user: dict = Depends(require_user)
):
    try:
        s3 = get_s3_client()
        region = os.environ.get("AWS_REGION", "ap-south-1")
        
        ext = body.filename.split('.')[-1]
        bucket_name = _resolve_upload_bucket(body.bucket_key)
        folder_prefix = (body.folder or body.bucket_key or "uploads").strip("/")

        file_token = f"{uuid.uuid4()}.{ext}"
        if body.bucket_key in ["artist-artworks", "artworks"]:
            key = f"{folder_prefix}/{user['id']}/{uuid.uuid4()}/{file_token}"
        elif body.bucket_key in ["commission-references", "commission-deliveries"]:
            parent = body.entity_id or user["id"]
            key = f"{folder_prefix}/{parent}/{file_token}"
        else:
            key = f"{folder_prefix}/{user['id']}/{file_token}"
        
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
