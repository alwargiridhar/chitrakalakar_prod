import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicAPI.getExhibitions()
      .then((data) => {
        const list = (data.exhibitions || []).filter((item) => ['active', 'upcoming'].includes((item.status || '').toLowerCase()));
        setExhibitions(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="active-exhibitions-page">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="active-exhibitions-title">Active Exhibitions</h1>
          <p className="text-base text-gray-600" data-testid="active-exhibitions-subtitle">Active and upcoming approved exhibitions</p>
        </div>
        <div>
          <Link to="/exhibitions/archived" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2" data-testid="go-to-archived-exhibitions-link">
            Archived Exhibitions
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12" data-testid="active-exhibitions-loading">Loading...</div>
      ) : exhibitions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl" data-testid="active-exhibitions-empty">
          <p className="text-gray-500 mb-2">No active exhibitions yet</p>
          <p className="text-sm text-gray-400">Approved exhibitions will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="active-exhibitions-grid">
          {exhibitions.map((exhibition) => (
            <div key={exhibition.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid={`active-exhibition-card-${exhibition.id}`}>
              <div className="h-44 bg-gradient-to-br from-orange-100 to-yellow-100 overflow-hidden">
                {exhibition.primary_exhibition_image || exhibition.exhibition_images?.[0] ? (
                  <img
                    src={exhibition.primary_exhibition_image || exhibition.exhibition_images?.[0]}
                    alt={exhibition.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-orange-400">🎨</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{exhibition.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Type: {exhibition.exhibition_type}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Dates: {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}</p>
                  <p>Artworks: {(exhibition.artwork_ids || []).length}</p>
                  <p>Status: {exhibition.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExhibitionsPage;
