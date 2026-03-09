import React, { useState, useEffect } from 'react';
import { publicAPI } from '../services/api';
import { ART_CATEGORIES } from '../utils/branding';

function ArtClassesPage() {
  const [step, setStep] = useState('form'); // form, results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enquiryId, setEnquiryId] = useState(null);
  const [matchedArtists, setMatchedArtists] = useState([]);
  const [enquiryInfo, setEnquiryInfo] = useState(null);

  const [formData, setFormData] = useState({
    art_type: '',
    skill_level: 'beginner',
    duration: '1 month',
    budget_range: '250-350',
    class_type: 'online',
    user_location: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await publicAPI.createArtClassEnquiry(formData);
      setEnquiryId(response.enquiry_id);
      
      if (response.matched_count > 0) {
        // Fetch matched artists
        const matchesResponse = await publicAPI.getArtClassMatches(response.enquiry_id);
        setMatchedArtists(matchesResponse.artists || []);
        setEnquiryInfo(matchesResponse.enquiry);
        setStep('results');
      } else {
        setError('No matching artists found. Try adjusting your criteria.');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit enquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealContact = async (artistId) => {
    if (!window.confirm('Reveal contact for this artist? (Limited to 3 contacts per enquiry)')) {
      return;
    }

    try {
      const response = await publicAPI.revealContact(enquiryId, artistId);
      
      // Update artist in the list
      setMatchedArtists(prev => prev.map(artist => 
        artist.id === artistId 
          ? { ...artist, phone: response.artist.phone, email: response.artist.email }
          : artist
      ));

      // Update enquiry info
      setEnquiryInfo(prev => ({
        ...prev,
        contacts_revealed_count: prev.contacts_revealed_count + 1,
        contacts_remaining: response.contacts_remaining
      }));

      alert(`Contact revealed! ${response.contacts_remaining} contacts remaining.`);
    } catch (err) {
      alert(err.message || 'Failed to reveal contact');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Art Classes</h1>
          <p className="text-xl text-gray-600">
            Connect with talented artists for personalized art classes
          </p>
          <p className="text-sm text-orange-500 mt-2">
            🎨 Platform fee-free • One enquiry per month • Up to 3 artist contacts
          </p>
        </div>

        {step === 'form' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Enquiry</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Art Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Art Category *
                </label>
                <select
                  value={formData.art_type}
                  onChange={(e) => setFormData({ ...formData, art_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select category</option>
                  {ART_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Skill Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Skill Level *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['beginner', 'intermediate', 'advanced'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, skill_level: level })}
                      className={`px-4 py-2 rounded-lg font-medium capitalize ${
                        formData.skill_level === level
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, class_type: 'online' })}
                    className={`px-4 py-3 rounded-lg font-medium ${
                      formData.class_type === 'online'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💻 Online Classes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, class_type: 'offline' })}
                    className={`px-4 py-3 rounded-lg font-medium ${
                      formData.class_type === 'offline'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📍 In-Person Classes
                  </button>
                </div>
              </div>

              {/* Location (for offline only) */}
              {formData.class_type === 'offline' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Location *
                  </label>
                  <input
                    type="text"
                    value={formData.user_location}
                    onChange={(e) => setFormData({ ...formData, user_location: e.target.value })}
                    required={formData.class_type === 'offline'}
                    placeholder="Enter your city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Budget Range - Different options for online vs offline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Per Session *
                </label>
                <div className={`grid gap-3 ${formData.class_type === 'offline' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {(formData.class_type === 'online' 
                    ? [
                        { label: '₹250-350', value: '250-350' },
                        { label: '₹350-500', value: '350-500' }
                      ]
                    : [
                        { label: '₹250-350', value: '250-350' },
                        { label: '₹350-500', value: '350-500' },
                        { label: '₹500-1000', value: '500-1000' }
                      ]
                  ).map(range => (
                    <button
                      key={range.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, budget_range: range.value })}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        formData.budget_range === range.value
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="1 month">1 Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="custom">Custom Duration</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Finding Artists...' : 'Find Matching Artists'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Note: You can submit one enquiry per month and reveal up to 3 artist contacts.
              </p>
            </form>
          </div>
        )}

        {step === 'results' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Matching Artists Found!</h2>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  We found <strong>{matchedArtists.length}</strong> artist(s) matching your criteria
                </p>
                <div className="text-sm text-orange-500 font-medium">
                  Contacts Revealed: {enquiryInfo?.contacts_revealed_count || 0} / 3
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedArtists.map(artist => (
                <div key={artist.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center relative">
                    {artist.avatar ? (
                      <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">👤</span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{artist.name}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-orange-500">
                        {(artist.categories || []).join(', ')}
                      </p>
                      {artist.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <span>📍</span> {artist.location}
                        </p>
                      )}
                      {artist.teaching_rate && (
                        <p className="text-lg font-bold text-green-600">
                          ₹{artist.teaching_rate}/session
                        </p>
                      )}
                      <div className="flex gap-2 text-xs">
                        {artist.teaches_online && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">💻 Online</span>
                        )}
                        {artist.teaches_offline && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">📍 In-Person</span>
                        )}
                      </div>
                    </div>

                    {/* Sample Artworks */}
                    {artist.sample_artworks && artist.sample_artworks.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Sample Work:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {artist.sample_artworks.slice(0, 3).map((artwork, idx) => (
                            <div key={idx} className="aspect-square rounded overflow-hidden bg-gray-100">
                              {artwork.image ? (
                                <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    {artist.phone !== '***HIDDEN***' ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-semibold text-green-800">Contact Revealed:</p>
                        <p className="text-sm text-gray-700">📞 {artist.phone}</p>
                        <p className="text-sm text-gray-700">📧 {artist.email}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRevealContact(artist.id)}
                        disabled={enquiryInfo?.contacts_remaining === 0}
                        className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {enquiryInfo?.contacts_remaining === 0 ? 'Contact Limit Reached' : 'Reveal Contact Info'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setStep('form');
                  setMatchedArtists([]);
                  setEnquiryId(null);
                  setEnquiryInfo(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Back to Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtClassesPage;
