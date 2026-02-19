import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI, communityAPI } from '../services/api';
import { BRAND_NAME, BRAND_TAGLINE, ART_CATEGORIES } from '../utils/branding';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ total_artists: 0, completed_projects: 0, satisfaction_rate: 0 });
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, artistsData, exhibitionsData, communitiesData] = await Promise.all([
          publicAPI.getStats().catch(() => ({ total_artists: 0, completed_projects: 0, satisfaction_rate: 0 })),
          publicAPI.getFeaturedArtists().catch(() => ({ artists: [] })),
          publicAPI.getExhibitions().catch(() => ({ exhibitions: [] })),
          publicAPI.getCommunities().catch(() => ({ communities: [] })),
        ]);
        setStats(statsData);
        setFeaturedArtists(artistsData.artists || []);
        setExhibitions(exhibitionsData.exhibitions || []);
        setCommunities(communitiesData.communities || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoinCommunity = async (communityId) => {
    if (!isAuthenticated) {
      alert('Please login to join a community');
      return;
    }
    try {
      await communityAPI.join(communityId);
      alert('Successfully joined the community!');
    } catch (error) {
      alert(error.message || 'Failed to join community');
    }
  };

  const howItWorks = [
    { step: 1, title: 'Find Your Artist', description: 'Browse our community of talented artisans', icon: '👥' },
    { step: 2, title: 'Review Portfolio', description: 'Check out sample works, reviews, and ratings', icon: '🎨' },
    { step: 3, title: 'Discuss & Agree', description: 'Connect with the artist, discuss your vision', icon: '🛡️' },
    { step: 4, title: 'Secure Payment', description: 'Make a secure payment through our platform', icon: '⚡' },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 overflow-hidden py-12 md:py-0">
        <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-orange-500 opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-yellow-500 opacity-5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center min-h-[calc(100vh-64px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <p className="text-orange-500 font-semibold text-lg mb-2">Welcome to {BRAND_NAME}</p>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">{BRAND_TAGLINE}</h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Connect with talented artisans to commission beautiful artwork, discover exhibitions, and celebrate creativity.
                </p>
              </div>

              <div className="space-y-4">
                <p className="font-semibold text-gray-900">I want to:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link to="/signup" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium text-center hover:opacity-90 flex items-center justify-center gap-2">
                    Commission Artwork →
                  </Link>
                  <Link to="/signup" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg font-medium text-center hover:opacity-90 flex items-center justify-center gap-2">
                    Sell My Art →
                  </Link>
                </div>
              </div>

              {/* Real Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-200">
                <div>
                  <p className="text-3xl font-bold text-orange-500">{stats.total_artists || 0}</p>
                  <p className="text-sm text-gray-500">Talented Artists</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-500">{stats.completed_projects || 0}</p>
                  <p className="text-sm text-gray-500">Completed Projects</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-500">{stats.satisfaction_rate || 0}%</p>
                  <p className="text-sm text-gray-500">Satisfaction Rate</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {[{ icon: '🎨', label: 'Paintings' }, { icon: '👥', label: 'Artisans' }, { icon: '⭐', label: 'Exhibitions' }, { icon: '📍', label: 'Community' }].map((item, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl hover:shadow-lg transition-shadow">
                      <span className="text-3xl mb-2">{item.icon}</span>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How {BRAND_NAME} Works</h2>
            <p className="text-xl text-gray-600">Simple steps to get started with your art journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500 mb-2">Step {item.step}</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Community Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Join the Community</h2>
            <p className="text-xl text-gray-600">Connect with fellow artists from different locations and art styles</p>
          </div>
          
          {communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.slice(0, 6).map((community) => (
                <div key={community.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow" data-testid={`community-card-${community.id}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                      🎨
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{community.name}</h3>
                      {community.location && (
                        <p className="text-sm text-gray-500">📍 {community.location}</p>
                      )}
                    </div>
                  </div>
                  {community.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{community.description}</p>
                  )}
                  <button
                    onClick={() => handleJoinCommunity(community.id)}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Join Community
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <span className="text-5xl mb-4 block">🤝</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Communities Coming Soon</h3>
              <p className="text-gray-500 mb-4">Artists can create and join communities to connect and collaborate</p>
              {isAuthenticated && (
                <Link to="/dashboard" className="inline-block px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                  Create a Community
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Artists - Only show if there are approved artists */}
      {featuredArtists.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-100 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Featured Artists</h2>
                <p className="text-lg text-gray-600">Discover extraordinary talent from our community</p>
              </div>
              <Link to="/artists" className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                View All Artists →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArtists.map((artist) => (
                <div key={artist.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-48 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                    {artist.avatar ? (
                      <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">👤</span>
                    )}
                    {artist.rating > 0 && (
                      <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-md">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-semibold text-sm">{artist.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900">{artist.name}</h3>
                    <p className="text-sm text-orange-500 font-semibold mb-2">{artist.category || 'Artist'}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                      <span>📍</span>
                      {artist.location || 'India'}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{artist.completed_projects || 0} projects completed</p>
                  </div>
                </div>
              ))}
            </div>

            {featuredArtists.length === 0 && !loading && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500">No featured artists yet. Be the first to join!</p>
                <Link to="/signup" className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Join as Artist
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Art Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Art Categories</h2>
            <p className="text-xl text-gray-600">Explore diverse art forms and mediums</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ART_CATEGORIES.map((category, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-500 transition-all cursor-pointer">
                <p className="text-center font-semibold text-gray-900">{category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exhibitions - Only show if there are approved exhibitions */}
      {exhibitions.length > 0 && (
        <section className="py-20 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Virtual Exhibitions</h2>
                <p className="text-lg text-gray-600">Explore curated art exhibitions from talented artists</p>
              </div>
              <Link to="/exhibitions" className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white">
                View All Exhibitions →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exhibitions.map((exhibition) => (
                <div key={exhibition.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-40 bg-gradient-to-br from-orange-500 to-yellow-500 relative flex items-center justify-center">
                    <span className="text-4xl opacity-50">🎨</span>
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-semibold">
                      <span className={exhibition.status === 'active' ? 'text-green-600' : 'text-orange-600'}>
                        {exhibition.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{exhibition.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">by {exhibition.artist_name}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>🎨</span>
                        {exhibition.artwork_count || 0} artworks
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👁️</span>
                        {exhibition.views || 0} views
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Create or Commission?</h2>
          <p className="text-xl mb-12 opacity-90">Join our thriving community of artists and art enthusiasts today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-8 py-3 bg-white text-orange-500 rounded-lg font-semibold hover:bg-gray-100">
              Create Free Account
            </Link>
            <Link to="/login" className="px-8 py-3 border border-white text-white rounded-lg font-semibold hover:bg-white/10">
              Sign In
            </Link>
          </div>
          <p className="mt-8 text-sm opacity-75">No credit card required • Free to join • Transparent pricing</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
