import { TraceMeta } from '../types';

// Server base URL - point to your deployed server (Vercel / Firebase functions)
const SERVER_BASE = 'https://your-echo-trace-server.example.com';

export async function registerDevice(): Promise<{ deviceId: string }> {
  // local client side generation of deviceId can be done; server registration helpful to store FCM token.
  // For demo: generate UUID v4 (simple)
  const deviceId = 'dev-' + Math.random().toString(36).slice(2, 10);
  // Optionally POST to /register with deviceId and FCM token
  try {
    await fetch(`${SERVER_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
  } catch (e) {
    // ignore network errors for offline register
  }
  return { deviceId };
}

export async function connectToPartner(
  myDeviceId: string,
  partnerCode: string,
  role: 'sender' | 'receiver'
) {
  const res = await fetch(`${SERVER_BASE}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ myDeviceId, partnerCode, role }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`connect failed: ${body}`);
  }
  return res.json();
}

export async function getPartnerStatus(deviceId: string) {
  const res = await fetch(`${SERVER_BASE}/partner-status/${encodeURIComponent(deviceId)}`);
  if (!res.ok) throw new Error('status failed');
  return res.json();
}
