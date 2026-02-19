import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState({ contemporary: [], registered: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registered');

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const [artistsRes, featuredRes] = await Promise.all([
        publicAPI.getArtists(),
        publicAPI.getFeaturedArtists()
      ]);
      setArtists(artistsRes.artists || []);
      setFeaturedArtists(featuredRes);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Artists</h1>
          <p className="text-xl opacity-90">
            Discover talented artisans and explore their beautiful creations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('registered')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'registered'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Registered Artists ({artists.length})
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'featured'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Featured Artists ({(featuredArtists.contemporary?.length || 0) + (featuredArtists.registered?.length || 0)})
          </button>
        </div>

        {/* Registered Artists Tab */}
        {activeTab === 'registered' && (
          <>
            {artists.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl">
                <span className="text-6xl mb-4 block">🎨</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No artists yet</h3>
                <p className="text-gray-500 mb-4">Be the first to join our community!</p>
                <Link 
                  to="/signup" 
                  className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:opacity-90"
                >
                  Join as Artist
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {artists.map(artist => (
                  <Link 
                    key={artist.id}
                    to={`/artist/${artist.id}`}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-yellow-100 relative overflow-hidden">
                      {artist.avatar ? (
                        <img 
                          src={artist.avatar} 
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{artist.name}</h3>
                      {artist.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                          <span>📍</span> {artist.location}
                        </p>
                      )}
                      {artist.categories && artist.categories.length > 0 && (
                        <p className="text-sm text-orange-500 truncate">
                          {artist.categories.join(', ')}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Featured Artists Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-12">
            {/* Contemporary Featured Artists */}
            {featuredArtists.contemporary?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contemporary Artists</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredArtists.contemporary.map(artist => (
                    <div 
                      key={artist.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
                        {artist.avatar ? (
                          <img 
                            src={artist.avatar} 
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            👤
                          </div>
                        )}
                        <span className="absolute top-3 right-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                          Contemporary
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{artist.name}</h4>
                        {artist.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                            <span>📍</span> {artist.location}
                          </p>
                        )}
                        {artist.categories && artist.categories.length > 0 && (
                          <p className="text-sm text-purple-500 truncate">
                            {artist.categories.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registered Featured Artists */}
            {featuredArtists.registered?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Featured Registered Artists</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredArtists.registered.map(artist => (
                    <div 
                      key={artist.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      <div className="h-48 bg-gradient-to-br from-orange-100 to-yellow-100 relative overflow-hidden">
                        {artist.avatar ? (
                          <img 
                            src={artist.avatar} 
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            👤
                          </div>
                        )}
                        <span className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                          Featured
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{artist.name}</h4>
                        {artist.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                            <span>📍</span> {artist.location}
                          </p>
                        )}
                        {artist.categories && artist.categories.length > 0 && (
                          <p className="text-sm text-orange-500 truncate">
                            {artist.categories.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(featuredArtists.contemporary?.length || 0) + (featuredArtists.registered?.length || 0) === 0 && (
              <div className="text-center py-16 bg-white rounded-xl">
                <span className="text-6xl mb-4 block">⭐</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No featured artists yet</h3>
                <p className="text-gray-500">Check back soon for featured artists</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtistsPage;
