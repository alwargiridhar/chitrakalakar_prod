import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { commissionAPI, userAPI } from '../services/api';

function UserDashboard() {
  const { profiles, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return navigate('/login', { replace: true });
    if (profiles?.role === 'artist') return navigate('/dashboard', { replace: true });
    if (profiles?.role === 'admin') return navigate('/admin', { replace: true });
    if (profiles?.role === 'lead_chitrakar') return navigate('/lead-chitrakar', { replace: true });
    if (profiles?.role === 'kalakar') return navigate('/kalakar', { replace: true });

    const fetchData = async () => {
      try {
        const [enquiriesRes, profileRes, commissionsRes] = await Promise.all([
          userAPI.getMyEnquiries(),
          userAPI.getProfile(),
          commissionAPI.getUserCommissions(),
        ]);
        setEnquiries(enquiriesRes.enquiries || []);
        setCommissions(commissionsRes.commissions || []);
        setProfile(profileRes.profile);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, profiles, isLoading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="user-dashboard-loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="user-dashboard-page">
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold" data-testid="user-dashboard-title">Welcome, {profile?.full_name || profiles?.full_name || 'User'}!</h1>
          <p className="text-white/80 mt-1" data-testid="user-dashboard-subtitle">Track your commissions, enquiries, and discoveries.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/commission/request" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow" data-testid="user-dashboard-quick-commission-link">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Commission Artwork</h3>
            <p className="text-sm text-gray-500">Get instant estimate and submit a custom request.</p>
          </Link>
          <Link to="/user-dashboard/commissions" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow" data-testid="user-dashboard-quick-track-link">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Track Commission Status</h3>
            <p className="text-sm text-gray-500">View all WIP updates and delivery progress.</p>
          </Link>
          <Link to="/paintings" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow" data-testid="user-dashboard-quick-paintings-link">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Browse Paintings</h3>
            <p className="text-sm text-gray-500">Explore curated artworks from artists.</p>
          </Link>
        </div>

        <div className="flex border-b border-gray-200 mb-6" data-testid="user-dashboard-tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'commissions', label: `Commissions (${commissions.length})` },
            { id: 'enquiries', label: `Art Class Enquiries (${enquiries.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              data-testid={`user-dashboard-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="user-dashboard-overview-section">
            <div className="bg-white rounded-xl shadow-sm p-6" data-testid="user-dashboard-overview-commission-count">
              <p className="text-2xl font-bold text-gray-900">{commissions.length}</p>
              <p className="text-sm text-gray-500">Total Commissions</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6" data-testid="user-dashboard-overview-active-commissions">
              <p className="text-2xl font-bold text-gray-900">{commissions.filter((c) => c.status !== 'Delivered').length}</p>
              <p className="text-sm text-gray-500">Active Commission Workflows</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6" data-testid="user-dashboard-overview-enquiry-count">
              <p className="text-2xl font-bold text-gray-900">{enquiries.length}</p>
              <p className="text-sm text-gray-500">Art Class Enquiries</p>
            </div>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100" data-testid="user-dashboard-commissions-section">
            {commissions.length === 0 ? (
              <div className="p-8 text-center" data-testid="user-dashboard-commissions-empty">
                <p className="text-gray-600 mb-4">No commission requests yet.</p>
                <Link to="/commission/request" className="px-4 py-2 bg-orange-500 text-white rounded-lg" data-testid="user-dashboard-commissions-empty-link">
                  Start a Commission
                </Link>
              </div>
            ) : (
              commissions.map((commission) => (
                <div key={commission.id} className="p-6" data-testid={`user-dashboard-commission-row-${commission.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500" data-testid={`user-dashboard-commission-category-${commission.id}`}>{commission.art_category}</p>
                      <h4 className="text-lg font-semibold text-gray-900" data-testid={`user-dashboard-commission-medium-${commission.id}`}>{commission.medium}</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold" data-testid={`user-dashboard-commission-status-${commission.id}`}>
                      {commission.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'enquiries' && (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100" data-testid="user-dashboard-enquiries-section">
            {enquiries.length === 0 ? (
              <div className="p-8 text-center" data-testid="user-dashboard-enquiries-empty">
                <p className="text-gray-600 mb-4">No art class enquiries yet.</p>
                <Link to="/art-classes" className="px-4 py-2 bg-orange-500 text-white rounded-lg" data-testid="user-dashboard-enquiries-empty-link">
                  Find Art Classes
                </Link>
              </div>
            ) : (
              enquiries.map((enquiry) => (
                <div key={enquiry.id} className="p-6" data-testid={`user-dashboard-enquiry-row-${enquiry.id}`}>
                  <h4 className="text-lg font-semibold text-gray-900" data-testid={`user-dashboard-enquiry-art-type-${enquiry.id}`}>{enquiry.art_type}</h4>
                  <p className="text-sm text-gray-500" data-testid={`user-dashboard-enquiry-status-${enquiry.id}`}>{enquiry.status}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
