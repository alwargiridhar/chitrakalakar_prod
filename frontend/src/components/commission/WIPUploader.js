import React, { useState } from 'react';
import ImageUpload from '../ImageUpload';
import { BUCKETS } from '../../lib/supabase';
import { COMMISSION_STATUSES } from './pricing';

export default function WIPUploader({ commission, onSubmit }) {
  const [form, setForm] = useState({
    status: commission.status,
    note: '',
    image_url: '',
  });

  return (
    <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50" data-testid={`wip-uploader-${commission.id}`}>
      <div className="grid md:grid-cols-2 gap-3">
        <select
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2"
          data-testid={`wip-status-select-${commission.id}`}
        >
          {COMMISSION_STATUSES.map((status) => (
            <option value={status} key={status}>{status}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Write a progress note"
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2"
          data-testid={`wip-note-input-${commission.id}`}
        />
      </div>

      <div className="mt-3" data-testid={`wip-image-upload-wrapper-${commission.id}`}>
        <ImageUpload
          bucket={BUCKETS.COMMISSION_WIPS}
          folder="commission-wips"
          label="Upload WIP Image"
          onUpload={(url) => setForm((p) => ({ ...p, image_url: url }))}
        />
      </div>

      <button
        type="button"
        onClick={() => onSubmit(form)}
        className="mt-3 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-black transition-colors"
        data-testid={`wip-submit-button-${commission.id}`}
      >
        Post Update
      </button>
    </div>
  );
}
