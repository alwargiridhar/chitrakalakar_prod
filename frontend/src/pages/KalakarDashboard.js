import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function KalakarDashboard() {
  const { profiles, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated || profiles?.role !== 'kalakar') {
      navigate('/login', { replace: true });
      return;
    }
    fetchData();
  }, [isAuthenticated, profiles, isLoading, navigate]);

  const fetchData = async () => {
    try {
      const [analyticsData, paymentsData] = await Promise.all([
        adminAPI.kalakarGetExhibitionAnalytics(),
        adminAPI.kalakarGetPaymentRecords()
      ]);
      setAnalytics(analyticsData);
      setPaymentRecords(paymentsData.payment_records || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kalakar Dashboard</h1>
          <p className="text-gray-600">Welcome, {profiles?.full_name}. Manage exhibitions and view analytics.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'analytics'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'payments'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            💰 Payment Records
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Exhibitions</p>
                  <span className="text-2xl">🏛️</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{analytics.total_exhibitions || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Active Exhibitions</p>
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{analytics.active_exhibitions || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <span className="text-2xl">💵</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">₹{(analytics.total_revenue || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Platform Fees</p>
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">₹{(analytics.voluntary_platform_fees || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Voluntary contributions</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Exhibition Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{analytics.archived_exhibitions || 0}</p>
                  <p className="text-sm text-gray-600">Archived</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.total_exhibitions ? 
                      ((analytics.active_exhibitions / analytics.total_exhibitions) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Active Rate</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{analytics.total_revenue && analytics.total_exhibitions ?
                      (analytics.total_revenue / analytics.total_exhibitions).toFixed(0) : 0}
                  </p>
                  <p className="text-sm text-gray-600">Avg Revenue/Exhibition</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Payment Records</h2>
              <p className="text-sm text-gray-500 mt-1">All exhibition fees and voluntary contributions</p>
            </div>
            <div className="overflow-x-auto">
              {paymentRecords.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <span className="text-5xl block mb-4">📊</span>
                  <p>No payment records yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exhibition</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artist</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentRecords.map((record, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{record.artist_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                            {record.exhibition_type || 'Standard'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{(record.fees || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {record.voluntary_platform_fee ? `₹${record.voluntary_platform_fee.toLocaleString()}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(record.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Totals:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{paymentRecords.reduce((sum, r) => sum + (r.fees || 0), 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          ₹{paymentRecords.reduce((sum, r) => sum + (r.voluntary_platform_fee || 0), 0).toLocaleString()}
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KalakarDashboard;
