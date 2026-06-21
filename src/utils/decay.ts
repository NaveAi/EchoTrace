// Implements the decay timing and helpers per spec:
// 0–6 hours: sharp
// 6–12 hours: fading (gaussian blur 0->25, text opacity 100->0)
// 12–24 hours: memory (max blur, color memory shown, text hidden)
// 24+ hours: presence (color memory only, optional saved phrase)
export type TraceState = 'waiting' | 'sharp' | 'fading' | 'memory' | 'presence';

export function getStateFromTimestamps(viewedAtIso?: string, now = new Date()): TraceState {
  if (!viewedAtIso) return 'waiting';
  const viewedAt = new Date(viewedAtIso);
  const diffMs = now.getTime() - viewedAt.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 6) return 'sharp';
  if (hours < 12) return 'fading';
  if (hours < 24) return 'memory';
  return 'presence';
}

// Compute blur radius value 0..25 for use with BlurView or mapping for overlay opacity
export function computeBlurRadius(state: TraceState, viewedAtIso?: string, now = new Date()): number {
  if (!viewedAtIso) return 0;
  const viewedAt = new Date(viewedAtIso);
  const hours = (now.getTime() - viewedAt.getTime()) / (1000 * 60 * 60);
  if (hours < 6) return 0;
  if (hours < 12) {
    // linear map 0 @6h -> 25 @12h
    return ((hours - 6) / 6) * 25;
  }
  // memory/presence max blur
  return 25;
}

// Compute text opacity 0..1
export function computeTextOpacity(state: TraceState, viewedAtIso?: string, now = new Date()): number {
  if (!viewedAtIso) return 1;
  const viewedAt = new Date(viewedAtIso);
  const hours = (now.getTime() - viewedAt.getTime()) / (1000 * 60 * 60);
  if (hours < 6) return 1;
  if (hours < 12) {
    // 1 -> 0 over 6 hours
    return 1 - (hours - 6) / 6;
  }
  return 0;
}
