import { FormEvent, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, RefreshCw, Shield, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import Button from "../components/ui/Button";
import FaceTrackMark from "../components/branding/FaceTrackMark";
import Input from "../components/ui/Input";
import { login, registerCollege, setAuthToken, type AuthRole } from "../services/api";

interface LoginPageProps { onLogin: (token: string, role: AuthRole) => void; }
type Mode = "login" | "register";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ collegeSlug: "", username: "", password: "" });
  const [collegeForm, setCollegeForm] = useState({ collegeName: "", collegeSlug: "", username: "", name: "", email: "", password: "" });

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (Object.values(loginForm).some((value) => !value.trim())) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const data = await login(loginForm.collegeSlug, loginForm.username, loginForm.password);
      setAuthToken(data.access_token);
      onLogin(data.access_token, data.role);
      toast.success(data.role === "teacher" ? "Teacher login successful" : "Login successful");
    } catch (error: any) { toast.error(error?.message || "Invalid credentials"); }
    finally { setLoading(false); }
  }

  async function handleCollegeRegistration(event: FormEvent) {
    event.preventDefault();
    if (Object.values(collegeForm).some((value) => !value.trim())) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const result = await registerCollege({ college_name: collegeForm.collegeName, college_slug: collegeForm.collegeSlug, username: collegeForm.username, name: collegeForm.name, email: collegeForm.email, password: collegeForm.password });
      setRegistrationMessage(result.message); toast.success("Verification email sent");
    } catch (error: any) { toast.error(error?.message || "Unable to register the college"); }
    finally { setLoading(false); }
  }

  const changeMode = (nextMode: Mode) => { setMode(nextMode); setLoading(false); setRegistrationMessage(null); };

  return (
    <main className="relative h-screen overflow-hidden bg-[#020817] text-white">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative mx-auto grid h-full max-w-7xl min-h-0 items-center gap-10 overflow-hidden px-5 py-6 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:px-10 lg:py-8">
        <section className="max-w-2xl lg:py-4">
          <div className="mb-8 flex items-center gap-3"><div className="rounded-xl border border-white/10 bg-white/5 p-2 shadow-lg shadow-blue-950/30"><FaceTrackMark size="sm" /></div><span className="text-lg font-semibold tracking-tight">FaceTrack</span></div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-sm text-blue-200 shadow-lg shadow-blue-950/20"><Sparkles size={15} /> Smart attendance management</div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Attendance made <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">simple, secure, and smart.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Manage students, lectures, face registration, and attendance from one secure college workspace.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">{[[Fingerprint, "Face recognition", "Fast attendance marking"], [Users, "Student management", "Keep records organised"], [CheckCircle2, "Live insights", "Know attendance at a glance"]].map(([Icon, title, description]) => { const FeatureIcon = Icon as typeof Fingerprint; return <div key={title as string} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-white/[0.07]"><FeatureIcon className="mb-3 text-blue-400 transition group-hover:text-cyan-300" size={20} /><p className="font-medium">{title as string}</p><p className="mt-1 text-xs leading-5 text-slate-400">{description as string}</p></div>; })}</div>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-400"><span className="inline-flex items-center gap-2"><Shield size={14} className="text-emerald-400" /> Secure college access</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Admin and teacher accounts</span></div>
          <a href="/student-attendance" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:gap-3 hover:text-blue-200">View a student attendance report <ArrowRight size={15} /></a>
        </section>
        <section className="max-h-full w-full overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7 lg:p-8">
          <div className="mb-7 flex rounded-xl border border-white/5 bg-slate-950/70 p-1"><button type="button" onClick={() => changeMode("login")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "login" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40" : "text-slate-400 hover:text-white"}`}>Log in</button><button type="button" onClick={() => changeMode("register")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "register" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40" : "text-slate-400 hover:text-white"}`}>Register college</button></div>
          {mode === "login" ? <form onSubmit={handleLogin} className="space-y-4"><div className="mb-5"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><LockKeyhole size={21} /></div><h2 className="text-2xl font-bold tracking-tight">Welcome back</h2><p className="mt-1.5 text-sm text-slate-400">Sign in with your college administrator or teacher account.</p></div><Input label="College ID" placeholder="e.g. greenfield-college" value={loginForm.collegeSlug} onChange={(event) => setLoginForm({ ...loginForm, collegeSlug: event.target.value })} /><Input label="Username" placeholder="Enter your username" value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} /><div className="relative"><Input label="Password" type={showLoginPassword ? "text" : "password"} placeholder="Enter your password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} /><button type="button" aria-label={showLoginPassword ? "Hide password" : "Show password"} onClick={() => setShowLoginPassword((value) => !value)} className="absolute right-3 top-[31px] rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white">{showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><Button type="submit" size="lg" className="mt-2 w-full justify-center" disabled={loading}>{loading ? <><RefreshCw size={16} className="animate-spin" /> Signing in…</> : <><Shield size={16} /> Log in</>}</Button><p className="pt-1 text-center text-xs text-slate-500">Your account is protected by your college workspace.</p></form> : registrationMessage ? <div className="py-8 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400"><Mail size={30} /></div><h2 className="text-2xl font-bold">Check your college email</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">{registrationMessage} No college record is created until you verify that link.</p><Button variant="secondary" className="mt-6" onClick={() => { setRegistrationMessage(null); changeMode("login"); }}>Back to login</Button></div> : <form onSubmit={handleCollegeRegistration} className="space-y-3"><div className="mb-5"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400"><Building2 size={21} /></div><h2 className="text-2xl font-bold tracking-tight">Register your college</h2><p className="mt-1.5 text-sm text-slate-400">Create your workspace and verify it through the official email.</p></div><Input label="College name" placeholder="Greenfield College" value={collegeForm.collegeName} onChange={(event) => setCollegeForm({ ...collegeForm, collegeName: event.target.value })} /><Input label="College ID" placeholder="greenfield-college" value={collegeForm.collegeSlug} onChange={(event) => setCollegeForm({ ...collegeForm, collegeSlug: event.target.value })} /><Input label="Administrator name" placeholder="Dr. Priya Sharma" value={collegeForm.name} onChange={(event) => setCollegeForm({ ...collegeForm, name: event.target.value })} /><Input label="Administrator username" placeholder="admin" value={collegeForm.username} onChange={(event) => setCollegeForm({ ...collegeForm, username: event.target.value })} /><Input label="Official college email" type="email" placeholder="admin@college.edu" value={collegeForm.email} onChange={(event) => setCollegeForm({ ...collegeForm, email: event.target.value })} /><div className="relative"><Input label="Password" type={showRegisterPassword ? "text" : "password"} placeholder="Create a password" value={collegeForm.password} onChange={(event) => setCollegeForm({ ...collegeForm, password: event.target.value })} /><button type="button" aria-label={showRegisterPassword ? "Hide password" : "Show password"} onClick={() => setShowRegisterPassword((value) => !value)} className="absolute right-3 top-[31px] rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white">{showRegisterPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><Button type="submit" size="lg" className="mt-2 w-full justify-center" disabled={loading}>{loading ? <><RefreshCw size={16} className="animate-spin" /> Creating…</> : <><Building2 size={16} /> Create college account</>}</Button></form>}
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">Admins manage the college; teachers see only their assigned classes and lectures.</p>
        </section>
      </div>
    </main>
  );
}
