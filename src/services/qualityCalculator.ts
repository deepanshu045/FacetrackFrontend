import type { FaceAnalysis } from "../types/analysis";

export function calculateQuality(analysis: FaceAnalysis): number {
  let score = 0;

  if (analysis.faceDetected) score += 20;
  if (analysis.onlyOneFace) score += 20;

  if (analysis.lookingStraight) score += 20;
  if (analysis.goodLighting) score += 15;
  if (analysis.properDistance) score += 15;
  if (analysis.sharpImage) score += 10;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}