import type { NextApiRequest, NextApiResponse } from 'next';
import { db, messaging } from '@/lib/firebase';

interface ConfirmUploadRequest {
  deviceId: string;
  imageId: string;
  caption?: string;
  memorySentence?: string;
}

interface ConfirmUploadResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfirmUploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { deviceId, imageId, caption, memorySentence } = req.body as ConfirmUploadRequest;

    if (!deviceId || !imageId) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceId or imageId',
      });
    }

    const deviceSnap = await db.collection('devices').doc(deviceId).get();
    const deviceData = deviceSnap.data();

    if (!deviceData || !deviceData.partnerId) {
      return res.status(404).json({
        success: false,
        error: 'Device not connected',
      });
    }

    const imageMetadata = {
      imageId,
      senderId: deviceId,
      receiverId: deviceData.partnerId,
      caption: caption || '',
      memorySentence: memorySentence || '',
      sentAt: new Date().toISOString(),
      viewedAt: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    await db.collection('images').doc(imageId).set(imageMetadata);

    const receiverSnap = await db.collection('devices').doc(deviceData.partnerId).get();
    const receiverData = receiverSnap.data();

    if (receiverData && receiverData.fcmToken) {
      try {
        await messaging.send({
          token: receiverData.fcmToken,
          data: {
            imageId,
            type: 'new_image',
          },
          notification: {
            title: 'EchoTrace',
            body: 'New trace arrived',
          },
        });
      } catch (error) {
        console.error('FCM error:', error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Image upload confirmed',
    });
  } catch (error) {
    console.error('Confirm upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
