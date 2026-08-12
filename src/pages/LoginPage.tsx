import { FormEvent, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, RefreshCw, Shield, Users } from "lucide-react";
import { toast } from "sonner";

import Button from "../components/ui/Button";
import FaceTrackMark from "../components/branding/FaceTrackMark";
import Input from "../components/ui/Input";
import { login, registerCollege, setAuthToken } from "../services/api";

interface LoginPageProps {
  onLogin: (token: string) => void;
}

type Mode = "login" | "register";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ collegeSlug: "", username: "", password: "" });
  const [collegeForm, setCollegeForm] = useState({ collegeName: "", collegeSlug: "", username: "", name: "", email: "", password: "" });

  async function finishLogin(collegeSlug: string, username: string, password: string) {
    const data = await login(collegeSlug, username, password);
    setAuthToken(data.access_token);
    onLogin(data.access_token);
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (Object.values(loginForm).some((value) => !value.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await finishLogin(loginForm.collegeSlug, loginForm.username, loginForm.password);
      toast.success("Login successful");
    } catch (error: any) {
      toast.error(error?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleCollegeRegistration(event: FormEvent) {
    event.preventDefault();
    if (Object.values(collegeForm).some((value) => !value.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const result = await registerCollege({
        college_name: collegeForm.collegeName,
        college_slug: collegeForm.collegeSlug,
        username: collegeForm.username,
        name: collegeForm.name,
        email: collegeForm.email,
        password: collegeForm.password,
      });
      setRegistrationMessage(result.message);
      toast.success("Verification email sent");
    } catch (error: any) {
      toast.error(error?.message || "Unable to register the college");
    } finally {
      setLoading(false);
    }
  }

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setLoading(false);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(37,99,235,.25),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(124,58,237,.20),transparent_24%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_.9fr] lg:px-10">
        <section className="max-w-2xl">
          <div className="mb-9 flex items-center gap-3"><FaceTrackMark size="sm" /><span className="font-semibold tracking-wide">FaceTrack</span></div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-200"><Shield size={15} /> College attendance, securely managed</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Attendance that starts with a <span className="text-blue-400">recognised face.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Register your college using its official email, manage student attendance, and give your team secure administrator access.</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              [Building2, "Register college", "Create your college workspace"],
              [Users, "Add your team", "Create multiple admin accounts"],
              [CheckCircle2, "Track attendance", "One shared, secure system"],
            ].map(([Icon, title, description]) => {
              const FeatureIcon = Icon as typeof Building2;
              return <div key={title as string} className="rounded-2xl border border-white/10 bg-white/5 p-4"><FeatureIcon className="mb-3 text-blue-400" size={20} /><p className="font-medium">{title as string}</p><p className="mt-1 text-xs leading-5 text-slate-400">{description as string}</p></div>;
            })}
          </div>
          <a href="/student-attendance" className="mt-8 inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200">View a student attendance report <ArrowRight size={15} /></a>
        </section>

        <section className="w-full max-h-[80vh] overflow-auto no-scrollbar rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div className="mb-7 flex rounded-xl bg-slate-800 p-1">
            <button type="button" onClick={() => changeMode("login")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "login" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>Log in</button>
            <button type="button" onClick={() => changeMode("register")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "register" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>Register college</button>
          </div>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><h2 className="text-2xl font-bold">Welcome back</h2><p className="mt-1 text-sm text-slate-400">Use your college administrator account.</p></div>
              <Input label="College ID" placeholder="e.g. greenfield-college" value={loginForm.collegeSlug} onChange={(event) => setLoginForm({ ...loginForm, collegeSlug: event.target.value })} />
              <Input label="Username" placeholder="Enter your username" value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} />
              <Input label="Password" type="password" placeholder="Enter your password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
              <Button type="submit" size="lg" className="w-full justify-center" disabled={loading}>{loading ? <><RefreshCw size={16} className="animate-spin" /> Signing in…</> : <><Shield size={16} /> Log in</>}</Button>
            </form>
          ) : registrationMessage ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={44} />
              <h2 className="text-2xl font-bold">Check your college email</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">{registrationMessage} No college record is created until you verify that link.</p>
              <Button variant="secondary" className="mt-6" onClick={() => { setRegistrationMessage(null); changeMode("login"); }}>Back to login</Button>
            </div>
          ) : (
            <form onSubmit={handleCollegeRegistration} className="space-y-3">
              <div><h2 className="text-2xl font-bold">Register your college</h2><p className="mt-1 text-sm text-slate-400">Your email becomes the first administrator account.</p></div>
              <Input label="College name" placeholder="Greenfield College" value={collegeForm.collegeName} onChange={(event) => setCollegeForm({ ...collegeForm, collegeName: event.target.value })} />
              <Input label="College ID" placeholder="greenfield-college" value={collegeForm.collegeSlug} onChange={(event) => setCollegeForm({ ...collegeForm, collegeSlug: event.target.value })} />
              <Input label="Administrator name" placeholder="Dr. Priya Sharma" value={collegeForm.name} onChange={(event) => setCollegeForm({ ...collegeForm, name: event.target.value })} />
              <Input label="Administrator username" placeholder="admin" value={collegeForm.username} onChange={(event) => setCollegeForm({ ...collegeForm, username: event.target.value })} />
              <Input label="Official college email" type="email" placeholder="admin@college.edu" value={collegeForm.email} onChange={(event) => setCollegeForm({ ...collegeForm, email: event.target.value })} />
              <Input label="Password" type="password" placeholder="Create a password" value={collegeForm.password} onChange={(event) => setCollegeForm({ ...collegeForm, password: event.target.value })} />
              <Button type="submit" size="lg" className="w-full justify-center" disabled={loading}>{loading ? <><RefreshCw size={16} className="animate-spin" /> Creating…</> : <><Building2 size={16} /> Create college account</>}</Button>
            </form>
          )}
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">After signing in, use your administrator account to add more admins for the same college.</p>
        </section>
      </div>
    </main>
  );
}
