import type { NextApiRequest, NextApiResponse } from 'next';
import { storage, db } from '@/lib/firebase';

interface DownloadResponse {
  success: boolean;
  downloadUrl?: string;
  imageMetadata?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DownloadResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { imageId, deviceId } = req.query as { imageId: string; deviceId: string };

    if (!imageId || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageId or deviceId',
      });
    }

    const imageSnap = await db.collection('images').doc(imageId).get();
    const imageData = imageSnap.data();

    if (!imageData) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    if (imageData.receiverId !== deviceId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const bucket = storage.bucket();
    const senderId = imageData.senderId;
    const file = bucket.file(`images/${senderId}/${imageId}.jpg`);

    const [downloadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });

    if (!imageData.viewedAt) {
      await db.collection('images').doc(imageId).update({
        viewedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      downloadUrl,
      imageMetadata: {
        caption: imageData.caption,
        memorySentence: imageData.memorySentence,
        sentAt: imageData.sentAt,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
