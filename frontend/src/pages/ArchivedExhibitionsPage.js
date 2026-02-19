import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

function ArchivedExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicAPI.getArchivedExhibitions()
      .then(data => setExhibitions(data.exhibitions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/exhibitions" className="text-orange-500 hover:text-orange-600 text-sm mb-4 inline-block">
          ← Back to Active Exhibitions
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">📁 Archived Exhibitions</h1>
        <p className="text-lg text-gray-600">
          Browse past exhibitions. Archived exhibitions remain accessible for free for the same duration the artist originally paid for.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : exhibitions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-6xl mb-4 block">📁</span>
          <p className="text-gray-500 mb-2">No archived exhibitions yet</p>
          <p className="text-sm text-gray-400">Past exhibitions will appear here once they complete their active period.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map(exhibition => (
            <div key={exhibition.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center relative">
                <span className="text-4xl opacity-50">🎨</span>
                <div className="absolute top-3 right-3 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Archived
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{exhibition.name}</h3>
                <p className="text-sm text-gray-500 mb-2">by {exhibition.artist_name}</p>
                <div className="space-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>🎨</span>
                    {exhibition.artwork_count || 0} artworks
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👁️</span>
                    {exhibition.views || 0} views
                  </div>
                  {exhibition.archived_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>📅</span>
                      Archived: {new Date(exhibition.archived_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArchivedExhibitionsPage;
