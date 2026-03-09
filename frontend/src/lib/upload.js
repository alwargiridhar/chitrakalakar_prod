import { supabase } from './supabase';

export const uploadFile = async ({ file, folder }) => {
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
      }),
    }
  );

  // Clone response before reading to avoid "body stream already read" error
  const resClone = res.clone();
  
  if (!res.ok) {
    try {
      const errorData = await resClone.json();
      throw new Error(errorData?.detail || 'Upload URL request failed');
    } catch (e) {
      throw new Error('Upload URL request failed');
    }
  }
  
  const dataJson = await res.json();

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
