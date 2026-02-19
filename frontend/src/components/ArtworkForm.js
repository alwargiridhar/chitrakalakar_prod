import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import { BUCKETS } from '../lib/supabase';

// Options for dropdowns
const MEDIUM_OPTIONS = [
  'Oil', 'Acrylic', 'Watercolor', 'Mixed Media', 'Digital', 'Charcoal', 
  'Pastel', 'Ink', 'Gouache', 'Tempera', 'Encaustic', 'Fresco', 'Other'
];

const SURFACE_OPTIONS = [
  'Canvas', 'Paper', 'Wood', 'Metal', 'Glass', 'Fabric', 'Board', 'Other'
];

const ORIENTATION_OPTIONS = ['Portrait', 'Landscape', 'Square'];

const STYLE_OPTIONS = [
  'Abstract', 'Realism', 'Contemporary', 'Traditional', 'Impressionism',
  'Expressionism', 'Surrealism', 'Minimalism', 'Pop Art', 'Folk Art',
  'Cubism', 'Baroque', 'Renaissance', 'Modern', 'Other'
];

const ARTWORK_TYPE_OPTIONS = ['Original', 'Limited Edition', 'Open Edition'];

const CONDITION_OPTIONS = ['Brand New', 'Excellent', 'Minor Imperfections', 'Restored'];

const FRAMING_OPTIONS = ['Unframed', 'Framed', 'Gallery Wrapped', 'Ready to Hang', 'Requires Framing'];

const PRICE_TYPE_OPTIONS = ['Fixed', 'Negotiable', 'Auction'];

const OWNERSHIP_OPTIONS = [
  'Physical Ownership Only',
  'Commercial Rights Included',
  'Reproduction Rights Retained by Artist',
  'Copyright Transfer Included'
];

const SIGNED_OPTIONS = ['Not Signed', 'Front', 'Back', 'Both'];

// Collapsible section component
function FormSection({ title, icon, children, isOpen, onToggle, required = false }) {
  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
          {required && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>}
        </div>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="p-4 bg-white space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Checkbox field component
function CheckboxField({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
      />
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </label>
  );
}

// Select field component
function SelectField({ label, value, onChange, options, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// Input field component
function InputField({ label, value, onChange, type = 'text', placeholder, required, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// Textarea field component
function TextareaField({ label, value, onChange, placeholder, rows = 3, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function ArtworkForm({ categories, onSubmit, onCancel }) {
  const [openSections, setOpenSections] = useState({
    basic: true,
    authenticity: false,
    condition: false,
    framing: false,
    pricing: true,
    shipping: false,
    rights: false,
    media: true,
    story: false,
    investment: false,
  });

  const [formData, setFormData] = useState({
    // Basic Info (Required)
    title: '',
    year_of_creation: new Date().getFullYear(),
    medium: '',
    surface: '',
    dimensions: { height: '', width: '', depth: '', unit: 'cm' },
    orientation: '',
    style: '',
    category: '',
    description: '',
    
    // Authenticity & Certification
    artwork_type: 'Original',
    edition_number: '',
    total_edition_size: '',
    certificate_of_authenticity: false,
    signed_by_artist: 'Not Signed',
    date_signed: '',
    hand_embellished: false,
    artist_stamp: false,
    
    // Condition Details
    condition: 'Brand New',
    condition_notes: '',
    restoration_history: '',
    
    // Framing & Presentation
    framing_status: 'Unframed',
    frame_material: '',
    frame_included_in_price: true,
    
    // Pricing & Availability
    price: '',
    price_type: 'Fixed',
    currency: 'INR',
    quantity_available: 1,
    international_shipping: false,
    
    // Shipping Details
    ships_rolled: false,
    ships_stretched: false,
    ships_framed: false,
    insured_shipping: false,
    dispatch_time: '',
    
    // Ownership & Usage Rights
    ownership_type: 'Physical Ownership Only',
    
    // Story & Context
    inspiration: '',
    technique_explanation: '',
    artist_statement: '',
    exhibition_history: '',
    awards_recognition: '',
    
    // Investment / Value Signals
    previously_exhibited: false,
    featured_in_publication: false,
    sold_similar_works: false,
    part_of_series: false,
    series_name: '',
    collector_interest: false,
    
    // Images
    images: [],
  });

  const [submitting, setSubmitting] = useState(false);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDimension = (field, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [field]: value }
    }));
  };

  const handleImageUpload = (url) => {
    if (formData.images.length < 8) {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.category || !formData.price) {
      alert('Please fill in all required fields: Title, Category, and Price');
      return;
    }
    
    if (formData.images.length < 1) {
      alert('Please upload at least 1 image');
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare dimensions object if filled
      const dimensions = formData.dimensions.height && formData.dimensions.width 
        ? formData.dimensions 
        : null;
      
      await onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        year_of_creation: parseInt(formData.year_of_creation) || null,
        total_edition_size: formData.total_edition_size ? parseInt(formData.total_edition_size) : null,
        quantity_available: parseInt(formData.quantity_available) || 1,
        dimensions,
        image: formData.images[0],
      });
    } catch (error) {
      alert(error.message || 'Failed to add artwork');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate completion percentage
  const mandatoryFields = ['title', 'category', 'price'];
  const completedMandatory = mandatoryFields.filter(f => formData[f]).length;
  const completion = Math.round((completedMandatory / mandatoryFields.length) * 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Progress indicator */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-orange-800">Listing Completion</span>
          <span className="text-sm font-bold text-orange-600">{completion}%</span>
        </div>
        <div className="w-full bg-orange-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all" 
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="text-xs text-orange-700 mt-2">
          Fill mandatory fields (Title, Category, Price, Min 1 Image) to publish
        </p>
      </div>

      {/* 1. Basic Artwork Information (Required) */}
      <FormSection 
        title="Basic Artwork Information" 
        icon="1️⃣" 
        isOpen={openSections.basic}
        onToggle={() => toggleSection('basic')}
        required
      >
        <InputField
          label="Artwork Title"
          value={formData.title}
          onChange={(v) => updateField('title', v)}
          required
          placeholder="Enter artwork title"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Year of Creation"
            type="number"
            value={formData.year_of_creation}
            onChange={(v) => updateField('year_of_creation', v)}
            placeholder="2024"
          />
          <SelectField
            label="Medium"
            value={formData.medium}
            onChange={(v) => updateField('medium', v)}
            options={MEDIUM_OPTIONS}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Surface"
            value={formData.surface}
            onChange={(v) => updateField('surface', v)}
            options={SURFACE_OPTIONS}
          />
          <SelectField
            label="Orientation"
            value={formData.orientation}
            onChange={(v) => updateField('orientation', v)}
            options={ORIENTATION_OPTIONS}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="Height"
              value={formData.dimensions.height}
              onChange={(e) => updateDimension('height', e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Width"
              value={formData.dimensions.width}
              onChange={(e) => updateDimension('width', e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Depth"
              value={formData.dimensions.depth}
              onChange={(e) => updateDimension('depth', e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={formData.dimensions.unit}
              onChange={(e) => updateDimension('unit', e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="cm">cm</option>
              <option value="inches">inches</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Style"
            value={formData.style}
            onChange={(v) => updateField('style', v)}
            options={STYLE_OPTIONS}
          />
          <SelectField
            label="Subject Category"
            value={formData.category}
            onChange={(v) => updateField('category', v)}
            options={categories}
            required
          />
        </div>
        
        <TextareaField
          label="Description"
          value={formData.description}
          onChange={(v) => updateField('description', v)}
          placeholder="Describe your artwork..."
          rows={3}
        />
      </FormSection>

      {/* 2. Authenticity & Certification */}
      <FormSection 
        title="Authenticity & Certification" 
        icon="2️⃣" 
        isOpen={openSections.authenticity}
        onToggle={() => toggleSection('authenticity')}
      >
        <SelectField
          label="Artwork Type"
          value={formData.artwork_type}
          onChange={(v) => updateField('artwork_type', v)}
          options={ARTWORK_TYPE_OPTIONS}
        />
        
        {(formData.artwork_type === 'Limited Edition') && (
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Edition Number"
              value={formData.edition_number}
              onChange={(v) => updateField('edition_number', v)}
              placeholder="e.g., 3 of 25"
            />
            <InputField
              label="Total Edition Size"
              type="number"
              value={formData.total_edition_size}
              onChange={(v) => updateField('total_edition_size', v)}
              placeholder="25"
            />
          </div>
        )}
        
        <CheckboxField
          label="Certificate of Authenticity Included"
          checked={formData.certificate_of_authenticity}
          onChange={(v) => updateField('certificate_of_authenticity', v)}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Signed by Artist"
            value={formData.signed_by_artist}
            onChange={(v) => updateField('signed_by_artist', v)}
            options={SIGNED_OPTIONS}
          />
          {formData.signed_by_artist !== 'Not Signed' && (
            <InputField
              label="Date Signed"
              type="date"
              value={formData.date_signed}
              onChange={(v) => updateField('date_signed', v)}
            />
          )}
        </div>
        
        <div className="flex gap-4">
          <CheckboxField
            label="Hand-embellished"
            checked={formData.hand_embellished}
            onChange={(v) => updateField('hand_embellished', v)}
          />
          <CheckboxField
            label="Artist Stamp Available"
            checked={formData.artist_stamp}
            onChange={(v) => updateField('artist_stamp', v)}
          />
        </div>
      </FormSection>

      {/* 3. Condition Details */}
      <FormSection 
        title="Condition Details" 
        icon="3️⃣" 
        isOpen={openSections.condition}
        onToggle={() => toggleSection('condition')}
      >
        <SelectField
          label="Condition"
          value={formData.condition}
          onChange={(v) => updateField('condition', v)}
          options={CONDITION_OPTIONS}
        />
        
        {formData.condition !== 'Brand New' && (
          <>
            <TextareaField
              label="Condition Notes"
              value={formData.condition_notes}
              onChange={(v) => updateField('condition_notes', v)}
              placeholder="Describe any imperfections or details about the condition..."
              rows={2}
            />
            {formData.condition === 'Restored' && (
              <TextareaField
                label="Restoration History"
                value={formData.restoration_history}
                onChange={(v) => updateField('restoration_history', v)}
                placeholder="Describe the restoration work done..."
                rows={2}
              />
            )}
          </>
        )}
      </FormSection>

      {/* 4. Framing & Presentation */}
      <FormSection 
        title="Framing & Presentation" 
        icon="4️⃣" 
        isOpen={openSections.framing}
        onToggle={() => toggleSection('framing')}
      >
        <SelectField
          label="Framing Status"
          value={formData.framing_status}
          onChange={(v) => updateField('framing_status', v)}
          options={FRAMING_OPTIONS}
        />
        
        {formData.framing_status === 'Framed' && (
          <>
            <InputField
              label="Frame Material"
              value={formData.frame_material}
              onChange={(v) => updateField('frame_material', v)}
              placeholder="e.g., Wood, Metal, etc."
            />
            <CheckboxField
              label="Frame Included in Price"
              checked={formData.frame_included_in_price}
              onChange={(v) => updateField('frame_included_in_price', v)}
            />
          </>
        )}
      </FormSection>

      {/* 5. Pricing & Availability */}
      <FormSection 
        title="Pricing & Availability" 
        icon="5️⃣" 
        isOpen={openSections.pricing}
        onToggle={() => toggleSection('pricing')}
        required
      >
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Price"
            type="number"
            value={formData.price}
            onChange={(v) => updateField('price', v)}
            placeholder="Enter price"
            required
          />
          <SelectField
            label="Price Type"
            value={formData.price_type}
            onChange={(v) => updateField('price_type', v)}
            options={PRICE_TYPE_OPTIONS}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Quantity Available"
            type="number"
            value={formData.quantity_available}
            onChange={(v) => updateField('quantity_available', v)}
            placeholder="1"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
        </div>
        
        <CheckboxField
          label="Available for International Shipping"
          checked={formData.international_shipping}
          onChange={(v) => updateField('international_shipping', v)}
        />
      </FormSection>

      {/* 6. Shipping Details */}
      <FormSection 
        title="Shipping Details" 
        icon="6️⃣" 
        isOpen={openSections.shipping}
        onToggle={() => toggleSection('shipping')}
      >
        <div className="grid grid-cols-3 gap-4">
          <CheckboxField
            label="Ships Rolled"
            checked={formData.ships_rolled}
            onChange={(v) => updateField('ships_rolled', v)}
            hint="For canvas"
          />
          <CheckboxField
            label="Ships Stretched"
            checked={formData.ships_stretched}
            onChange={(v) => updateField('ships_stretched', v)}
          />
          <CheckboxField
            label="Ships Framed"
            checked={formData.ships_framed}
            onChange={(v) => updateField('ships_framed', v)}
          />
        </div>
        
        <CheckboxField
          label="Insured Shipping Included"
          checked={formData.insured_shipping}
          onChange={(v) => updateField('insured_shipping', v)}
        />
        
        <InputField
          label="Estimated Dispatch Time"
          value={formData.dispatch_time}
          onChange={(v) => updateField('dispatch_time', v)}
          placeholder="e.g., 3-5 business days"
        />
      </FormSection>

      {/* 7. Ownership & Usage Rights */}
      <FormSection 
        title="Ownership & Usage Rights" 
        icon="7️⃣" 
        isOpen={openSections.rights}
        onToggle={() => toggleSection('rights')}
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This section clarifies what rights the buyer receives with the artwork purchase.
          </p>
        </div>
        
        <SelectField
          label="Ownership Type"
          value={formData.ownership_type}
          onChange={(v) => updateField('ownership_type', v)}
          options={OWNERSHIP_OPTIONS}
        />
      </FormSection>

      {/* 8. High-Quality Media Upload */}
      <FormSection 
        title="High-Quality Media Upload" 
        icon="8️⃣" 
        isOpen={openSections.media}
        onToggle={() => toggleSection('media')}
        required
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Required:</strong> Upload at least 1 image. Recommended: Front View, Close-up Detail, Signature Image
          </p>
          <ul className="text-xs text-blue-700 mt-2 list-disc list-inside">
            <li>Front View Image</li>
            <li>Close-up Detail Image</li>
            <li>Side Edge Image</li>
            <li>Backside Image</li>
            <li>Artist Signature Image</li>
            <li>In-room Mockup Image</li>
          </ul>
        </div>
        
        {/* Uploaded images preview */}
        {formData.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.images.map((url, index) => (
              <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
                <span className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-1">
                  {index === 0 ? 'Main' : index + 1}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {formData.images.length < 8 && (
          <ImageUpload
            bucket={BUCKETS.ARTWORKS}
            folder="artworks"
            onUpload={handleImageUpload}
            label={`Upload Image (${formData.images.length}/8)`}
          />
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          {formData.images.length === 0 
            ? '⚠️ Upload at least 1 image to publish' 
            : `${formData.images.length} image(s) uploaded. You can add up to ${8 - formData.images.length} more.`}
        </p>
      </FormSection>

      {/* 9. Story & Context */}
      <FormSection 
        title="Story & Context" 
        icon="9️⃣" 
        isOpen={openSections.story}
        onToggle={() => toggleSection('story')}
      >
        <p className="text-sm text-gray-600 mb-3">
          Adding story and context improves your artwork's visibility and helps collectors connect with your work.
        </p>
        
        <TextareaField
          label="Inspiration Behind the Piece"
          value={formData.inspiration}
          onChange={(v) => updateField('inspiration', v)}
          placeholder="What inspired you to create this artwork?"
          rows={3}
        />
        
        <TextareaField
          label="Technique Explanation"
          value={formData.technique_explanation}
          onChange={(v) => updateField('technique_explanation', v)}
          placeholder="Describe the techniques used in creating this artwork..."
          rows={3}
        />
        
        <TextareaField
          label="Artist Statement"
          value={formData.artist_statement}
          onChange={(v) => updateField('artist_statement', v)}
          placeholder="Your personal statement about this work..."
          rows={3}
        />
        
        <TextareaField
          label="Exhibition History"
          value={formData.exhibition_history}
          onChange={(v) => updateField('exhibition_history', v)}
          placeholder="List any exhibitions where this artwork has been displayed..."
          rows={2}
        />
        
        <TextareaField
          label="Awards / Recognition"
          value={formData.awards_recognition}
          onChange={(v) => updateField('awards_recognition', v)}
          placeholder="Any awards or recognition received for this artwork..."
          rows={2}
        />
      </FormSection>

      {/* 10. Investment / Value Signals */}
      <FormSection 
        title="Investment / Value Signals" 
        icon="🔟" 
        isOpen={openSections.investment}
        onToggle={() => toggleSection('investment')}
      >
        <p className="text-sm text-gray-600 mb-3">
          These optional fields help indicate the investment potential of your artwork.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <CheckboxField
            label="Previously Exhibited"
            checked={formData.previously_exhibited}
            onChange={(v) => updateField('previously_exhibited', v)}
          />
          <CheckboxField
            label="Featured in Publication"
            checked={formData.featured_in_publication}
            onChange={(v) => updateField('featured_in_publication', v)}
          />
          <CheckboxField
            label="Sold Similar Works"
            checked={formData.sold_similar_works}
            onChange={(v) => updateField('sold_similar_works', v)}
          />
          <CheckboxField
            label="Collector Interest"
            checked={formData.collector_interest}
            onChange={(v) => updateField('collector_interest', v)}
          />
        </div>
        
        <CheckboxField
          label="Part of Series"
          checked={formData.part_of_series}
          onChange={(v) => updateField('part_of_series', v)}
        />
        
        {formData.part_of_series && (
          <InputField
            label="Series Name"
            value={formData.series_name}
            onChange={(v) => updateField('series_name', v)}
            placeholder="Enter series name"
          />
        )}
      </FormSection>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white py-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || completion < 100}
          className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="submit-artwork-btn"
        >
          {submitting ? 'Adding Artwork...' : 'Add Artwork'}
        </button>
      </div>
    </form>
  );
}
