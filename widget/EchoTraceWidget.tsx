import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { computeBlurRadius, computeTextOpacity, TraceState } from '../src/utils/decay';
import { computeMemoryColor } from '../src/utils/memoryColor';
import {
  registerDevice,
  connectToPartner,
  getPartnerStatus,
} from '../src/services/pairing';
import { uploadImageFile, confirmUpload } from '../src/services/imageService';
import { useTraceStore } from '../src/store/traceStore';
import WidgetStates from './WidgetStates';

const CAMERA_CIRCLE_DIAMETER = 48;

export default function EchoTraceWidget() {
  const { traceMeta, setTraceMeta, deviceId, setDeviceId } = useTraceStore();
  const [loading, setLoading] = useState(false);
  const blurAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const [memoryColor, setMemoryColor] = useState<string>('#eae0d5');

  useEffect(() => {
    // Ensure deviceId registered (placeholder: generate/register)
    // In production: load from secure storage; here we call registerDevice if missing
    async function ensureRegistered() {
      if (!deviceId) {
        const dev = await registerDevice();
        setDeviceId(dev.deviceId);
      }
    }
    ensureRegistered();
  }, [deviceId]);

  useEffect(() => {
    if (!traceMeta?.viewedAt) return;
    const state = getTraceState(traceMeta.viewedAt, new Date());
    // animate blur and text opacity according to state
    const blur = computeBlurRadius(state, traceMeta.viewedAt);
    const textOp = computeTextOpacity(state, traceMeta.viewedAt);
    Animated.timing(blurAnim, { toValue: blur, duration: 400, useNativeDriver: false }).start();
    Animated.timing(textOpacity, { toValue: textOp, duration: 400, useNativeDriver: true }).start();
    if (state === 'memory' || state === 'presence') {
      // try compute memory color from local image (if present)
      if (traceMeta?.localPath) {
        computeMemoryColor(traceMeta.localPath).then((c) => setMemoryColor(c)).catch(()=>{});
      }
    }
  }, [traceMeta?.viewedAt]);

  const onOpenCamera = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setLoading(false);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: false,
      });
      if (!result.cancelled) {
        // upload automatically
        const uploadRes = await uploadImageFile(result.uri);
        if (uploadRes?.imageId) {
          await confirmUpload(uploadRes.imageId);
          // set local meta; partner will receive via FCM and download
          setTraceMeta({
            imageId: uploadRes.imageId,
            localPath: result.uri,
            sentAt: new Date().toISOString(),
            viewedAt: null,
            partnerId: null,
            role: 'sender',
            caption: '',
          });
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  // Render logic
  if (!deviceId) {
    return (
      <View style={styles.widget}>
        <Text>טוען…</Text>
      </View>
    );
  }

  if (!traceMeta || !traceMeta.imageId) {
    // show pairing / waiting view
    return (
      <View style={[styles.widget, { backgroundColor: '#f2efe9' }]}> 
        <WidgetStates.PairingView />
      </View>
    );
  }

  // If we have an image: attempt to show via local path or remote signed URL (not shown here)
  const imageSource: ImageSourcePropType = traceMeta.localPath
    ? { uri: traceMeta.localPath }
    : require('../assets/icon.png');

  return (
    <View style={[styles.widget, { backgroundColor: memoryColor }]}> 
      <Image source={imageSource} style={styles.image} resizeMode="cover" />
      {/* Blur overlay (simulated using view with backgroundColor and opacity or use expo-blur) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blurOverlay,
          {
            // Map blurAnim (0-25) to opacity of overlay to simulate blur + greyscale
            backgroundColor: 'rgba(255,255,255,0.0)',
            // we could use expo-blur; for simplicity use overlay opacity mapping
            opacity: blurAnim.interpolate({
              inputRange: [0, 25],
              outputRange: [0, 0.8],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
      <Animated.Text style={[styles.caption, { opacity: textOpacity }]}> 
        {traceMeta.caption || ''}
      </Animated.Text>

      <TouchableOpacity
        onPress={onOpenCamera}
        style={styles.cameraCircle}
        accessibilityLabel="Open Camera"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.cameraText}>📸</Text>}
      </TouchableOpacity>
    </View>
  );
}

// Small helper to match decay util signature
function getTraceState(viewedAtStr?: string, now = new Date()): TraceState {
  if (!viewedAtStr) return 'waiting';
  const viewedAt = new Date(viewedAtStr);
  const ageMs = now.getTime() - viewedAt.getTime();
  const hours = ageMs / (1000 * 60 * 60);
  if (hours < 6) return 'sharp';
  if (hours < 12) return 'fading';
  if (hours < 24) return 'memory';
  return 'presence';
}

const styles = StyleSheet.create({
  widget: {
    width: 300,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  caption: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    color: '#111',
    fontSize: 14,
    maxWidth: '80%',
  },
  cameraCircle: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: CAMERA_CIRCLE_DIAMETER,
    height: CAMERA_CIRCLE_DIAMETER,
    borderRadius: CAMERA_CIRCLE_DIAMETER / 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
  },
});
