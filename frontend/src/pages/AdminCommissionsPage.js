import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, commissionAPI } from '../services/api';
import CommissionStatusTimeline from '../components/commission/CommissionStatusTimeline';

function AdminCommissionsPage() {
  const { profiles } = useAuth();
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState([]);
  const [artists, setArtists] = useState([]);
  const [actionState, setActionState] = useState({});

  const fetchData = async () => {
    try {
      const [commissionRes, artistRes] = await Promise.all([
        commissionAPI.getAdminCommissions(),
        adminAPI.getApprovedArtists(),
      ]);
      setCommissions(commissionRes.commissions || []);
      setArtists(artistRes.artists || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!profiles || profiles.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [profiles, navigate]);

  const handleAction = async (commissionId) => {
    const action = actionState[commissionId] || {};
    try {
      await commissionAPI.adminAction({
        commission_id: commissionId,
        artist_id: action.artist_id || null,
        status: action.status || null,
        admin_note: action.admin_note || null,
      });
      await fetchData();
    } catch (error) {
      alert(error.message || 'Failed to update commission');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-10" data-testid="admin-commissions-page">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl mb-8 text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="admin-commissions-title">
          Commission Requests - Admin
        </h1>

        <div className="space-y-5" data-testid="admin-commissions-list">
          {commissions.map((commission) => {
            const action = actionState[commission.id] || {};
            return (
              <div key={commission.id} className="bg-white rounded-2xl border border-gray-200 p-6" data-testid={`admin-commission-card-${commission.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500" data-testid={`admin-commission-user-${commission.id}`}>
                      User: {commission.user?.full_name || 'N/A'}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900" data-testid={`admin-commission-medium-${commission.id}`}>
                      {commission.medium} • {commission.art_category}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#F5F1E4] text-[#1A1A1A] text-xs font-semibold" data-testid={`admin-commission-status-${commission.id}`}>
                    {commission.status}
                  </span>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <CommissionStatusTimeline status={commission.status} updates={commission.updates || []} />

                  <div className="space-y-3" data-testid={`admin-commission-action-panel-${commission.id}`}>
                    <select
                      value={action.artist_id || commission.artist_id || ''}
                      onChange={(e) => setActionState((prev) => ({ ...prev, [commission.id]: { ...action, artist_id: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      data-testid={`admin-commission-artist-select-${commission.id}`}
                    >
                      <option value="">Assign artist</option>
                      {artists.map((artist) => (
                        <option key={artist.id} value={artist.id}>{artist.full_name}</option>
                      ))}
                    </select>

                    <select
                      value={action.status || commission.status}
                      onChange={(e) => setActionState((prev) => ({ ...prev, [commission.id]: { ...action, status: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      data-testid={`admin-commission-status-select-${commission.id}`}
                    >
                      {['Requested', 'Accepted', 'In Progress', 'WIP Shared', 'Completed', 'Delivered'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>

                    <textarea
                      rows={2}
                      value={action.admin_note || ''}
                      onChange={(e) => setActionState((prev) => ({ ...prev, [commission.id]: { ...action, admin_note: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Admin note"
                      data-testid={`admin-commission-note-input-${commission.id}`}
                    />

                    <button
                      type="button"
                      onClick={() => handleAction(commission.id)}
                      className="w-full px-4 py-2 rounded-lg bg-[#1A1A1A] text-white hover:bg-black"
                      data-testid={`admin-commission-save-button-${commission.id}`}
                    >
                      Save Action
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminCommissionsPage;
