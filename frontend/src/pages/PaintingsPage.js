import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI, cartAPI } from '../services/api';
import { ART_CATEGORIES } from '../utils/branding';
import { useAuth } from '../contexts/AuthContext';

function PaintingsPage() {
  const { isAuthenticated } = useAuth();
  const [paintings, setPaintings] = useState([]);
  const [filteredPaintings, setFilteredPaintings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [priceRange, setPriceRange] = useState('all');

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
  }, [paintings, selectedCategory, priceRange, sortBy]);

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
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Paintings Marketplace</h1>
          <p className="text-xl opacity-90">
            Discover and collect beautiful artworks from talented artists
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPaintings.map(painting => (
              <Link 
                key={painting.id} 
                to={`/painting/${painting.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
                data-testid={`painting-card-${painting.id}`}
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {(painting.images?.[0] || painting.image) ? (
                    <img 
                      src={painting.images?.[0] || painting.image} 
                      alt={painting.title}
                      className="w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-300"
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
                  <button
                    onClick={(e) => handleAddToCart(e, painting.id)}
                    className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    data-testid={`add-to-cart-${painting.id}`}
                  >
                    Add to Cart
                  </button>
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
    </div>
  );
}

export default PaintingsPage;
