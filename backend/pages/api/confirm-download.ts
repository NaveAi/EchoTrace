import type { NextApiRequest, NextApiResponse } from 'next';
import { db, storage } from '@/lib/firebase';

interface ConfirmDownloadRequest {
  imageId: string;
  deviceId: string;
}

interface ConfirmDownloadResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfirmDownloadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { imageId, deviceId } = req.body as ConfirmDownloadRequest;

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

    try {
      await file.delete();
    } catch (error) {
      console.error('File deletion error:', error);
    }

    await db.collection('images').doc(imageId).delete();

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Confirm download error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
