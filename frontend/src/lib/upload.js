import { supabase } from './supabase';

export const uploadFile = async ({ file, folder, bucketKey, entityId = null }) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/api/upload-url`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
        folder,
        bucket_key: bucketKey,
        entity_id: entityId,
      }),
    }
  );

  const rawText = await res.text();
  let dataJson = null;
  try {
    dataJson = rawText ? JSON.parse(rawText) : null;
  } catch {
    dataJson = null;
  }

  if (!res.ok) {
    throw new Error(dataJson?.detail || dataJson?.message || 'Upload URL request failed');
  }

  if (!dataJson?.uploadUrl || !dataJson?.publicUrl) {
    throw new Error('Upload URL response is invalid');
  }

  const { uploadUrl, publicUrl } = dataJson;

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error('Failed to upload file to S3');
  }

  return publicUrl;
};
