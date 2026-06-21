// Lightweight FCM handling; in a real RN app use react-native-firebase or expo-notifications
import { getFcmToken, onForegroundMessage } from './firebase';

export async function registerFcmToken() {
  try {
    const token = await getFcmToken();
    // send token to your server/register endpoint
    await fetch('https://your-echo-trace-server.example.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken: token }),
    });
    return token;
  } catch (e) {
    console.warn('registerFcmToken', e);
    return null;
  }
}

export function onMessage(handler: (payload: any) => void) {
  onForegroundMessage(handler);
}
