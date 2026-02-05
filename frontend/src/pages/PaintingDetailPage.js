import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { publicAPI, cartAPI, videoScreeningAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function PaintingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [painting, setPainting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
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

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-3">
                {painting.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="painting-title">{painting.title}</h1>
              <p className="text-2xl font-bold text-orange-600" data-testid="painting-price">
                ₹{painting.price?.toLocaleString('en-IN')}
              </p>
            </div>

            {painting.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{painting.description}</p>
              </div>
            )}

            {/* Action Buttons */}
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

            {/* Artist Info (without contact) */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Artist</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center overflow-hidden">
                  {artist?.avatar ? (
                    <img src={artist.avatar} alt={artist.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{artist?.full_name || 'Unknown Artist'}</h4>
                  {artist?.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span>📍</span> {artist.location}
                    </p>
                  )}
                  {artist?.categories && artist.categories.length > 0 && (
                    <p className="text-sm text-orange-500 mt-1">
                      {artist.categories.join(', ')}
                    </p>
                  )}
                  {artist?.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{artist.bio}</p>
                  )}
                </div>
              </div>
              <Link 
                to={`/artist/${artist?.id}`}
                className="mt-4 block text-center px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
              >
                View Artist Profile
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {painting.views > 0 && (
                <span className="flex items-center gap-1">
                  <span>👁️</span> {painting.views} views
                </span>
              )}
              <span className="flex items-center gap-1">
                <span>📅</span> Added {new Date(painting.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
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
