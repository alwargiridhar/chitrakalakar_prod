import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { communityAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { BUCKETS } from '../lib/supabase';

function CommunitiesPage() {
  const { isAuthenticated, isArtist, profiles } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [myInvites, setMyInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    image: '',
    category: '',
    location: '',
  });

  useEffect(() => {
    fetchCommunities();
    if (isAuthenticated && isArtist) {
      fetchMyCommunities();
      fetchMyInvites();
    }
  }, [isAuthenticated, isArtist]);

  const fetchCommunities = async () => {
    try {
      const response = await communityAPI.getAll();
      setCommunities(response.communities || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCommunities = async () => {
    try {
      const response = await communityAPI.getMyCommunities();
      setMyCommunities(response.communities || []);
    } catch (error) {
      console.error('Error fetching my communities:', error);
    }
  };

  const fetchMyInvites = async () => {
    try {
      const response = await communityAPI.getMyInvites();
      setMyInvites(response.invites || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to create communities');
      return;
    }

    try {
      await communityAPI.create(createForm);
      alert('Community created! Pending admin approval.');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', image: '', category: '', location: '' });
      fetchCommunities();
    } catch (error) {
      alert(error.message || 'Failed to create community');
    }
  };

  const handleJoinCommunity = async (communityId) => {
    if (!isAuthenticated) {
      alert('Please login to join communities');
      return;
    }
    if (!isArtist) {
      alert('Only artists can join communities');
      return;
    }

    try {
      await communityAPI.join(communityId);
      alert('Join request submitted!');
      fetchCommunities();
    } catch (error) {
      alert(error.message || 'Failed to submit join request');
    }
  };

  const handleRespondToInvite = async (inviteId, accept) => {
    try {
      await communityAPI.respondToInvite(inviteId, accept);
      fetchMyInvites();
      fetchMyCommunities();
    } catch (error) {
      alert(error.message || 'Failed to respond to invite');
    }
  };

  const categories = [
    'Abstract Art', 'Traditional Art', 'Digital Art', 'Photography', 
    'Sculpture', 'Mixed Media', 'Regional Art', 'Contemporary'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Art Communities</h1>
            <p className="text-gray-600 mt-1">Connect with fellow artists and art enthusiasts</p>
          </div>
          
          {isAuthenticated && isArtist && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:opacity-90 flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <span>+</span> Create Community
            </button>
          )}
        </div>

        {/* Tabs */}
        {isAuthenticated && isArtist && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'explore', label: 'Explore', icon: '🌐' },
              { id: 'my-communities', label: 'My Communities', icon: '👥' },
              { id: 'invites', label: `Invites ${myInvites.length > 0 ? `(${myInvites.length})` : ''}`, icon: '📩' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Explore Tab */}
            {activeTab === 'explore' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white rounded-xl">
                    <span className="text-6xl mb-4 block">🎨</span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No communities yet</h3>
                    <p className="text-gray-500 mb-4">Be the first to create an art community!</p>
                    {isAuthenticated && isArtist && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium"
                      >
                        Create Community
                      </button>
                    )}
                  </div>
                ) : (
                  communities.map((community) => (
                    <div key={community.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-32 bg-gradient-to-br from-orange-100 to-yellow-100 relative">
                        {community.image && (
                          <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
                        )}
                        {community.category && (
                          <span className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-orange-600">
                            {community.category}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{community.name}</h3>
                        {community.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                            <span>📍</span> {community.location}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{community.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-900">{community.member_count || 0}</span> members
                          </span>
                          <div className="flex gap-2">
                            <Link
                              to={`/community/${community.id}`}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleJoinCommunity(community.id)}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* My Communities Tab */}
            {activeTab === 'my-communities' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCommunities.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white rounded-xl">
                    <span className="text-6xl mb-4 block">👥</span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No communities joined</h3>
                    <p className="text-gray-500">Explore and join communities to connect with other artists</p>
                  </div>
                ) : (
                  myCommunities.map((membership) => (
                    <Link
                      key={membership.community_id}
                      to={`/community/${membership.community_id}`}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-24 bg-gradient-to-br from-purple-100 to-indigo-100 relative">
                        {membership.communities?.image && (
                          <img src={membership.communities.image} alt="" className="w-full h-full object-cover" />
                        )}
                        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                          membership.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-white/90 text-gray-700'
                        }`}>
                          {membership.role}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">{membership.communities?.name}</h3>
                        <p className="text-sm text-gray-500">{membership.communities?.member_count || 0} members</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <div className="space-y-4">
                {myInvites.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <span className="text-6xl mb-4 block">📩</span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending invites</h3>
                    <p className="text-gray-500">You'll see community invitations here</p>
                  </div>
                ) : (
                  myInvites.map((invite) => (
                    <div key={invite.id} className="bg-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center overflow-hidden">
                          {invite.communities?.image ? (
                            <img src={invite.communities.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">👥</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{invite.communities?.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{invite.communities?.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondToInvite(invite.id, false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespondToInvite(invite.id, true)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Create Community</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleCreateCommunity} className="p-6 space-y-4">
              {!profiles?.is_member && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <strong>Note:</strong> Active membership is required to create communities.
                  <Link to="/subscription" className="text-orange-600 ml-1 underline">Upgrade now</Link>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Community Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Mumbai Abstract Artists"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="What is this community about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <LocationAutocomplete
                  value={createForm.location}
                  onChange={(value) => setCreateForm({ ...createForm, location: value })}
                  placeholder="City or region"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Community Image</label>
                {createForm.image && (
                  <img src={createForm.image} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <ImageUpload
                  bucket={BUCKETS.COMMUNITIES || 'communities'}
                  folder="logos"
                  onUpload={(url) => setCreateForm({ ...createForm, image: url })}
                  label="Upload Image"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!profiles?.is_member}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunitiesPage;
