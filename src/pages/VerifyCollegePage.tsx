import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import Button from "../components/ui/Button";
import FaceTrackMark from "../components/branding/FaceTrackMark";
import { verifyCollegeEmail } from "../services/api";

export default function VerifyCollegePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your college email…");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    verifyCollegeEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Your college workspace and first administrator account are ready.");
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(error.message || "This verification link is invalid or expired.");
      });
  }, []);

  return <main className="flex min-h-screen items-center justify-center bg-[#020817] p-6 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl"><div className="mb-8 flex justify-center"><FaceTrackMark size="md" /></div>{status === "loading" ? <RefreshCw className="mx-auto animate-spin text-blue-400" size={42} /> : status === "success" ? <CheckCircle2 className="mx-auto text-emerald-400" size={42} /> : <XCircle className="mx-auto text-red-400" size={42} />}<h1 className="mt-5 text-2xl font-bold">{status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Verifying email"}</h1><p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>{status !== "loading" && <Button className="mt-7" onClick={() => { window.location.href = "/"; }}>Go to login</Button>}</section></main>;
}
