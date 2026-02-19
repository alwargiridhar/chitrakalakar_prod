import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function LeadChitrakarDashboard() {
  const { profiles, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingArtworks, setPendingArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated || profiles?.role !== 'lead_chitrakar') {
      navigate('/login', { replace: true });
      return;
    }
    fetchPendingArtworks();
  }, [isAuthenticated, profiles, isLoading, navigate]);

  const fetchPendingArtworks = async () => {
    try {
      const data = await adminAPI.getPendingArtworks();
      setPendingArtworks(data.artworks || []);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveArtwork = async (artworkId, approved) => {
    try {
      await adminAPI.leadChitrakarApproveArtwork(artworkId, approved);
      fetchPendingArtworks();
      alert(`Artwork ${approved ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error approving artwork:', error);
      alert('Failed to process artwork');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Chitrakar Dashboard</h1>
          <p className="text-gray-600">Welcome, {profiles?.full_name}. Review and approve artworks for quality standards.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{pendingArtworks.length}</h2>
              <p className="text-gray-600">Artworks Pending Approval</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎨</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Pending Artwork Approvals</h2>
          </div>
          <div className="p-6">
            {pendingArtworks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <span className="text-5xl block mb-4">✓</span>
                <p>No pending artworks to review. Great job!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingArtworks.map((artwork) => (
                  <div key={artwork.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gray-100 relative">
                      {artwork.image ? (
                        <img
                          src={artwork.image}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🎨
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{artwork.title}</h3>
                      <p className="text-sm text-gray-500 mb-1">{artwork.artist_name}</p>
                      <p className="text-sm text-orange-500 mb-2">{artwork.category}</p>
                      <p className="text-lg font-bold text-gray-900 mb-3">₹{artwork.price?.toLocaleString()}</p>
                      {artwork.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{artwork.description}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveArtwork(artwork.id, true)}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleApproveArtwork(artwork.id, false)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                        >
                          ✕ Reject
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
    </div>
  );
}

export default LeadChitrakarDashboard;
