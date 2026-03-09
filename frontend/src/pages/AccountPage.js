import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function AccountPage() {
  const { user, profiles, isAdmin, isArtist } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Admin', color: 'bg-red-500' };
    if (profiles?.role === 'lead_chitrakar') return { label: 'Lead Chitrakar', color: 'bg-purple-500' };
    if (profiles?.role === 'kalakar') return { label: 'Kalakar', color: 'bg-blue-500' };
    if (isArtist) return { label: 'Artist', color: 'bg-orange-500' };
    return { label: 'User', color: 'bg-gray-500' };
  };

  const role = getRoleBadge();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Account Overview */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <p className="text-gray-300">Manage your account preferences</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Account Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">{profiles?.full_name || 'User'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${role.color}`}>
                {role.label}
              </span>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-medium text-gray-900">Edit Profile</p>
                  <p className="text-sm text-gray-500">Update your information</p>
                </div>
              </Link>

              <Link
                to="/change-password"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <span className="text-2xl">🔐</span>
                <div>
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-500">Update your password</p>
                </div>
              </Link>

              {isArtist && (
                <Link
                  to="/subscription"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="font-medium text-gray-900">Subscription</p>
                    <p className="text-sm text-gray-500">Manage your plan</p>
                  </div>
                </Link>
              )}

              <Link
                to="/orders"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-medium text-gray-900">Order History</p>
                  <p className="text-sm text-gray-500">View past orders</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Account Type</span>
              <span className={`px-3 py-1 rounded-full text-white text-sm ${role.color}`}>
                {role.label}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Account Status</span>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                Active
              </span>
            </div>

            {isArtist && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Membership</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  profiles?.is_member ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {profiles?.is_member ? 'Active Member' : 'No Membership'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Member Since</span>
              <span className="text-gray-900">
                {profiles?.created_at ? new Date(profiles.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 font-medium"
            >
              Delete Account
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium mb-3">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => alert('Please contact support to delete your account')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Yes, Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
