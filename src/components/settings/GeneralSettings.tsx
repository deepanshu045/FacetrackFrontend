import { Settings } from "lucide-react";

import GlassCard from "../ui/GlassCard";

export default function GeneralSettings() {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20">
          <Settings
            size={18}
            className="text-emerald-400"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">
            General
          </h3>

          <p className="text-xs text-[#94A3B8]">
            Display preferences
          </p>
        </div>
      </div>

      <div className="text-sm text-[#94A3B8]">
        Language selection has been removed from the settings.
      </div>
    </GlassCard>
  );
}