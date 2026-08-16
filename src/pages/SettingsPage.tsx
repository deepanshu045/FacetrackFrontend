import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import CameraSettings from "../components/settings/CameraSettings";
import RecognitionSettings from "../components/settings/RecognitionSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import GeneralSettings from "../components/settings/GeneralSettings";
import { fetchProfile, setCollegeAccessCode, updateProfile } from "../services/api";
import type { UserProfile } from "../types";

const DEFAULT_SETTINGS = {
  notifications: true,
  emailAlerts: false,
  soundAlerts: true,
  language: "English",
  threshold: 85,
  resolution: "1080p",
  fps: "30",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [savingAccessCode, setSavingAccessCode] = useState(false);

  function generateAccessCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    setAccessCode(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`);
  }

  async function saveAccessCode() {
    if (accessCode.replace(/-/g, "").length < 8) {
      toast.error("Generate or enter an access code with at least 8 characters.");
      return;
    }
    setSavingAccessCode(true);
    try {
      await setCollegeAccessCode(accessCode);
      toast.success("Camera access code saved.");
    } catch (err: any) {
      toast.error(err?.message || "Unable to save the access code");
    } finally {
      setSavingAccessCode(false);
    }
  }

  useEffect(() => {
    async function loadSettings() {
      setError(null);
      setLoading(true);
      try {
        const profile = await fetchProfile();
        setSettings({
          notifications: profile.notifications ?? DEFAULT_SETTINGS.notifications,
          emailAlerts: profile.email_alerts ?? DEFAULT_SETTINGS.emailAlerts,
          soundAlerts: profile.sound_alerts ?? DEFAULT_SETTINGS.soundAlerts,
          language: profile.language ?? DEFAULT_SETTINGS.language,
          threshold: profile.threshold != null ? Number(profile.threshold) || DEFAULT_SETTINGS.threshold : DEFAULT_SETTINGS.threshold,
          resolution: profile.resolution ?? DEFAULT_SETTINGS.resolution,
          fps: profile.fps != null ? String(profile.fps) : DEFAULT_SETTINGS.fps,
        });
      } catch (err: any) {
        setError(err?.message || "Unable to load settings");
        toast.error(err?.message || "Unable to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function updateSetting<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    const previous = settings;
    setSettings((prev) => ({ ...prev, [key]: value }));

    const payload: Partial<UserProfile> = {};
    if (key === "emailAlerts") payload.email_alerts = value as boolean;
    else if (key === "soundAlerts") payload.sound_alerts = value as boolean;
    else (payload as any)[key] = value;

    setSaving(true);
    try {
      await updateProfile(payload);
      toast.success("Setting updated");
    } catch (err: any) {
      setSettings(previous);
      setError(err?.message || "Unable to save setting");
      toast.error(err?.message || "Unable to save setting");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageWrap>
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-200">
            <Loader2 size={18} className="animate-spin text-blue-400" />
            Loading settings...
          </div>
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-300">
              <SlidersHorizontal size={14} /> Preferences
            </div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Control recognition, notifications, camera behaviour, and secure desktop access for your college.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
            {saving ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <Check size={14} className="text-emerald-400" />}
            {saving ? "Saving change..." : "All changes saved"}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <CameraSettings
            resolution={settings.resolution}
            fps={settings.fps}
            onResolutionChange={(value) => updateSetting("resolution", value)}
            onFpsChange={(value) => updateSetting("fps", value)}
          />
          <RecognitionSettings
            threshold={settings.threshold}
            onThresholdChange={(value) => updateSetting("threshold", value)}
          />
          <NotificationSettings
            notifications={settings.notifications}
            emailAlerts={settings.emailAlerts}
            soundAlerts={settings.soundAlerts}
            onToggle={(key, value) => updateSetting(key, value)}
          />
          <GeneralSettings
            language={settings.language}
            onLanguageChange={(value) => updateSetting("language", value)}
          />
        </div>

        <section className="rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-500/[0.08] to-slate-950 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/15 p-3 text-blue-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Desktop camera access</h2>
              <p className="mt-1 text-sm text-slate-400">
                Create a secure code for authorised operators using the FaceTrack desktop camera for this college.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX"
              className="min-w-0 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-mono tracking-wider text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button type="button" onClick={generateAccessCode} className="rounded-lg border border-blue-400/30 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-400/10">
              Generate
            </button>
            <button type="button" disabled={savingAccessCode} onClick={saveAccessCode} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60">
              {savingAccessCode ? "Saving..." : "Save code"}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Do not share this code with unauthorised users.</p>
        </section>
      </div>
    </PageWrap>
  );
}
