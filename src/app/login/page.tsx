"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User as UserIcon, ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  // Used for both Email AND Username
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (errorMsg) setErrorMsg("");
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid login credentials.");
        setIsLoading(false);
        return;
      }

      // 🚀 CRITICAL FIX 2: Absolute Ruthless Routing
      // If the backend designated a B2B dashboard, we wipe out the cache and force it.
      if (data.redirectUrl === "/dashboard" || data.redirectUrl === "/command-center") {
        window.location.href = data.redirectUrl; 
      } else {
        window.location.href = redirectUrl || data.redirectUrl || "/";
      }

    } catch (error) {
      setErrorMsg("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-brand-dark flex items-center justify-center font-sans px-4 overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury Real Estate"
          className="w-full h-full object-cover opacity-[0.03] mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ai/10 via-brand-dark to-brand-dark"></div>
      </div>

      <div className="z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black text-white tracking-tighter hover:opacity-80 transition-opacity">
            LPG<span className="text-ai-light">.com</span> <Sparkles className="w-5 h-5 text-gold-light" />
          </Link>
          <p className="text-gray-400 mt-3 text-sm">Secure Global Access Portal</p>
        </div>

        <div className="bg-glass-gradient backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-ai/20 rounded-full blur-3xl pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black ml-1">Email or Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@lpg.com or waqas_khan"
                  className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-ai/50 focus:bg-white/5 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black ml-1 flex justify-between">
                <span>Password</span>
                <a href="#" className="text-ai-light hover:text-white transition-colors">Forgot?</a>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-ai/50 focus:bg-white/5 transition-all shadow-inner font-mono tracking-widest"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center justify-center animate-in shake duration-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full mt-2 py-4 bg-ai hover:bg-ai-light text-white font-black text-lg rounded-2xl transition-all shadow-ai-glow disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Secure Login <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ai-light" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}