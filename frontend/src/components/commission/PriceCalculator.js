import React from 'react';
import { ART_CATEGORIES } from '../../utils/branding';
import { CATEGORY_PRICING, DETAIL_MULTIPLIERS, MEDIUM_PRICING, PRICING_MODELS, formatINR } from './pricing';

export default function PriceCalculator({ formData, setFormData, estimate }) {
  const mediums = Object.keys(MEDIUM_PRICING);
  const detailLevels = Object.keys(DETAIL_MULTIPLIERS);
  const selectedCategoryPricing = CATEGORY_PRICING[formData.art_category] || CATEGORY_PRICING[ART_CATEGORIES[0]];

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm" data-testid="commission-price-calculator">
      <h2 className="text-2xl text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="commission-price-heading">
        Estimated Commission Price
      </h2>
      <p className="text-sm text-gray-500 mb-6" data-testid="commission-price-subheading">
        Live estimate updates as you change size, medium, detail level, and subjects.
      </p>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2" data-testid="commission-category-label">Artwork Category</label>
          <select
            value={formData.art_category}
            onChange={(e) => setFormData((p) => ({ ...p, art_category: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
            data-testid="commission-category-select"
          >
            {ART_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2" data-testid="commission-width-label">Width (ft)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.width_ft}
              onChange={(e) => setFormData((p) => ({ ...p, width_ft: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2"
              data-testid="commission-width-input"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2" data-testid="commission-height-label">Height (ft)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.height_ft}
              onChange={(e) => setFormData((p) => ({ ...p, height_ft: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2"
              data-testid="commission-height-input"
            />
          </div>
        </div>

        <p className="text-sm text-gray-600" data-testid="commission-square-feet-value">
          Square Feet: <span className="font-semibold text-gray-900">{estimate.sqft}</span>
        </p>
        <p className="text-xs text-gray-500" data-testid="commission-pricing-model-value">
          Pricing Model: {PRICING_MODELS[selectedCategoryPricing.model]} {selectedCategoryPricing.model === 'flat' ? '(size ignored)' : ''}
        </p>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2" data-testid="commission-medium-label">Medium</label>
          <select
            value={formData.medium}
            onChange={(e) => setFormData((p) => ({ ...p, medium: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
            data-testid="commission-medium-select"
          >
            {mediums.map((medium) => (
              <option key={medium} value={medium}>{medium}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2" data-testid="commission-skill-label">Artist Skill Level</label>
          <div className="flex gap-2">
            {['Average', 'Advanced'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, skill_level: level }))}
                className={`flex-1 rounded-xl px-3 py-2 border transition-transform duration-200 hover:-translate-y-0.5 ${formData.skill_level === level ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-gray-700 border-gray-300'}`}
                data-testid={`commission-skill-${level.toLowerCase()}-button`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2" data-testid="commission-detail-label">Detail Level</label>
          <div className="grid grid-cols-3 gap-2">
            {detailLevels.map((detail) => (
              <button
                key={detail}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, detail_level: detail }))}
                className={`rounded-xl px-2 py-2 text-xs border transition-colors ${formData.detail_level === detail ? 'border-[#D4AF37] bg-[#F5F1E4] text-[#1A1A1A]' : 'border-gray-300 text-gray-600'}`}
                data-testid={`commission-detail-${detail.toLowerCase().replace(/\s+/g, '-')}-button`}
              >
                {detail}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2" data-testid="commission-subjects-label">Number of Subjects</label>
          <input
            type="number"
            min="1"
            value={formData.subjects}
            onChange={(e) => setFormData((p) => ({ ...p, subjects: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
            data-testid="commission-subjects-input"
          />
        </div>
      </div>

      <div className="mt-8 bg-[#FAFAFA] border border-gray-200 rounded-2xl p-4" data-testid="commission-price-output">
        <p className="text-sm text-gray-500">Minimum Price</p>
        <p className="text-xl font-semibold text-[#1A1A1A]" data-testid="commission-min-price">{formatINR(estimate.minPrice)}</p>
        <p className="text-sm text-gray-500 mt-2">Maximum Price</p>
        <p className="text-xl font-semibold text-[#1A1A1A]" data-testid="commission-max-price">{formatINR(estimate.maxPrice)}</p>
        <p className="text-sm text-gray-500 mt-2">Average Estimate</p>
        <p className="text-2xl text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="commission-avg-price">
          {formatINR(estimate.averagePrice)}
        </p>

        <div className="mt-4 space-y-2" data-testid="commission-price-comparison-bar">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span data-testid="commission-price-comparison-average-label">Average Artist</span>
            <span data-testid="commission-price-comparison-average-value">{formatINR(estimate.averageMin)}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-[#1A1A1A] rounded-full" style={{ width: '45%' }}></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-700 mt-2">
            <span data-testid="commission-price-comparison-advanced-label">Advanced Artist</span>
            <span data-testid="commission-price-comparison-advanced-value">{formatINR(estimate.advancedMax)}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-[#D4AF37] rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
