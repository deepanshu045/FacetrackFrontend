import { Zap } from "lucide-react";

import GlassCard from "../ui/GlassCard";

interface RecognitionSettingsProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
}

export default function RecognitionSettings({
  threshold,
  onThresholdChange,
}: RecognitionSettingsProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20">
          <Zap size={18} className="text-purple-400" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">
            Face Recognition
          </h3>

          <p className="text-xs text-[#94A3B8]">
            Tune recognition sensitivity
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-white">
            Confidence Threshold
          </p>

          <span className="font-mono text-sm text-blue-400">
            {threshold}%
          </span>
        </div>

        <input
          type="range"
          min={60}
          max={99}
          value={threshold}
          onChange={(e) =>
            onThresholdChange(Number(e.target.value))
          }
          className="w-full accent-blue-600"
        />

        <div className="mt-1 flex justify-between text-xs text-[#475569]">
          <span>60% (Lenient)</span>
          <span>99% (Strict)</span>
        </div>
      </div>
    </GlassCard>
  );
}