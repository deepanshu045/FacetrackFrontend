import { useCallback, useEffect, useRef } from "react";

export default function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      throw new Error("Video element is not mounted yet");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
      },
    });

    videoRef.current.srcObject = stream;
    videoRef.current.muted = true;
    videoRef.current.playsInline = true;
    await videoRef.current.play();
  }, []);

  const stopCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const stream = video.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    video.srcObject = null;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    startCamera,
    stopCamera,
  };
}
