import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import { BUCKETS } from '../lib/supabase';
import AdaptiveArtworkImage from '../components/AdaptiveArtworkImage';

const PLAN_CONFIG = {
  Kalakanksh: { days: 1, fee: 500, maxArtworks: 10 },
  Kalahruday: { days: 3, fee: 1000, maxArtworks: 20 },
  KalaDeeksh: { days: 10, fee: 2500, maxArtworks: 25 },
};

function AdminExhibitionsPage() {
  const { profiles } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [extendDaysById, setExtendDaysById] = useState({});
  const [form, setForm] = useState({
    artist_id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    exhibition_type: 'Kalakanksh',
    exhibition_paintings: [
      { image_url: '', title: '', description: '', price: '', creation_date: '', on_sale: true },
    ],
    artwork_ids_input: '',
  });

  const selectedPlan = PLAN_CONFIG[form.exhibition_type] || PLAN_CONFIG.Kalakanksh;

  useEffect(() => {
    if (!profiles || profiles.role !== 'admin') {
      navigate('/login');
      return;
    }

    const loadArtists = async () => {
      try {
        const [artistsRes, exhibitionsRes] = await Promise.all([
          adminAPI.getApprovedArtists(),
          adminAPI.getAllExhibitions(),
        ]);
        const response = artistsRes;
        setArtists(response.artists || []);
        setExhibitions(exhibitionsRes.exhibitions || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadArtists();
  }, [profiles, navigate]);

  useEffect(() => {
    if (!form.start_date) return;
    const plan = PLAN_CONFIG[form.exhibition_type] || PLAN_CONFIG.Kalakanksh;
    const start = new Date(form.start_date);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setDate(end.getDate() + plan.days);
    setForm((prev) => ({ ...prev, end_date: end.toISOString().slice(0, 10) }));
  }, [form.exhibition_type, form.start_date]);

  const updatePainting = (index, patch) => {
    setForm((prev) => {
      const next = [...prev.exhibition_paintings];
      next[index] = { ...next[index], ...patch };
      return { ...prev, exhibition_paintings: next };
    });
  };

  const addPainting = () => {
    setForm((prev) => ({
      ...prev,
      exhibition_paintings: [
        ...prev.exhibition_paintings,
        { image_url: '', title: '', description: '', price: '', creation_date: '', on_sale: true },
      ],
    }));
  };

  const removePainting = (index) => {
    setForm((prev) => ({
      ...prev,
      exhibition_paintings: prev.exhibition_paintings.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const artwork_ids = (form.artwork_ids_input || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      const exhibition_paintings = (form.exhibition_paintings || [])
        .filter((p) => p.image_url)
        .map((p) => ({
          ...p,
          price: p.price ? Number(p.price) : null,
        }));

      await adminAPI.createExhibition({
        artist_id: form.artist_id || null,
        name: form.name,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        exhibition_type: form.exhibition_type,
        artwork_ids,
        exhibition_images: exhibition_paintings.map((p) => p.image_url),
        exhibition_paintings,
      });
      alert('Exhibition created successfully without payment requirement.');
      setForm({
        artist_id: '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        exhibition_type: 'Kalakanksh',
        exhibition_paintings: [{ image_url: '', title: '', description: '', price: '', creation_date: '', on_sale: true }],
        artwork_ids_input: '',
      });
      const refreshed = await adminAPI.getAllExhibitions();
      setExhibitions(refreshed.exhibitions || []);
    } catch (error) {
      alert(error.message || 'Failed to create exhibition');
    }
  };

  const handleExtend = async (exhibitionId) => {
    const days = Number(extendDaysById[exhibitionId] || 1);
    if (!days || days < 1) {
      alert('Enter valid extension days.');
      return;
    }
    try {
      await adminAPI.extendExhibition(exhibitionId, days);
      const refreshed = await adminAPI.getAllExhibitions();
      setExhibitions(refreshed.exhibitions || []);
    } catch (error) {
      alert(error.message || 'Failed to extend exhibition');
    }
  };

  const handleDelete = async (exhibitionId) => {
    const yes = window.confirm('Delete this exhibition?');
    if (!yes) return;
    try {
      await adminAPI.deleteExhibition(exhibitionId);
      const refreshed = await adminAPI.getAllExhibitions();
      setExhibitions(refreshed.exhibitions || []);
    } catch (error) {
      alert(error.message || 'Failed to delete exhibition');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-exhibitions-page">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="admin-exhibitions-title">Admin Exhibition Creator</h1>
        <p className="text-sm text-gray-600 mb-6" data-testid="admin-exhibitions-subtitle">Admin can directly create exhibitions without payment.</p>

        <form className="space-y-4" onSubmit={handleSubmit} data-testid="admin-exhibitions-form">
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.artist_id} onChange={(e) => setForm((p) => ({ ...p, artist_id: e.target.value }))} data-testid="admin-exhibition-artist-select">
            <option value="">Assign artist (optional)</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>{artist.full_name}</option>
            ))}
          </select>

          <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Exhibition name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} data-testid="admin-exhibition-name-input" required />
          <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} data-testid="admin-exhibition-description-input" />

          <div className="grid sm:grid-cols-3 gap-3">
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} data-testid="admin-exhibition-start-date" required />
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" value={form.end_date} readOnly data-testid="admin-exhibition-end-date" />
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100" value={`₹${selectedPlan.fee} • ${selectedPlan.days} days • Max ${selectedPlan.maxArtworks}`} readOnly data-testid="admin-exhibition-plan-summary" />
          </div>

          <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.exhibition_type} onChange={(e) => setForm((p) => ({ ...p, exhibition_type: e.target.value }))} data-testid="admin-exhibition-type-select">
            <option value="Kalakanksh">Kalakanksh</option>
            <option value="Kalahruday">Kalahruday</option>
            <option value="KalaDeeksh">KalaDeeksh</option>
          </select>

          <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Artwork IDs (comma separated, optional)" value={form.artwork_ids_input} onChange={(e) => setForm((p) => ({ ...p, artwork_ids_input: e.target.value }))} data-testid="admin-exhibition-artwork-ids-input" />

          <div data-testid="admin-exhibition-images-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Paintings for Exhibition (with optional metadata)</p>
              <button type="button" onClick={addPainting} className="px-3 py-1.5 text-xs rounded bg-orange-500 text-white hover:bg-orange-600" data-testid="admin-add-painting-button">
                + Add Painting
              </button>
            </div>

            {form.exhibition_paintings.map((painting, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50" data-testid={`admin-painting-row-${index}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-800">Painting #{index + 1}</p>
                  {form.exhibition_paintings.length > 1 && (
                    <button type="button" onClick={() => removePainting(index)} className="text-xs text-red-600" data-testid={`admin-remove-painting-${index}`}>
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <ImageUpload
                      bucket={BUCKETS.EXHIBITIONS}
                      folder="exhibitions"
                      label="Upload Painting Image"
                      maxFileSizeMB={5}
                      outputMaxSizeMB={1}
                      enforceAspectRatios={["4:3", "3:4"]}
                      onUpload={(url) => updatePainting(index, { image_url: url })}
                    />

                    {painting.image_url && (
                      <div className="mt-2 h-28 rounded overflow-hidden border border-gray-200 relative" data-testid={`admin-painting-preview-${index}`}>
                        <AdaptiveArtworkImage src={painting.image_url} alt={painting.title || `Painting ${index + 1}`} />
                        <span className={`absolute top-1 right-1 text-[10px] px-2 py-1 rounded ${painting.on_sale ? 'bg-green-600 text-white' : 'bg-gray-700 text-white'}`} data-testid={`admin-painting-ribbon-${index}`}>
                          {painting.on_sale ? 'On Sale' : 'Not for Sale'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Painting title" value={painting.title} onChange={(e) => updatePainting(index, { title: e.target.value })} data-testid={`admin-painting-title-${index}`} />
                    <textarea className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" rows={2} placeholder="Short description (optional)" value={painting.description} onChange={(e) => updatePainting(index, { description: e.target.value })} data-testid={`admin-painting-description-${index}`} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="0" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Price" value={painting.price} onChange={(e) => updatePainting(index, { price: e.target.value })} data-testid={`admin-painting-price-${index}`} />
                      <input type="date" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value={painting.creation_date} onChange={(e) => updatePainting(index, { creation_date: e.target.value })} data-testid={`admin-painting-date-${index}`} />
                    </div>
                    <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value={painting.on_sale ? 'yes' : 'no'} onChange={(e) => updatePainting(index, { on_sale: e.target.value === 'yes' })} data-testid={`admin-painting-sale-status-${index}`}>
                      <option value="yes">On Sale</option>
                      <option value="no">Not for Sale</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black" data-testid="admin-exhibition-submit-button">
            Create Exhibition
          </button>
        </form>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6" data-testid="admin-exhibitions-manage-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Exhibitions</h2>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {exhibitions.length === 0 ? (
              <p className="text-sm text-gray-500">No exhibitions yet.</p>
            ) : (
              exhibitions.map((exhibition) => (
                <div key={exhibition.id} className="border border-gray-200 rounded-lg p-3" data-testid={`admin-manage-exhibition-${exhibition.id}`}>
                  <p className="font-semibold text-gray-900">{exhibition.name}</p>
                  <p className="text-xs text-gray-600">{exhibition.artist_name || 'Unknown Artist'} • {exhibition.status}</p>
                  <p className="text-xs text-gray-500">Days Paid: {exhibition.days_paid || 0}</p>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      min="1"
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                      placeholder="days"
                      value={extendDaysById[exhibition.id] || ''}
                      onChange={(e) => setExtendDaysById((prev) => ({ ...prev, [exhibition.id]: e.target.value }))}
                      data-testid={`admin-extend-days-input-${exhibition.id}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleExtend(exhibition.id)}
                      className="px-2.5 py-1 text-xs rounded bg-amber-500 text-white hover:bg-amber-600"
                      data-testid={`admin-extend-exhibition-${exhibition.id}`}
                    >
                      Extend
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(exhibition.id)}
                      className="px-2.5 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                      data-testid={`admin-delete-exhibition-${exhibition.id}`}
                    >
                      Delete
                    </button>
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

export default AdminExhibitionsPage;
