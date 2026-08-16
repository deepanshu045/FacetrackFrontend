import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  FileImage,
  ImagePlus,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
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
import useStudents from "../hooks/useStudents";
import { uploadFace } from "../services/api";
import { cn } from "../utils/cn";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function Spinner() {
  return <Loader2 size={17} className="animate-spin" aria-hidden="true" />;
}

function validateImage(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Image must be smaller than 10 MB.";
  }
  return null;
}

export default function UploadFacePage() {
  const { videoRef, startCamera, stopCamera } = useCamera();
  const { students, fetchAll } = useStudents();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ name: string; size: number } | null>(null);

  const liveAnalysis = useFaceDetection(videoRef);

  useEffect(() => {
    if (!cameraOn) return;
    let active = true;

    const open = async () => {
      try {
        await startCamera();
      } catch (error: any) {
        if (!active) return;
        toast.error(error?.message || "Unable to access camera");
        setCameraOn(false);
      }
    };

    open();
    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraOn, startCamera, stopCamera]);

  const matchedStudents = students
    .filter((student) => {
      const query = studentSearch.trim().toLowerCase();
      if (!query) return true;
      return (
        student.name.toLowerCase().includes(query) ||
        student.roll_no.toLowerCase().includes(query)
      );
    })
    .slice(0, 8);

  const resetImage = () => {
    setCaptured(false);
    setCapturedImage(null);
    setImageInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch("");
    setShowDropdown(false);
    resetImage();
  };

  const readImage = (file: File) => {
    const validationError = validateImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setCaptured(true);
      setImageInfo({ name: file.name, size: file.size });
      toast.success("Image ready for review");
    };
    reader.onerror = () => toast.error("Unable to read this image");
    reader.readAsDataURL(file);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedStudent) {
      toast.error("Select a student before uploading a face");
      return;
    }
    const file = event.target.files?.[0];
    if (file) readImage(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!selectedStudent) {
      toast.error("Select a student before uploading a face");
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) readImage(file);
  };

  const handleCapture = () => {
    if (!selectedStudent) {
      toast.error("Select a student first");
      return;
    }

    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error("Camera is not ready yet");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Unable to capture image");
      return;
    }

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    setCaptured(true);
    setImageInfo({ name: "camera-capture.jpg", size: Math.round((dataUrl.length * 3) / 4) });
    toast.success("Photo captured — review it before registering");
  };

  const handleRegister = async () => {
    if (!selectedStudent || !capturedImage) {
      toast.error("Select a student and provide a face image first");
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await uploadFace(selectedStudent.id, blob);

      toast.success(`Face registered for ${selectedStudent.name}`);
      await fetchAll();
      resetImage();
      setSelectedStudent(null);
      setCameraOn(false);
    } catch (error: any) {
      toast.error(error?.message || "Unable to register face");
    } finally {
      setRegistering(false);
    }
  };

  const checks = captured
    ? [
        { label: "Image selected", ok: true },
        { label: "Readable image", ok: true },
        { label: "Server face validation", ok: null },
        { label: "Duplicate-face check", ok: null },
      ]
    : cameraOn
      ? [
          { label: "Camera available", ok: true },
          { label: "Face visible", ok: liveAnalysis.faceDetected },
          { label: "One face", ok: liveAnalysis.onlyOneFace },
          { label: "Good lighting", ok: liveAnalysis.goodLighting },
        ]
      : [];

  return (
    <PageWrap>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Upload Face</h1>
          <p className="mt-1 text-sm text-slate-400">
            Select a student, capture or upload one clear face, then register it.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
          <ShieldCheck size={14} />
          Server validates the final face
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Student & photo</h2>
              <p className="mt-1 text-xs text-slate-500">Only one student can be registered at a time.</p>
            </div>
            {selectedStudent?.has_face && (
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                Face already registered
              </span>
            )}
          </div>

          <div className="relative mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Select student</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={selectedStudent ? `${selectedStudent.roll_no} — ${selectedStudent.name}` : studentSearch}
                onFocus={() => setShowDropdown(true)}
                onChange={(event) => {
                  setStudentSearch(event.target.value);
                  setSelectedStudent(null);
                  resetImage();
                  setShowDropdown(true);
                }}
                placeholder="Search by roll number or name"
                className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-10 pr-10 text-sm text-white outline-none transition focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              />
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    resetImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  aria-label="Clear student"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showDropdown && !selectedStudent && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900 p-1 shadow-2xl"
              >
                {students.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">No students available.</p>
                ) : matchedStudents.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">No matching student.</p>
                ) : (
                  matchedStudents.map((student) => (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/5"
                    >
                      <Avatar name={student.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{student.name}</p>
                        <p className="truncate text-xs text-slate-500">{student.roll_no} · {student.department}</p>
                      </div>
                      <span className={cn("text-[11px]", student.has_face ? "text-blue-300" : "text-amber-300")}>
                        {student.has_face ? "Registered" : "Not set"}
                      </span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </div>

          {selectedStudent && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <Avatar name={selectedStudent.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{selectedStudent.name}</p>
                <p className="truncate text-xs text-slate-400">
                  {selectedStudent.roll_no} · {selectedStudent.department} · {selectedStudent.class_name} {selectedStudent.section}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-500">Face status</p>
                <p className={selectedStudent.has_face ? "text-blue-300" : "text-amber-300"}>
                  {selectedStudent.has_face ? "Registered" : "Not registered"}
                </p>
              </div>
            </div>
          )}

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-dashed bg-slate-950/70 transition",
              dragging ? "border-blue-400 bg-blue-500/10" : "border-white/10",
              !selectedStudent && "opacity-60"
            )}
          >
            <div className="aspect-video">
              {capturedImage ? (
                <img src={capturedImage} alt="Selected face preview" className="h-full w-full object-contain bg-black" />
              ) : cameraOn ? (
                <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                    <ImagePlus size={28} />
                  </div>
                  <p className="font-medium text-white">Add a clear face photo</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    JPG, PNG or WebP · up to 10 MB · one face only
                  </p>
                </div>
              )}
            </div>

            {cameraOn && !capturedImage && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-40 rounded-[45%] border border-blue-400/60 shadow-[0_0_0_9999px_rgba(2,8,23,0.15)]" />
              </div>
            )}

            {dragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-950/80 backdrop-blur-sm">
                <div className="text-center text-blue-200">
                  <Upload className="mx-auto mb-2" size={30} />
                  <p className="font-medium">Drop image here</p>
                </div>
              </div>
            )}
          </div>

          {imageInfo && capturedImage && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <FileImage size={18} className="text-blue-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">{imageInfo.name}</p>
                <p className="text-[11px] text-slate-500">{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={resetImage} className="text-slate-500 hover:text-white" aria-label="Remove image">
                <X size={16} />
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleUpload} />

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              variant="secondary"
              className="justify-center"
              disabled={!selectedStudent || registering}
              onClick={() => setCameraOn((value) => !value)}
            >
              <Camera size={16} />
              {cameraOn ? "Close camera" : "Use camera"}
            </Button>
            <Button
              variant="secondary"
              className="justify-center"
              disabled={!selectedStudent || registering}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Choose image
            </Button>
            <Button
              variant="primary"
              className="justify-center"
              disabled={!cameraOn || !selectedStudent || registering || !!capturedImage}
              onClick={handleCapture}
            >
              <Camera size={16} />
              Capture
            </Button>
          </div>

          {captured && (
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" className="flex-1 justify-center" disabled={registering} onClick={resetImage}>
                <RotateCcw size={16} />
                Choose another
              </Button>
            </div>
          )}

          {selectedStudent?.has_face && (
            <div className="mt-4 flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs leading-5 text-blue-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-300" />
              <p>This student already has a registered face. Registering a new image will replace the existing face data.</p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Review before registering</h2>
            <p className="mt-1 text-xs text-slate-500">The backend performs the final face and duplicate checks.</p>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-300">Photo readiness</span>
              <span className="text-xs text-slate-500">{captured ? "Ready" : cameraOn ? "Live" : "Waiting"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${captured ? 100 : cameraOn ? Math.max(10, liveAnalysis.quality || 0) : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {checks.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">
                Select a student and add a photo to see the registration checks.
              </div>
            ) : (
              checks.map((check) => (
                <div key={check.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
                  {check.ok === true ? (
                    <CheckCircle2 size={17} className="text-emerald-400" />
                  ) : check.ok === false ? (
                    <XCircle size={17} className="text-red-400" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-600" />
                  )}
                  <span className="text-sm text-slate-300">{check.label}</span>
                  {check.ok === null && <span className="ml-auto text-[11px] text-slate-500">On register</span>}
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-300">
              <AlertCircle size={14} />
              Best result
            </div>
            <ul className="space-y-1 text-xs leading-5 text-slate-500">
              <li>• Face should be clearly visible and unobstructed.</li>
              <li>• Use even lighting and avoid strong backlight.</li>
              <li>• Keep only one person in the frame.</li>
              <li>• The server will reject invalid or duplicate faces.</li>
            </ul>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-5 w-full justify-center"
            disabled={!selectedStudent || !capturedImage || registering}
            onClick={handleRegister}
          >
            {registering ? <Spinner /> : <Check size={17} />}
            {registering ? "Registering face…" : "Register face"}
          </Button>

          {registering && (
            <p className="mt-2 text-center text-xs text-slate-500">Uploading and validating the face. Please wait.</p>
          )}
        </GlassCard>
      </div>
    </PageWrap>
  );
}
