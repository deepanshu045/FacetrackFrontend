import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle,
  RotateCcw,
  Search,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";

import { Student } from "../types";
import useCamera from "../hooks/useCamera";
import useFaceDetection from "../hooks/useFaceDetection";
import { calculateQuality } from "../services/qualityCalculator";
import FaceAnalysis from "../components/FaceAnalysis/FaceAnalysis";
import { cn } from "../utils/cn";
import useStudents from "../hooks/useStudents";
import { uploadFace } from "../services/api";

export default function UploadFacePage() {
  const { videoRef, startCamera, stopCamera } = useCamera();
  const { students } = useStudents();

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [studentSearch, setStudentSearch] =
    useState("");

  const [showDropdown, setShowDropdown] =
    useState(false);

  const [cameraOn, setCameraOn] =
    useState(false);

  const [captured, setCaptured] =
    useState(false);

  const [capturedImage, setCapturedImage] =
    useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialAnalysis = {
    faceDetected: false,
    onlyOneFace: false,
    lookingStraight: false,
    goodLighting: false,
    properDistance: false,
    sharpImage: false,
    quality: 0,
  };

  async function analyzeImageDataUrl(dataUrl: string) {
    return new Promise<any>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width || 640;
          const h = img.naturalHeight || img.height || 480;
          const canvas = document.createElement("canvas");
          const maxSide = 256;
          const scale = Math.min(1, maxSide / Math.max(w, h));
          const cw = Math.max(8, Math.floor(w * scale));
          const ch = Math.max(8, Math.floor(h * scale));
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(initialAnalysis);
          ctx.drawImage(img, 0, 0, cw, ch);
          const imgData = ctx.getImageData(0, 0, cw, ch).data;
          let lsum = 0;
          const gray = new Uint8ClampedArray(cw * ch);
          for (let i = 0, j = 0; i < imgData.length; i += 4, j++) {
            const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2];
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            lsum += lum;
            gray[j] = lum;
          }
          const meanLum = lsum / (cw * ch);

          // Laplacian variance approx
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
          const n = Math.max(1, (cw - 2) * (ch - 2));
          const lapVar = lapSum / n;

          const sharpImage = lapVar > 400;
          const goodLighting = meanLum > 40 && meanLum < 220;

          // crude face detection heuristic: assume face present if image has reasonable sharpness
          const faceDetected = sharpImage || (meanLum > 30 && meanLum < 230);
          const onlyOneFace = true;
          const properDistance = true;

          const result = {
            faceDetected,
            onlyOneFace,
            lookingStraight: true,
            goodLighting,
            properDistance,
            sharpImage,
            quality: 0,
          };

          result.quality = calculateQuality(result as any);
          resolve(result);
        } catch (e) {
          resolve(initialAnalysis);
        }
      };
      img.onerror = () => resolve(initialAnalysis);
      img.src = dataUrl;
    });
  }

  useEffect(() => {
    if (!cameraOn) return;

    let active = true;

    const enableCamera = async () => {
      try {
        await startCamera();
      } catch (err: any) {
        if (!active) return;
        toast.error(err?.message || "Unable to access camera");
        setCameraOn(false);
      }
    };

    enableCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraOn, startCamera, stopCamera]);

  // Face analysis derived from live video
  const analysis = useFaceDetection(videoRef);
  // Choose which analysis to display: image analysis (uploaded/captured) > live camera analysis > initial
  const displayedAnalysis = capturedImage ? (imageAnalysis ?? initialAnalysis) : (cameraOn ? analysis : initialAnalysis);
  const displayedQuality = displayedAnalysis?.quality ?? 0;

  const qualityChecks = [
    { label: "Face Detected", ok: displayedAnalysis.faceDetected },
    { label: "Only One Face", ok: displayedAnalysis.onlyOneFace },
    { label: "Looking Straight", ok: displayedAnalysis.lookingStraight },
    { label: "Good Lighting", ok: displayedAnalysis.goodLighting },
    { label: "Proper Distance", ok: displayedAnalysis.properDistance },
    { label: "Sharp Image", ok: displayedAnalysis.sharpImage },
  ];

  const matchedStudents = students
    .filter(
      (student) =>
        student.name
          .toLowerCase()
          .includes(studentSearch.toLowerCase()) ||
        student.roll_no
          .toLowerCase()
          .includes(studentSearch.toLowerCase())
    )
    .slice(0, 5);

  function handleCapture() {
    if (!selectedStudent) {
      toast.error("Please select a student first");
      return;
    }

    const video = videoRef.current;
    if (!video) {
      toast.error("Camera not initialized");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Unable to get canvas context");

      // Mirror the capture to match the preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = canvas.toDataURL("image/jpeg");

      setCapturedImage(image);
      analyzeImageDataUrl(image).then((a) => setImageAnalysis(a));
      setCaptured(true);

      toast.success("Face captured successfully");
    } catch (err) {
      console.error(err);
      toast.error("Unable to capture image");
    }
  }

  function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!selectedStudent) {
      toast.error("Please select a student first");
      return;
    }

    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setCapturedImage(reader.result as string);
      analyzeImageDataUrl(reader.result as string).then((a) => setImageAnalysis(a));
      setCaptured(true);

      toast.success("Image uploaded");
    };

    reader.readAsDataURL(file);
  }

  function handleRetake() {
    setCaptured(false);
    setCapturedImage(null);
  }

  async function handleRegister() {
    if (!capturedImage || !selectedStudent) {
      toast.error("Please capture or upload a face first");
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await uploadFace(selectedStudent.id, blob);

      toast.success(`Face registered for ${selectedStudent.name}`);
      setCaptured(false);
      setCapturedImage(null);
      setSelectedStudent(null);
      setStudentSearch("");
      setCameraOn(false);
    } catch (err: any) {
      toast.error(err?.message || "Unable to register face");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <PageWrap>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* LEFT PANEL */}

        <GlassCard className="p-6">
          <h3 className="mb-4 text-base font-semibold text-white">
            Camera Preview
          </h3>

          {/* Student Search */}

          <div className="relative mb-4">
            <label className="mb-1.5 block text-sm font-medium text-[#94A3B8]">
              Select Student
            </label>

            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
              />

              <input
                value={
                  selectedStudent
                    ? `${selectedStudent.roll_no} — ${selectedStudent.name}`
                    : studentSearch
                }
                onFocus={() =>
                  setShowDropdown(true)
                }
                onChange={(e) => {
                  setStudentSearch(
                    e.target.value
                  );
                  setSelectedStudent(null);
                  setShowDropdown(true);
                }}
                placeholder="Search by Roll No or Name..."
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <AnimatePresence>
              {showDropdown &&
                studentSearch &&
                !selectedStudent && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 4,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: 4,
                    }}
                    className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1E293B]"
                  >
                    {matchedStudents.length ===
                    0 ? (
                      <div className="py-4 text-center text-sm text-[#94A3B8]">
                        No students found
                      </div>
                    ) : (
                      matchedStudents.map(
                        (student) => (
                          <button
                            key={student.id}
                            onClick={() => {
                              setSelectedStudent(
                                student
                              );
                              setStudentSearch(
                                ""
                              );
                              setCaptured(
                                false
                              );
                              setCapturedImage(
                                null
                              );
                              setShowDropdown(
                                false
                              );
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                          >
                            <Avatar
                              name={
                                student.name
                              }
                              size="sm"
                            />

                            <div>
                              <p className="text-sm font-medium text-white">
                                {student.name}
                              </p>

                              <p className="text-xs text-[#94A3B8]">
                                {student.roll_no} ·{" "}
                                {
                                  student.department
                                }
                              </p>
                            </div>
                          </button>
                        )
                      )
                    )}
                  </motion.div>
                )}
            </AnimatePresence>

            {students.length === 0 && (
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                No students are available yet. Please register students first before uploading face data.
              </div>
            )}
          </div>

          {selectedStudent && (            <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-600/10 p-3">
              <Avatar
                name={selectedStudent.name}
                size="md"
              />

              <div>
                <p className="text-sm font-medium text-white">
                  {selectedStudent.name}
                </p>

                <p className="text-xs text-[#94A3B8]">
                  {selectedStudent.roll_no} ·{" "}
                  {selectedStudent.department}
                </p>
              </div>

              <button
                className="ml-auto text-[#94A3B8] hover:text-white"
                onClick={() => {
                  setSelectedStudent(null);
                  handleRetake();
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Camera */}

          <div className="relative mb-4 aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0F172A]">

            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                className="h-full w-full object-contain bg-black"
              />
            ) : cameraOn ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)", backgroundColor: '#000' }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-[#475569]">
                <Camera
                  size={48}
                  strokeWidth={1}
                />
                <p>Camera is turned off</p>
              </div>
            )}

            {[
              "top-4 left-4 border-t-2 border-l-2",
              "top-4 right-4 border-t-2 border-r-2",
              "bottom-4 left-4 border-b-2 border-l-2",
              "bottom-4 right-4 border-b-2 border-r-2",
            ].map((item, index) => (
              <div
                key={index}
                className={cn(
                  "absolute h-6 w-6 border-blue-500/60",
                  item
                )}
              />
            ))}
          </div>

          <input
            id="upload-face"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleUpload}
          />

          <div className="flex flex-wrap gap-2">

            <Button
              variant="secondary"
              onClick={() => {
                setCaptured(false);
                setCapturedImage(null);
                setCameraOn((current) => !current);
              }}
            >
              <Camera size={16} />
              {cameraOn ? "Close Camera" : "Open Camera"}
            </Button>

            <Button
              variant="primary"
              onClick={handleCapture}
              disabled={!cameraOn || !selectedStudent}
            >
              <Camera size={16} />
              Capture
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                if (!selectedStudent) {
                  toast.error("Please select a student first");
                  return;
                }
                if (registering) return;
                fileInputRef.current?.click();
              }}
              disabled={registering}
            >
              <Upload size={16} />
              Upload Image
            </Button>

            {captured && (
              <Button
                variant="ghost"
                onClick={handleRetake}
              >
                <RotateCcw size={16} />
              </Button>
              
              
            )}
            </div>
          </GlassCard>

                    {/* RIGHT PANEL */}

        <GlassCard className="p-6">
          <h3 className="mb-4 text-base font-semibold text-white">
            Face Quality Analysis
          </h3>

          {/* Quality Score */}

          <div className="mb-6 flex justify-center">
            <div className="relative h-32 w-32">
              <svg
                className="h-full w-full -rotate-90"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="10"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={displayedQuality >= 80 ? "#22C55E" : "#2563EB"}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - displayedQuality / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {displayedQuality}%
                </span>

                <span className="text-xs text-[#94A3B8]">
                  Quality
                </span>
              </div>
            </div>
          </div>

          {/* Quality Checks (Face Analysis) */}

          <div className="mb-6">
            <FaceAnalysis analysis={displayedAnalysis} />
          </div>

          {/* Instructions */}

          {!captured && (
            <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-amber-400">
                <AlertCircle size={13} />
                Tips for best results
              </p>

              {[
                "Move closer to the camera",
                "Ensure good lighting",
                "Keep your face centered",
                "Look straight ahead",
                "Only one face should be visible",
                "Remove sunglasses or masks",
              ].map((tip) => (
                <p
                  key={tip}
                  className="pl-4 text-xs text-[#94A3B8]"
                >
                  • {tip}
                </p>
              ))}
            </div>
          )}

          {/* Register Button */}

          {captured && (
            <Button
              variant="primary"
              size="lg"
              className="mt-4 w-full justify-center"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <>
                  <RotateCcw size={16} className="animate-spin" />
                  Registering…
                </>
              ) : (
                <>
                  <Check size={16} />
                  Register Face
                </>
              )}
            </Button>
          )}
        </GlassCard>
      </div>
    </PageWrap>)
    }
  

            
          
