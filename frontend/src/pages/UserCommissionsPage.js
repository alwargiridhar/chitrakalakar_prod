import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { commissionAPI } from '../services/api';
import CommissionStatusTimeline from '../components/commission/CommissionStatusTimeline';
import { formatINR } from '../components/commission/pricing';

function UserCommissionsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchCommissions = async () => {
      try {
        const response = await commissionAPI.getUserCommissions();
        setCommissions(response.commissions || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-10" data-testid="user-commissions-page">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="user-commissions-title">
            My Commissioned Works
          </h1>
          <Link to="/user-dashboard/commissions/new" className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg" data-testid="user-commissions-new-request-link">
            New Request
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500" data-testid="user-commissions-loading">Loading commissions...</p>
        ) : commissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center" data-testid="user-commissions-empty-state">
            <p className="text-gray-600 mb-4">No commission requests yet.</p>
            <Link to="/user-dashboard/commissions/new" className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg" data-testid="user-commissions-empty-action">
              Start Commission
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="user-commissions-list">
            {commissions.map((commission) => (
              <div key={commission.id} className="bg-white rounded-2xl border border-gray-200 p-5" data-testid={`user-commission-card-${commission.id}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500" data-testid={`user-commission-category-${commission.id}`}>{commission.art_category}</p>
                    <h3 className="text-lg font-semibold text-gray-900" data-testid={`user-commission-medium-${commission.id}`}>{commission.medium}</h3>
                    <p className="text-sm text-gray-500" data-testid={`user-commission-size-${commission.id}`}>
                      {commission.width_ft}ft × {commission.height_ft}ft
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#F5F1E4] text-[#1A1A1A] text-xs font-semibold" data-testid={`user-commission-status-${commission.id}`}>
                    {commission.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4" data-testid={`user-commission-price-range-${commission.id}`}>
                  Estimate: {formatINR(commission.price_min)} - {formatINR(commission.price_max)}
                </p>

                <CommissionStatusTimeline status={commission.status} updates={commission.updates || []} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCommissionsPage;
