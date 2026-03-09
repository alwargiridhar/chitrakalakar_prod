import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { commissionAPI } from '../services/api';
import CommissionStatusTimeline from '../components/commission/CommissionStatusTimeline';
import WIPUploader from '../components/commission/WIPUploader';
import { formatINR } from '../components/commission/pricing';

function ArtistCommissionsPage() {
  const { profiles } = useAuth();
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counterOffers, setCounterOffers] = useState({});

  const fetchCommissions = async () => {
    try {
      const response = await commissionAPI.getArtistCommissions();
      setCommissions(response.commissions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profiles || profiles.role !== 'artist') {
      navigate('/login');
      return;
    }
    fetchCommissions();
  }, [profiles, navigate]);

  const handleUpdate = async (commissionId, payload) => {
    try {
      await commissionAPI.updateByArtist(commissionId, payload);
      await fetchCommissions();
    } catch (error) {
      alert(error.message || 'Failed to post update');
    }
  };

  const handleRespond = async (artistRequestId, action, counterOffer = null) => {
    try {
      await commissionAPI.respondToArtistRequest(artistRequestId, {
        action,
        counter_offer: counterOffer,
      });
      await fetchCommissions();
    } catch (error) {
      alert(error.message || 'Failed to respond to request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-10" data-testid="artist-commissions-page">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl mb-8 text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="artist-commissions-title">
          Commission Work Queue
        </h1>

        {loading ? (
          <p className="text-gray-500" data-testid="artist-commissions-loading">Loading commissions...</p>
        ) : commissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center" data-testid="artist-commissions-empty-state">
            <p className="text-gray-600">No commission assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-5" data-testid="artist-commissions-list">
            {commissions.map((commission) => (
              <div key={commission.id} className="bg-white rounded-2xl border border-gray-200 p-6" data-testid={`artist-commission-card-${commission.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500" data-testid={`artist-commission-requester-${commission.id}`}>
                      Requester: {commission.requester?.full_name || 'User'}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900" data-testid={`artist-commission-medium-${commission.id}`}>{commission.medium}</h3>
                    <p className="text-sm text-gray-600" data-testid={`artist-commission-range-${commission.id}`}>
                      {formatINR(commission.price_min)} - {formatINR(commission.price_max)}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#F5F1E4] text-[#1A1A1A] text-xs font-semibold" data-testid={`artist-commission-status-${commission.id}`}>
                    {commission.status}
                  </span>
                </div>

                <div className="grid lg:grid-cols-2 gap-5 mt-5">
                  <CommissionStatusTimeline status={commission.status} updates={commission.updates || []} />
                  <div>
                    {commission.artist_request_status === 'pending' ? (
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50" data-testid={`artist-commission-response-${commission.id}`}>
                        <p className="text-sm text-gray-700 mb-3" data-testid={`artist-commission-response-note-${commission.id}`}>
                          This request is pending. Accept to lock this commission.
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm"
                            onClick={() => handleRespond(commission.artist_request_id, 'accept_offer')}
                            data-testid={`artist-commission-accept-button-${commission.id}`}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm"
                            onClick={() => handleRespond(commission.artist_request_id, 'counter_offer', Number(counterOffers[commission.id] || 0))}
                            data-testid={`artist-commission-counter-button-${commission.id}`}
                          >
                            Counter
                          </button>
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm"
                            onClick={() => handleRespond(commission.artist_request_id, 'reject')}
                            data-testid={`artist-commission-reject-button-${commission.id}`}
                          >
                            Reject
                          </button>
                        </div>
                        <input
                          type="number"
                          min="1000"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Counter offer amount"
                          value={counterOffers[commission.id] || ''}
                          onChange={(e) => setCounterOffers((prev) => ({ ...prev, [commission.id]: e.target.value }))}
                          data-testid={`artist-commission-counter-input-${commission.id}`}
                        />
                      </div>
                    ) : (
                      <WIPUploader commission={commission} onSubmit={(payload) => handleUpdate(commission.id, payload)} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtistCommissionsPage;
