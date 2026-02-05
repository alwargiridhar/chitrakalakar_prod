# ChitraKalakar Platform PRD

## Original Problem Statement
Art marketplace platform improvements for chitrakalakar.com including:
- Location services for users/artists
- Multiple images per painting (up to 5)
- Admin dashboard fixes
- Artist membership (Razorpay)
- Community feature
- Chatbot "Chitrakar"
- Google/Gmail login
- Forgot password
- Real-time notifications
- Courier tracking with AWB

## What's Been Implemented (Feb 5, 2026)

### Phase 1 - Core Infrastructure
- [x] Location autocomplete (OpenStreetMap/Nominatim)
- [x] Multiple images per painting (up to 5)
- [x] Image display fix (object-contain)
- [x] Chatbot "Chitrakar" (AI-powered)
- [x] Community section on landing page
- [x] Membership system (Razorpay ready)
- [x] Push to marketplace feature
- [x] Real-time purchase notifications
- [x] Courier AWB tracking
- [x] Video screening booking
- [x] Cart & checkout functionality
- [x] Google OAuth login/signup
- [x] Forgot password page
- [x] Profile update improvements

### Backend APIs Added
- `/api/locations/search` - Location autocomplete
- `/api/membership/*` - Subscription management
- `/api/chat/*` - Chitrakar chatbot
- `/api/communities/*` - Artist communities
- `/api/video-screening/*` - Video screening requests
- `/api/cart/*` - Shopping cart
- `/api/orders/*` - Order management
- `/api/notifications/*` - Real-time notifications

### Frontend Components Added
- `Chatbot.js` - AI chat assistant
- `LocationAutocomplete.js` - Location search
- `NotificationPopup.js` - Purchase notifications
- `ForgotPasswordPage.js` - Password reset

## Credentials Required
### Backend (.env)
- SUPABASE_URL
- SUPABASE_KEY (or SUPABASE_SERVICE_KEY)
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_BUCKET
- AWS_REGION
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

### Frontend (.env)
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY
- REACT_APP_BACKEND_URL
- REACT_APP_RAZORPAY_KEY_ID

### For Google OAuth (in Supabase)
- Enable Google provider in Supabase Auth
- Add Google OAuth Client ID and Secret

## Next Tasks (P0)
1. Test Google OAuth end-to-end on production
2. Test artist profile bio update
3. Verify admin can see pending artworks
4. Test membership payment flow

## Backlog (P1)
1. OTP-based password reset (needs SMS provider)
2. Email notifications for orders
3. Analytics dashboard
