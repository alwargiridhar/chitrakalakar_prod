import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import { BUCKETS } from '../lib/supabase';

function AdminExhibitionsPage() {
  const { profiles } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [form, setForm] = useState({
    artist_id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    exhibition_type: 'Kalakanksh',
    exhibition_images: [],
    artwork_ids_input: '',
  });

  useEffect(() => {
    if (!profiles || profiles.role !== 'admin') {
      navigate('/login');
      return;
    }

    const loadArtists = async () => {
      try {
        const response = await adminAPI.getApprovedArtists();
        setArtists(response.artists || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadArtists();
  }, [profiles, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const artwork_ids = (form.artwork_ids_input || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      await adminAPI.createExhibition({
        artist_id: form.artist_id || null,
        name: form.name,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        exhibition_type: form.exhibition_type,
        artwork_ids,
        exhibition_images: form.exhibition_images,
      });
      alert('Exhibition created successfully without payment requirement.');
      setForm({
        artist_id: '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        exhibition_type: 'Kalakanksh',
        exhibition_images: [],
        artwork_ids_input: '',
      });
    } catch (error) {
      alert(error.message || 'Failed to create exhibition');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-exhibitions-page">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-6">
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

          <div className="grid sm:grid-cols-2 gap-3">
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} data-testid="admin-exhibition-start-date" required />
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} data-testid="admin-exhibition-end-date" required />
          </div>

          <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.exhibition_type} onChange={(e) => setForm((p) => ({ ...p, exhibition_type: e.target.value }))} data-testid="admin-exhibition-type-select">
            <option value="Kalakanksh">Kalakanksh</option>
            <option value="Kalahruday">Kalahruday</option>
            <option value="KalaDeeksh">KalaDeeksh</option>
          </select>

          <input className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Artwork IDs (comma separated, optional)" value={form.artwork_ids_input} onChange={(e) => setForm((p) => ({ ...p, artwork_ids_input: e.target.value }))} data-testid="admin-exhibition-artwork-ids-input" />

          <div data-testid="admin-exhibition-images-section">
            <p className="text-sm font-medium text-gray-700 mb-2">Exhibition Images (4:3 or 3:4, auto-cropped, under 1MB)</p>
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
              <div className="grid grid-cols-3 gap-2 mt-2">
                {form.exhibition_images.map((url, index) => (
                  <img key={url} src={url} alt="Exhibition" className="w-full h-20 object-cover rounded" data-testid={`admin-exhibition-image-${index}`} />
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black" data-testid="admin-exhibition-submit-button">
            Create Exhibition
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminExhibitionsPage;
