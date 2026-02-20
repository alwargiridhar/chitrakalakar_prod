import { supabase } from '../lib/supabase';

// Use environment variable or fallback to localhost for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL && 
  process.env.REACT_APP_BACKEND_URL !== 'your_render_backend_url_here'
    ? process.env.REACT_APP_BACKEND_URL 
    : 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Get auth token from Supabase session
const getToken = async () => {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  } catch {
    return null;
  }
};

// Helper for API calls (SAFE VERSION)
const apiCall = async (endpoint, options = {}) => {
  const token = await getToken();

  const headers = {
    ...(options.body && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  const contentType = response.headers.get('content-type');
  const hasJson = contentType?.includes('application/json');

  if (hasJson) {
    try {
      data = await response.json();
    } catch (e) {
      // JSON parse error - ignore
      console.debug('JSON parse error', e);
    }
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || 'Request failed');
  }

  return data;
};

// Auth APIs - Now using Supabase directly, these are for profile updates only
export const authAPI = {
  updateProfile: (data) => apiCall('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Location APIs
export const locationAPI = {
  search: (query, country = null) => {
    const params = new URLSearchParams({ q: query });
    if (country) params.append('country', country);
    return apiCall(`/locations/search?${params.toString()}`);
  },
};

// Public APIs
export const publicAPI = {
  getStats: () => apiCall('/public/stats'),
  getFeaturedArtists: () => apiCall('/public/featured-artists'),
  getArtists: () => apiCall('/public/artists'),
  getArtistDetail: (artistId) => apiCall(`/public/artist/${artistId}`),
  getPaintings: () => apiCall('/public/paintings'),
  getPaintingDetail: (paintingId) => apiCall(`/public/painting/${paintingId}`),
  getExhibitions: () => apiCall('/public/exhibitions'),
  getActiveExhibitions: () => apiCall('/public/exhibitions/active'),
  getArchivedExhibitions: () => apiCall('/public/exhibitions/archived'),
  getFeaturedArtistDetail: (artistId) => apiCall(`/public/featured-artist/${artistId}`),
  getTrendingArtists: () => apiCall('/public/trending-artists'),
  
  // Art Class Enquiry
  createArtClassEnquiry: (data) => apiCall('/public/art-class-enquiry', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getArtClassMatches: (enquiryId) => apiCall(`/public/art-class-matches/${enquiryId}`),
  revealContact: (enquiryId, artistId) => apiCall('/public/reveal-contact', {
    method: 'POST',
    body: JSON.stringify({ enquiry_id: enquiryId, artist_id: artistId }),
  }),
  
  // Communities
  getCommunities: () => apiCall('/public/communities'),
  getCommunityDetail: (communityId) => apiCall(`/public/community/${communityId}`),
  getArtistOfTheDay: () => apiCall('/public/artist-of-the-day'),
};

// Community APIs
export const communityAPI = {
  create: (data) => apiCall('/community/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAll: () => apiCall('/communities'),
  getDetails: (communityId) => apiCall(`/community/${communityId}`),
  join: (communityId) => apiCall(`/community/${communityId}/join`, {
    method: 'POST',
  }),
  leave: (communityId) => apiCall(`/community/${communityId}/leave`, {
    method: 'POST',
  }),
  getJoinRequests: (communityId) => apiCall(`/community/${communityId}/join-requests`),
  approveJoin: (communityId, requestId, approved) => apiCall(`/community/${communityId}/approve-join/${requestId}?approved=${approved}`, {
    method: 'POST',
  }),
  invite: (communityId, artistIds, message) => apiCall(`/community/${communityId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ community_id: communityId, artist_ids: artistIds, message }),
  }),
  createPost: (communityId, content, images, postType) => apiCall(`/community/${communityId}/post`, {
    method: 'POST',
    body: JSON.stringify({ community_id: communityId, content, images, post_type: postType }),
  }),
  getMyCommunities: () => apiCall('/community/my-communities'),
  getMyInvites: () => apiCall('/community/invites'),
  respondToInvite: (inviteId, accept) => apiCall(`/community/respond-invite/${inviteId}?accept=${accept}`, {
    method: 'POST',
  }),
};

// Chat APIs (Chitrakar)
export const chatAPI = {
  sendMessage: (message, sessionId = null) => apiCall('/chat/message', {
    method: 'POST',
    body: JSON.stringify({ message, session_id: sessionId }),
  }),
  getHistory: () => apiCall('/chat/history'),
};

// Membership APIs
export const membershipAPI = {
  getPlans: () => apiCall('/membership/plans'),
  applyVoucher: (voucherCode, planId) => apiCall('/public/apply-voucher', {
    method: 'POST',
    body: JSON.stringify({ voucher_code: voucherCode, plan_id: planId }),
  }),
  initiateMembership: (planType, voucherCode = null) => apiCall('/membership/create-order', {
    method: 'POST',
    body: JSON.stringify({ plan_type: planType, voucher_code: voucherCode }),
  }),
  createOrder: (planType) => apiCall('/membership/create-order', {
    method: 'POST',
    body: JSON.stringify({ plan_type: planType }),
  }),
  verifyPayment: (data) => apiCall('/membership/verify-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getStatus: () => apiCall('/membership/status'),
};

// Video Screening APIs
export const videoScreeningAPI = {
  request: (data) => apiCall('/video-screening/request', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMyRequests: () => apiCall('/video-screening/my-requests'),
};

// Cart APIs
export const cartAPI = {
  add: (artworkId, quantity = 1) => apiCall('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ artwork_id: artworkId, quantity }),
  }),
  get: () => apiCall('/cart'),
  remove: (itemId) => apiCall(`/cart/${itemId}`, {
    method: 'DELETE',
  }),
};

// Order APIs
export const orderAPI = {
  create: (data) => apiCall('/orders/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMyOrders: () => apiCall('/orders/my-orders'),
  track: (orderId) => apiCall(`/orders/${orderId}/track`),
  updateAWB: (orderId, data) => apiCall(`/orders/${orderId}/update-awb`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Notifications API
export const notificationAPI = {
  getRecent: () => apiCall('/notifications/recent'),
};

// Profile Modification API
export const profileModificationAPI = {
  request: (data) => apiCall('/profile/request-modification', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPending: () => apiCall('/profile/pending-modifications'),
};

// User APIs
export const userAPI = {
  getMyEnquiries: () => apiCall('/user/my-enquiries'),
  getProfile: () => apiCall('/user/profile'),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => apiCall('/admin/dashboard'),
  getPendingArtists: () => apiCall('/admin/pending-artists'),
  approveArtist: (artistId, approved) => apiCall(`/admin/approve-artist?artist_id=${artistId}&approved=${approved}`, {
    method: 'POST',
  }),
  getPendingArtworks: () => apiCall('/admin/pending-artworks'),
  approveArtwork: (artworkId, approved) => apiCall('/admin/approve-artwork', {
    method: 'POST',
    body: JSON.stringify({ artwork_id: artworkId, approved }),
  }),
  getPendingExhibitions: () => apiCall('/admin/pending-exhibitions'),
  approveExhibition: (exhibitionId, approved) => apiCall('/admin/approve-exhibition', {
    method: 'POST',
    body: JSON.stringify({ exhibition_id: exhibitionId, approved }),
  }),
  archiveExhibition: (exhibitionId) => apiCall(`/admin/archive-exhibition/${exhibitionId}`, {
    method: 'POST',
  }),
  getAllUsers: () => apiCall('/admin/all-users'),
  toggleUserStatus: (userId) => apiCall(`/admin/toggle-user-status?user_id=${userId}`, {
    method: 'POST',
  }),
  getAllOrders: () => apiCall('/admin/all-orders'),
  
  // Artists by Membership
  getArtistsByMembership: () => apiCall('/admin/artists-by-membership'),
  
  // Role Management
  updateUserRole: (userId, newRole) => apiCall('/admin/update-user-role', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, new_role: newRole }),
  }),
  
  // Membership Management
  grantMembership: (artistId, plan, durationDays) => apiCall('/admin/grant-membership', {
    method: 'POST',
    body: JSON.stringify({ artist_id: artistId, plan, duration_days: durationDays }),
  }),
  revokeMembership: (artistId) => apiCall(`/admin/revoke-membership?artist_id=${artistId}`, {
    method: 'POST',
  }),
  
  // Pricing & Plans Management
  getMembershipPlans: () => apiCall('/admin/membership-plans'),
  updateMembershipPlan: (plan) => apiCall('/admin/update-membership-plan', {
    method: 'POST',
    body: JSON.stringify(plan),
  }),
  updatePricingPlan: (plan) => apiCall('/admin/update-membership-plan', {
    method: 'POST',
    body: JSON.stringify(plan),
  }),
  
  // Voucher Management
  getVouchers: () => apiCall('/admin/vouchers'),
  createVoucher: (voucher) => apiCall('/admin/create-voucher', {
    method: 'POST',
    body: JSON.stringify(voucher),
  }),
  deleteVoucher: (voucherId) => apiCall(`/admin/voucher/${voucherId}`, {
    method: 'DELETE',
  }),
  toggleVoucher: (voucherId) => apiCall(`/admin/toggle-voucher/${voucherId}`, {
    method: 'POST',
  }),
  
  // Featured Artists
  getFeaturedArtists: () => apiCall('/admin/featured-artists'),
  getApprovedArtists: () => apiCall('/admin/approved-artists'),
  getArtistPreview: (artistId) => apiCall(`/admin/artist-preview/${artistId}`),
  
  // Feature Contemporary Artist
  createFeaturedArtist: (data) => apiCall('/admin/feature-contemporary-artist', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateFeaturedArtist: (artistId, data) => apiCall(`/admin/featured-artist/${artistId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteFeaturedArtist: (artistId) => apiCall(`/admin/featured-artist/${artistId}`, {
    method: 'DELETE',
  }),
  
  // Feature Registered Artist
  featureRegisteredArtist: (artistId, featured) => apiCall('/admin/feature-registered-artist', {
    method: 'POST',
    body: JSON.stringify({ artist_id: artistId, featured }),
  }),
  
  // Sub-Admin Management
  createSubAdmin: (data) => apiCall('/admin/create-sub-admin', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getSubAdmins: () => apiCall('/admin/sub-admins'),
  
  // Lead Chitrakar
  leadChitrakarApproveArtwork: (artworkId, approved) => apiCall('/admin/lead-chitrakar/approve-artwork', {
    method: 'POST',
    body: JSON.stringify({ artwork_id: artworkId, approved }),
  }),
  
  // Kalakar
  kalakarGetExhibitionAnalytics: () => apiCall('/admin/kalakar/exhibitions-analytics'),
  kalakarGetPaymentRecords: () => apiCall('/admin/kalakar/payment-records'),
  
  // Communities
  getPendingCommunities: () => apiCall('/admin/pending-communities'),
  approveCommunity: (communityId, approved) => apiCall(`/admin/approve-community?community_id=${communityId}&approved=${approved}`, {
    method: 'POST',
  }),
  
  // Profile Modifications
  getPendingProfileModifications: () => apiCall('/admin/pending-profile-modifications'),
  approveProfileModification: (modificationId, approved) => apiCall(`/admin/approve-profile-modification?modification_id=${modificationId}&approved=${approved}`, {
    method: 'POST',
  }),
  
  // Video Screenings
  getPendingVideoScreenings: () => apiCall('/admin/pending-video-screenings'),
  accommodateVideoScreening: (screeningId, scheduledDate) => apiCall(`/admin/accommodate-video-screening?screening_id=${screeningId}&scheduled_date=${scheduledDate}`, {
    method: 'POST',
  }),
  
  // Chat Messages
  getChatMessages: () => apiCall('/admin/chat-messages'),
  respondToChat: (messageId, response) => apiCall(`/admin/respond-to-chat?message_id=${messageId}&response=${encodeURIComponent(response)}`, {
    method: 'POST',
  }),
};

// Artist APIs
export const artistAPI = {
  getDashboard: () => apiCall('/artist/dashboard'),
  getPortfolio: () => apiCall('/artist/artworks'),
  
  addArtwork: (artwork) => apiCall('/artist/artworks', {
    method: 'POST',
    body: JSON.stringify(artwork),
  }),

  updateArtwork: (id, artwork) => apiCall(`/artist/artworks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(artwork),
  }),

  deleteArtwork: (id) => apiCall(`/artist/artworks/${id}`, {
    method: 'DELETE',
  }),

  getOrders: () => apiCall('/artist/orders'),

  updateOrderStatus: (id, status) =>
    apiCall(`/artist/orders/${id}/status?status=${status}`, {
      method: 'PUT',
    }),

  getExhibitions: () => apiCall('/artist/exhibitions'),

  createExhibition: (data) =>
    apiCall('/artist/exhibitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Push to Marketplace
  pushToMarketplace: (artworkIds) => apiCall('/artist/push-to-marketplace', {
    method: 'POST',
    body: JSON.stringify({ artwork_ids: artworkIds }),
  }),
  
  // AWB Update
  updateAWB: (orderId, data) => apiCall(`/orders/${orderId}/update-awb`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Featured Request
  requestFeatured: (paymentReference, durationDays = 5) => apiCall('/artist/request-featured', {
    method: 'POST',
    body: JSON.stringify({ payment_reference: paymentReference, duration_days: durationDays }),
  }),
  getFeaturedRequestStatus: () => apiCall('/artist/featured-request-status'),
};

export async function getImageUrl(key, token) {
  const res = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/api/image-url?key=${encodeURIComponent(key)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error('Failed to load image');

  return res.json();
}
