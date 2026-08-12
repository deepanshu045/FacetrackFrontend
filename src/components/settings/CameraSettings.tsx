import { Camera } from "lucide-react";

import GlassCard from "../ui/GlassCard";

interface CameraSettingsProps {
  resolution: string;
  fps: string;
  onResolutionChange: (value: string) => void;
  onFpsChange: (value: string) => void;
}

export default function CameraSettings({
  resolution,
  fps,
  onResolutionChange,
  onFpsChange,
}: CameraSettingsProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
          <Camera size={18} className="text-blue-400" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">
            Camera Settings
          </h3>

          <p className="text-xs text-[#94A3B8]">
            Configure camera hardware options
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Resolution */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">
              Resolution
            </p>

            <p className="text-xs text-[#94A3B8]">
              Camera capture resolution
            </p>
          </div>

          <select
            value={resolution}
            onChange={(e) =>
              onResolutionChange(e.target.value)
            }
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0F172A] text-sm text-white focus:outline-none"
          >
            {["720p", "1080p", "4K"].map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">
              Frame Rate
            </p>

            <p className="text-xs text-[#94A3B8]">
              Frames per second
            </p>
          </div>

          <select
            value={fps}
            onChange={(e) =>
              onFpsChange(e.target.value)
            }
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0F172A] text-sm text-white focus:outline-none"
          >
            {["15", "24", "30", "60"].map((item) => (
              <option
                key={item}
                value={item}
              >
                {item} fps
              </option>
            ))}
          </select>
        </div>
      </div>
    </GlassCard>
  );
}