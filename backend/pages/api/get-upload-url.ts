import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

interface UploadUrlRequest {
  deviceId: string;
  mimeType: string;
}

interface UploadUrlResponse {
  success: boolean;
  uploadUrl?: string;
  imageId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadUrlResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { deviceId, mimeType } = req.body as UploadUrlRequest;

    if (!deviceId || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceId or mimeType',
      });
    }

    const imageId = uuidv4();
    const bucket = storage.bucket();
    const file = bucket.file(`images/${deviceId}/${imageId}.jpg`);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: mimeType,
    });

    return res.status(200).json({
      success: true,
      uploadUrl,
      imageId,
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
