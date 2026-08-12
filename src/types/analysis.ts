export interface FaceAnalysis {
  faceDetected: boolean;
  onlyOneFace: boolean;
  lookingStraight: boolean;
  goodLighting: boolean;
  properDistance: boolean;
  sharpImage: boolean;
  quality: number;

  // Optional debug fields
  areaRatio?: number; // face area relative to frame (0..1)
  bbox?: { x: number; y: number; width: number; height: number };
}