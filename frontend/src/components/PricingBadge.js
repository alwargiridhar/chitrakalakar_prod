import React from 'react';

/**
 * Pricing Transparency Badge Component
 * Shows pricing evaluation status for artworks
 */
export function PricingBadge({ badge, evaluation, showLabel = true, size = 'sm' }) {
  if (!badge) return null;

  const badgeConfig = {
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: '🟢',
      label: 'Fairly Priced'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
      icon: '🟡',
      label: 'Slightly Above Market'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: '🔴',
      label: 'Premium Pricing'
    }
  };

  const config = badgeConfig[badge] || badgeConfig.green;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
      title={`${config.label}${evaluation ? ` - ${evaluation.replace('_', ' ')}` : ''}`}
    >
      <span>{config.icon}</span>
      {showLabel && <span className="font-medium">{config.label}</span>}
    </span>
  );
}

/**
 * Pricing Analysis Card Component
 * Shows detailed pricing analysis for artists/admins
 */
export function PricingAnalysisCard({ analysis, artistPrice, onRequestJustification }) {
  if (!analysis) return null;

  const { suggested_price_range, pricing_evaluation, pricing_badge, buyer_message, artist_suggestion } = analysis;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">AI Price Analysis</h4>
        <PricingBadge badge={pricing_badge} evaluation={pricing_evaluation} />
      </div>

      <div className="space-y-3">
        {/* Suggested Range */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Suggested Range:</span>
          <span className="font-medium text-gray-900">
            ₹{suggested_price_range?.min?.toLocaleString()} - ₹{suggested_price_range?.max?.toLocaleString()}
          </span>
        </div>

        {/* Artist's Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Your Price:</span>
          <span className="font-bold text-gray-900">₹{artistPrice?.toLocaleString()}</span>
        </div>

        {/* Evaluation Bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          {suggested_price_range && (
            <>
              <div 
                className="absolute h-full bg-green-400"
                style={{ 
                  left: '20%',
                  width: '40%'
                }}
              />
              <div 
                className="absolute h-full w-1 bg-gray-800"
                style={{ 
                  left: `${Math.min(90, Math.max(10, (artistPrice / suggested_price_range.max) * 60))}%`
                }}
              />
            </>
          )}
        </div>

        {/* Buyer Message */}
        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{buyer_message}</p>

        {/* Artist Suggestion */}
        {artist_suggestion && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              <span className="font-medium">💡 Tip:</span> {artist_suggestion}
            </p>
            {onRequestJustification && (
              <button
                onClick={onRequestJustification}
                className="mt-2 text-sm text-orange-600 hover:text-orange-700 underline"
              >
                Add justification for your pricing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingBadge;
