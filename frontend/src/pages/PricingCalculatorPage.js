import React, { useState } from 'react';
import { pricingAPI } from '../services/api';
import { PricingAnalysisCard } from '../components/PricingBadge';

const MEDIUMS = [
  { id: 'oil', name: 'Oil Paint' },
  { id: 'acrylic', name: 'Acrylic' },
  { id: 'watercolor', name: 'Watercolor' },
  { id: 'charcoal', name: 'Charcoal' },
  { id: 'pencil', name: 'Pencil/Graphite' },
  { id: 'pastel', name: 'Pastel' },
  { id: 'mixed_media', name: 'Mixed Media' },
  { id: 'digital', name: 'Digital Art' },
];

const REALISM_LEVELS = [
  { id: 'abstract', name: 'Abstract', description: 'Non-representational, focuses on shapes, colors, forms' },
  { id: 'impressionistic', name: 'Impressionistic', description: 'Captures essence rather than exact details' },
  { id: 'realism', name: 'Realism', description: 'Accurate depiction of subjects' },
  { id: 'hyperrealism', name: 'Hyperrealism', description: 'Extremely detailed, photo-realistic' },
];

const DETAILING_LEVELS = [
  { id: 'average', name: 'Average', description: 'Standard level of detail' },
  { id: 'high_accuracy', name: 'High Accuracy', description: 'Good attention to detail' },
  { id: 'excellent', name: 'Excellent', description: 'Exceptional detailing throughout' },
];

const UNIQUENESS_OPTIONS = [
  { id: 'original', name: 'Original Artwork', description: 'One-of-a-kind piece' },
  { id: 'limited_edition', name: 'Limited Edition', description: 'Part of a limited series' },
  { id: 'multiple_copies', name: 'Multiple Copies', description: 'Can be reproduced' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: '0-2 years of experience' },
  { id: 'intermediate', name: 'Intermediate', description: '3-7 years of experience' },
  { id: 'professional', name: 'Professional', description: '8+ years or formally trained' },
];

function PricingCalculatorPage() {
  const [formData, setFormData] = useState({
    width: '',
    height: '',
    medium: '',
    realism_level: '',
    detailing_level: '',
    uniqueness: '',
    artist_experience: '',
    hours_spent: '',
    material_cost: '',
    artist_price: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
        medium: formData.medium,
        realism_level: formData.realism_level,
        detailing_level: formData.detailing_level,
        uniqueness: formData.uniqueness,
        artist_experience: formData.artist_experience,
        hours_spent: formData.hours_spent ? parseInt(formData.hours_spent) : null,
        material_cost: formData.material_cost ? parseFloat(formData.material_cost) : null,
        artist_price: parseFloat(formData.artist_price),
      };

      const result = await pricingAPI.analyzePrice(payload);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze pricing');
    } finally {
      setLoading(false);
    }
  };

  const squareInches = formData.width && formData.height 
    ? (parseFloat(formData.width) * parseFloat(formData.height)).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chitrakalakar Pricing Calculator</h1>
          <p className="text-gray-600">Get a fair market price estimate for your artwork</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Artwork Size (inches)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      name="width"
                      placeholder="Width"
                      value={formData.width}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                      min="1"
                      step="0.5"
                      data-testid="pricing-width"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="height"
                      placeholder="Height"
                      value={formData.height}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                      min="1"
                      step="0.5"
                      data-testid="pricing-height"
                    />
                  </div>
                </div>
                {squareInches > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Total: {squareInches} sq inches</p>
                )}
              </div>

              {/* Medium */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medium</label>
                <select
                  name="medium"
                  value={formData.medium}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  data-testid="pricing-medium"
                >
                  <option value="">Select medium...</option>
                  {MEDIUMS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Realism Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Realism Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {REALISM_LEVELS.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, realism_level: level.id }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.realism_level === level.id
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      data-testid={`pricing-realism-${level.id}`}
                    >
                      <span className="font-medium text-sm">{level.name}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{level.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailing Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailing Level</label>
                <div className="flex gap-2">
                  {DETAILING_LEVELS.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, detailing_level: level.id }))}
                      className={`flex-1 p-2.5 rounded-lg border text-center transition-all ${
                        formData.detailing_level === level.id
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      data-testid={`pricing-detailing-${level.id}`}
                    >
                      <span className="font-medium text-sm">{level.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Uniqueness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uniqueness</label>
                <select
                  name="uniqueness"
                  value={formData.uniqueness}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  data-testid="pricing-uniqueness"
                >
                  <option value="">Select...</option>
                  {UNIQUENESS_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {/* Artist Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Experience Level</label>
                <div className="flex gap-2">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, artist_experience: level.id }))}
                      className={`flex-1 p-2.5 rounded-lg border text-center transition-all ${
                        formData.artist_experience === level.id
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      data-testid={`pricing-experience-${level.id}`}
                    >
                      <span className="font-medium text-sm">{level.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Spent (optional)</label>
                  <input
                    type="number"
                    name="hours_spent"
                    placeholder="e.g., 40"
                    value={formData.hours_spent}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="1"
                    data-testid="pricing-hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost ₹ (optional)</label>
                  <input
                    type="number"
                    name="material_cost"
                    placeholder="e.g., 2000"
                    value={formData.material_cost}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                    data-testid="pricing-material-cost"
                  />
                </div>
              </div>

              {/* Artist's Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Asking Price (₹)</label>
                <input
                  type="number"
                  name="artist_price"
                  placeholder="Enter your price"
                  value={formData.artist_price}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-medium"
                  required
                  min="100"
                  data-testid="pricing-artist-price"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
                data-testid="pricing-analyze-btn"
              >
                {loading ? 'Analyzing...' : 'Analyze Pricing'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {analysis ? (
              <PricingAnalysisCard 
                analysis={analysis} 
                artistPrice={parseFloat(formData.artist_price)}
              />
            ) : (
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">🎨</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Your Price Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Fill in your artwork details and we'll provide a fair market price estimate based on:
                </p>
                <ul className="mt-4 text-sm text-gray-600 space-y-2 text-left max-w-xs mx-auto">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Size & medium
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Realism & detailing level
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Uniqueness & experience
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Indian art market rates
                  </li>
                </ul>
              </div>
            )}

            {/* Pricing Guide */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Pricing Transparency Badges</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <div>
                    <p className="font-medium text-gray-900">Fairly Priced</p>
                    <p className="text-xs text-gray-500">Within market range</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🟡</span>
                  <div>
                    <p className="font-medium text-gray-900">Slightly Above Market</p>
                    <p className="text-xs text-gray-500">May need justification</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔴</span>
                  <div>
                    <p className="font-medium text-gray-900">Premium Pricing</p>
                    <p className="text-xs text-gray-500">Requires clear justification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingCalculatorPage;
