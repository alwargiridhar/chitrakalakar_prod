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
              {(() => {
                const paintings = Array.isArray(exhibition.exhibition_paintings) ? exhibition.exhibition_paintings : [];
                const previewImage = exhibition.primary_exhibition_image || exhibition.exhibition_images?.[0] || paintings[0]?.image_url;
                const artworkCount = (exhibition.artwork_ids || []).length > 0 ? (exhibition.artwork_ids || []).length : paintings.length;
                const firstPainting = paintings[0] || null;
                return (
                  <>
              <div className="h-44 bg-gradient-to-br from-orange-100 to-yellow-100 overflow-hidden">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={exhibition.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-orange-400">
                    <span className="text-3xl">🎨</span>
                    <span className="text-xs mt-1">No painting uploaded</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{exhibition.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Type: {exhibition.exhibition_type}</p>
                {exhibition.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{exhibition.description}</p>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Dates: {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}</p>
                  <p>Artworks: {artworkCount}</p>
                  <p>Status: {exhibition.status}</p>
                  {firstPainting?.price ? <p>Starting Price: ₹{Number(firstPainting.price).toLocaleString('en-IN')}</p> : null}
                  {typeof firstPainting?.on_sale === 'boolean' ? <p>{firstPainting.on_sale ? 'On Sale' : 'Not for Sale'}</p> : null}
                </div>
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExhibitionsPage;
