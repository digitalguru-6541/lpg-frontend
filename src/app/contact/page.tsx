"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft, Clock } from "lucide-react";
import { usePathname } from "next/navigation";

export default function ComingSoonPage() {
  const pathname = usePathname();
  const pageName = pathname.replace('/', '').charAt(0).toUpperCase() + pathname.slice(2);

  return (
    <div className="relative w-full min-h-screen bg-brand-dark flex flex-col items-center justify-center font-sans overflow-hidden px-4">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ai/10 via-brand-dark to-brand-dark -z-10"></div>

      <div className="z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-lg">
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(139,92,246,0.2)]">
          <Clock className="w-10 h-10 text-ai-light" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          {pageName} <span className="text-gray-500">Hub</span>
        </h1>
        
        <p className="text-gray-400 text-lg leading-relaxed mb-8">
          We are currently training our AI models and gathering live market data for the <strong className="text-white">{pageName}</strong> module. This section will be launching soon.
        </p>

        <Link href="/" className="inline-flex items-center gap-2 bg-ai hover:bg-ai-light text-white px-8 py-4 rounded-full font-bold transition-all shadow-ai-glow group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to AI Concierge
        </Link>
      </div>
    </div>
  );
}