import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { artistAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import AdaptiveArtworkImage from '../components/AdaptiveArtworkImage';
import { BUCKETS } from '../lib/supabase';
import { loadRazorpayScript } from '../lib/razorpay';

const EXHIBITION_PLAN = {
  Kalakanksh: { days: 1, fee: 500, max_artworks: 10 },
  Kalahruday: { days: 3, fee: 1000, max_artworks: 20 },
  KalaDeeksh: { days: 10, fee: 2500, max_artworks: 25 },
};

const GPAY_UPI_ID = 'chitrakalakar@upi';

function ArtistExhibitionsPage() {
  const { isAuthenticated, profiles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    exhibition_type: 'Kalakanksh',
    base_fee: EXHIBITION_PLAN.Kalakanksh.fee,
    artwork_ids: [],
    exhibition_images: [],
    primary_exhibition_image: '',
    payment_method: 'manual',
    payment_reference: '',
    payment_screenshot_url: '',
    razorpay_order_id: '',
    razorpay_payment_id: '',
    razorpay_signature: '',
  });

  const artworksMap = useMemo(() => {
    const map = new Map();
    artworks.forEach((art) => map.set(art.id, art));
    return map;
  }, [artworks]);

  const selectedPlan = EXHIBITION_PLAN[form.exhibition_type] || EXHIBITION_PLAN.Kalakanksh;

  const fetchData = async () => {
    try {
      const [artworksRes, exhibitionsRes] = await Promise.all([
        artistAPI.getArtworks(),
        artistAPI.getExhibitions(),
      ]);
      setArtworks(artworksRes.artworks || []);
      setExhibitions(exhibitionsRes.exhibitions || []);
    } catch (error) {
      alert(error.message || 'Failed to load exhibition data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (profiles?.role !== 'artist') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [isAuthenticated, profiles, navigate]);

  useEffect(() => {
    const plan = EXHIBITION_PLAN[form.exhibition_type] || EXHIBITION_PLAN.Kalakanksh;
    let nextEndDate = form.end_date;
    if (form.start_date) {
      const start = new Date(form.start_date);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(end.getDate() + plan.days);
        nextEndDate = end.toISOString().slice(0, 10);
      }
    }

    setForm((prev) => {
      const normalizedArtworkIds = prev.artwork_ids.slice(0, plan.max_artworks);
      return {
        ...prev,
        base_fee: plan.fee,
        end_date: nextEndDate,
        artwork_ids: normalizedArtworkIds,
      };
    });
  }, [form.exhibition_type, form.start_date]);

  const toggleArtwork = (id) => {
    setForm((prev) => {
      const exists = prev.artwork_ids.includes(id);
      if (exists) {
        return {
          ...prev,
          artwork_ids: prev.artwork_ids.filter((item) => item !== id),
        };
      }
      if (prev.artwork_ids.length >= selectedPlan.max_artworks) {
        alert(`Maximum ${selectedPlan.max_artworks} artworks allowed for ${form.exhibition_type}`);
        return prev;
      }
      return {
        ...prev,
        artwork_ids: [...prev.artwork_ids, id],
      };
    });
  };

  const handleRazorpayPay = async () => {
    try {
      const order = await artistAPI.createExhibitionPaymentOrder(form.exhibition_type);
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded || !window.Razorpay || !order.razorpay_key) {
        alert('Razorpay is currently unavailable. Please use Manual payment with screenshot.');
        return;
      }

      const razorpay = new window.Razorpay({
        key: order.razorpay_key,
        amount: Number(order.amount) * 100,
        currency: 'INR',
        name: 'ChitraKalakar',
        description: `${form.exhibition_type} Exhibition Fee`,
        order_id: order.razorpay_order_id,
        handler: (response) => {
          setForm((prev) => ({
            ...prev,
            payment_method: 'razorpay',
            payment_reference: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }));
          alert('Razorpay payment captured. Submit request to send for admin approval.');
        },
      });
      razorpay.open();
    } catch (error) {
      alert(error.message || 'Unable to start Razorpay payment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.artwork_ids.length === 0) {
      alert('Please select at least one artwork for exhibition request.');
      return;
    }

    if (form.exhibition_images.length > 3) {
      alert('Maximum 3 exhibition images allowed.');
      return;
    }

    if (form.payment_method === 'manual' && !form.payment_screenshot_url) {
      alert('Please upload manual payment screenshot.');
      return;
    }

    try {
      setSubmitting(true);
      await artistAPI.createExhibition({
        ...form,
        voluntary_platform_fee: 0,
      });
      alert('Exhibition request submitted for admin approval.');
      setForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        exhibition_type: 'Kalakanksh',
        base_fee: EXHIBITION_PLAN.Kalakanksh.fee,
        artwork_ids: [],
        exhibition_images: [],
        primary_exhibition_image: '',
        payment_method: 'manual',
        payment_reference: '',
        payment_screenshot_url: '',
        razorpay_order_id: '',
        razorpay_payment_id: '',
        razorpay_signature: '',
      });
      fetchData();
    } catch (error) {
      alert(error.message || 'Failed to submit exhibition request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" data-testid="artist-exhibitions-loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8" data-testid="artist-exhibitions-page">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="artist-exhibitions-title">Request Exhibition</h1>
          <p className="text-sm text-gray-600 mb-6" data-testid="artist-exhibitions-subtitle">
            End date and fee are auto-populated from selected exhibition type. Manual payment screenshot is required unless Razorpay payment succeeds.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit} data-testid="artist-exhibition-form">
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Exhibition name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} data-testid="artist-exhibition-name-input" required />
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} data-testid="artist-exhibition-description-input" />

            <div className="grid sm:grid-cols-3 gap-3">
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.exhibition_type} onChange={(e) => setForm((p) => ({ ...p, exhibition_type: e.target.value }))} data-testid="artist-exhibition-type-select">
                <option value="Kalakanksh">Kalakanksh</option>
                <option value="Kalahruday">Kalahruday</option>
                <option value="KalaDeeksh">KalaDeeksh</option>
              </select>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} data-testid="artist-exhibition-start-date" required />
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" value={form.end_date} readOnly data-testid="artist-exhibition-end-date" />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" value={`₹${selectedPlan.fee}`} readOnly data-testid="artist-exhibition-fee-display" />
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" value={`${selectedPlan.days} days`} readOnly data-testid="artist-exhibition-days-display" />
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" value={`Max ${selectedPlan.max_artworks} artworks`} readOnly data-testid="artist-exhibition-max-artworks-display" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} data-testid="artist-exhibition-payment-method-select">
                <option value="manual">Manual (GPay/UPI + screenshot)</option>
                <option value="razorpay">Razorpay</option>
              </select>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Payment reference" value={form.payment_reference} onChange={(e) => setForm((p) => ({ ...p, payment_reference: e.target.value }))} data-testid="artist-exhibition-payment-reference-input" />
            </div>

            {form.payment_method === 'manual' ? (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50" data-testid="artist-manual-payment-box">
                <p className="text-sm text-gray-700 mb-2">Pay manually to GPay/UPI and upload screenshot for admin validation.</p>
                <p className="text-sm font-semibold text-gray-900" data-testid="artist-manual-payment-upi-id">UPI ID: {GPAY_UPI_ID}</p>
                <div className="mt-2" data-testid="artist-payment-screenshot-upload-section">
                  <ImageUpload
                    bucket={BUCKETS.EXHIBITION_PAYMENT_PROOFS}
                    folder="exhibition-payment-proofs"
                    label="Upload Payment Screenshot"
                    maxFileSizeMB={5}
                    outputMaxSizeMB={1}
                    enforceAspectRatios={["4:3", "3:4"]}
                    onUpload={(url) => setForm((p) => ({ ...p, payment_screenshot_url: url }))}
                  />
                </div>
              </div>
            ) : (
              <button type="button" onClick={handleRazorpayPay} className="w-full py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700" data-testid="artist-exhibition-razorpay-pay-button">
                Pay via Razorpay
              </button>
            )}

            <div data-testid="artist-exhibition-images-upload-section">
              <p className="text-sm font-medium text-gray-700 mb-2">Upload up to 3 artwork images (4:3 or 3:4, under 1MB)</p>
              {form.exhibition_images.length < 3 && (
                <ImageUpload
                  bucket={BUCKETS.EXHIBITIONS}
                  folder="exhibitions"
                  label="Upload Exhibition Image"
                  maxFileSizeMB={5}
                  outputMaxSizeMB={1}
                  enforceAspectRatios={["4:3", "3:4"]}
                  onUpload={(url) => setForm((p) => ({ ...p, exhibition_images: [...p.exhibition_images, url], primary_exhibition_image: p.primary_exhibition_image || url }))}
                />
              )}

              {form.exhibition_images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {form.exhibition_images.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, primary_exhibition_image: url }))}
                      className={`relative border rounded overflow-hidden ${form.primary_exhibition_image === url ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}`}
                      data-testid={`artist-exhibition-image-select-${index}`}
                    >
                      <img src={url} alt="Exhibition asset" className="w-full h-20 object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/60 text-white py-0.5">
                        {form.primary_exhibition_image === url ? 'Primary' : 'Set as Primary'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Select Artworks for Exhibition View</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1" data-testid="artist-exhibition-artwork-list">
                {artworks.map((artwork) => (
                  <button
                    key={artwork.id}
                    type="button"
                    onClick={() => toggleArtwork(artwork.id)}
                    className={`text-left border rounded-lg p-2 ${form.artwork_ids.includes(artwork.id) ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}
                    data-testid={`artist-exhibition-artwork-option-${artwork.id}`}
                  >
                    <div className="w-full h-24 rounded overflow-hidden bg-gray-100 mb-2">
                      <AdaptiveArtworkImage src={artwork.images?.[0] || artwork.image} alt={artwork.title} settings={(artwork.image_display_settings || [])[0] || null} />
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{artwork.title}</p>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60" data-testid="artist-exhibition-submit-button">
              {submitting ? 'Submitting...' : 'Submit Exhibition Request'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6" data-testid="artist-exhibitions-list-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Exhibition Requests</h2>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {exhibitions.length === 0 ? (
              <p className="text-sm text-gray-500" data-testid="artist-exhibitions-empty">No exhibition requests yet.</p>
            ) : (
              exhibitions.map((exhibition) => (
                <div key={exhibition.id} className="border border-gray-200 rounded-lg p-3" data-testid={`artist-exhibition-row-${exhibition.id}`}>
                  <p className="font-semibold text-gray-900">{exhibition.name}</p>
                  <p className="text-xs text-gray-600">Status: {exhibition.status} {exhibition.is_approved ? '• Approved' : '• Pending'}</p>
                  <p className="text-xs text-gray-600">Payment: {exhibition.payment_status || 'manual review'}</p>
                  <p className="text-xs text-gray-500">Artworks: {(exhibition.artwork_ids || []).length}</p>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {(exhibition.artwork_ids || []).slice(0, 3).map((id) => {
                      const artwork = artworksMap.get(id);
                      return (
                        <div key={id} className="w-full h-16 bg-gray-100 rounded overflow-hidden">
                          <AdaptiveArtworkImage src={artwork?.images?.[0] || artwork?.image} alt={artwork?.title || 'Artwork'} settings={(artwork?.image_display_settings || [])[0] || null} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtistExhibitionsPage;
