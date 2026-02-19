import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { artistAPI, authAPI, membershipAPI } from '../services/api';
import { ART_CATEGORIES } from '../utils/branding';
import ImageUpload from '../components/ImageUpload';
import LocationAutocomplete from '../components/LocationAutocomplete';
import ArtworkForm from '../components/ArtworkForm';
import { BUCKETS } from '../lib/supabase';

function ArtistDashboard() {
  const { profiles, isArtist } = useAuth();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAddArtwork, setShowAddArtwork] = useState(false);
  const [newArtwork, setNewArtwork] = useState({ title: '', category: '', price: '', images: [], description: '' });
  
  // Profile editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    full_name: '', 
    bio: '', 
    location: '', 
    categories: [], 
    avatar: '',
    phone: '',
    teaching_rate: null,
    teaches_online: false,
    teaches_offline: false
  });
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Membership
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [selectedArtworks, setSelectedArtworks] = useState([]);

const fetchData = useCallback(async () => {
  try {
    const results = await Promise.allSettled([
      artistAPI.getDashboard(),
      artistAPI.getPortfolio(),
      artistAPI.getOrders(),
      membershipAPI.getStatus(),
    ]);

    const dashboard =
      results[0].status === 'fulfilled' ? results[0].value : null;

    const portfolio =
      results[1].status === 'fulfilled' && results[1].value
        ? results[1].value
        : { artworks: [] };
    
    const membership =
      results[3].status === 'fulfilled' ? results[3].value : null;

    const ordersData =
      results[2].status === 'fulfilled' && results[2].value
        ? results[2].value
        : { orders: [] };

    setDashboardData(dashboard);
    setArtworks(Array.isArray(portfolio.artworks) ? portfolio.artworks : []);
    setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
    setMembershipStatus(membership);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  if (!profiles) {
    navigate('/login');
    return;
  }

  // Redirect other roles to their respective dashboards
  if (profiles.role === 'admin') {
    navigate('/admin', { replace: true });
    return;
  }

  if (profiles.role === 'lead_chitrakar') {
    navigate('/lead-chitrakar', { replace: true });
    return;
  }

  if (profiles.role === 'kalakar') {
    navigate('/kalakar', { replace: true });
    return;
  }

  // For artists - check approval status
  if (profiles.role === 'artist' && !profiles.is_approved) {
    setLoading(false);
    return;
  }

  fetchData();
}, [profiles, navigate, fetchData]);

useEffect(() => {
  if (!profiles) return;

  setProfileForm({
    full_name: profiles.full_name || '',
    bio: profiles.bio || '',
    location: profiles.location || '',
    categories: profiles.categories || [],
    avatar: profiles.avatar || '',
    phone: profiles.phone || '',
    teaching_rate: profiles.teaching_rate || null,
    teaches_online: profiles.teaches_online || false,
    teaches_offline: profiles.teaches_offline || false,
  });
}, [profiles]);

const handleAddArtwork = async (e) => {
  e.preventDefault();

  const priceValue = Number(newArtwork.price);
  if (Number.isNaN(priceValue) || priceValue <= 0) {
    alert("Invalid price");
    return;
  }

  // Debug: Log the artwork data being sent
  console.log('Submitting artwork:', newArtwork);
  
  if (newArtwork.images.length === 0) {
    alert("Please upload at least one image before adding artwork");
    return;
  }

  try {
    await artistAPI.addArtwork({
      ...newArtwork,
      image: newArtwork.images[0],
      price: priceValue,
    });

    setShowAddArtwork(false);
    setNewArtwork({
      title: '',
      category: '',
      price: '',
      images: [],
      description: '',
    });

    fetchData();
  } catch (error) {
    console.error('Error adding artwork:', error);
    alert(error.message || 'Failed to add artwork');
  }
};

const handleImageUpload = (url) => {
  if (newArtwork.images.length < 5) {
    setNewArtwork({ ...newArtwork, images: [...newArtwork.images, url] });
  }
};

const handleRemoveImage = (index) => {
  setNewArtwork({
    ...newArtwork,
    images: newArtwork.images.filter((_, i) => i !== index)
  });
};

const handlePushToMarketplace = async () => {
  if (selectedArtworks.length === 0) {
    alert('Please select artworks to push to marketplace');
    return;
  }
  
  if (!membershipStatus?.is_member) {
    setShowMembershipModal(true);
    return;
  }
  
  try {
    await artistAPI.pushToMarketplace(selectedArtworks);
    alert('Artworks pushed to marketplace successfully!');
    setSelectedArtworks([]);
    fetchData();
  } catch (error) {
    console.error('Error pushing to marketplace:', error);
    alert(error.message || 'Failed to push to marketplace');
  }
};

const handleMembershipPayment = async (planType) => {
  try {
    const orderResponse = await membershipAPI.createOrder(planType);
    
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      order_id: orderResponse.order_id,
      name: 'ChitraKalakar',
      description: `${planType === 'annual' ? 'Annual' : 'Monthly'} Membership`,
      handler: async (response) => {
        try {
          await membershipAPI.verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
          alert('Membership activated successfully!');
          setShowMembershipModal(false);
          fetchData();
        } catch (error) {
          alert('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: profiles?.full_name,
        email: profiles?.email
      },
      theme: {
        color: '#f97316'
      }
    };
    
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error creating order:', error);
    alert(error.message || 'Failed to create payment order');
  }
};

  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm('Are you sure you want to delete this artwork?')) {
      return;
    }
    
    try {
      await artistAPI.deleteArtwork(artworkId);
      // Refresh the artworks list
      fetchData();
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert(error.message || 'Failed to delete artwork');
    }
  };

  const handleProfileCategoryToggle = (category) => {
    setProfileForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

const handleSaveProfile = async () => {
  setProfileSaving(true);
  try {
    const payload = {
      full_name: profileForm.full_name,
      bio: profileForm.bio,
      location: profileForm.location,
      categories: profileForm.categories,
      avatar: profileForm.avatar,
      phone: profileForm.phone,
      teaching_rate: profileForm.teaching_rate,
      teaches_online: profileForm.teaches_online,
      teaches_offline: profileForm.teaches_offline,
    };

    console.log('Saving profile with payload:', payload);
    
    const result = await authAPI.updateProfile(payload);
    console.log('Profile update result:', result);
    
    alert('Profile updated successfully!');
    setShowEditProfile(false);
    
    // Refresh profile in context by triggering re-fetch
    window.location.reload();
  } catch (error) {
    console.error('Error saving profile:', error);
    alert(error.message || 'Failed to save profile');
    setProfileSaving(false);
  }
};

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Show pending approval message for artists
  if (profiles?.role === 'artist' && !profiles?.is_approved) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
          <span className="text-6xl mb-4 block">⏳</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your artist account is pending admin approval. You will be notified once approved.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show user dashboard for non-artists
  if (profiles?.role !== 'artist') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {profiles?.full_name}!</h1>
          <p className="text-gray-600 mb-8">Browse artists and commission artwork</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/artists" className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <span className="text-4xl mb-4 block">🎨</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Artists</h3>
              <p className="text-gray-600">Discover talented artists and their work</p>
            </Link>
            <Link to="/exhibitions" className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <span className="text-4xl mb-4 block">🏛️</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">View Exhibitions</h3>
              <p className="text-gray-600">Explore curated virtual exhibitions</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', icon: '🖼️' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'membership', label: 'Membership', icon: '⭐' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {profiles?.full_name}! 🎨</h1>
          <p className="text-gray-600">Here is an overview of your artistry journey</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">💰</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{dashboardData.total_earnings?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">👁️</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">Portfolio Views</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.portfolio_views || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">✅</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">Completed Orders</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.completed_orders || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">🖼️</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Artworks</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.total_artworks || 0}</p>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">My Portfolio</h2>
              <div className="flex gap-2">
                {selectedArtworks.length > 0 && (
                  <button
                    onClick={handlePushToMarketplace}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    data-testid="push-to-marketplace-btn"
                  >
                    Push to Marketplace ({selectedArtworks.length})
                  </button>
                )}
                <button
                  onClick={() => setShowAddArtwork(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  data-testid="add-artwork-btn"
                >
                  + Add Artwork
                </button>
              </div>
            </div>
            <div className="p-6">
              {!membershipStatus?.is_member && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> You need an active membership to push artworks to the marketplace.{' '}
                    <button onClick={() => setActiveTab('membership')} className="underline font-medium">
                      Get membership
                    </button>
                  </p>
                </div>
              )}
              {artworks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No artworks yet. Add your first artwork.</p>
                  <button
                    onClick={() => setShowAddArtwork(true)}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Add Artwork
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {artworks.map((artwork) => (
                    <div key={artwork.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="h-48 bg-gray-100 relative">
                        {artwork.is_approved && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedArtworks.includes(artwork.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedArtworks([...selectedArtworks, artwork.id]);
                                } else {
                                  setSelectedArtworks(selectedArtworks.filter(id => id !== artwork.id));
                                }
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        )}
                        {(artwork.images?.[0] || artwork.image) ? (
                          <img
                            src={artwork.images?.[0] || artwork.image}
                            alt={artwork.title}
                            className="w-full h-full object-contain bg-gray-50"
                            onError={(e) => {
                              console.error('Image load error for:', artwork.image);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full flex items-center justify-center text-4xl"
                          style={{ display: (artwork.images?.[0] || artwork.image) ? 'none' : 'flex' }}
                        >
                          🎨
                        </div>
                        {!artwork.is_approved && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                            Pending Approval
                          </div>
                        )}
                        {artwork.in_marketplace && (
                          <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                            In Marketplace
                          </div>
                        )}
                        {artwork.images && artwork.images.length > 1 && (
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                            +{artwork.images.length - 1} more
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900">{artwork.title}</h3>
                        <p className="text-sm text-orange-500">{artwork.category}</p>
                        <p className="text-lg font-bold text-gray-900 mt-2">₹{artwork.price?.toLocaleString()}</p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDeleteArtwork(artwork.id)}
                            className="flex-1 px-3 py-1.5 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                        <p className={`text-xs mt-2 ${artwork.is_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                          {artwork.is_approved ? '✓ Approved' : '⏳ Pending approval'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
            </div>
            <div className="p-6">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                          <p className="text-sm text-gray-500">{order.artwork_title}</p>
                          <p className="text-sm text-gray-500">Customer: {order.customer_name}</p>
                          {order.awb_number && (
                            <p className="text-sm text-blue-600 mt-1">AWB: {order.awb_number}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-500">₹{order.artist_receives?.toLocaleString()}</p>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      {order.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <AWBUpdateForm orderId={order.id} onUpdate={fetchData} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Membership Tab */}
        {activeTab === 'membership' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Membership</h2>
            </div>
            <div className="p-6">
              {membershipStatus?.is_member ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">⭐</span>
                    <div>
                      <h3 className="text-xl font-bold text-green-800">Active Membership</h3>
                      <p className="text-green-600">
                        {membershipStatus.membership_type === 'annual' ? 'Annual' : 'Monthly'} Plan
                      </p>
                    </div>
                  </div>
                  <p className="text-green-700">
                    Expires: {new Date(membershipStatus.membership_expiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    You can push approved artworks to the marketplace!
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-orange-800 mb-2">Why Become a Member?</h3>
                  <ul className="list-disc list-inside text-orange-700 space-y-1">
                    <li>Push your approved artworks to the marketplace</li>
                    <li>Get featured visibility across the platform</li>
                    <li>Access exclusive exhibitions</li>
                    <li>Connect with art collectors directly</li>
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`border-2 rounded-xl p-6 ${membershipStatus?.membership_type === 'monthly' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Monthly Plan</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">₹99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">+ 18% GST = ₹116.82/month</p>
                  <button
                    onClick={() => handleMembershipPayment('monthly')}
                    disabled={membershipStatus?.is_member}
                    className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {membershipStatus?.is_member ? 'Current Plan' : 'Choose Monthly'}
                  </button>
                </div>
                
                <div className={`border-2 rounded-xl p-6 relative ${membershipStatus?.membership_type === 'annual' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                    Save 20%
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Annual Plan</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">₹999</span>
                    <span className="text-gray-500">/year</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">+ 18% GST = ₹1,178.82/year</p>
                  <button
                    onClick={() => handleMembershipPayment('annual')}
                    disabled={membershipStatus?.is_member}
                    className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {membershipStatus?.is_member ? 'Current Plan' : 'Choose Annual'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
              <button
                onClick={() => {
                  setProfileForm({
                    full_name: profiles?.full_name || '',
                    bio: profiles?.bio || '',
                    location: profiles?.location || '',
                    categories: profiles?.categories || [],
                    avatar: profiles?.avatar || '',
                    phone: profiles?.phone || '',
                    teaching_rate: profiles?.teaching_rate || null,
                    teaches_online: profiles?.teaches_online || false,
                    teaches_offline: profiles?.teaches_offline || false
                  });
                  setShowEditProfile(true);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Edit Profile
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {profiles?.avatar ? (
                        <img src={profiles.avatar} alt={profiles.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">👤</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profiles?.full_name}</h3>
                      <p className="text-sm text-gray-500">{profiles?.email}</p>
                      {profiles?.is_featured && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full">⭐ Featured Artist</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-900">{profiles?.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Bio</label>
                      <p className="text-gray-900">{profiles?.bio || 'No bio added yet'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Art Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {(profiles?.categories || []).filter(Boolean).length > 0 ? (
                      (profiles?.categories || []).filter(Boolean).map((cat, i) => (
                        <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No categories selected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <button onClick={() => setShowEditProfile(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, full_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <ImageUpload
                      bucket={BUCKETS.AVATARS}
                      folder="avatars"
                      onUpload={async (url) => {
                        setProfileForm((prev) => ({ ...prev, avatar: url }));

                        await authAPI.updateProfile({ avatar: url });
                      }}
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Teaching Profile Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Profile (Optional)</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Rate (₹ per session)</label>
                      <input
                        type="number"
                        value={profileForm.teaching_rate || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, teaching_rate: parseFloat(e.target.value) || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phone || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="+91 9876543210"
                      />
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileForm.teaches_online || false}
                          onChange={(e) => setProfileForm({ ...profileForm, teaches_online: e.target.checked })}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">💻 I teach online</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileForm.teaches_offline || false}
                          onChange={(e) => setProfileForm({ ...profileForm, teaches_offline: e.target.checked })}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">📍 I teach in-person</span>
                      </label>
                    </div>

                    <p className="text-xs text-gray-500">
                      Setting teaching preferences will make you visible to students looking for art classes
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Art Categories (select multiple)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {ART_CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={profileForm.categories.includes(cat)}
                          onChange={() => handleProfileCategoryToggle(cat)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                  {profileForm.categories.length > 0 && (
                    <p className="text-xs text-orange-500 mt-1">
                      Selected: {profileForm.categories.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Artwork Modal */}
        {showAddArtwork && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Add New Artwork</h2>
                <button onClick={() => setShowAddArtwork(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleAddArtwork} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newArtwork.title}
                    onChange={(e) => setNewArtwork({ ...newArtwork, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    data-testid="artwork-title-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newArtwork.category}
                    onChange={(e) => setNewArtwork({ ...newArtwork, category: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    data-testid="artwork-category-select"
                  >
                    <option value="">Select category</option>
                    {ART_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={newArtwork.price}
                    onChange={(e) => setNewArtwork({ ...newArtwork, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    data-testid="artwork-price-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artwork Images (up to 5)
                  </label>
                  
                  {/* Uploaded images preview */}
                  {newArtwork.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {newArtwork.images.map((url, index) => (
                        <div key={index} className="relative w-20 h-20 border rounded overflow-hidden">
                          <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {newArtwork.images.length < 5 && (
                    <ImageUpload
                      bucket={BUCKETS.ARTWORKS}
                      folder="artworks"
                      onUpload={handleImageUpload}
                      label={`Upload Image (${newArtwork.images.length}/5)`}
                    />
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {newArtwork.images.length === 0 
                      ? 'Upload at least 1 image' 
                      : `${newArtwork.images.length} image(s) uploaded. You can add up to ${5 - newArtwork.images.length} more.`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newArtwork.description}
                    onChange={(e) => setNewArtwork({ ...newArtwork, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddArtwork(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    data-testid="submit-artwork-btn"
                  >
                    Add Artwork
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// AWB Update Form Component
function AWBUpdateForm({ orderId, onUpdate }) {
  const [awbNumber, setAwbNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const courierOptions = [
    'Delhivery',
    'BlueDart',
    'DTDC',
    'FedEx',
    'India Post',
    'Ecom Express',
    'Xpressbees',
    'Other'
  ];

  const handleSubmit = async () => {
    if (!awbNumber || !courierPartner) {
      alert('Please enter AWB number and select courier partner');
      return;
    }
    
    setLoading(true);
    try {
      await artistAPI.updateAWB(orderId, {
        order_id: orderId,
        awb_number: awbNumber,
        courier_partner: courierPartner,
        tracking_url: courierPartner === 'Other' ? trackingUrl : null
      });
      alert('AWB updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating AWB:', error);
      alert(error.message || 'Failed to update AWB');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700">Update Shipping Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          value={courierPartner}
          onChange={(e) => setCourierPartner(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Select Courier</option>
          {courierOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input
          type="text"
          value={awbNumber}
          onChange={(e) => setAwbNumber(e.target.value)}
          placeholder="AWB Number"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>
      {courierPartner === 'Other' && (
        <input
          type="url"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="Tracking URL (if courier is not listed)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      )}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update AWB'}
      </button>
    </div>
  );
}

export default ArtistDashboard;
