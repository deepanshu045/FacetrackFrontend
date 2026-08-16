import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Trash2, UserPlus, Users, UserRound } from "lucide-react";
import { toast } from "sonner";

import PageWrap from "../components/layout/PageWrap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileInfoGrid from "../components/profile/ProfileInfoGrid";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";
import { PROFILE_INFO } from "../components/profile/profileData";
import { changePassword, deleteCollegeAdmin, fetchCollegeAdmins, fetchProfile, registerAdmin } from "../services/api";
import type { CollegeAdmin } from "../services/api";
import type { UserProfile } from "../types";

export default function ProfilePage() {
  const [pwModal, setPwModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [adminForm, setAdminForm] = useState({ name: "", username: "", email: "", password: "" });
  const [admins, setAdmins] = useState<CollegeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [profileData, adminsData] = await Promise.all([fetchProfile(), fetchCollegeAdmins()]);
      setProfile(profileData);
      setAdmins(adminsData);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load administrator data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handlePwChange() {
    if (!password.current || !password.next || !password.confirm) return toast.error("Fill all fields");
    if (password.next !== password.confirm) return toast.error("Passwords do not match");
    try {
      await changePassword(password.current, password.next);
      toast.success("Password changed successfully");
      setPwModal(false);
      setPassword({ current: "", next: "", confirm: "" });
    } catch (error: any) { toast.error(error?.message || "Unable to change password."); }
  }

  async function handleAddAdmin() {
    if (Object.values(adminForm).some((value) => !value.trim())) return toast.error("Fill all administrator fields");
    setAddingAdmin(true);
    try {
      await registerAdmin(adminForm);
      setAdminForm({ name: "", username: "", email: "", password: "" });
      await loadData();
      toast.success("Administrator account created");
    } catch (error: any) { toast.error(error?.message || "Unable to create administrator"); }
    finally { setAddingAdmin(false); }
  }

  async function handleDeleteAdmin(admin: CollegeAdmin) {
    if (!window.confirm(`Delete ${admin.name || admin.username}'s administrator account?`)) return;
    setRemovingAdminId(admin.id);
    try {
      await deleteCollegeAdmin(admin.id);
      setAdmins((items) => items.filter((item) => item.id !== admin.id));
      toast.success("Administrator account deleted");
    } catch (error: any) { toast.error(error?.message || "Unable to delete administrator"); }
    finally { setRemovingAdminId(null); }
  }

  const displayName = profile?.name || profile?.username || "Admin User";

  return (
    <PageWrap>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-300">
                <UserRound size={14} /> Account
              </div>
              <h1 className="text-2xl font-bold text-white">Profile</h1>
              <p className="mt-1 text-sm text-slate-400">Manage your administrator account and college access.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
              <ShieldCheck size={14} /> Account active
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="p-6">
            <ProfileCard
              name={displayName}
              email={profile?.email || ""}
              role="Administrator"
              status="Active"
              onChangePassword={() => setPwModal(true)}
            />
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/15 p-3 text-blue-300"><KeyRound size={19} /></div>
              <div>
                <h2 className="font-semibold text-white">Security</h2>
                <p className="text-xs text-slate-400">Keep your administrator account secure.</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Password</p>
              <p className="mt-1 text-xs text-slate-400">Use a strong password and change it regularly.</p>
              <Button className="mt-4" variant="secondary" onClick={() => setPwModal(true)}>
                <KeyRound size={16} /> Change password
              </Button>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-slate-500/15 p-3 text-slate-200"><UserRound size={19} /></div>
            <div>
              <h2 className="font-semibold text-white">Account details</h2>
              <p className="text-xs text-slate-400">Your current administrator and system preferences.</p>
            </div>
          </div>
          <ProfileInfoGrid items={profile ? [
            { label: "Name", value: profile.name || "Not set" },
            { label: "Username", value: profile.username },
            { label: "Email", value: profile.email },
            { label: "Notifications", value: profile.notifications ? "Enabled" : "Disabled" },
            { label: "Email Alerts", value: profile.email_alerts ? "Enabled" : "Disabled" },
            { label: "Sound Alerts", value: profile.sound_alerts ? "Enabled" : "Disabled" },
            { label: "Resolution", value: profile.resolution },
            { label: "Frame Rate", value: `${profile.fps} fps` },
          ] : PROFILE_INFO} />
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/15 p-3 text-blue-300"><UserPlus size={20} /></div>
            <div>
              <h2 className="font-semibold text-white">Add college administrator</h2>
              <p className="mt-1 text-sm text-[#94A3B8]">Create another administrator account for this college.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Administrator name" placeholder="Dr. Priya Sharma" value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} />
            <Input label="Username" placeholder="registrar" value={adminForm.username} onChange={(event) => setAdminForm({ ...adminForm, username: event.target.value })} />
            <Input label="College email" type="email" placeholder="registrar@college.edu" value={adminForm.email} onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} />
            <Input label="Temporary password" type="password" placeholder="Create a password" value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} />
          </div>
          <Button className="mt-5" onClick={handleAddAdmin} disabled={addingAdmin}>
            {addingAdmin ? "Creating account…" : <><UserPlus size={16} /> Create administrator</>}
          </Button>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300"><Users size={20} /></div>
            <div>
              <h2 className="font-semibold text-white">College administrators</h2>
              <p className="text-sm text-[#94A3B8]">Administrators belonging to your college.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            {loading ? (
              <p className="p-5 text-sm text-slate-400">Loading administrators…</p>
            ) : admins.map((admin) => (
              <div key={admin.id} className="flex flex-col gap-4 border-b border-white/10 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-white">{admin.name || admin.username}</p>
                    {profile?.id === admin.id ? <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300">You</span> : null}
                  </div>
                  <p className="truncate text-sm text-[#94A3B8]">{admin.email} · @{admin.username}</p>
                </div>
                {profile?.id !== admin.id && (
                  <Button variant="danger" size="sm" disabled={removingAdminId === admin.id} onClick={() => handleDeleteAdmin(admin)}>
                    <Trash2 size={15} /> {removingAdminId === admin.id ? "Deleting…" : "Delete"}
                  </Button>
                )}
              </div>
            ))}
            {!loading && !admins.length && <p className="p-5 text-sm text-[#94A3B8]">No administrators found.</p>}
          </div>
        </GlassCard>
      </div>

      <ChangePasswordModal
        open={pwModal}
        password={password}
        setPassword={setPassword}
        onClose={() => setPwModal(false)}
        onSave={handlePwChange}
      />
    </PageWrap>
  );
}
