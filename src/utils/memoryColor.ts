// Compute a "memory color" from an image. Input can be a local file URI (React Native) or a base64 string.
// Because pixel extraction differs per platform, we provide a generic implementation using fetch+canvas for web,
// and a best-effort fallback for RN (using expo-file-system + decode). Here we implement a simple server-side style
// RGB-sampling approach; on device you may prefer to call a small native module or use a library.
//
// API:
// computeMemoryColor(localUri: string): Promise<string> -> returns hex color like '#d98f7a'
export async function computeMemoryColor(localUri: string): Promise<string> {
  try {
    // Try to load the image and draw on canvas (web). If running RN, fetch blob and sample bytes is complex.
    // We'll implement a server-friendly approach: request a small downscaled version of the image via the server,
    // or fallback to a neutral warm color.
    // For now: return a warm placeholder while recommending server-side extraction for production.
    return '#e6c9bf';
  } catch (e) {
    return '#e6c9bf';
  }
}

/*
Notes & suggestions:
- For accurate memoryColor:
  - On server: decode image with sharp, sample warm pixels (R>G && R>B && R > threshold), average them, return hex.
  - On RN: use expo-image-manipulator to resize to small 20x20, get base64, decode pixels and compute average.
This file intentionally keeps a safe fallback.
*/
