
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { ART_CATEGORIES } from '../utils/branding';

function AdminDashboard() {
  const { profiles, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingArtists, setPendingArtists] = useState([]);
  const [pendingArtworks, setPendingArtworks] = useState([]);
  const [pendingExhibitions, setPendingExhibitions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [approvedArtists, setApprovedArtists] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState({ contemporary: [], registered: [] });
  const [subAdmins, setSubAdmins] = useState([]);
  const [memberArtists, setMemberArtists] = useState([]);
  const [nonMemberArtists, setNonMemberArtists] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([
    { id: 'basic', name: 'Basic', price: 999, duration: '1 Month', duration_days: 30, features: ['Appear in Artists Directory', 'Upload up to 10 artworks', 'Basic portfolio page', 'Email support'], popular: false, active: true },
    { id: 'premium', name: 'Premium', price: 2499, duration: '3 Months', duration_days: 90, features: ['Everything in Basic', 'Upload unlimited artworks', 'Featured artist placement', 'Priority support', 'Analytics dashboard'], popular: true, active: true },
    { id: 'annual', name: 'Annual', price: 7999, duration: '12 Months', duration_days: 365, features: ['Everything in Premium', 'Custom portfolio URL', 'Exhibition priority', 'Dedicated account manager', 'Marketing features', '2 months FREE'], popular: false, active: true },
  ]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAddContemporary, setShowAddContemporary] = useState(false);
  const [showCreateVoucher, setShowCreateVoucher] = useState(false);
  const [showCreateSubAdmin, setShowCreateSubAdmin] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipForm, setMembershipForm] = useState({ plan: 'basic', duration_days: 30 });

  const [contemporaryForm, setContemporaryForm] = useState({
    name: '',
    bio: '',
    avatar: '',
    categories: [],
    location: '',
    artworks: [],
  });

  const [newArtworkForm, setNewArtworkForm] = useState({
    title: '',
    image: '',
    category: '',
    price: '',
    description: '',
  });

  const [subAdminForm, setSubAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'lead_chitrakar',
    location: '',
  });

  const [voucherForm, setVoucherForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    max_uses: 100,
    applicable_plans: [],
    description: '',
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'artists', label: 'Pending Artists', icon: '👥' },
    { id: 'members', label: 'Members', icon: '💳' },
    { id: 'non-members', label: 'Non-Members', icon: '👤' },
    { id: 'artworks', label: 'Pending Artworks', icon: '🖼️' },
    { id: 'exhibitions', label: 'Exhibitions', icon: '🎨' },
    { id: 'feature', label: 'Feature Artists', icon: '⭐' },
    { id: 'pricing', label: 'Pricing & Vouchers', icon: '🎟️' },
    { id: 'users', label: 'All Users', icon: '👤' },
    { id: 'subadmins', label: 'Sub-Admins', icon: '🔑' },
  ];

  // CORRECT ADMIN GUARD
  useEffect(() => {
    if (isLoading) return;

    if (!profiles || !isAdmin) {
      navigate('/login', { replace: true });
      return;
    }

    fetchData();
  }, [profiles, isAdmin, isLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        dashboard,
        artists,
        artworks,
        exhibitions,
        users,
        approved,
        featured,
        subadmins,
        artistsByMembership,
        vouchersData,
      ] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getPendingArtists(),
        adminAPI.getPendingArtworks(),
        adminAPI.getPendingExhibitions(),
        adminAPI.getAllUsers(),
        adminAPI.getApprovedArtists().catch(() => ({ artists: [] })),
        adminAPI.getFeaturedArtists().catch(() => ({ contemporary: [], registered: [] })),
        adminAPI.getSubAdmins().catch(() => ({ sub_admins: [] })),
        adminAPI.getArtistsByMembership().catch(() => ({ members: [], non_members: [] })),
        adminAPI.getVouchers().catch(() => ({ vouchers: [] })),
      ]);

      setDashboardData(dashboard);
      setPendingArtists(artists.artists || []);
      setPendingArtworks(artworks.artworks || []);
      setPendingExhibitions(exhibitions.exhibitions || []);
      setAllUsers(users.users || []);
      setApprovedArtists(approved.artists || []);
      setFeaturedArtists(featured);
      setSubAdmins(subadmins.sub_admins || []);
      setMemberArtists(artistsByMembership.members || []);
      setNonMemberArtists(artistsByMembership.non_members || []);
      setVouchers(vouchersData.vouchers || []);
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // === ACTION HANDLERS ===
  const handleApproveArtist = async (id, approved) => {
    await adminAPI.approveArtist(id, approved);
    fetchData();
  };

  const handleApproveArtwork = async (id, approved) => {
    await adminAPI.approveArtwork(id, approved);
    fetchData();
  };

  const handleApproveExhibition = async (id, approved) => {
    await adminAPI.approveExhibition(id, approved);
    fetchData();
  };

  const handleToggleUserStatus = async (id) => {
    await adminAPI.toggleUserStatus(id);
    fetchData();
  };

  const handleFeatureRegisteredArtist = async (id, featured) => {
    await adminAPI.featureRegisteredArtist(id, featured);
    fetchData();
  };

  // === CONTEMPORARY ARTIST ===
  const handleCategoryToggle = (category) => {
    setContemporaryForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleAddArtworkToContemporary = () => {
    if (!newArtworkForm.title || !newArtworkForm.image) return;
    if (contemporaryForm.artworks.length >= 10) return;

    setContemporaryForm((prev) => ({
      ...prev,
      artworks: [
        ...prev.artworks,
        { ...newArtworkForm, price: Number(newArtworkForm.price) || 0 },
      ],
    }));

    setNewArtworkForm({ title: '', image: '', category: '', price: '', description: '' });
  };

  const handleRemoveArtworkFromContemporary = (index) => {
    setContemporaryForm((prev) => ({
      ...prev,
      artworks: prev.artworks.filter((_, i) => i !== index),
    }));
  };

  const handleCreateContemporaryArtist = async () => {
    if (!contemporaryForm.name || !contemporaryForm.bio || !contemporaryForm.avatar) return;

    await adminAPI.createFeaturedArtist(contemporaryForm);
    setShowAddContemporary(false);
    setContemporaryForm({ name: '', bio: '', avatar: '', categories: [], location: '', artworks: [] });
    fetchData();
  };

  const handleDeleteContemporaryArtist = async (id) => {
    if (!window.confirm('Delete this featured artist?')) return;
    await adminAPI.deleteFeaturedArtist(id);
    fetchData();
  };

  // === SUB ADMIN ===
  const handleCreateSubAdmin = async () => {
    if (!subAdminForm.name || !subAdminForm.email || !subAdminForm.password) return;

    await adminAPI.createSubAdmin(subAdminForm);
    setShowCreateSubAdmin(false);
    setSubAdminForm({ name: '', email: '', password: '', role: 'lead_chitrakar', location: '' });
    fetchData();
  };

  // === VOUCHER HANDLERS ===
  const handleCreateVoucher = async () => {
    if (!voucherForm.code || !voucherForm.discount_value) return;

    try {
      await adminAPI.createVoucher(voucherForm);
      setShowCreateVoucher(false);
      setVoucherForm({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_uses: 100,
        applicable_plans: [],
        description: '',
      });
      fetchData();
    } catch (error) {
      alert(error.message || 'Failed to create voucher');
    }
  };

  const handleDeleteVoucher = async (voucherId) => {
    if (!window.confirm('Delete this voucher?')) return;
    await adminAPI.deleteVoucher(voucherId);
    fetchData();
  };

  const handleToggleVoucher = async (voucherId) => {
    await adminAPI.toggleVoucher(voucherId);
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome, {profiles?.full_name || profiles?.email}
        </p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Pending Artists</p>
              <p className="text-3xl font-bold text-orange-500">{dashboardData.pending_artists}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Pending Artworks</p>
              <p className="text-3xl font-bold text-purple-500">{dashboardData.pending_artworks}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Pending Exhibitions</p>
              <p className="text-3xl font-bold text-blue-500">{dashboardData.pending_exhibitions}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.total_users}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Featured Artists</p>
              <p className="text-3xl font-bold text-yellow-500">{dashboardData.featured_artists || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Platform Revenue</p>
              <p className="text-3xl font-bold text-green-600">₹{dashboardData.total_revenue?.toLocaleString() || 0}</p>
            </div>
          </div>
        )}

        {/* Pending Artists Tab */}
        {activeTab === 'artists' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Pending Artist Approvals</h2>
            </div>
            <div className="p-6">
              {pendingArtists.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending artists to review</p>
              ) : (
                <div className="space-y-4">
                  {pendingArtists.map((artist) => (
                    <div key={artist.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {artist.full_name || 'Unnamed Artist'}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {artist.email}
                        </p>

                        <p className="text-sm text-orange-500">
                          {(artist.categories || []).join(', ') || 'No category'} • {artist.location || 'No location'}
                        </p>

                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveArtist(artist.id, true)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Approve</button>
                        <button onClick={() => handleApproveArtist(artist.id, false)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Member Artists ({memberArtists.length})</h2>
              <p className="text-sm text-gray-500">Artists with active membership - visible publicly</p>
            </div>
            <div className="p-6">
              {memberArtists.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No member artists</p>
              ) : (
                <div className="space-y-4">
                  {memberArtists.map((artist) => (
                    <div key={artist.id} className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center overflow-hidden">
                          {artist.avatar ? (
                            <img src={artist.avatar} alt={artist.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">👤</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{artist.full_name}</h3>
                          <p className="text-sm text-gray-500">{artist.email}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                              {artist.membership_plan || 'Member'}
                            </span>
                            <span className="text-xs text-gray-500">
                              Expires: {artist.membership_expiry ? new Date(artist.membership_expiry).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedUser(artist); setShowRoleModal(true); }}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Revoke membership?')) {
                              await adminAPI.revokeMembership(artist.id);
                              fetchData();
                            }
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Non-Members Tab */}
        {activeTab === 'non-members' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Non-Member Artists ({nonMemberArtists.length})</h2>
              <p className="text-sm text-gray-500">Artists without membership - NOT visible publicly until they upgrade</p>
            </div>
            <div className="p-6">
              {nonMemberArtists.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No non-member artists</p>
              ) : (
                <div className="space-y-4">
                  {nonMemberArtists.map((artist) => (
                    <div key={artist.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {artist.avatar ? (
                            <img src={artist.avatar} alt={artist.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">👤</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{artist.full_name}</h3>
                          <p className="text-sm text-gray-500">{artist.email}</p>
                          <span className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full">
                            No Membership
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedUser(artist); setShowRoleModal(true); }}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => { setSelectedUser(artist); setShowMembershipModal(true); }}
                          className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Grant Membership
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Artworks Tab */}
        {activeTab === 'artworks' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Pending Artwork Approvals</h2>
            </div>
            <div className="p-6">
              {pendingArtworks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending artworks to review</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingArtworks.map((artwork) => (
                    <div key={artwork.id} className="border border-gray-200 rounded-lg overflow-hidden" data-testid={`pending-artwork-${artwork.id}`}>
                      <div className="h-48 bg-gray-50 relative">
                        {(artwork.images?.[0] || artwork.image) ? (
                          <img 
                            src={artwork.images?.[0] || artwork.image} 
                            alt={artwork.title} 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                        )}
                        {artwork.images && artwork.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                            +{artwork.images.length - 1} more
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">{artwork.title}</h3>
                        <p className="text-sm text-gray-500">{artwork.artist_name}</p>
                        <p className="text-sm text-orange-500">₹{artwork.price?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{artwork.category}</p>
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => handleApproveArtwork(artwork.id, true)} 
                            className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                            data-testid={`approve-artwork-${artwork.id}`}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleApproveArtwork(artwork.id, false)} 
                            className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            data-testid={`reject-artwork-${artwork.id}`}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Exhibitions Tab */}
        {activeTab === 'exhibitions' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Pending Exhibition Approvals</h2>
            </div>
            <div className="p-6">
              {pendingExhibitions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending exhibitions to review</p>
              ) : (
                <div className="space-y-4">
                  {pendingExhibitions.map((exhibition) => (
                    <div key={exhibition.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exhibition.name}</h3>
                        <p className="text-sm text-gray-500">by {exhibition.artist_name}</p>
                        <p className="text-sm text-orange-500">{exhibition.start_date} - {exhibition.end_date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveExhibition(exhibition.id, true)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Approve</button>
                        <button onClick={() => handleApproveExhibition(exhibition.id, false)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature Artists Tab */}
        {activeTab === 'feature' && (
          <div className="space-y-8">
            {/* Add Contemporary Artist Section */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Feature Contemporary Artist</h2>
                  <p className="text-sm text-gray-500">Add external artists with bio, picture, and artworks</p>
                </div>
                <button
                  onClick={() => setShowAddContemporary(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  + Add Contemporary Artist
                </button>
              </div>
              
              {/* Contemporary Artists List */}
              <div className="p-6">
                {featuredArtists.contemporary?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No contemporary artists featured yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuredArtists.contemporary?.map((artist) => (
                      <div key={artist.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <img src={artist.avatar} alt={artist.name} className="w-16 h-16 rounded-full object-cover" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{artist.name}</h3>
                            <p className="text-sm text-orange-500">{(artist.categories || []).join(', ')}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{artist.bio?.substring(0, 100)}...</p>
                            <p className="text-xs text-gray-400 mt-1">{artist.artworks?.length || 0} artworks</p>
                          </div>
                          <button
                            onClick={() => handleDeleteContemporaryArtist(artist.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Feature Registered Artists Section */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Feature Registered Artists</h2>
                <p className="text-sm text-gray-500">Select approved artists to feature on homepage</p>
              </div>
              <div className="p-6">
                {approvedArtists.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No approved artists available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {approvedArtists.map((artist) => (
                      <div key={artist.id} className={`border rounded-lg p-4 ${artist.is_featured ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {artist.avatar ? (
                              <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">👤</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{artist.name}</h3>
                            <p className="text-sm text-orange-500">
                              {(artist.categories || [artist.category]).filter(Boolean).join(', ')}
                            </p>
                            <p className="text-xs text-gray-500">{artist.artwork_count || 0} artworks</p>
                            {artist.is_featured && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full">⭐ Featured</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleFeatureRegisteredArtist(artist.id, !artist.is_featured)}
                            className={`flex-1 px-3 py-1.5 rounded text-sm font-medium ${
                              artist.is_featured
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            }`}
                          >
                            {artist.is_featured ? 'Unfeature' : '⭐ Feature'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pricing & Vouchers Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-8">
            {/* Membership Plans Overview */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Membership Plans</h2>
                <p className="text-sm text-gray-500">Current pricing structure for artist memberships</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monthly Plan */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Monthly Membership</h3>
                        <p className="text-sm text-gray-500">30-day access to all features</p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                    </div>
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-gray-900">₹99</p>
                      <p className="text-sm text-gray-500">+ 18% GST = ₹116.82</p>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Public artist profile</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> List artworks on marketplace</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Join communities</li>
                    </ul>
                  </div>

                  {/* Annual Plan */}
                  <div className="border-2 border-orange-400 rounded-xl p-6 relative">
                    <div className="absolute -top-3 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Best Value
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Annual Membership</h3>
                        <p className="text-sm text-gray-500">365-day access (save 16%)</p>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                    </div>
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-gray-900">₹999</p>
                      <p className="text-sm text-gray-500">+ 18% GST = ₹1,178.82</p>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> All monthly features</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Featured on homepage</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Priority support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Vouchers Section */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Discount Vouchers</h2>
                  <p className="text-sm text-gray-500">Create and manage promotional vouchers</p>
                </div>
                <button
                  onClick={() => setShowCreateVoucher(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  data-testid="create-voucher-btn"
                >
                  + Create Voucher
                </button>
              </div>
              <div className="p-6">
                {vouchers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-5xl block mb-4">🎟️</span>
                    <p>No vouchers created yet</p>
                    <p className="text-sm">Create vouchers to offer discounts on memberships</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vouchers.map((voucher) => (
                      <div 
                        key={voucher.id} 
                        className={`border rounded-lg p-4 ${voucher.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                        data-testid={`voucher-${voucher.id}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <code className="bg-white px-3 py-1 rounded border font-mono text-lg font-bold text-orange-600">
                                {voucher.code}
                              </code>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                voucher.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                              }`}>
                                {voucher.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {voucher.discount_type === 'percentage' 
                                ? `${voucher.discount_value}% off` 
                                : `₹${voucher.discount_value} off`}
                              {voucher.description && ` - ${voucher.description}`}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>Valid: {new Date(voucher.valid_from).toLocaleDateString()} - {new Date(voucher.valid_until).toLocaleDateString()}</span>
                              <span>Uses: {voucher.uses_count || 0} / {voucher.max_uses}</span>
                              {voucher.applicable_plans?.length > 0 && (
                                <span>Plans: {voucher.applicable_plans.join(', ')}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleVoucher(voucher.id)}
                              className={`px-3 py-1.5 rounded text-sm font-medium ${
                                voucher.is_active 
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              {voucher.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(voucher.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'artist' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                        {u.role === 'artist' && u.is_featured && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">⭐ Featured</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`px-3 py-1 text-xs rounded ${
                              u.is_active !== false
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {u.is_active !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Admins Tab */}
        {activeTab === 'subadmins' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Sub-Admin Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Create and manage Lead Chitrakar and Kalakar roles</p>
                </div>
                <button
                  onClick={() => setShowCreateSubAdmin(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  + Create Sub-Admin
                </button>
              </div>

              <div className="p-6">
                {subAdmins.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-5xl block mb-4">👤</span>
                    <p>No sub-admins created yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subAdmins.map((subAdmin) => (
                      <div key={subAdmin.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{subAdmin.name}</h3>
                            <p className="text-sm text-gray-500">{subAdmin.email}</p>
                            {subAdmin.location && (
                              <p className="text-xs text-gray-400 mt-1">📍 {subAdmin.location}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            subAdmin.role === 'lead_chitrakar' 
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {subAdmin.role === 'lead_chitrakar' ? 'Lead Chitrakar' : 'Kalakar'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          {subAdmin.role === 'lead_chitrakar' && (
                            <p>✓ Can approve artworks for quality control</p>
                          )}
                          {subAdmin.role === 'kalakar' && (
                            <>
                              <p>✓ Can view exhibition analytics</p>
                              <p>✓ Can manage payment records</p>
                            </>
                          )}
                          <p className="text-xs text-gray-400 pt-2">
                            Created: {new Date(subAdmin.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Sub-Admin Modal */}
        {showCreateSubAdmin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Create Sub-Admin</h2>
                <button onClick={() => setShowCreateSubAdmin(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={subAdminForm.name}
                    onChange={(e) => setSubAdminForm({ ...subAdminForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={subAdminForm.email}
                    onChange={(e) => setSubAdminForm({ ...subAdminForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    value={subAdminForm.password}
                    onChange={(e) => setSubAdminForm({ ...subAdminForm, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    value={subAdminForm.role}
                    onChange={(e) => setSubAdminForm({ ...subAdminForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="lead_chitrakar">Lead Chitrakar (Artwork Quality Control)</option>
                    <option value="kalakar">Kalakar (Exhibition & Payment Management)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={subAdminForm.location}
                    onChange={(e) => setSubAdminForm({ ...subAdminForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="City, Country"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-semibold mb-1">Role Permissions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {subAdminForm.role === 'lead_chitrakar' ? (
                      <>
                        <li>Review and approve/reject artworks</li>
                        <li>Maintain platform quality standards</li>
                      </>
                    ) : (
                      <>
                        <li>View exhibition analytics</li>
                        <li>Manage payment records</li>
                        <li>Track voluntary platform fees</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateSubAdmin(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSubAdmin}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Create Sub-Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Contemporary Artist Modal */}
        {showAddContemporary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Add Contemporary Artist</h2>
                <button onClick={() => setShowAddContemporary(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Artist Name *</label>
                    <input
                      type="text"
                      value={contemporaryForm.name}
                      onChange={(e) => setContemporaryForm({ ...contemporaryForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={contemporaryForm.location}
                      onChange={(e) => setContemporaryForm({ ...contemporaryForm, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Picture URL *</label>
                  <input
                    type="url"
                    value={contemporaryForm.avatar}
                    onChange={(e) => setContemporaryForm({ ...contemporaryForm, avatar: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="https://..."
                  />
                  {contemporaryForm.avatar && (
                    <img src={contemporaryForm.avatar} alt="Preview" className="w-20 h-20 rounded-full object-cover mt-2" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {ART_CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contemporaryForm.categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio * (up to 2500 words)</label>
                  <textarea
                    value={contemporaryForm.bio}
                    onChange={(e) => setContemporaryForm({ ...contemporaryForm, bio: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Write about the artist..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {contemporaryForm.bio.split(/\s+/).filter(Boolean).length} / 2500 words
                  </p>
                </div>

                {/* Artworks Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Artworks (up to 10)</h3>
                  
                  {/* Add Artwork Form */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Artwork title"
                        value={newArtworkForm.title}
                        onChange={(e) => setNewArtworkForm({ ...newArtworkForm, title: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={newArtworkForm.image}
                        onChange={(e) => setNewArtworkForm({ ...newArtworkForm, image: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <select
                        value={newArtworkForm.category}
                        onChange={(e) => setNewArtworkForm({ ...newArtworkForm, category: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Category</option>
                        {ART_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={newArtworkForm.price}
                        onChange={(e) => setNewArtworkForm({ ...newArtworkForm, price: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddArtworkToContemporary}
                      disabled={contemporaryForm.artworks.length >= 10}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                      + Add Artwork
                    </button>
                  </div>

                  {/* Artworks List */}
                  {contemporaryForm.artworks.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {contemporaryForm.artworks.map((artwork, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-2 relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveArtworkFromContemporary(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                          {artwork.image && (
                            <img src={artwork.image} alt={artwork.title} className="w-full h-20 object-cover rounded mb-2" />
                          )}
                          <p className="text-sm font-medium truncate">{artwork.title}</p>
                          <p className="text-xs text-gray-500">₹{artwork.price?.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddContemporary(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateContemporaryArtist}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Create Featured Artist
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Change User Role</h2>
                <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Current Role: <span className="font-medium">{selectedUser.role}</span></p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select New Role</label>
                  <div className="space-y-2">
                    {[
                      { value: 'user', label: 'User', desc: 'Regular buyer account' },
                      { value: 'artist', label: 'Artist', desc: 'Can upload and sell artworks' },
                      { value: 'lead_chitrakar', label: 'Lead Chitrakar', desc: 'Can approve artworks' },
                      { value: 'kalakar', label: 'Kalakar', desc: 'Can view analytics & payments' },
                      { value: 'admin', label: 'Admin', desc: 'Full platform access' },
                    ].map((role) => (
                      <label 
                        key={role.value} 
                        className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedUser.role === role.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={selectedUser.newRole === role.value}
                          onChange={(e) => setSelectedUser({ ...selectedUser, newRole: e.target.value })}
                          className="mr-3 text-orange-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{role.label}</p>
                          <p className="text-xs text-gray-500">{role.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (selectedUser.newRole) {
                        await adminAPI.updateUserRole(selectedUser.id, selectedUser.newRole);
                        setShowRoleModal(false);
                        setSelectedUser(null);
                        fetchData();
                      }
                    }}
                    disabled={!selectedUser.newRole}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grant Membership Modal */}
        {showMembershipModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Grant Membership</h2>
                <button onClick={() => { setShowMembershipModal(false); setSelectedUser(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Membership Plan</label>
                  <select
                    value={membershipForm.plan}
                    onChange={(e) => setMembershipForm({ ...membershipForm, plan: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                  <select
                    value={membershipForm.duration_days}
                    onChange={(e) => setMembershipForm({ ...membershipForm, duration_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={30}>30 days (1 month)</option>
                    <option value={90}>90 days (3 months)</option>
                    <option value={180}>180 days (6 months)</option>
                    <option value={365}>365 days (1 year)</option>
                  </select>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="text-green-800">
                    <strong>Note:</strong> Granting membership will make this artist visible in the public Artists page.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowMembershipModal(false); setSelectedUser(null); }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await adminAPI.grantMembership(selectedUser.id, membershipForm.plan, membershipForm.duration_days);
                      setShowMembershipModal(false);
                      setSelectedUser(null);
                      fetchData();
                    }}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Grant Membership
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Voucher Modal */}
        {showCreateVoucher && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Create Voucher</h2>
                <button onClick={() => setShowCreateVoucher(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Code *</label>
                  <input
                    type="text"
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono uppercase"
                    placeholder="e.g., SUMMER20"
                    maxLength={20}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                    <select
                      value={voucherForm.discount_type}
                      onChange={(e) => setVoucherForm({ ...voucherForm, discount_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      value={voucherForm.discount_value}
                      onChange={(e) => setVoucherForm({ ...voucherForm, discount_value: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder={voucherForm.discount_type === 'percentage' ? '10' : '50'}
                      min={1}
                      max={voucherForm.discount_type === 'percentage' ? 100 : 10000}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                    <input
                      type="date"
                      value={voucherForm.valid_from}
                      onChange={(e) => setVoucherForm({ ...voucherForm, valid_from: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                    <input
                      type="date"
                      value={voucherForm.valid_until}
                      onChange={(e) => setVoucherForm({ ...voucherForm, valid_until: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Uses</label>
                  <input
                    type="number"
                    value={voucherForm.max_uses}
                    onChange={(e) => setVoucherForm({ ...voucherForm, max_uses: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="100"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Plans</label>
                  <div className="flex gap-3">
                    {['monthly', 'annual'].map((plan) => (
                      <label key={plan} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={voucherForm.applicable_plans.includes(plan)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVoucherForm({ ...voucherForm, applicable_plans: [...voucherForm.applicable_plans, plan] });
                            } else {
                              setVoucherForm({ ...voucherForm, applicable_plans: voucherForm.applicable_plans.filter(p => p !== plan) });
                            }
                          }}
                          className="w-4 h-4 text-orange-500 rounded"
                        />
                        <span className="capitalize">{plan}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all plans</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <input
                    type="text"
                    value={voucherForm.description}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Summer sale discount"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <p><strong>Preview:</strong> {voucherForm.code || 'CODE'} gives {
                    voucherForm.discount_type === 'percentage' 
                      ? `${voucherForm.discount_value}% off` 
                      : `₹${voucherForm.discount_value} off`
                  }</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateVoucher(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateVoucher}
                    disabled={!voucherForm.code || !voucherForm.discount_value}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    Create Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
