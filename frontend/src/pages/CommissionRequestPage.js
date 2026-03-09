import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { commissionAPI, publicAPI } from '../services/api';
import { BUCKETS } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import PriceCalculator from '../components/commission/PriceCalculator';
import { calculateEstimate, formatINR } from '../components/commission/pricing';

function CommissionRequestPage() {
  const { isAuthenticated, isLoading, profiles } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const preferredArtistId = query.get('artistId');

  const [formData, setFormData] = useState({
    art_category: 'Acrylic Colors',
    medium: 'Pencil / Charcoal',
    width_ft: 2,
    height_ft: 2,
    budget: 30000,
    skill_level: 'Average',
    detail_level: 'Basic',
    subjects: 1,
    offer_price: '',
    negotiation_allowed: false,
    selected_artist_ids: preferredArtistId ? [preferredArtistId] : [],
    reference_image_urls: [],
    special_instructions: '',
    deadline: '',
    framing_option: 'No Frame',
  });
  const [submitting, setSubmitting] = useState(false);
  const [matchingArtists, setMatchingArtists] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const isProfileComplete = Boolean(profiles?.full_name && profiles?.email && profiles?.phone);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (profiles?.role === 'artist') {
      navigate('/dashboard/commissions', { replace: true });
      return;
    }

    if (profiles?.role === 'admin') {
      navigate('/admin/commissions', { replace: true });
    }
  }, [isLoading, isAuthenticated, profiles, navigate]);

  const estimate = useMemo(() => calculateEstimate({
    category: formData.art_category,
    width: formData.width_ft,
    height: formData.height_ft,
    detailLevel: formData.detail_level,
    subjects: formData.subjects,
  }), [formData]);

  useEffect(() => {
    let mounted = true;
    const fetchMatches = async () => {
      if (!formData.art_category || !formData.budget) {
        setMatchingArtists([]);
        return;
      }

      try {
        setLoadingMatches(true);
        const response = await publicAPI.getCommissionMatchingArtists(formData.art_category, Number(formData.budget));
        if (!mounted) return;
        setMatchingArtists(response.artists || []);

        if (preferredArtistId) {
          setFormData((prev) => {
            if (prev.selected_artist_ids.includes(preferredArtistId)) return prev;
            return { ...prev, selected_artist_ids: [preferredArtistId, ...prev.selected_artist_ids].slice(0, 3) };
          });
        }
      } catch (error) {
        if (mounted) setMatchingArtists([]);
      } finally {
        if (mounted) setLoadingMatches(false);
      }
    };

    fetchMatches();
    return () => {
      mounted = false;
    };
  }, [formData.art_category, formData.budget, preferredArtistId]);

  const toggleArtistSelection = (artistId) => {
    setFormData((prev) => {
      const exists = prev.selected_artist_ids.includes(artistId);
      if (exists) {
        return {
          ...prev,
          selected_artist_ids: prev.selected_artist_ids.filter((id) => id !== artistId),
        };
      }

      if (prev.selected_artist_ids.length >= 3) {
        alert('You can send request to maximum 3 artists.');
        return prev;
      }

      return {
        ...prev,
        selected_artist_ids: [...prev.selected_artist_ids, artistId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isProfileComplete) {
      alert('Please complete your registration profile (full name, email, phone) before commissioning.');
      navigate('/account');
      return;
    }

    try {
      setSubmitting(true);
      await commissionAPI.create({
        ...formData,
        width_ft: Number(formData.width_ft),
        height_ft: Number(formData.height_ft),
        budget: Number(formData.budget),
        offer_price: formData.offer_price ? Number(formData.offer_price) : null,
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

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="commission-request-loading">Loading...</div>;
  }

  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16" data-testid="commission-profile-incomplete-page">
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <h1 className="text-3xl text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="commission-profile-incomplete-title">
            Complete Registration to Start Commission
          </h1>
          <p className="text-sm text-gray-600 mt-3" data-testid="commission-profile-incomplete-message">
            For authenticity, commissioning is enabled only after profile completion with full name, email, and phone. If you signed up using Gmail, available details are auto-captured and you can complete the remaining fields in Account.
          </p>
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-[#1A1A1A] text-white hover:bg-black"
            data-testid="commission-profile-incomplete-account-button"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="commission-request-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="commission-request-title">
            Commission an Artwork
          </h1>
          <p className="text-base text-gray-600 mt-3 max-w-3xl" data-testid="commission-request-subtitle">
            Select category, medium, size, budget and deadline. Discover matching artists and send requests to up to 3 artists.
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
                <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="commission-budget-label">Budget (₹)</label>
                <input
                  type="number"
                  min="1000"
                  value={formData.budget}
                  onChange={(e) => setFormData((p) => ({ ...p, budget: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                  data-testid="commission-budget-input"
                />
              </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="commission-negotiation-label">Negotiation Allowed</label>
              <select
                value={formData.negotiation_allowed ? 'yes' : 'no'}
                onChange={(e) => setFormData((p) => ({ ...p, negotiation_allowed: e.target.value === 'yes' }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2"
                data-testid="commission-negotiation-select"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {formData.negotiation_allowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="commission-offer-price-label">Offer Price (optional)</label>
                <input
                  type="number"
                  min="1000"
                  value={formData.offer_price}
                  onChange={(e) => setFormData((p) => ({ ...p, offer_price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                  data-testid="commission-offer-price-input"
                />
              </div>
            )}

            <div data-testid="commission-reference-upload-section">
              <p className="text-sm font-medium text-gray-700 mb-2" data-testid="commission-reference-upload-label">Reference Images</p>
              <ImageUpload
                bucket={BUCKETS.COMMISSION_REFERENCES}
                folder="commission-references"
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

            <div className="border border-gray-200 rounded-xl p-4" data-testid="commission-matching-artists-section">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800" data-testid="commission-matching-artists-title">Matching Artists</h3>
                <p className="text-xs text-gray-500" data-testid="commission-selected-artists-count">Selected: {formData.selected_artist_ids.length}/3</p>
              </div>

              {loadingMatches ? (
                <p className="text-sm text-gray-500" data-testid="commission-matching-artists-loading">Finding artists...</p>
              ) : matchingArtists.length === 0 ? (
                <p className="text-sm text-gray-500" data-testid="commission-matching-artists-empty">No artist matched this budget/category yet.</p>
              ) : (
                <div className="space-y-3" data-testid="commission-matching-artists-list">
                  {matchingArtists.map((artist) => {
                    const selected = formData.selected_artist_ids.includes(artist.id);
                    return (
                      <div key={artist.id} className={`border rounded-xl p-3 ${selected ? 'border-[#D4AF37] bg-[#FCFAF2]' : 'border-gray-200'}`} data-testid={`commission-matching-artist-card-${artist.id}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900" data-testid={`commission-matching-artist-name-${artist.id}`}>{artist.name}</p>
                            <p className="text-xs text-gray-500" data-testid={`commission-matching-artist-meta-${artist.id}`}>
                              Rating: {artist.rating || 0} • Delivery: {artist.delivery_days || 14} days • Negotiation: {artist.negotiation_allowed ? 'Yes' : 'No'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1" data-testid={`commission-matching-artist-range-${artist.id}`}>
                              {formatINR(artist.commission_price_range?.min || 0)} - {formatINR(artist.commission_price_range?.max || 0)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleArtistSelection(artist.id)}
                            className={`px-3 py-1 rounded-lg text-xs ${selected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                            data-testid={`commission-matching-artist-select-button-${artist.id}`}
                          >
                            {selected ? 'Selected' : 'Send Request'}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {(artist.artworks || []).slice(0, 3).map((artwork) => (
                            <div key={artwork.id} className="rounded-md overflow-hidden bg-gray-100" data-testid={`commission-matching-artist-artwork-${artist.id}-${artwork.id}`}>
                              <img src={artwork.image} alt={artwork.title || 'Artwork'} className="w-full h-16 object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
