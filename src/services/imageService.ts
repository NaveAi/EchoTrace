// Handles upload/download handshake with server.
// Uses the server's /get-upload-url, /confirm-upload, /download-image/{imageId}, /confirm-download
const SERVER_BASE = 'https://your-echo-trace-server.example.com';

export async function uploadImageFile(localUri: string): Promise<{ imageId?: string; uploadUrl?: string }> {
  // 1) ask server for signed upload URL
  const filename = localUri.split('/').pop() || `trace-${Date.now()}.jpg`;
  const mimeType = 'image/jpeg';
  const res = await fetch(`${SERVER_BASE}/get-upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, mimeType }),
  });
  if (!res.ok) throw new Error('get-upload-url failed');
  const { uploadUrl, imageId } = await res.json();

  // 2) PUT the file content to uploadUrl
  // In RN fetch PUT with blob: use XMLHttpRequest or fetch with file uri using expo-file-system.
  // Here we assume fetch can upload binary via blob; adapt if using expo-file-system.
  const fileResp = await fetch(localUri);
  const blob = await fileResp.blob();

  const putResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  });
  if (!putResp.ok) throw new Error('upload failed');

  return { imageId, uploadUrl };
}

export async function confirmUpload(imageId: string) {
  const res = await fetch(`${SERVER_BASE}/confirm-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId }),
  });
  if (!res.ok) throw new Error('confirm-upload failed');
  return res.json();
}

export async function fetchDownloadUrl(imageId: string) {
  const res = await fetch(`${SERVER_BASE}/download-image/${encodeURIComponent(imageId)}`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error('download-image failed');
  return res.json(); // { downloadUrl }
}

export async function confirmDownload(imageId: string) {
  const res = await fetch(`${SERVER_BASE}/confirm-download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId }),
  });
  if (!res.ok) throw new Error('confirm-download failed');
  return res.json();
}
