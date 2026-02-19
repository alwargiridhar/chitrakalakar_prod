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

1. **Artists** - Create profiles, upload artworks, manage portfolio
2. **Buyers** - Browse marketplace, purchase artworks, visualize in rooms
3. **Admin** - Approve artists/artworks, manage featured artists, oversee platform

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

### Date: Feb 19, 2026

#### Session 1: Core Enhancements
1. **Enhanced Artwork Form** - 10 collapsible sections, 50+ fields
2. **Enhanced Thumbnails** - Key info overlay, badge system
3. **Comprehensive Detail Page** - Organized info sections
4. **Backend Updates** - Extended model, optimized queries
5. **Bug Fixes** - Parallel query execution, membership checks

#### Session 2: Virtual Room Preview Feature
1. **VirtualRoomPreview Component** (`/app/frontend/src/components/VirtualRoomPreview.js`)
   - 6 Room Presets: Modern Living, Classic Living, Bedroom, Office, Dining, Hallway
   - 10 Wall Colors: White, Cream, Beige, Gray, Sage, Blue, Blush, Charcoal, Navy, Forest
   - 5 Frame Styles: Modern, Classic, Minimal, Ornate, Float
   - Artwork Size Slider (Small to Large)
   - Drag-to-Reposition functionality
   - SVG Furniture graphics for each room type

2. **Integration Points**
   - "View in Your Room" button on Painting Detail Page
   - Quick 🏠 button on each painting card in gallery
   - Responsive modal with split view (preview + controls)

#### Session 3: Membership-Based Artist Visibility
1. **Public Artists Filter** - Only shows artists with ACTIVE membership
2. **Admin Dashboard Updates**:
   - New "Members" tab - Shows artists with active membership
   - New "Non-Members" tab - Shows artists without membership
   - Role Change Modal - Admin can change any user's role
   - Grant Membership Modal - Admin can grant membership with plan/duration
   - Revoke Membership - Admin can revoke artist membership
3. **New Backend Endpoints**:
   - `GET /api/admin/artists-by-membership` - Separate members/non-members
   - `POST /api/admin/update-user-role` - Change user roles
   - `POST /api/admin/grant-membership` - Grant membership
   - `POST /api/admin/revoke-membership` - Revoke membership

#### Session 4: User Dropdown Menu & Account Pages
1. **NavBar User Dropdown** (`/app/frontend/src/components/NavBar.js`)
   - Circular avatar with role-based colors (Admin=red, Artist=orange, etc.)
   - Dropdown shows: Name, Email, Role badge
   - Menu items based on role: Profile, Dashboard, Account Settings, Subscription (artists only), Change Password, Logout
   - Mobile-responsive with full menu in hamburger menu

2. **New Account Pages**:
   - `/profile` - Edit profile (name, phone, location, bio, avatar)
   - `/account` - Account overview with quick links, status, danger zone
   - `/change-password` - Change password with validation
   - `/subscription` - Membership plans (Basic, Premium, Annual) with Razorpay

---

## Prioritized Backlog

### P0 - Critical
- [ ] Verify Supabase connection for actual data flow
- [ ] Test full artwork submission workflow

### P1 - High Priority
- [ ] Add real room background images (upgrade from gradients)
- [ ] Implement artwork edit functionality
- [ ] Add search functionality

### P2 - Medium Priority
- [ ] Save favorite room configurations
- [ ] Share room preview as image
- [ ] Add AR view using device camera

### P3 - Nice to Have
- [ ] Price history chart
- [ ] Bulk artwork upload
- [ ] Artist analytics dashboard

---

## Next Steps

1. **Run Supabase Migration** → See `/app/SUPABASE_MIGRATION_GUIDE.md`
2. **Quick Migration** → Copy `/app/scripts/supabase_migration.sql` to Supabase SQL Editor
3. **Field Mapping Reference** → See `/app/docs/BACKEND_DATABASE_MAPPING.md`
4. Add sample paintings to test Virtual Room Preview
5. Consider real room background images from Unsplash
