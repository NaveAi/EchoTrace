// Firebase Functions (TypeScript) implementing the server endpoints described in the spec.
// Endpoints:
// POST /register         { deviceId, fcmToken? }
// POST /connect          { myDeviceId, partnerCode, role }
// POST /get-upload-url   { filename, mimeType } -> { uploadUrl, imageId }
// POST /confirm-upload   { imageId }
// GET  /download-image/:imageId -> { downloadUrl }
// POST /confirm-download { imageId }
// GET  /partner-status/:deviceId -> { connected: boolean }
// Notes:
// - Requires Firebase Admin SDK setup and environment variables for storage bucket.
// - This is a minimal approach; production should add auth, validation, rate limits.
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket(); // uses default bucket from firebase config

const app = express();
app.use(express.json());

// POST /register
app.post('/register', async (req, res) => {
  const { deviceId, fcmToken } = req.body || {};
  if (!deviceId) return res.status(400).send('deviceId required');
  await db.collection('devices').doc(deviceId).set({ deviceId, fcmToken, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  res.json({ ok: true });
});

// POST /connect
app.post('/connect', async (req, res) => {
  const { myDeviceId, partnerCode, role } = req.body || {};
  if (!myDeviceId || !partnerCode) return res.status(400).send('missing fields');
  // create a connection document that maps the two device IDs
  const connectionId = uuidv4();
  const doc = {
    id: connectionId,
    a: myDeviceId,
    b: partnerCode,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    roles: { [myDeviceId]: role || 'receiver' },
  };
  await db.collection('connections').doc(connectionId).set(doc);
  // optionally notify partner via FCM if token known
  const partnerDoc = await db.collection('devices').doc(partnerCode).get();
  const partnerData = partnerDoc.exists ? partnerDoc.data() as any : null;
  if (partnerData?.fcmToken) {
    try {
      await admin.messaging().send({
        token: partnerData.fcmToken,
        data: { type: 'partner-connected', deviceId: myDeviceId },
        notification: { title: 'EchoTrace זיווג', body: 'שותף חדש התחבר' },
      });
    } catch (e) {
      console.warn('fcm send failed', e);
    }
  }
  res.json({ ok: true, connectionId });
});

// POST /get-upload-url
app.post('/get-upload-url', async (req, res) => {
  const { filename, mimeType } = req.body || {};
  if (!filename) return res.status(400).send('missing filename');
  const imageId = uuidv4();
  const filePath = `traces/${imageId}/${filename}`;
  const file = bucket.file(filePath);
  // Create signed URL for upload (PUT) — requires service account with proper perms
  try {
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 min
      contentType: mimeType || 'application/octet-stream',
    });
    // create a placeholder image doc
    await db.collection('images').doc(imageId).set({
      imageId,
      filePath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'uploading',
    });
    res.json({ uploadUrl, imageId });
  } catch (e) {
    console.error(e);
    res.status(500).send('could not create upload url');
  }
});

// POST /confirm-upload
app.post('/confirm-upload', async (req, res) => {
  const { imageId } = req.body || {};
  if (!imageId) return res.status(400).send('missing imageId');
  const imgRef = db.collection('images').doc(imageId);
  const doc = await imgRef.get();
  if (!doc.exists) return res.status(404).send('image not found');
  await imgRef.update({ status: 'ready', readyAt: admin.firestore.FieldValue.serverTimestamp() });
  // Notify partner(s) - simplistic: find connections that include uploader (not tracked here).
  // In a full implementation, the client should include uploaderDeviceId and server will look up pair.
  res.json({ ok: true });
});

// GET /download-image/:imageId
app.get('/download-image/:imageId', async (req, res) => {
  const imageId = req.params.imageId;
  const doc = await db.collection('images').doc(imageId).get();
  if (!doc.exists) return res.status(404).send('not found');
  const data = doc.data() as any;
  const file = bucket.file(data.filePath);
  try {
    const [downloadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });
    res.json({ downloadUrl });
  } catch (e) {
    console.error(e);
    res.status(500).send('signed url failed');
  }
});

// POST /confirm-download
app.post('/confirm-download', async (req, res) => {
  const { imageId } = req.body || {};
  if (!imageId) return res.status(400).send('missing imageId');
  // Delete from storage & mark as deleted (spec: images removed from server after confirm)
  const doc = await db.collection('images').doc(imageId).get();
  if (!doc.exists) return res.status(404).send('not found');
  const data = doc.data() as any;
  const file = bucket.file(data.filePath);
  try {
    await file.delete();
  } catch (e) {
    console.warn('file delete', e);
  }
  await db.collection('images').doc(imageId).update({ status: 'downloaded', downloadedAt: admin.firestore.FieldValue.serverTimestamp() });
  res.json({ ok: true });
});

// GET /partner-status/:deviceId
app.get('/partner-status/:deviceId', async (req, res) => {
  const deviceId = req.params.deviceId;
  // Check if there exists a connection document that references this device and whose partner device exists.
  const connections = await db.collection('connections').where('a', '==', deviceId).get();
  if (!connections.empty) {
    // For simplification: return connected true
    return res.json({ connected: true });
  }
  // search the other side
  const connections2 = await db.collection('connections').where('b', '==', deviceId).get();
  if (!connections2.empty) {
    return res.json({ connected: true });
  }
  res.json({ connected: false });
});

export const api = functions.https.onRequest(app);
