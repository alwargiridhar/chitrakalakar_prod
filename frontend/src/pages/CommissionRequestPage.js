import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { commissionAPI } from '../services/api';
import { BUCKETS } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import PriceCalculator from '../components/commission/PriceCalculator';
import { calculateEstimate } from '../components/commission/pricing';

function CommissionRequestPage() {
  const { isAuthenticated, profiles } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const preferredArtistId = query.get('artistId');

  const [formData, setFormData] = useState({
    art_category: 'Acrylic Colors',
    medium: 'Pencil / Charcoal',
    width_ft: 2,
    height_ft: 2,
    skill_level: 'Average',
    detail_level: 'Basic',
    subjects: 1,
    reference_image_urls: [],
    special_instructions: '',
    deadline: '',
    framing_option: 'No Frame',
    contact_phone: profiles?.phone || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const estimate = useMemo(() => calculateEstimate({
    medium: formData.medium,
    width: formData.width_ft,
    height: formData.height_ft,
    detailLevel: formData.detail_level,
    subjects: formData.subjects,
  }), [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      await commissionAPI.create({
        ...formData,
        preferred_artist_id: preferredArtistId || null,
        width_ft: Number(formData.width_ft),
        height_ft: Number(formData.height_ft),
        subjects: Number(formData.subjects),
      });
      alert('Commission request submitted successfully. You can now track progress in your dashboard.');
      navigate('/user-dashboard/commissions');
    } catch (error) {
      alert(error.message || 'Failed to submit commission request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="commission-request-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="commission-request-title">
            Commission an Artwork
          </h1>
          <p className="text-base text-gray-600 mt-3 max-w-3xl" data-testid="commission-request-subtitle">
            Select your artwork category, medium, dimensions, and detail level. Share references and instructions. Pricing updates instantly.
          </p>
          <p className="text-sm text-gray-500 mt-2" data-testid="commission-request-category-pricing-note">
            Pricing matrix is configured across all existing ChitraKalakar artwork categories.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <form className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 space-y-6" onSubmit={handleSubmit} data-testid="commission-request-form">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="commission-instructions-label">Special Instructions</label>
              <textarea
                rows={4}
                value={formData.special_instructions}
                onChange={(e) => setFormData((p) => ({ ...p, special_instructions: e.target.value }))}
                placeholder="Share your concept, color preferences, mood, and specific requirements"
                className="w-full border border-gray-300 rounded-xl px-3 py-2"
                data-testid="commission-instructions-input"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="commission-deadline-label">Delivery Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData((p) => ({ ...p, deadline: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                  data-testid="commission-deadline-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="commission-framing-label">Framing Option</label>
                <select
                  value={formData.framing_option}
                  onChange={(e) => setFormData((p) => ({ ...p, framing_option: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                  data-testid="commission-framing-select"
                >
                  <option>No Frame</option>
                  <option>Basic Frame</option>
                  <option>Premium Frame</option>
                  <option>Gallery Wrap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="commission-contact-phone-label">Contact Number</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData((p) => ({ ...p, contact_phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2"
                placeholder="Enter your active phone number"
                data-testid="commission-contact-phone-input"
              />
            </div>

            <div data-testid="commission-reference-upload-section">
              <p className="text-sm font-medium text-gray-700 mb-2" data-testid="commission-reference-upload-label">Reference Images</p>
              <ImageUpload
                bucket={BUCKETS.COMMISSION_REFS}
                folder="commission-refs"
                label="Upload Reference"
                onUpload={(url) => setFormData((p) => ({ ...p, reference_image_urls: [...p.reference_image_urls, url] }))}
              />

              {formData.reference_image_urls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3" data-testid="commission-reference-image-list">
                  {formData.reference_image_urls.map((url, index) => (
                    <div key={url} className="relative rounded-lg overflow-hidden border border-gray-200" data-testid={`commission-reference-image-${index}`}>
                      <img src={url} alt="Reference" className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({
                          ...p,
                          reference_image_urls: p.reference_image_urls.filter((_, i) => i !== index),
                        }))}
                        className="absolute top-1 right-1 text-xs bg-black/70 text-white px-2 py-0.5 rounded"
                        data-testid={`commission-reference-remove-button-${index}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#1A1A1A] text-white hover:bg-black transition-colors disabled:opacity-60"
              data-testid="commission-submit-button"
            >
              {submitting ? 'Submitting...' : 'Request Commission'}
            </button>
          </form>

          <div className="lg:col-span-2 lg:sticky lg:top-24 h-fit">
            <PriceCalculator formData={formData} setFormData={setFormData} estimate={estimate} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommissionRequestPage;
