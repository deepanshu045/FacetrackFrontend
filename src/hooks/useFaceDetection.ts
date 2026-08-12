import { useEffect, useState } from "react";
import { loadFaceDetector } from "../services/faceDetector";
import type { FaceAnalysis } from "../types/analysis";
import { calculateQuality } from "../services/qualityCalculator";

export default function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  const [analysis, setAnalysis] = useState<FaceAnalysis>({
    faceDetected: false,
    onlyOneFace: false,
    lookingStraight: false,
    goodLighting: false,
    properDistance: false,
    sharpImage: false,
    quality: 0,
  });

  useEffect(() => {
    let animationId: number;

    async function detectLoop() {
      let detector: any = null;
      try {
        detector = await loadFaceDetector();
      } catch (err) {
        // swallow load failure
      }

      if (!detector) {
        const detectNoop = () => {
          const video = videoRef.current;
          if (!video || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
            animationId = requestAnimationFrame(detectNoop);
            return;
          }
          animationId = requestAnimationFrame(detectNoop);
        };
        detectNoop();
        return;
      }

      const detect = () => {
        const video = videoRef.current;

        // Ensure video element exists and has valid dimensions before calling into
        // the detector. Mediapipe will crash if width/height are zero (ROI must
        // be > 0), which leads to WebGL framebuffer errors.
        if (!video || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
          animationId = requestAnimationFrame(detect);
          return;
        }

        // Throttle heavy analysis to every 200ms
        const now = performance.now();
        if (!(detect as any)._lastRun) (detect as any)._lastRun = 0;
        const interval = 200;
        if (now - (detect as any)._lastRun < interval) {
          // still update face count quickly but avoid expensive pixel ops
          try {
            const quick = detector.detectForVideo(video, now);
            const faceCount = quick?.detections?.length ?? 0;

            // Try to extract a lightweight bbox and area when available so the UI can show metrics
            let areaRatio: number | undefined = undefined;
            let bbox: { x: number; y: number; width: number; height: number } | undefined = undefined;

            // Cheap quick estimates for lookingStraight, goodLighting, sharpImage
            let quickLookingStraight: boolean | undefined = undefined;
            let quickGoodLighting: boolean | undefined = undefined;
            let quickSharpImage: boolean | undefined = undefined;

            try {
              const first = quick?.detections?.[0];
              if (first) {
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                const db = first.boundingBox ?? (first.locationData && first.locationData.relativeBoundingBox) ?? first.box ?? null;
                if (db) {
                  // absolute pixel bbox
                  if (typeof db.originX === 'number' && typeof db.originY === 'number' && typeof db.width === 'number' && typeof db.height === 'number') {
                    const sx = Math.max(0, Math.floor(db.originX));
                    const sy = Math.max(0, Math.floor(db.originY));
                    const sw = Math.max(1, Math.floor(db.width));
                    const sh = Math.max(1, Math.floor(db.height));
                    areaRatio = (sw * sh) / (vw * vh);
                    bbox = { x: sx, y: sy, width: sw, height: sh };
                  }
                  // relative normalized
                  else if (typeof db.xCenter === 'number' && typeof db.yCenter === 'number' && typeof db.width === 'number' && typeof db.height === 'number') {
                    const rx = db.xCenter - db.width / 2;
                    const ry = db.yCenter - db.height / 2;
                    const rw = db.width;
                    const rh = db.height;
                    const sx = Math.max(0, Math.floor(rx * video.videoWidth));
                    const sy = Math.max(0, Math.floor(ry * video.videoHeight));
                    const sw = Math.max(1, Math.min(video.videoWidth - sx, Math.floor(rw * video.videoWidth)));
                    const sh = Math.max(1, Math.min(video.videoHeight - sy, Math.floor(rh * video.videoHeight)));
                    areaRatio = (sw * sh) / (video.videoWidth * video.videoHeight);
                    bbox = { x: sx, y: sy, width: sw, height: sh };
                  }

                  // If we have a bbox, compute cheap pixel stats using a small canvas
                  if (bbox) {
                    try {
                      const cw = 32;
                      const ch = 32;
                      const tmp = document.createElement('canvas');
                      tmp.width = cw;
                      tmp.height = ch;
                      const tctx = tmp.getContext('2d');
                      if (tctx) {
                        tctx.drawImage(video, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, cw, ch);
                        const img = tctx.getImageData(0, 0, cw, ch);
                        const data = img.data;
                        let lsum = 0;
                        const gray = new Uint8ClampedArray(cw * ch);
                        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                          const r = data[i], g = data[i + 1], b = data[i + 2];
                          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                          lsum += lum;
                          gray[j] = lum;
                        }
                        const meanLum = lsum / (cw * ch);
                        quickGoodLighting = meanLum > 50 && meanLum < 220;

                        // Quick Laplacian variance
                        let lapSum = 0;
                        for (let y = 1; y < ch - 1; y++) {
                          for (let x = 1; x < cw - 1; x++) {
                            const idx = y * cw + x;
                            const center = gray[idx];
                            const left = gray[idx - 1];
                            const right = gray[idx + 1];
                            const up = gray[idx - cw];
                            const down = gray[idx + cw];
                            const lap = 4 * center - left - right - up - down;
                            lapSum += lap * lap;
                          }
                        }
                        const n = (cw - 2) * (ch - 2);
                        const lapVar = lapSum / Math.max(1, n);
                        quickSharpImage = lapVar > 80; // lower threshold for small scale

                        // quick looking straight by comparing bbox center to frame center
                        const faceCenterX = bbox.x + bbox.width / 2;
                        const centerDistNorm = Math.abs(faceCenterX - vw / 2) / vw;
                        quickLookingStraight = centerDistNorm < 0.12;
                      }
                    } catch (e) {
                      // ignore quick pixel errors
                    }
                  }
                }
              }
            } catch (e) {
              // ignore
            }

            const quickProperDistance = areaRatio !== undefined ? (areaRatio > 0.02 && areaRatio < 0.35) : undefined;

            setAnalysis((prev) => ({
              ...prev,
              faceDetected: faceCount > 0,
              onlyOneFace: faceCount === 1,
              // apply quick heuristics when available
              lookingStraight: quickLookingStraight !== undefined ? quickLookingStraight : prev.lookingStraight,
              goodLighting: quickGoodLighting !== undefined ? quickGoodLighting : prev.goodLighting,
              sharpImage: quickSharpImage !== undefined ? quickSharpImage : prev.sharpImage,
              properDistance: quickProperDistance !== undefined ? quickProperDistance : prev.properDistance,
              quality: calculateQuality({ ...prev, faceDetected: faceCount > 0, onlyOneFace: faceCount === 1, properDistance: quickProperDistance !== undefined ? quickProperDistance : prev.properDistance, lookingStraight: quickLookingStraight !== undefined ? quickLookingStraight : prev.lookingStraight, goodLighting: quickGoodLighting !== undefined ? quickGoodLighting : prev.goodLighting, sharpImage: quickSharpImage !== undefined ? quickSharpImage : prev.sharpImage } as any),
              ...(areaRatio !== undefined ? { areaRatio } : {}),
              ...(bbox ? { bbox } : {}),
            }));

          } catch (err) {
            // swallow
          }

          animationId = requestAnimationFrame(detect);
          return;
        }

        (detect as any)._lastRun = now;

        try {
          const result = detector.detectForVideo(video, now);

          const faceCount = result?.detections?.length ?? 0;

          // Default analysis
          let faceDetected = faceCount > 0;
          let onlyOneFace = faceCount === 1;
          let lookingStraight = false;
          let goodLighting = false;
          let properDistance = false;
          let sharpImage = false;

          if (faceDetected) {
            const det = result.detections[0];

            // Robust bounding-box extraction (try multiple possible shapes)
            const vw = video.videoWidth;
            const vh = video.videoHeight;

            let relBox: any = null;
            if (det.locationData && det.locationData.relativeBoundingBox) relBox = det.locationData.relativeBoundingBox;
            else if (det.boundingBox) relBox = det.boundingBox;
            else if (det.box) relBox = det.box;

            // Default normalized box
            let rx = 0, ry = 0, rw = 1, rh = 1; // normalized
            // Default pixel box
            let sx = 0, sy = 0, sw = vw, sh = vh;

            if (relBox) {
              // Mediapipe sometimes returns absolute pixel boundingBox with originX/originY
              if (typeof relBox.originX === 'number' && typeof relBox.originY === 'number' && typeof relBox.width === 'number' && typeof relBox.height === 'number') {
                sx = Math.max(0, Math.floor(relBox.originX));
                sy = Math.max(0, Math.floor(relBox.originY));
                sw = Math.max(1, Math.floor(relBox.width));
                sh = Math.max(1, Math.floor(relBox.height));
              }
              // Relative bounding box (normalized coordinates)
              else if (typeof relBox.xCenter === 'number' && typeof relBox.yCenter === 'number' && typeof relBox.width === 'number' && typeof relBox.height === 'number') {
                rx = relBox.xCenter - relBox.width / 2;
                ry = relBox.yCenter - relBox.height / 2;
                rw = relBox.width;
                rh = relBox.height;
                sx = Math.max(0, Math.floor(rx * vw));
                sy = Math.max(0, Math.floor(ry * vh));
                sw = Math.max(1, Math.min(vw - sx, Math.floor(rw * vw)));
                sh = Math.max(1, Math.min(vh - sy, Math.floor(rh * vh)));
              }
              // Other shapes: xmin/xmin + width/height
              else if (typeof relBox.xMin === 'number' || typeof relBox.xmin === 'number') {
                const xmin = relBox.xMin ?? relBox.xmin ?? 0;
                const ymin = relBox.yMin ?? relBox.ymin ?? 0;
                const width = relBox.width ?? relBox.w ?? 0;
                const height = relBox.height ?? relBox.h ?? 0;
                // assume normalized if width <= 1, otherwise pixels
                if (width <= 1 && height <= 1) {
                  rx = xmin; ry = ymin; rw = width; rh = height;
                  sx = Math.max(0, Math.floor(rx * vw));
                  sy = Math.max(0, Math.floor(ry * vh));
                  sw = Math.max(1, Math.min(vw - sx, Math.floor(rw * vw)));
                  sh = Math.max(1, Math.min(vh - sy, Math.floor(rh * vh)));
                } else {
                  sx = Math.max(0, Math.floor(xmin));
                  sy = Math.max(0, Math.floor(ymin));
                  sw = Math.max(1, Math.floor(width));
                  sh = Math.max(1, Math.floor(height));
                }
              }
              else if (typeof relBox.x === 'number' && typeof relBox.y === 'number' && typeof relBox.width === 'number') {
                // ambiguous: treat as normalized by default
                rx = relBox.x; ry = relBox.y; rw = relBox.width; rh = relBox.height ?? relBox.h ?? 0;
                sx = Math.max(0, Math.floor(rx * vw));
                sy = Math.max(0, Math.floor(ry * vh));
                sw = Math.max(1, Math.min(vw - sx, Math.floor(rw * vw)));
                sh = Math.max(1, Math.min(vh - sy, Math.floor(rh * vh)));
              }
            }

            // Ensure pixel box within frame
            sx = Math.max(0, Math.min(sx, vw - 1));
            sy = Math.max(0, Math.min(sy, vh - 1));
            sw = Math.max(1, Math.min(sw, vw - sx));
            sh = Math.max(1, Math.min(sh, vh - sy));

            // Looking straight: center X close to frame center
            const faceCenterX = sx + sw / 2;
            const centerDistNorm = Math.abs(faceCenterX - vw / 2) / vw;
            lookingStraight = centerDistNorm < 0.12; // threshold: 12% of width

            // Proper distance: face area relative to frame
            const areaRatio = (sw * sh) / (vw * vh);
            properDistance = areaRatio > 0.02 && areaRatio < 0.35;

            // Prepare offscreen canvas for pixel analysis (downscale for speed)
            const canvas = document.createElement('canvas');
            const maxSide = 128;
            const scale = Math.min(1, Math.max(64 / Math.max(sw, sh), Math.min(maxSide / Math.max(sw, sh), 1)));
            const cw = Math.max(8, Math.floor(sw * scale));
            const ch = Math.max(8, Math.floor(sh * scale));
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              try {
                ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
                const img = ctx.getImageData(0, 0, cw, ch);
                const data = img.data;
                let lsum = 0;
                const gray = new Uint8ClampedArray(cw * ch);
                for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                  const r = data[i], g = data[i + 1], b = data[i + 2];
                  // Rec. 709 luminance
                  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                  lsum += lum;
                  gray[j] = lum;
                }
                const meanLum = lsum / (cw * ch);
                goodLighting = meanLum > 50 && meanLum < 220;

                // Sharpness estimation: variance of Laplacian (approx)
                let lapSum = 0;
                // simple 3x3 Laplacian kernel: [0 -1 0; -1 4 -1; 0 -1 0]
                for (let y = 1; y < ch - 1; y++) {
                  for (let x = 1; x < cw - 1; x++) {
                    const idx = y * cw + x;
                    const center = gray[idx];
                    const left = gray[idx - 1];
                    const right = gray[idx + 1];
                    const up = gray[idx - cw];
                    const down = gray[idx + cw];
                    const lap = 4 * center - left - right - up - down;
                    lapSum += lap * lap;
                  }
                }
                const n = (cw - 2) * (ch - 2);
                const lapVar = lapSum / Math.max(1, n);
                sharpImage = lapVar > 400; // threshold - tuned experimentally
              } catch (err) {
                // ignore pixel-analysis errors
              }
            }
          }

          const areaRatio = (sw * sh) / (vw * vh);

          const newAnalysis: FaceAnalysis = {
            faceDetected,
            onlyOneFace,
            lookingStraight,
            goodLighting,
            properDistance,
            sharpImage,
            quality: 0,
            areaRatio,
            bbox: { x: sx, y: sy, width: sw, height: sh },
          };

          newAnalysis.quality = calculateQuality(newAnalysis);


          setAnalysis(newAnalysis);
        } catch (err) {
          // Catch runtime errors from Mediapipe and continue attempting detection.
        }

        animationId = requestAnimationFrame(detect);
      };

      detect();
    }

    detectLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [videoRef]);

  return analysis;
}