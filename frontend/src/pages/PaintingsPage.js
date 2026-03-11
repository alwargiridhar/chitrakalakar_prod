import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI, cartAPI } from '../services/api';
import { ART_CATEGORIES } from '../utils/branding';
import { useAuth } from '../contexts/AuthContext';
import VirtualRoomPreview from '../components/VirtualRoomPreview';
import AdaptiveArtworkImage from '../components/AdaptiveArtworkImage';

function PaintingsPage() {
  const { isAuthenticated } = useAuth();
  const [paintings, setPaintings] = useState([]);
  const [filteredPaintings, setFilteredPaintings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [previewPainting, setPreviewPainting] = useState(null);

  // Room types for filtering
  const ROOM_TYPES = [
    { id: 'all', name: 'All Spaces', icon: '🏠' },
    { id: 'living_room', name: 'Living Room', icon: '🛋️' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
    { id: 'office', name: 'Office', icon: '💼' },
    { id: 'dining_room', name: 'Dining Room', icon: '🍽️' },
    { id: 'hotel', name: 'Hotel & Lobby', icon: '🏨' },
    { id: 'hospital', name: 'Hospital', icon: '🏥' },
    { id: 'school', name: 'School', icon: '🏫' },
  ];

  // Price range quick filters
  const PRICE_RANGES = [
    { id: 'all', name: 'All Prices', color: 'bg-gray-100 text-gray-700' },
    { id: 'under-5000', name: 'Under ₹5,000', color: 'bg-green-100 text-green-700' },
    { id: '5000-15000', name: '₹5K - ₹15K', color: 'bg-blue-100 text-blue-700' },
    { id: '15000-50000', name: '₹15K - ₹50K', color: 'bg-purple-100 text-purple-700' },
    { id: 'above-50000', name: 'Above ₹50K', color: 'bg-orange-100 text-orange-700' },
  ];

  const fetchPaintings = useCallback(async () => {
    try {
      const response = await publicAPI.getPaintings();
      setPaintings(response.paintings || []);
    } catch (error) {
      console.error('Error fetching paintings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAndSortPaintings = useCallback(() => {
    let filtered = [...paintings];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (priceRange !== 'all') {
      const ranges = {
        'under-5000': [0, 5000],
        '5000-15000': [5000, 15000],
        '15000-50000': [15000, 50000],
        'above-50000': [50000, Infinity],
      };
      const [min, max] = ranges[priceRange];
      filtered = filtered.filter(p => p.price >= min && p.price < max);
    }

    // Room-based filtering
    if (selectedRoom !== 'all') {
      filtered = filtered.filter(p => {
        // Check if artwork has suitable_rooms array
        if (p.suitable_rooms && Array.isArray(p.suitable_rooms)) {
          return p.suitable_rooms.includes(selectedRoom);
        }
        // Fallback: Use category-based room suggestions if suitable_rooms not set
        const categoryRoomMap = {
          'living_room': ['Landscape', 'Abstract', 'Nature', 'Scenery', 'Contemporary'],
          'bedroom': ['Nature', 'Floral', 'Abstract', 'Minimalist'],
          'office': ['Abstract', 'Modern', 'Motivational', 'Cityscape'],
          'dining_room': ['Still Life', 'Floral', 'Nature', 'Food'],
          'hotel': ['Landscape', 'Abstract', 'Contemporary', 'Modern'],
          'hospital': ['Nature', 'Floral', 'Calming', 'Abstract'],
          'school': ['Educational', 'Nature', 'Inspirational', 'Portrait'],
        };
        const suggestedCategories = categoryRoomMap[selectedRoom] || [];
        return suggestedCategories.some(cat => 
          p.category?.toLowerCase().includes(cat.toLowerCase()) ||
          p.style?.toLowerCase().includes(cat.toLowerCase())
        );
      });
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }

    setFilteredPaintings(filtered);
  }, [paintings, selectedCategory, priceRange, selectedRoom, sortBy]);

  useEffect(() => {
    fetchPaintings();
  }, [fetchPaintings]);

  useEffect(() => {
    filterAndSortPaintings();
  }, [filterAndSortPaintings]);

  const handleAddToCart = async (e, paintingId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }
    
    try {
      await cartAPI.add(paintingId);
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Failed to add to cart');
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
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Paintings Marketplace</h1>
          <p className="text-base sm:text-xl opacity-90">
            Discover and collect beautiful artworks from talented artists
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Price Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Browse by Price</h3>
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map(range => (
              <button
                key={range.id}
                onClick={() => setPriceRange(range.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  priceRange === range.id 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : `${range.color} hover:shadow-md`
                }`}
                data-testid={`price-quick-filter-${range.id}`}
              >
                {range.name}
              </button>
            ))}
          </div>
        </div>

        {/* Room-based Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Browse by Room/Space</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {ROOM_TYPES.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  selectedRoom === room.id 
                    ? 'bg-orange-500 text-white shadow-lg scale-105' 
                    : 'bg-white text-gray-700 hover:shadow-md hover:scale-102 border border-gray-200'
                }`}
                data-testid={`room-filter-${room.id}`}
              >
                <span className="text-2xl mb-1">{room.icon}</span>
                <span className="text-xs font-medium text-center">{room.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-sm font-medium text-gray-700">Advanced Filters</span>
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                data-testid="category-filter"
              >
                <option value="all">All Categories</option>
                {ART_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                data-testid="price-filter"
              >
                <option value="all">All Prices</option>
                <option value="under-5000">Under ₹5,000</option>
                <option value="5000-15000">₹5,000 - ₹15,000</option>
                <option value="15000-50000">₹15,000 - ₹50,000</option>
                <option value="above-50000">Above ₹50,000</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                data-testid="sort-filter"
              >
                <option value="latest">Latest First</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 mb-6">
          Showing <span className="font-semibold">{filteredPaintings.length}</span> painting{filteredPaintings.length !== 1 ? 's' : ''}
        </p>

        {/* Paintings Grid */}
        {filteredPaintings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <span className="text-6xl mb-4 block">🎨</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No paintings found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredPaintings.map(painting => (
              <Link 
                key={painting.id} 
                to={`/painting/${painting.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
                data-testid={`painting-card-${painting.id}`}
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {(painting.images?.[0] || painting.image) ? (
                    <AdaptiveArtworkImage
                      src={painting.images?.[0] || painting.image} 
                      alt={painting.title}
                      settings={(painting.image_display_settings || [])[0] || null}
                      className="bg-gray-50 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                      🖼️
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-orange-600">
                    {painting.category}
                  </div>
                  
                  {/* Multiple Images Indicator */}
                  {painting.images && painting.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      +{painting.images.length - 1} more
                    </div>
                  )}
                  
                  {/* Key Info Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs space-y-1">
                      {painting.medium && (
                        <p className="flex items-center gap-1">
                          <span>🎨</span> {painting.medium}
                        </p>
                      )}
                      {painting.dimensions && (
                        <p className="flex items-center gap-1">
                          <span>📐</span> {painting.dimensions.height}×{painting.dimensions.width} {painting.dimensions.unit}
                        </p>
                      )}
                      {painting.year_of_creation && (
                        <p className="flex items-center gap-1">
                          <span>📅</span> {painting.year_of_creation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{painting.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    by {painting.profiles?.full_name || 'Unknown Artist'}
                  </p>
                  
                  {/* Key Info Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {painting.artwork_type && painting.artwork_type !== 'Original' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {painting.artwork_type}
                      </span>
                    )}
                    {painting.certificate_of_authenticity && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        COA
                      </span>
                    )}
                    {painting.signed_by_artist && painting.signed_by_artist !== 'Not Signed' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Signed
                      </span>
                    )}
                    {painting.framing_status === 'Framed' && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Framed
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-orange-600">
                        ₹{painting.price?.toLocaleString('en-IN')}
                      </span>
                      {painting.price_type === 'Negotiable' && (
                        <span className="text-xs text-gray-500 ml-1">(Negotiable)</span>
                      )}
                    </div>
                    {painting.views > 0 && (
                      <span className="text-xs text-gray-400">
                        {painting.views} views
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleAddToCart(e, painting.id)}
                      className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                      data-testid={`add-to-cart-${painting.id}`}
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPreviewPainting(painting);
                      }}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                      title="View in Room"
                      data-testid={`room-preview-${painting.id}`}
                    >
                      🏠
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Contact Note */}
        <div className="mt-12 bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            Interested in a painting?
          </h3>
          <p className="text-orange-700">
            Click on any painting to see details, request a video screening, or add to cart for purchase.
          </p>
        </div>
      </div>

      {/* Virtual Room Preview Modal */}
      <VirtualRoomPreview
        artwork={previewPainting}
        isOpen={!!previewPainting}
        onClose={() => setPreviewPainting(null)}
      />
    </div>
  );
}

export default PaintingsPage;
