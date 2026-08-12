import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
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

  return <PageWrap><div className="max-w-2xl">
      <GlassCard className="p-8">
      <ProfileCard name={profile?.name || profile?.username || "Admin User"} email={profile?.email || ""} role="Administrator" status="Active" onChangePassword={() => setPwModal(true)} />
      <ProfileInfoGrid items={profile ? [{ label: "Name", value: profile.name || "Not set" }, { label: "Username", value: profile.username }, { label: "Email", value: profile.email }, { label: "Notifications", value: profile.notifications ? "Enabled" : "Disabled" }, { label: "Email Alerts", value: profile.email_alerts ? "Enabled" : "Disabled" }, { label: "Sound Alerts", value: profile.sound_alerts ? "Enabled" : "Disabled" }, { label: "Resolution", value: profile.resolution }, { label: "Frame Rate", value: `${profile.fps} fps` }] : PROFILE_INFO} />
    </GlassCard>

    <GlassCard className="mt-6 p-8"><div className="mb-6 flex items-start gap-3"><div className="rounded-xl bg-blue-500/15 p-3 text-blue-300"><UserPlus size={20} /></div><div><h2 className="font-semibold text-white">Add college administrator</h2><p className="mt-1 text-sm text-[#94A3B8]">This account will belong only to your college.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Administrator name" placeholder="Dr. Priya Sharma" value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} /><Input label="Username" placeholder="registrar" value={adminForm.username} onChange={(event) => setAdminForm({ ...adminForm, username: event.target.value })} /><Input label="College email" type="email" placeholder="registrar@college.edu" value={adminForm.email} onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} /><Input label="Temporary password" type="password" placeholder="Create a password" value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} /></div><Button className="mt-5" onClick={handleAddAdmin} disabled={addingAdmin}>{addingAdmin ? "Creating account…" : <><UserPlus size={16} /> Create administrator</>}</Button></GlassCard>

    <GlassCard className="mt-6 p-8"><h2 className="font-semibold text-white">College administrators</h2><p className="mt-1 text-sm text-[#94A3B8]">Only signed-in administrators from this college can see this list.</p><div className="mt-5 divide-y divide-white/10 rounded-xl border border-white/10">{loading ? <p className="p-4 text-sm text-[#94A3B8]">Loading administrators…</p> : admins.map((admin) => <div key={admin.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="truncate font-medium text-white">{admin.name || admin.username}{profile?.id === admin.id ? " (You)" : ""}</p><p className="truncate text-sm text-[#94A3B8]">{admin.email} · @{admin.username}</p></div>{profile?.id !== admin.id && <Button variant="danger" size="sm" disabled={removingAdminId === admin.id} onClick={() => handleDeleteAdmin(admin)}><Trash2 size={15} /> {removingAdminId === admin.id ? "Deleting…" : "Delete"}</Button>}</div>)}{!loading && !admins.length && <p className="p-4 text-sm text-[#94A3B8]">No administrators found.</p>}</div></GlassCard>
  </div><ChangePasswordModal open={pwModal} password={password} setPassword={setPassword} onClose={() => setPwModal(false)} onSave={handlePwChange} /></PageWrap>;
}
