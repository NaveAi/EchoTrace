import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';

interface PartnerStatusResponse {
  success: boolean;
  connected?: boolean;
  lastImage?: {
    imageId: string;
    sentAt: string;
    caption: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PartnerStatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { deviceId } = req.query as { deviceId: string };

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceId',
      });
    }

    const deviceSnap = await db.collection('devices').doc(deviceId).get();
    const deviceData = deviceSnap.data();

    if (!deviceData) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    const partnerId = deviceData.partnerId;
    if (!partnerId) {
      return res.status(200).json({
        success: true,
        connected: false,
      });
    }

    const partnerSnap = await db.collection('devices').doc(partnerId).get();
    const connected = partnerSnap.exists;

    const lastImageSnap = await db
      .collection('images')
      .where('receiverId', '==', deviceId)
      .orderBy('sentAt', 'desc')
      .limit(1)
      .get();

    let lastImage = undefined;
    if (!lastImageSnap.empty) {
      const imageData = lastImageSnap.docs[0].data();
      lastImage = {
        imageId: imageData.imageId,
        sentAt: imageData.sentAt,
        caption: imageData.caption,
      };
    }

    return res.status(200).json({
      success: true,
      connected,
      lastImage,
    });
  } catch (error) {
    console.error('Partner status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
