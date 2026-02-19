import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicAPI, cartAPI, videoScreeningAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import VirtualRoomPreview from '../components/VirtualRoomPreview';

function PaintingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [painting, setPainting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [showRoomPreview, setShowRoomPreview] = useState(false);
  const [screeningForm, setScreeningForm] = useState({
    preferred_date: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPainting = useCallback(async () => {
    try {
      const response = await publicAPI.getPaintingDetail(id);
      setPainting(response.painting);
    } catch (error) {
      setError('Painting not found');
      console.error('Error fetching painting:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPainting();
  }, [fetchPainting]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    try {
      await cartAPI.add(id);
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Failed to add to cart');
    }
  };

  const handleRequestScreening = async () => {
    if (!isAuthenticated) {
      alert('Please login to request a video screening');
      navigate('/login');
      return;
    }
    
    setSubmitting(true);
    try {
      await videoScreeningAPI.request({
        painting_id: id,
        preferred_date: screeningForm.preferred_date,
        message: screeningForm.message
      });
      alert('Video screening request submitted! Admin will accommodate your request.');
      setShowScreeningModal(false);
      setScreeningForm({ preferred_date: '', message: '' });
    } catch (error) {
      console.error('Error requesting screening:', error);
      alert(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const images = painting?.images || (painting?.image ? [painting.image] : []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !painting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">😕</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Painting not found'}</h2>
          <Link to="/paintings" className="text-orange-500 hover:underline">
            ← Back to Paintings
          </Link>
        </div>
      </div>
    );
  }

  const artist = painting.profiles;

  // Helper to render info row
  const InfoRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
        <span className="text-lg">{icon}</span>
        <div>
          <span className="text-xs text-gray-500 block">{label}</span>
          <span className="text-sm text-gray-900 font-medium">{value}</span>
        </div>
      </div>
    );
  };

  // Helper to render badge
  const Badge = ({ children, color = 'gray' }) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-700',
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
      amber: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
        {children}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link to="/" className="text-gray-500 hover:text-orange-500">Home</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link to="/paintings" className="text-gray-500 hover:text-orange-500">Paintings</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">{painting.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-xl shadow-lg overflow-hidden">
              {images.length > 0 ? (
                <img 
                  src={images[currentImageIndex]} 
                  alt={painting.title}
                  className="w-full h-full object-contain"
                  data-testid="painting-main-image"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl text-gray-300">
                  🖼️
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === index ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'
                    }`}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge color="orange">{painting.category}</Badge>
                {painting.artwork_type && <Badge color="purple">{painting.artwork_type}</Badge>}
                {painting.condition && painting.condition !== 'Brand New' && (
                  <Badge color="amber">{painting.condition}</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="painting-title">{painting.title}</h1>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-orange-600" data-testid="painting-price">
                  {painting.currency === 'USD' ? '$' : painting.currency === 'EUR' ? '€' : '₹'}
                  {painting.price?.toLocaleString('en-IN')}
                </p>
                {painting.price_type === 'Negotiable' && (
                  <span className="text-sm text-gray-500">(Negotiable)</span>
                )}
              </div>
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap gap-2">
              {painting.certificate_of_authenticity && (
                <Badge color="green">✓ Certificate of Authenticity</Badge>
              )}
              {painting.signed_by_artist && painting.signed_by_artist !== 'Not Signed' && (
                <Badge color="blue">✓ Signed ({painting.signed_by_artist})</Badge>
              )}
              {painting.framing_status === 'Framed' && (
                <Badge color="amber">✓ Framed</Badge>
              )}
              {painting.framing_status === 'Ready to Hang' && (
                <Badge color="green">✓ Ready to Hang</Badge>
              )}
              {painting.international_shipping && (
                <Badge color="blue">🌍 Ships Internationally</Badge>
              )}
              {painting.insured_shipping && (
                <Badge color="green">🛡️ Insured Shipping</Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  data-testid="add-to-cart-btn"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => setShowScreeningModal(true)}
                  className="flex-1 py-3 border-2 border-orange-500 text-orange-500 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                  data-testid="request-screening-btn"
                >
                  Request Video Screening
                </button>
              </div>
              
              {/* Virtual Room Preview Button */}
              <button
                onClick={() => setShowRoomPreview(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                data-testid="virtual-room-preview-btn"
              >
                <span>🏠</span> View in Your Room
              </button>
            </div>

            {/* Artwork Details Grid */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span> Artwork Details
              </h3>
              <div className="grid grid-cols-2 gap-x-6">
                <InfoRow icon="📅" label="Year Created" value={painting.year_of_creation} />
                <InfoRow icon="🎨" label="Medium" value={painting.medium} />
                <InfoRow icon="📄" label="Surface" value={painting.surface} />
                <InfoRow icon="🖼️" label="Style" value={painting.style} />
                <InfoRow icon="📏" label="Orientation" value={painting.orientation} />
                {painting.dimensions && (
                  <InfoRow 
                    icon="📐" 
                    label="Dimensions" 
                    value={`${painting.dimensions.height} × ${painting.dimensions.width}${painting.dimensions.depth ? ` × ${painting.dimensions.depth}` : ''} ${painting.dimensions.unit}`} 
                  />
                )}
                {painting.edition_number && (
                  <InfoRow icon="🔢" label="Edition" value={painting.edition_number} />
                )}
                <InfoRow icon="📦" label="Quantity" value={painting.quantity_available > 1 ? `${painting.quantity_available} available` : null} />
                <InfoRow icon="⏱️" label="Dispatch Time" value={painting.dispatch_time} />
              </div>
            </div>

            {/* Authenticity & Certification */}
            {(painting.certificate_of_authenticity || painting.signed_by_artist || painting.hand_embellished || painting.artist_stamp) && (
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span>✅</span> Authenticity & Certification
                </h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-center gap-2">
                    <span>{painting.artwork_type === 'Original' ? '✓' : '○'}</span>
                    Original Artwork: <strong>{painting.artwork_type || 'Original'}</strong>
                  </li>
                  {painting.certificate_of_authenticity && (
                    <li className="flex items-center gap-2">✓ Certificate of Authenticity Included</li>
                  )}
                  {painting.signed_by_artist && painting.signed_by_artist !== 'Not Signed' && (
                    <li className="flex items-center gap-2">✓ Signed by Artist ({painting.signed_by_artist})</li>
                  )}
                  {painting.hand_embellished && (
                    <li className="flex items-center gap-2">✓ Hand-embellished</li>
                  )}
                  {painting.artist_stamp && (
                    <li className="flex items-center gap-2">✓ Artist Stamp Available</li>
                  )}
                </ul>
              </div>
            )}

            {/* Framing & Shipping Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📦</span> Framing & Shipping
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Framing Status:</span>
                  <p className="font-medium text-gray-900">{painting.framing_status || 'Not specified'}</p>
                </div>
                {painting.frame_material && (
                  <div>
                    <span className="text-gray-500">Frame Material:</span>
                    <p className="font-medium text-gray-900">{painting.frame_material}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-gray-500">Shipping Options:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {painting.ships_rolled && <Badge>Ships Rolled</Badge>}
                    {painting.ships_stretched && <Badge>Ships Stretched</Badge>}
                    {painting.ships_framed && <Badge>Ships Framed</Badge>}
                    {!painting.ships_rolled && !painting.ships_stretched && !painting.ships_framed && (
                      <span className="text-gray-500">Contact artist for details</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ownership & Rights */}
            {painting.ownership_type && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span>⚖️</span> Ownership & Usage Rights
                </h3>
                <p className="text-sm text-blue-700">{painting.ownership_type}</p>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description & Story */}
          <div className="space-y-6">
            {painting.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{painting.description}</p>
              </div>
            )}

            {(painting.inspiration || painting.technique_explanation || painting.artist_statement) && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📖</span> Story & Context
                </h3>
                {painting.inspiration && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Inspiration</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{painting.inspiration}</p>
                  </div>
                )}
                {painting.technique_explanation && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Technique</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{painting.technique_explanation}</p>
                  </div>
                )}
                {painting.artist_statement && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Artist Statement</h4>
                    <p className="text-gray-600 text-sm leading-relaxed italic">"{painting.artist_statement}"</p>
                  </div>
                )}
              </div>
            )}

            {(painting.exhibition_history || painting.awards_recognition) && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Recognition & History
                </h3>
                {painting.exhibition_history && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Exhibition History</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{painting.exhibition_history}</p>
                  </div>
                )}
                {painting.awards_recognition && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Awards & Recognition</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{painting.awards_recognition}</p>
                  </div>
                )}
              </div>
            )}

            {/* Investment Signals */}
            {(painting.previously_exhibited || painting.featured_in_publication || painting.sold_similar_works || painting.part_of_series || painting.collector_interest) && (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <span>📈</span> Investment Signals
                </h3>
                <div className="flex flex-wrap gap-2">
                  {painting.previously_exhibited && <Badge color="purple">Previously Exhibited</Badge>}
                  {painting.featured_in_publication && <Badge color="purple">Featured in Publication</Badge>}
                  {painting.sold_similar_works && <Badge color="purple">Sold Similar Works</Badge>}
                  {painting.collector_interest && <Badge color="purple">Collector Interest</Badge>}
                  {painting.part_of_series && (
                    <Badge color="purple">Part of Series{painting.series_name ? `: ${painting.series_name}` : ''}</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Artist Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Artist</h3>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center overflow-hidden">
                  {artist?.avatar ? (
                    <img src={artist.avatar} alt={artist.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{artist?.full_name || 'Unknown Artist'}</h4>
                  {artist?.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span>📍</span> {artist.location}
                    </p>
                  )}
                  {artist?.categories && artist.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {artist.categories.map((cat, i) => (
                        <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {artist?.bio && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">{artist.bio}</p>
              )}
              <Link 
                to={`/artist/${artist?.id}`}
                className="mt-4 block text-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                View Artist Profile
              </Link>
            </div>

            {/* Stats & Meta */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold text-orange-500">{painting.views || 0}</span>
                  <p className="text-gray-500">Views</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold text-orange-500">{images.length}</span>
                  <p className="text-gray-500">Images</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Listed on {new Date(painting.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12">
          <button 
            onClick={() => navigate(-1)}
            className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-2"
          >
            ← Back to Paintings
          </button>
        </div>
      </div>

      {/* Video Screening Modal */}
      {showScreeningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Request Video Screening</h2>
              <button onClick={() => setShowScreeningModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Like this painting? Request a video screening to see it in detail before purchasing.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date (Optional)</label>
                <input
                  type="date"
                  value={screeningForm.preferred_date}
                  onChange={(e) => setScreeningForm({ ...screeningForm, preferred_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                <textarea
                  value={screeningForm.message}
                  onChange={(e) => setScreeningForm({ ...screeningForm, message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Any specific questions about the painting..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowScreeningModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestScreening}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaintingDetailPage;
