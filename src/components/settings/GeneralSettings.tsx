import { Globe2, Settings } from "lucide-react";

import GlassCard from "../ui/GlassCard";

interface GeneralSettingsProps {
  language: string;
  onLanguageChange: (value: string) => void;
}

const languages = ["English"];

export default function GeneralSettings({
  language,
  onLanguageChange,
}: GeneralSettingsProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20">
          <Settings size={18} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">General</h3>
          <p className="text-xs text-[#94A3B8]">Application preferences</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <Globe2 size={17} className="text-emerald-300" />
          <div>
            <p className="text-sm font-medium text-white">Language</p>
            <p className="text-xs text-[#94A3B8]">Choose the dashboard language</p>
          </div>
        </div>

        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          className="rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
        >
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </GlassCard>
  );
}
