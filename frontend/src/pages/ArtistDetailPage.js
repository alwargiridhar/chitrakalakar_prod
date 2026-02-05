import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

function ArtistDetailPage() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const artistName = artist?.full_name || artist?.name || 'Artist';
  const categories = Array.isArray(artist?.categories) ? artist.categories : [];

  const fetchArtist = useCallback(async () => {
    try {
      const response = await publicAPI.getArtistDetail(id);
      setArtist(response.artist);
      setArtworks(response.artworks || []);
    } catch (err) {
      setError('Artist not found');
      console.error('Error fetching artist:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">😕</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Artist not found'}</h2>
          <Link to="/artists" className="text-orange-500 hover:underline">
            ← Back to Artists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
              {artist.avatar ? (
                <img src={artist.avatar} alt={artist.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{artist.full_name}</h1>
              {artist.location && (
                <p className="text-lg opacity-90 flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span>📍</span> {artist.location}
                </p>
              )}
              {artist.categories && artist.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {artist.categories.map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Bio Section */}
        {artist.bio && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Artist</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{artist.bio}</p>
          </div>
        )}

        {/* Artworks Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Artworks 
              <span className="text-lg font-normal text-gray-500 ml-2">({artworks.length})</span>
            </h2>
          </div>

          {artworks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <span className="text-6xl mb-4 block">🎨</span>
              <p className="text-gray-500">No artworks available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artworks.map(artwork => (
                <Link 
                  key={artwork.id}
                  to={`/painting/${artwork.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {artwork.image ? (
                      <img 
                        src={artwork.image} 
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                        🖼️
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-orange-600">
                      {artwork.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{artwork.title}</h3>
                    <span className="text-lg font-bold text-orange-600">
                      ₹{artwork.price?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Commission CTA */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Want to commission artwork from {artist.full_name}?
          </h3>
          <p className="text-gray-600 mb-4">
            Submit a commission enquiry and we&apos;ll help connect you with the artist.
          </p>
          <Link 
            to="/contact"
            className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Commission Artwork →
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link to="/artists" className="text-orange-500 hover:text-orange-600 font-medium">
            ← Back to Artists
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ArtistDetailPage;
