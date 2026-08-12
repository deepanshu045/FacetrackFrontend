import { useEffect, useState } from "react";
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
      toast.success("Camera access code saved. Share it only with authorized operators.");
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
          notifications:
            profile.notifications ?? DEFAULT_SETTINGS.notifications,
          emailAlerts:
            profile.email_alerts ?? DEFAULT_SETTINGS.emailAlerts,
          soundAlerts:
            profile.sound_alerts ?? DEFAULT_SETTINGS.soundAlerts,
          language: profile.language ?? DEFAULT_SETTINGS.language,
          threshold:
            profile.threshold != null
              ? Number(profile.threshold) || DEFAULT_SETTINGS.threshold
              : DEFAULT_SETTINGS.threshold,
          resolution:
            profile.resolution ?? DEFAULT_SETTINGS.resolution,
          fps:
            profile.fps != null
              ? String(profile.fps)
              : DEFAULT_SETTINGS.fps,
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

  async function updateSetting<K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) {
    const previous = settings;
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    const payload: Partial<UserProfile> = {};
    if (key === "emailAlerts") {
      payload.email_alerts = value as boolean;
    } else if (key === "soundAlerts") {
      payload.sound_alerts = value as boolean;
    } else {
      (payload as any)[key] = value;
    }

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
        <div className="max-w-2xl rounded-xl border border-white/10 bg-slate-950/80 p-6 text-sm text-slate-200">
          Loading settings...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <div className="max-w-2xl space-y-4">
        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

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

        <GeneralSettings />

        <section className="rounded-xl border border-white/10 bg-slate-950/80 p-5">
          <h2 className="text-base font-semibold text-white">Desktop camera access</h2>
          <p className="mt-1 text-sm text-slate-400">
            Generate a code for operators who use the FaceTrack desktop camera for this college.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Generate a camera access code"
              className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button type="button" onClick={generateAccessCode} className="rounded-lg border border-blue-400/30 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-400/10">
              Generate code
            </button>
            <button type="button" disabled={savingAccessCode} onClick={saveAccessCode} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {savingAccessCode ? "Saving..." : "Save code"}
            </button>
          </div>
        </section>
      </div>
    </PageWrap>
  );
}
