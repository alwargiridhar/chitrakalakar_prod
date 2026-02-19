# ChitraKalakar - Art Marketplace Platform

## Original Problem Statement
Load the ChitraKalakar app from GitHub (https://github.com/alwargiridhar/chitrakalakar_prod) and implement the following enhancements:

### Issues to Fix:
1. Analytics on loading page loads late
2. Paintings showing "pending for approval" but admin doesn't receive requests  
3. Membership-based access for registered artists column and marketplace

### New Features:
1. Enhanced artwork listing form with comprehensive checklist/dropdowns
2. Show key information on thumbnails
3. Show all artwork information in detail page
4. **Virtual Room Preview** - Visualize artwork in different room settings
5. User profile dropdown with account management pages
6. PWA functionality for mobile/desktop installation
7. Admin ability to manage featured artists
8. Sub-admin creation with location autocomplete
9. Pricing & voucher management system
10. Artist of the Day feature
11. Community feature for artists

---

## Architecture

### Tech Stack
- **Frontend**: React.js with TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with Supabase Auth
- **Payment**: Razorpay integration

### Key Files
- `/app/backend/server.py` - Main FastAPI application
- `/app/frontend/src/pages/` - React page components
- `/app/frontend/src/components/ArtworkForm.js` - Enhanced artwork form
- `/app/frontend/src/components/VirtualRoomPreview.js` - Room visualization
- `/app/frontend/src/services/api.js` - API service layer

---

## User Personas

1. **Artists** - Create profiles, upload artworks, manage portfolio, join communities
2. **Buyers** - Browse marketplace, purchase artworks, visualize in rooms
3. **Admin** - Approve artists/artworks, manage featured artists, create vouchers

---

## Core Requirements (Static)

### Membership System
- Artists can create profiles for free
- To appear in "Registered Artists" section - membership required
- To push artworks to marketplace - membership required

### Artwork Listing Requirements

#### Mandatory Fields
- Title, Category/Subject, Price & Currency, Minimum 1 image
- Artwork Type, Ownership/Rights declaration, Shipping info

#### Optional Fields (Improves Visibility)
- Year of creation, Medium, Surface, Dimensions
- Authenticity (COA, Signed, Hand-embellished)
- Condition details, Framing status
- Story & Context, Investment Signals

---

## What's Been Implemented

### Feb 19, 2026 - Session 6: Community, Pricing & Trending Features

1. **Trending Artists Section** (`/app/frontend/src/components/TrendingArtists.js`) ✨ NEW
   - Shows top artists ranked by views and sales
   - Displays artwork count, views, and sales statistics
   - Top artwork preview for each artist
   - Rank badges (#1 gold, #2 silver, #3 bronze)
   - Auto-hides when no trending data available
   - Backend endpoint: `GET /api/public/trending-artists`

2. **Community Detail Page** (`/app/frontend/src/pages/CommunityDetailPage.js`)
   - View individual community with posts and members
   - Create posts (text, image, announcements)
   - Invite artists to community (admin only)
   - Join/Leave community functionality
   - Responsive design for mobile

2. **Admin Pricing & Voucher Management**
   - New "Pricing & Vouchers" tab in Admin Dashboard
   - View membership plans (Monthly ₹99, Annual ₹999)
   - Create/Edit/Delete discount vouchers
   - Toggle voucher active status
   - View voucher usage statistics

3. **Backend Endpoints Added/Updated**
   - `POST /api/community/{id}/leave` - Leave a community
   - `POST /api/community/{id}/post` - Create community post
   - `GET /api/admin/vouchers` - List all vouchers
   - `POST /api/admin/create-voucher` - Create new voucher
   - `DELETE /api/admin/voucher/{id}` - Delete voucher
   - `POST /api/admin/toggle-voucher/{id}` - Toggle voucher status

4. **Routes Added**
   - `/communities` - Communities listing page
   - `/community/:id` - Individual community detail page

### Previous Sessions Summary

#### Session 5: Progressive Web App (PWA)
- PWA Configuration with manifest.json and service-worker.js
- Installable on mobile and desktop
- Offline support with caching

#### Session 4: User Dropdown Menu & Account Pages
- NavBar user dropdown with role-based colors
- Profile, Account, Subscription, Change Password pages

#### Session 3: Membership-Based Artist Visibility
- Public Artists Filter - Only shows active members
- Admin Dashboard updates for member management

#### Session 2: Virtual Room Preview Feature
- 6 Room Presets with SVG furniture graphics
- 10 Wall Colors and 5 Frame Styles
- Drag-to-Reposition functionality

#### Session 1: Core Enhancements
- Enhanced Artwork Form with 50+ fields
- Enhanced Thumbnails with badge system
- Comprehensive Detail Page
- Backend optimization for parallel queries

---

## S3 Buckets Required

Please create the following S3 buckets:
```
[your-prefix]-chitrakalakar-artworks     → For artwork images
[your-prefix]-chitrakalakar-avatars      → For user profile photos
[your-prefix]-chitrakalakar-exhibitions  → For exhibition banners
[your-prefix]-chitrakalakar-communities  → For community images/posts
```

---

## Database Schema (Supabase)

### Core Tables
- `profiles` - User profiles with role, membership status
- `artworks` - Artwork listings with all metadata
- `exhibitions` - Exhibition entries
- `featured_artists` - Featured artist profiles

### New Tables for Communities & Vouchers
- `communities` - Community definitions
- `community_members` - Membership records
- `community_posts` - Posts within communities
- `vouchers` - Discount voucher codes

---

## Prioritized Backlog

### P0 - Critical
- [x] Community Detail Page implementation
- [x] Admin Pricing & Voucher Management
- [ ] Configure Supabase connection for actual data flow

### P1 - High Priority
- [ ] Add real room background images (upgrade from gradients)
- [ ] Implement artwork edit functionality
- [ ] Add search functionality

### P2 - Medium Priority
- [ ] Save favorite room configurations
- [ ] Share room preview as image
- [ ] Community post likes/comments

### P3 - Nice to Have
- [ ] Price history chart
- [ ] Bulk artwork upload
- [ ] Artist analytics dashboard
- [ ] AR view using device camera

---

## Test Reports

- `/app/test_reports/iteration_5.json` - Latest test results
- All tests passing (100% backend, 100% frontend)

---

## Notes

- Supabase credentials need to be configured in preview environment
- All features are UI-complete and tested
- Backend APIs return empty data when Supabase is not configured
