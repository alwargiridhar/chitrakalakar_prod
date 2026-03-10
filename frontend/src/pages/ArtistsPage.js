import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import AdaptiveArtworkImage from '../components/AdaptiveArtworkImage';

function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState({ contemporary: [], registered: [] });
  const [spotlightArtist, setSpotlightArtist] = useState(null);
  const [spotlightArtworks, setSpotlightArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, []);

  const allFeatured = useMemo(
    () => [
      ...(featuredArtists.contemporary || []),
      ...(featuredArtists.registered || []),
    ],
    [featuredArtists]
  );

  const featuredCountToShow = allFeatured.length > 0 ? allFeatured.length : (spotlightArtist ? 1 : 0);

  const getArtworkImage = (artwork) => artwork?.images?.[0] || artwork?.image || '';

  const sortMostViewed = (items = []) => {
    return [...items].sort((a, b) => {
      const aViews = Number(a?.views || a?.view_count || 0);
      const bViews = Number(b?.views || b?.view_count || 0);
      if (bViews !== aViews) return bViews - aViews;

      const aLikes = Number(a?.likes_count || a?.likes || 0);
      const bLikes = Number(b?.likes_count || b?.likes || 0);
      if (bLikes !== aLikes) return bLikes - aLikes;

      const aDate = new Date(a?.created_at || 0).getTime();
      const bDate = new Date(b?.created_at || 0).getTime();
      return bDate - aDate;
    });
  };

  const fetchArtists = async () => {
    try {
      const [artistsRes, featuredRes] = await Promise.all([
        publicAPI.getArtists(),
        publicAPI.getFeaturedArtists()
      ]);

      setArtists(artistsRes.artists || []);
      setFeaturedArtists(featuredRes);

      const spotlight =
        (featuredRes.contemporary && featuredRes.contemporary[0]) ||
        (featuredRes.registered && featuredRes.registered[0]) ||
        null;

      if (spotlight) {
        if (spotlight.artist_id) {
          try {
            const detailRes = await publicAPI.getArtistDetail(spotlight.artist_id);
            setSpotlightArtist(detailRes.artist || spotlight);
            setSpotlightArtworks(sortMostViewed(detailRes.artworks || []).slice(0, 3));
          } catch {
            setSpotlightArtist(spotlight);
            setSpotlightArtworks(sortMostViewed(spotlight.artworks || []).slice(0, 3));
          }
        } else {
          setSpotlightArtist(spotlight);
          setSpotlightArtworks(sortMostViewed(spotlight.artworks || []).slice(0, 3));
        }
      } else if ((artistsRes.artists || []).length > 0) {
        const fallbackArtist = artistsRes.artists[0];
        try {
          const detailRes = await publicAPI.getArtistDetail(fallbackArtist.id);
          setSpotlightArtist(detailRes.artist || fallbackArtist);
          setSpotlightArtworks(sortMostViewed(detailRes.artworks || []).slice(0, 3));
        } catch {
          setSpotlightArtist(fallbackArtist);
          setSpotlightArtworks([]);
        }
      }
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
      <div className="bg-gradient-to-r from-[#f97316] via-[#f59e0b] to-[#eab308] text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" data-testid="artists-hero-section">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="artists-hero-title">Our Artists</h1>
          <p className="text-base sm:text-lg opacity-95 max-w-3xl mx-auto" data-testid="artists-hero-subtitle">
            Discover talented artisans and explore their beautiful creations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6" data-testid="featured-artists-count">
          <h2 className="text-2xl font-semibold text-gray-900">Featured Artist Spotlight</h2>
          <p className="text-sm text-gray-600 mt-1">
            Featured Artists ({featuredCountToShow})
          </p>
        </div>

        {/* Featured Spotlight Layout */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm" data-testid="featured-artist-spotlight-card">
          {spotlightArtist ? (
            <div className="grid lg:grid-cols-5 gap-5 sm:gap-7 items-start">
              <div className="lg:col-span-2" data-testid="featured-artist-profile-block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200" data-testid="featured-artist-avatar-wrap">
                    {spotlightArtist.avatar ? (
                      <img
                        src={spotlightArtist.avatar}
                        alt={spotlightArtist.name || spotlightArtist.full_name || 'Featured Artist'}
                        className="w-full h-full object-cover"
                        data-testid="featured-artist-avatar"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-yellow-100" data-testid="featured-artist-avatar-fallback" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900" data-testid="featured-artist-name">
                      {spotlightArtist.name || spotlightArtist.full_name || 'Featured Artist'}
                    </h3>
                    {spotlightArtist.location && (
                      <p className="text-sm text-gray-600" data-testid="featured-artist-location">{spotlightArtist.location}</p>
                    )}
                  </div>
                </div>

                {(spotlightArtist.bio || spotlightArtist.description) && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-4" data-testid="featured-artist-description">
                    {spotlightArtist.bio || spotlightArtist.description}
                  </p>
                )}

                {Array.isArray(spotlightArtist.categories) && spotlightArtist.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5" data-testid="featured-artist-categories">
                    {spotlightArtist.categories.slice(0, 5).map((category) => (
                      <span key={category} className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200" data-testid={`featured-artist-category-${category}`}>
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {(spotlightArtist.artist_id || spotlightArtist.id) && (
                  <Link
                    to={`/artist/${spotlightArtist.artist_id || spotlightArtist.id}`}
                    className="inline-block px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black transition-colors"
                    data-testid="featured-artist-view-profile-link"
                  >
                    View Artist Profile
                  </Link>
                )}
              </div>

              <div className="lg:col-span-3" data-testid="featured-artist-most-viewed-section">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900" data-testid="featured-artist-most-viewed-title">Most Viewed Artworks</h4>
                  <span className="text-xs text-gray-500" data-testid="featured-artist-most-viewed-subtitle">Sorted by views, then likes, then latest</span>
                </div>

                {spotlightArtworks.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="featured-artist-most-viewed-grid">
                    {spotlightArtworks.map((artwork) => (
                      <Link
                        key={artwork.id}
                        to={`/painting/${artwork.id}`}
                        className="rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow"
                        data-testid={`featured-artwork-card-${artwork.id}`}
                      >
                        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center p-2">
                          {getArtworkImage(artwork) ? (
                            <AdaptiveArtworkImage
                              src={getArtworkImage(artwork)}
                              alt={artwork.title || 'Artwork'}
                              settings={(artwork.image_display_settings || [])[0] || null}
                              dataTestId={`featured-artwork-image-${artwork.id}`}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" data-testid={`featured-artwork-image-fallback-${artwork.id}`} />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-gray-900 truncate" data-testid={`featured-artwork-title-${artwork.id}`}>
                            {artwork.title || 'Untitled Artwork'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1" data-testid={`featured-artwork-metrics-${artwork.id}`}>
                            Views: {Number(artwork.views || artwork.view_count || 0)} · Likes: {Number(artwork.likes_count || artwork.likes || 0)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-500" data-testid="featured-artist-most-viewed-empty">
                    No artworks available for this featured artist yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center" data-testid="featured-artist-empty-state">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No featured artists yet</h3>
              <p className="text-sm text-gray-500">Check back soon for featured artist highlights.</p>
            </div>
          )}
        </div>

        {/* Registered Artists below featured section */}
        <div className="mt-6" data-testid="registered-artists-section">
          <div className="flex items-end justify-between mb-5 gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900" data-testid="registered-artists-title">Registered Artists</h2>
              <p className="text-sm text-gray-600" data-testid="registered-artists-subtitle">Registered Artists ({artists.length})</p>
            </div>
          </div>

          {artists.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl" data-testid="registered-artists-empty-state">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No artists yet</h3>
              <p className="text-gray-500 mb-4">Be the first to join our community.</p>
              <Link
                to="/signup"
                className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:opacity-90"
                data-testid="registered-artists-join-link"
              >
                Join as Artist
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5" data-testid="registered-artists-grid">
              {artists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group border border-gray-200"
                  data-testid={`registered-artist-card-${artist.id}`}
                >
                  <div className="h-48 bg-gradient-to-br from-orange-100 to-yellow-100 relative overflow-hidden">
                    {artist.avatar ? (
                        <img 
                          src={artist.avatar} 
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          data-testid={`registered-artist-avatar-${artist.id}`}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-yellow-200" data-testid={`registered-artist-avatar-fallback-${artist.id}`} />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1" data-testid={`registered-artist-name-${artist.id}`}>{artist.name}</h3>
                      {artist.location && (
                        <p className="text-sm text-gray-500 mb-2" data-testid={`registered-artist-location-${artist.id}`}>
                          {artist.location}
                        </p>
                      )}
                      {artist.categories && artist.categories.length > 0 && (
                        <p className="text-sm text-orange-500 truncate" data-testid={`registered-artist-categories-${artist.id}`}>
                          {artist.categories.join(', ')}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArtistsPage;
