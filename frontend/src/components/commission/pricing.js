import { ART_CATEGORIES } from '../../utils/branding';

export const MEDIUM_PRICING = {
  'Pencil / Charcoal': {
    average: { min: 800, max: 2000 },
    advanced: { min: 2000, max: 5000 },
  },
  Watercolor: {
    average: { min: 1200, max: 3000 },
    advanced: { min: 3000, max: 6000 },
  },
  'Acrylic on Canvas': {
    average: { min: 1500, max: 4000 },
    advanced: { min: 4000, max: 10000 },
  },
  'Oil on Canvas': {
    average: { min: 2500, max: 6000 },
    advanced: { min: 6000, max: 15000 },
  },
  'Hyper-Realism / Museum Replica': {
    average: { min: 5000, max: 12000 },
    advanced: { min: 12000, max: 30000 },
  },
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

export const CATEGORY_PRICING = ART_CATEGORIES.reduce((acc, category) => {
  acc[category] = MEDIUM_PRICING;
  return acc;
}, {});

export const formatINR = (value = 0) => `₹${Math.round(value).toLocaleString('en-IN')}`;

export const calculateEstimate = ({ medium, width, height, detailLevel, subjects }) => {
  const pricing = MEDIUM_PRICING[medium] || MEDIUM_PRICING['Pencil / Charcoal'];
  const sqft = Number(width || 0) * Number(height || 0);
  const multiplier = DETAIL_MULTIPLIERS[detailLevel] || 1;
  const subjectMultiplier = 1 + Math.max(0, Number(subjects || 1) - 1) * 0.15;

  const averageMin = sqft * pricing.average.min * multiplier * subjectMultiplier;
  const averageMax = sqft * pricing.average.max * multiplier * subjectMultiplier;
  const advancedMin = sqft * pricing.advanced.min * multiplier * subjectMultiplier;
  const advancedMax = sqft * pricing.advanced.max * multiplier * subjectMultiplier;

  return {
    sqft: Number(sqft.toFixed(2)),
    averageMin,
    averageMax,
    advancedMin,
    advancedMax,
    minPrice: averageMin,
    maxPrice: advancedMax,
    averagePrice: (averageMin + advancedMax) / 2,
  };
};
