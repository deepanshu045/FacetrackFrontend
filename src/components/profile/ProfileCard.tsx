import { Shield } from "lucide-react";

import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";

interface ProfileCardProps {
  name: string;
  email: string;
  role?: string;
  status?: string;
  onChangePassword?: () => void;
}

export default function ProfileCard({
  name,
  email,
  role = "Administrator",
  status = "Active",
  onChangePassword,
}: ProfileCardProps) {
  return (
    <GlassCard className="p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar
          name={name}
          size="xl"
        />

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white">
            {name}
          </h2>

          <p className="mt-1 text-[#94A3B8]">
            {email}
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge variant="info">
              {role}
            </Badge>

            <Badge variant="success">
              {status}
            </Badge>
          </div>
        </div>
      </div>

      {role !== "Teacher" && onChangePassword ? (
        <div className="mt-6 border-t border-white/10 pt-6">
          <Button
            variant="primary"
            onClick={onChangePassword}
          >
            <Shield size={16} />
            Change Password
          </Button>
        </div>
      ) : null}
    </GlassCard>
  );
}