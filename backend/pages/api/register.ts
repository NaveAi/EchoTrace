import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';

interface RegisterRequest {
  deviceId: string;
  fcmToken: string;
  platform: 'android' | 'ios';
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { deviceId, fcmToken, platform } = req.body as RegisterRequest;

    if (!deviceId || !fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceId or fcmToken',
      });
    }

    await db.collection('devices').doc(deviceId).set(
      {
        deviceId,
        fcmToken,
        platform,
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
