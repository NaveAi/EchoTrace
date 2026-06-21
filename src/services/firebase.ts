// Client-side Firebase setup (Expo / React Native).
// Replace config with your Firebase project's config or use google-services.json as appropriate.
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import Constants from 'expo-constants';

let firebaseApp: any = null;

export function initFirebaseClient(config?: any) {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(
      config || {
        apiKey: '<FIREBASE_API_KEY>',
        authDomain: '<PROJECT>.firebaseapp.com',
        projectId: '<PROJECT>',
        storageBucket: '<PROJECT>.appspot.com',
        messagingSenderId: '<SENDER_ID>',
        appId: '<APP_ID>',
      }
    );
  }
  // return app if needed
  return firebaseApp;
}

// Get FCM token for device (web-like; on RN, you may use expo-notifications or react-native-firebase)
export async function getFcmToken() {
  try {
    // On bare RN, integrate react-native-firebase messaging. For expo, use expo-notifications.
    // This function is a placeholder showing intent.
    const messaging = getMessaging();
    const vapidKey = Constants.manifest?.extra?.vapidKey || undefined;
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (e) {
    console.warn('getFcmToken failed', e);
    return null;
  }
}

export function onForegroundMessage(handler: (payload: any) => void) {
  try {
    const messaging = getMessaging();
    onMessage(messaging, handler);
  } catch (e) {
    // ignore on unsupported platforms
  }
}
