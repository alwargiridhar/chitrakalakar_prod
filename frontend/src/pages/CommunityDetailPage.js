import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { communityAPI, publicAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { BUCKETS } from '../lib/supabase';

function CommunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isArtist, profiles } = useAuth();
  
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Post creation
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    content: '',
    images: [],
    post_type: 'text'
  });
  const [posting, setPosting] = useState(false);
  
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    fetchCommunityData();
  }, [id]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const response = await communityAPI.getDetails(id);
      setCommunity(response.community);
      setMembers(response.members || []);
      setPosts(response.posts || []);
      
      // Check if current user is a member
      if (profiles?.id) {
        const memberRecord = (response.members || []).find(m => m.user_id === profiles.id);
        setIsMember(!!memberRecord);
        setIsAdmin(memberRecord?.role === 'admin');
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      alert('Please login to join communities');
      navigate('/login');
      return;
    }
    
    try {
      await communityAPI.join(id);
      alert('Successfully joined the community!');
      fetchCommunityData();
    } catch (error) {
      alert(error.message || 'Failed to join community');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this community?')) return;
    
    try {
      await communityAPI.leave(id);
      setIsMember(false);
      fetchCommunityData();
    } catch (error) {
      alert(error.message || 'Failed to leave community');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postForm.content.trim()) return;
    
    setPosting(true);
    try {
      await communityAPI.createPost(id, postForm.content, postForm.images, postForm.post_type);
      setShowPostModal(false);
      setPostForm({ content: '', images: [], post_type: 'text' });
      fetchCommunityData();
    } catch (error) {
      alert(error.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleInviteArtists = async () => {
    if (selectedArtists.length === 0) return;
    
    try {
      await communityAPI.invite(id, selectedArtists, inviteMessage);
      alert('Invitations sent successfully!');
      setShowInviteModal(false);
      setSelectedArtists([]);
      setInviteMessage('');
    } catch (error) {
      alert(error.message || 'Failed to send invitations');
    }
  };

  const loadAvailableArtists = async () => {
    try {
      const response = await publicAPI.getArtists();
      // Filter out existing members
      const memberIds = members.map(m => m.user_id);
      setAvailableArtists((response.artists || []).filter(a => !memberIds.includes(a.id)));
    } catch (error) {
      console.error('Error loading artists:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Not Found</h1>
          <p className="text-gray-500 mb-4">This community may have been removed or doesn't exist.</p>
          <Link to="/communities" className="text-orange-500 hover:underline">
            Browse Communities →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="community-detail-page">
      {/* Header Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-purple-500 via-orange-400 to-yellow-400">
        {community.image && (
          <img 
            src={community.image} 
            alt={community.name} 
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Back Button */}
        <Link 
          to="/communities" 
          className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
        >
          ← Back to Communities
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10 pb-12">
        {/* Community Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{community.name}</h1>
                {community.category && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {community.category}
                  </span>
                )}
              </div>
              
              {community.location && (
                <p className="text-gray-500 flex items-center gap-1 mb-3">
                  <span>📍</span> {community.location}
                </p>
              )}
              
              <p className="text-gray-600 mb-4">{community.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">{members.length}</span> members
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">{posts.length}</span> posts
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {isMember ? (
                <>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:opacity-90"
                    data-testid="create-post-btn"
                  >
                    + Create Post
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { loadAvailableArtists(); setShowInviteModal(true); }}
                      className="px-6 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
                      data-testid="invite-artists-btn"
                    >
                      Invite Artists
                    </button>
                  )}
                  <button
                    onClick={handleLeave}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Leave Community
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoin}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:opacity-90"
                  data-testid="join-community-btn"
                >
                  Join Community
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'posts', label: 'Posts', icon: '📝' },
            { id: 'members', label: 'Members', icon: '👥' },
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

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <span className="text-6xl mb-4 block">📝</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-4">Be the first to share something with the community!</p>
                {isMember && (
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                  >
                    Create First Post
                  </button>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl p-6 shadow-sm" data-testid={`post-${post.id}`}>
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center overflow-hidden">
                      {post.profiles?.avatar ? (
                        <img src={post.profiles.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-lg">👤</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{post.profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                    </div>
                    {post.post_type === 'announcement' && (
                      <span className="ml-auto bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                        📢 Announcement
                      </span>
                    )}
                  </div>
                  
                  {/* Post Content */}
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
                  
                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {post.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt="" 
                          className="rounded-lg w-full object-cover max-h-80"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{members.length} Members</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center gap-4" data-testid={`member-${member.user_id}`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center overflow-hidden">
                    {member.profiles?.avatar ? (
                      <img src={member.profiles.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{member.profiles?.full_name || 'Unknown'}</p>
                    {member.profiles?.location && (
                      <p className="text-sm text-gray-500">📍 {member.profiles.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                        Admin
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Joined {formatDate(member.joined_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
              <button 
                onClick={() => setShowPostModal(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                <select
                  value={postForm.post_type}
                  onChange={(e) => setPostForm({ ...postForm, post_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="text">Regular Post</option>
                  <option value="image">Image Post</option>
                  {isAdmin && <option value="announcement">📢 Announcement</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <textarea
                  required
                  rows={4}
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Share something with the community..."
                />
              </div>

              {(postForm.post_type === 'image' || postForm.images.length > 0) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  {postForm.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {postForm.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setPostForm({
                              ...postForm,
                              images: postForm.images.filter((_, i) => i !== idx)
                            })}
                            className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {postForm.images.length < 4 && (
                    <ImageUpload
                      bucket={BUCKETS.COMMUNITIES || 'communities'}
                      folder="posts"
                      onUpload={(url) => setPostForm({
                        ...postForm,
                        images: [...postForm.images, url]
                      })}
                      label="Add Image"
                    />
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting || !postForm.content.trim()}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Artists Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Invite Artists</h2>
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Artists</label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {availableArtists.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">No artists available to invite</p>
                  ) : (
                    availableArtists.map((artist) => (
                      <label 
                        key={artist.id} 
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedArtists.includes(artist.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedArtists([...selectedArtists, artist.id]);
                            } else {
                              setSelectedArtists(selectedArtists.filter(id => id !== artist.id));
                            }
                          }}
                          className="w-4 h-4 text-orange-500 rounded"
                        />
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          {artist.avatar ? (
                            <img src={artist.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center">👤</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{artist.name}</p>
                          {artist.location && (
                            <p className="text-xs text-gray-500">📍 {artist.location}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (optional)</label>
                <textarea
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Add a personal message to your invitation..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteArtists}
                  disabled={selectedArtists.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  Send {selectedArtists.length > 0 ? `(${selectedArtists.length})` : ''} Invites
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityDetailPage;
