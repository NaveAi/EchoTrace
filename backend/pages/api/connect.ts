import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

interface ConnectRequest {
  myDeviceId: string;
  partnerCode: string;
  role: 'sender' | 'receiver';
}

interface ConnectResponse {
  success: boolean;
  connectionId?: string;
  partnerId?: string;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConnectResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { myDeviceId, partnerCode, role } = req.body as ConnectRequest;

    if (!myDeviceId || !partnerCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing myDeviceId or partnerCode',
      });
    }

    const myDeviceSnap = await db.collection('devices').doc(myDeviceId).get();
    const partnerDeviceSnap = await db.collection('devices').doc(partnerCode).get();

    if (!myDeviceSnap.exists || !partnerDeviceSnap.exists) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    const connectionId = uuidv4();
    const connection = {
      connectionId,
      device1: myDeviceId,
      device2: partnerCode,
      role1: role,
      role2: role === 'sender' ? 'receiver' : 'sender',
      createdAt: new Date().toISOString(),
      active: true,
    };

    await db.collection('connections').doc(connectionId).set(connection);

    await db.collection('devices').doc(myDeviceId).update({
      connectionId,
      partnerId: partnerCode,
    });

    await db.collection('devices').doc(partnerCode).update({
      connectionId,
      partnerId: myDeviceId,
    });

    return res.status(200).json({
      success: true,
      connectionId,
      partnerId: partnerCode,
      message: 'Connection created successfully',
    });
  } catch (error) {
    console.error('Connection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
