import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';

function UserDashboard() {
  const { profiles, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    // Redirect other roles to their respective dashboards
    if (profiles?.role === 'artist') {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (profiles?.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    if (profiles?.role === 'lead_chitrakar') {
      navigate('/lead-chitrakar', { replace: true });
      return;
    }
    if (profiles?.role === 'kalakar') {
      navigate('/kalakar', { replace: true });
      return;
    }
    fetchData();
  }, [isAuthenticated, profiles, isLoading, navigate]);

  const fetchData = async () => {
    try {
      const [enquiriesRes, profileRes] = await Promise.all([
        userAPI.getMyEnquiries(),
        userAPI.getProfile()
      ]);
      setEnquiries(enquiriesRes.enquiries || []);
      setProfile(profileRes.profile);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'matched': 'bg-green-100 text-green-800',
      'expired': 'bg-gray-100 text-gray-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || profiles?.full_name || 'User'}!</h1>
          <p className="text-white/80 mt-1">Manage your art journey</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/contact"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Commission Artwork</h3>
            <p className="text-sm text-gray-500">Request a custom piece from talented artists</p>
          </Link>

          <Link 
            to="/art-classes"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Find Art Classes</h3>
            <p className="text-sm text-gray-500">Learn from skilled instructors near you</p>
          </Link>

          <Link 
            to="/paintings"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl">🖼️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Browse Paintings</h3>
            <p className="text-sm text-gray-500">Discover and collect beautiful artwork</p>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'enquiries'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Art Class Enquiries ({enquiries.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-xl">📝</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{enquiries.length}</p>
                    <p className="text-sm text-gray-500">Total Enquiries</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {enquiries.filter(e => e.status === 'matched').length}
                    </p>
                    <p className="text-sm text-gray-500">Active Matches</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {enquiries.reduce((sum, e) => sum + (e.contacts_revealed?.length || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-500">Contacts Revealed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Enquiries */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Art Class Enquiries</h3>
                <button 
                  onClick={() => setActiveTab('enquiries')}
                  className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {enquiries.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📚</span>
                  <p className="text-gray-500 mb-4">No art class enquiries yet</p>
                  <Link 
                    to="/art-classes"
                    className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg text-sm"
                  >
                    Find Art Classes
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enquiries.slice(0, 3).map(enquiry => (
                    <div key={enquiry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{enquiry.art_type}</p>
                        <p className="text-sm text-gray-500">
                          {enquiry.class_type} • {enquiry.skill_level} • {enquiry.duration}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(enquiry.status)}
                        <span className="text-xs text-gray-400">
                          {new Date(enquiry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enquiries Tab */}
        {activeTab === 'enquiries' && (
          <div className="bg-white rounded-xl shadow-sm">
            {enquiries.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-6xl mb-4 block">📚</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No enquiries yet</h3>
                <p className="text-gray-500 mb-4">Start your art learning journey today!</p>
                <Link 
                  to="/art-classes"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium"
                >
                  Find Art Classes →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {enquiries.map(enquiry => (
                  <div key={enquiry.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{enquiry.art_type}</h4>
                        <p className="text-sm text-gray-500">
                          Submitted on {new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(enquiry.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Class Type</p>
                        <p className="font-medium capitalize">{enquiry.class_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Skill Level</p>
                        <p className="font-medium capitalize">{enquiry.skill_level}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{enquiry.duration}</p>
                      </div>
                      {enquiry.budget_range && (
                        <div>
                          <p className="text-gray-500">Budget</p>
                          <p className="font-medium">₹{enquiry.budget_range}</p>
                        </div>
                      )}
                    </div>
                    {enquiry.matched_artists && enquiry.matched_artists.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-green-600">{enquiry.matched_artists.length}</span> artist(s) matched • 
                          <span className="font-medium text-orange-600"> {enquiry.contacts_revealed?.length || 0}</span> contact(s) revealed
                        </p>
                        <Link 
                          to="/art-classes"
                          className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-2 inline-block"
                        >
                          View Matched Artists →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
