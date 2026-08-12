import { Bell } from "lucide-react";

import GlassCard from "../ui/GlassCard";
import Toggle from "./Toggle";

interface NotificationSettingsProps {
  notifications: boolean;
  emailAlerts: boolean;
  soundAlerts: boolean;
  onToggle: (
    key: "notifications" | "emailAlerts" | "soundAlerts",
    value: boolean
  ) => void;
}

const notificationItems = [
  {
    key: "notifications" as const,
    label: "Push Notifications",
    desc: "Receive in-app notifications",
  },
  {
    key: "emailAlerts" as const,
    label: "Email Alerts",
    desc: "Send alerts to admin email",
  },
  {
    key: "soundAlerts" as const,
    label: "Sound Alerts",
    desc: "Play sound on recognition",
  },
];

export default function NotificationSettings({
  notifications,
  emailAlerts,
  soundAlerts,
  onToggle,
}: NotificationSettingsProps) {
  const values = {
    notifications,
    emailAlerts,
    soundAlerts,
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20">
          <Bell size={18} className="text-amber-400" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">
            Notifications
          </h3>

          <p className="text-xs text-[#94A3B8]">
            Manage alerts and notifications
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {notificationItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-white">
                {item.label}
              </p>

              <p className="text-xs text-[#94A3B8]">
                {item.desc}
              </p>
            </div>

            <Toggle
              checked={values[item.key]}
              disabled={item.key !== "notifications" && !notifications}
              onChange={(value) =>
                onToggle(item.key, value)
              }
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}