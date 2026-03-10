import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { artistAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import AdaptiveArtworkImage from '../components/AdaptiveArtworkImage';
import { BUCKETS } from '../lib/supabase';

function ArtistExhibitionsPage() {
  const { isAuthenticated, profiles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    exhibition_type: 'Kalakanksh',
    voluntary_platform_fee: 0,
    artwork_ids: [],
    exhibition_images: [],
    payment_reference: '',
  });

  const artworksMap = useMemo(() => {
    const map = new Map();
    artworks.forEach((art) => map.set(art.id, art));
    return map;
  }, [artworks]);

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

  const toggleArtwork = (id) => {
    setForm((prev) => {
      const exists = prev.artwork_ids.includes(id);
      return {
        ...prev,
        artwork_ids: exists ? prev.artwork_ids.filter((item) => item !== id) : [...prev.artwork_ids, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.artwork_ids.length === 0) {
      alert('Please select at least one artwork for exhibition request.');
      return;
    }

    try {
      await artistAPI.createExhibition({
        ...form,
        voluntary_platform_fee: Number(form.voluntary_platform_fee || 0),
      });
      alert('Exhibition request submitted. Admin will validate terms/payment and approve.');
      setForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        exhibition_type: 'Kalakanksh',
        voluntary_platform_fee: 0,
        artwork_ids: [],
        exhibition_images: [],
        payment_reference: '',
      });
      fetchData();
    } catch (error) {
      alert(error.message || 'Failed to submit exhibition request');
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
            Submit exhibition request. Admin validates payment terms manually where required.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit} data-testid="artist-exhibition-form">
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Exhibition name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} data-testid="artist-exhibition-name-input" required />
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} data-testid="artist-exhibition-description-input" />

            <div className="grid sm:grid-cols-2 gap-3">
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} data-testid="artist-exhibition-start-date" required />
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} data-testid="artist-exhibition-end-date" required />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.exhibition_type} onChange={(e) => setForm((p) => ({ ...p, exhibition_type: e.target.value }))} data-testid="artist-exhibition-type-select">
                <option value="Kalakanksh">Kalakanksh</option>
                <option value="Kalahruday">Kalahruday</option>
                <option value="KalaDeeksh">KalaDeeksh</option>
              </select>
              <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Voluntary platform fee" value={form.voluntary_platform_fee} onChange={(e) => setForm((p) => ({ ...p, voluntary_platform_fee: e.target.value }))} data-testid="artist-exhibition-voluntary-fee-input" />
            </div>

            <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Payment reference (optional)" value={form.payment_reference} onChange={(e) => setForm((p) => ({ ...p, payment_reference: e.target.value }))} data-testid="artist-exhibition-payment-reference-input" />

            <div data-testid="artist-exhibition-images-upload-section">
              <p className="text-sm font-medium text-gray-700 mb-2">Exhibition Images (Auto-crop 4:3 / 3:4, below 1MB)</p>
              <ImageUpload
                bucket={BUCKETS.EXHIBITIONS}
                folder="exhibitions"
                label="Upload Exhibition Image"
                maxFileSizeMB={5}
                outputMaxSizeMB={1}
                enforceAspectRatios={["4:3", "3:4"]}
                onUpload={(url) => setForm((p) => ({ ...p, exhibition_images: [...p.exhibition_images, url] }))}
              />
              {form.exhibition_images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {form.exhibition_images.map((url, index) => (
                    <img key={url} src={url} alt="Exhibition asset" className="w-full h-20 object-cover rounded border border-gray-200" data-testid={`artist-exhibition-image-${index}`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Select Artworks for Virtual Rooms</p>
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

            <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600" data-testid="artist-exhibition-submit-button">
              Submit Exhibition Request
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
