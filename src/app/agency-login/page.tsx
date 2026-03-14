"use client";

import { useState, useEffect } from "react";
import { Lock, Building, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AgencyLoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
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
      const res = await fetch("/api/agency-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Access Denied. Invalid credentials.");
        setIsLoading(false);
        return;
      }

      // 🚀 RUTHLESS REDIRECT: Bypass Next.js cache and force route
      window.location.href = data.redirectUrl;

    } catch (error) {
      setErrorMsg("Network error connecting to B2B Server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-brand-dark flex items-center justify-center font-sans px-4 overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-brand-dark to-brand-dark"></div>
      </div>

      <div className="z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black text-white tracking-tighter hover:opacity-80 transition-opacity">
            LPG<span className="text-gold-light">.com</span> <Building className="w-5 h-5 text-gold-light" />
          </Link>
          <p className="text-gold mt-3 text-sm font-bold uppercase tracking-widest">B2B Partner Portal</p>
        </div>

        <div className="bg-glass-gradient backdrop-blur-2xl border border-gold/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(217,119,6,0.15)] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/20 rounded-full blur-3xl pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black ml-1">Agent Username</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. waqas_khan"
                  className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-gold/50 focus:bg-white/5 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black ml-1 flex justify-between">
                <span>Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-gold/50 focus:bg-white/5 transition-all shadow-inner font-mono tracking-widest"
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
              disabled={isLoading || !formData.username || !formData.password}
              className="w-full mt-2 py-4 bg-gold hover:bg-gold-light text-brand-dark font-black text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Access Workspace <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-gold/70" />
          Restricted B2B Agency Access Only
        </div>
      </div>
    </div>
  );
}