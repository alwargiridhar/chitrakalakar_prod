import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

function TrendingArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('This Week');

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      try {
        const response = await publicAPI.getTrendingArtists();
        setArtists(response.artists || []);
        setPeriod(response.period || 'This Week');
      } catch (error) {
        console.error('Error fetching trending artists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingArtists();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 via-white to-yellow-50" data-testid="trending-artists-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔥</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Trending Artists</h2>
            </div>
            <p className="text-lg text-gray-600">
              Most viewed and purchased artists {period.toLowerCase()}
            </p>
          </div>
          <Link 
            to="/artists" 
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-orange-600 font-medium hover:text-orange-700"
          >
            View All Artists
            <span>→</span>
          </Link>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map((artist, index) => (
            <Link
              key={artist.id}
              to={`/artist/${artist.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              data-testid={`trending-artist-${artist.id}`}
            >
              {/* Rank Badge */}
              <div className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                    'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    #{index + 1}
                  </div>
                </div>
                
                {/* Top Artwork Preview */}
                <div className="h-40 bg-gradient-to-br from-orange-100 to-yellow-100 relative overflow-hidden">
                  {artist.top_artwork?.image ? (
                    <img 
                      src={artist.top_artwork.image} 
                      alt={artist.top_artwork.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl opacity-50">🎨</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              </div>

              {/* Artist Info */}
              <div className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center overflow-hidden shadow-md flex-shrink-0 border-2 border-white -mt-10 relative z-10">
                    {artist.avatar ? (
                      <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl text-white">👤</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                      {artist.name}
                    </h3>
                    {artist.location && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                        <span>📍</span> {artist.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Categories */}
                {artist.categories && artist.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {artist.categories.slice(0, 2).map((cat, i) => (
                      <span 
                        key={i} 
                        className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                    {artist.categories.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{artist.categories.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <span className="text-orange-500">👁️</span>
                      <span className="font-medium">{artist.total_views.toLocaleString()}</span>
                      <span className="text-gray-400 text-xs">views</span>
                    </span>
                    {artist.sales_count > 0 && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <span className="text-green-500">✓</span>
                        <span className="font-medium">{artist.sales_count}</span>
                        <span className="text-gray-400 text-xs">sales</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {artist.artwork_count} artworks
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-10 text-center">
          <p className="text-gray-500 mb-4">
            Want to be featured here? Upload your artworks and get noticed!
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg"
          >
            <span>🎨</span>
            Join as Artist
          </Link>
        </div>
      </div>
    </section>
  );
}

export default TrendingArtists;
