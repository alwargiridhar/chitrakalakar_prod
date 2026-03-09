import { ART_CATEGORIES } from '../../utils/branding';

export const CATEGORY_PRICING = {
  'Acrylic Colors': {
    model: 'sqft',
    average: { min: 1500, max: 4000 },
    advanced: { min: 4000, max: 10000 },
  },
  Watercolors: {
    model: 'sqft',
    average: { min: 1200, max: 3000 },
    advanced: { min: 3000, max: 6000 },
  },
  'Pencil & Pen Work': {
    model: 'sqft',
    average: { min: 800, max: 2000 },
    advanced: { min: 2000, max: 5000 },
  },
  Pastels: {
    model: 'sqft',
    average: { min: 1200, max: 3500 },
    advanced: { min: 3500, max: 7000 },
  },
  'Indian Ink': {
    model: 'sqft',
    average: { min: 1000, max: 2500 },
    advanced: { min: 2500, max: 5500 },
  },
  Illustrations: {
    model: 'flat',
    average: { min: 2000, max: 8000 },
    advanced: { min: 8000, max: 25000 },
  },
  'Visual Art': {
    model: 'sqft',
    average: { min: 2000, max: 7000 },
    advanced: { min: 7000, max: 18000 },
  },
  'Digital Art': {
    model: 'flat',
    average: { min: 1000, max: 6000 },
    advanced: { min: 6000, max: 20000 },
  },
  'Mixed Media': {
    model: 'sqft',
    average: { min: 2500, max: 8000 },
    advanced: { min: 8000, max: 20000 },
  },
  Sculpture: {
    model: 'flat',
    average: { min: 10000, max: 80000 },
    advanced: { min: 80000, max: 400000 },
  },
  Photography: {
    model: 'flat',
    average: { min: 2000, max: 15000 },
    advanced: { min: 15000, max: 100000 },
  },
  Printmaking: {
    model: 'sqft',
    average: { min: 1500, max: 5000 },
    advanced: { min: 5000, max: 12000 },
  },
};

export const MEDIUM_PRICING = {
  'Pencil / Charcoal': { average: { min: 800, max: 2000 }, advanced: { min: 2000, max: 5000 } },
  Watercolor: { average: { min: 1200, max: 3000 }, advanced: { min: 3000, max: 6000 } },
  'Acrylic on Canvas': { average: { min: 1500, max: 4000 }, advanced: { min: 4000, max: 10000 } },
  'Oil on Canvas': { average: { min: 2500, max: 6000 }, advanced: { min: 6000, max: 15000 } },
  'Hyper-Realism / Museum Replica': { average: { min: 5000, max: 12000 }, advanced: { min: 12000, max: 30000 } },
};

export const DETAIL_MULTIPLIERS = {
  Basic: 1,
  Detailed: 1.25,
  'Hyper Realistic': 1.5,
};

export const COMMISSION_STATUSES = [
  'Requested',
  'Accepted',
  'In Progress',
  'WIP Shared',
  'Completed',
  'Delivered',
];

export const PRICING_MODELS = {
  sqft: 'Per sq ft',
  flat: 'Per project',
};

export const formatINR = (value = 0) => `₹${Math.round(value).toLocaleString('en-IN')}`;

export const calculateEstimate = ({ category, width, height, detailLevel, subjects }) => {
  const pricing = CATEGORY_PRICING[category] || CATEGORY_PRICING[ART_CATEGORIES[0]];
  const sqft = Number(width || 0) * Number(height || 0);
  const multiplier = DETAIL_MULTIPLIERS[detailLevel] || 1;
  const subjectMultiplier = 1 + Math.max(0, Number(subjects || 1) - 1) * 0.15;

  const baseMultiplier = pricing.model === 'flat' ? 1 : sqft;

  const averageMin = baseMultiplier * pricing.average.min * multiplier * subjectMultiplier;
  const averageMax = baseMultiplier * pricing.average.max * multiplier * subjectMultiplier;
  const advancedMin = baseMultiplier * pricing.advanced.min * multiplier * subjectMultiplier;
  const advancedMax = baseMultiplier * pricing.advanced.max * multiplier * subjectMultiplier;

  return {
    sqft: Number(sqft.toFixed(2)),
    pricingModel: pricing.model,
    averageMin,
    averageMax,
    advancedMin,
    advancedMax,
    minPrice: averageMin,
    maxPrice: advancedMax,
    averagePrice: (averageMin + advancedMax) / 2,
  };
};
