import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

function ArtistOfTheDay() {
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await publicAPI.getArtistOfTheDay();
        setArtist(response.artist);
      } catch (error) {
        console.error('Error fetching artist of the day:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  // Parse artworks if stored as JSON
  const artworks = Array.isArray(artist.artworks) ? artist.artworks : [];

  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          <div>
            <p className="text-xs text-purple-200 uppercase tracking-wider">Featured Today</p>
            <h3 className="font-bold text-lg">Artist of the Day</h3>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Artist Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center overflow-hidden shadow-lg">
            {artist.avatar ? (
              <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-white">🎨</span>
            )}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{artist.name}</h4>
            {artist.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <span>📍</span> {artist.location}
              </p>
            )}
            {artist.categories && artist.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {artist.categories.slice(0, 3).map((cat, i) => (
                  <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {artist.bio}
          </p>
        )}

        {/* Artworks Showcase */}
        {artworks.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Featured Works</p>
            <div className="grid grid-cols-3 gap-2">
              {artworks.slice(0, 3).map((artwork, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                  {artwork.image ? (
                    <img 
                      src={artwork.image} 
                      alt={artwork.title || 'Artwork'} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      🖼️
                    </div>
                  )}
                </div>
              ))}
            </div>
            {artworks.length > 3 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                +{artworks.length - 3} more artworks
              </p>
            )}
          </div>
        )}

        {/* View Profile Button */}
        {artist.artist_id ? (
          <Link
            to={`/artist/${artist.artist_id}`}
            className="block w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
          >
            View Full Profile
          </Link>
        ) : (
          <div className="text-center py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
            Contemporary Artist
          </div>
        )}
      </div>

      {/* Daily Rotation Notice */}
      <div className="bg-purple-100 px-5 py-2 text-center">
        <p className="text-xs text-purple-700">
          ✨ New artist featured daily at midnight
        </p>
      </div>
    </div>
  );
}

export default ArtistOfTheDay;
