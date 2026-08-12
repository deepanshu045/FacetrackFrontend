import { ScanFace } from "lucide-react";

interface FaceTrackMarkProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-20 w-20 rounded-2xl",
};

const iconSizes = { sm: 16, md: 20, lg: 36 };

export default function FaceTrackMark({ size = "md" }: FaceTrackMarkProps) {
  return (
    <div className={`relative flex ${sizes[size]} items-center justify-center overflow-hidden border border-blue-300/30 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-lg shadow-blue-950/40`}>
      <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white/20 blur-sm" />
      <ScanFace size={iconSizes[size]} strokeWidth={1.8} className="relative text-white" />
    </div>
  );
}
