"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User as UserIcon, LogIn, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export default function GlobalHeader() {
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<{ name: string, role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 Automatically check if the user is logged in
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.isLoggedIn) {
            setActiveUser(data.user);
          }
        }
      } catch (error) {
        console.error("Failed to fetch auth state", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuth();
  }, [pathname]); 

  const getDashboardLink = () => {
    if (!activeUser) return "/login";
    if (activeUser.role === "MASTER_ADMIN") return "/command-center";
    if (activeUser.role === "AGENCY_PARTNER") return "/dashboard";
    return "/user-dashboard";
  };

  // Hide this header entirely inside Dashboards and Login Page
  if (
    pathname.includes('/dashboard') || 
    pathname.includes('/command-center') || 
    pathname.includes('/user-dashboard') || 
    pathname.includes('/login')
  ) {
    return null;
  }

  return (
    <header className="absolute top-0 inset-x-0 z-[100] h-24 bg-brand-dark/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 md:px-12 transition-all">
      
      {/* 1. Brand Logo */}
      <Link href="/" className="text-xl md:text-2xl font-extrabold text-white tracking-tighter hover:opacity-80 transition-opacity">
        LahorePropertyGuide<span className="text-ai-light">.com</span>
      </Link>

      {/* Right Side: Nav & Auth */}
      <div className="flex items-center gap-6 md:gap-8">
        
        {/* 2. LIVE Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
          <Link href="/insights" className="hover:text-white transition-colors">AI Insights</Link>
          <Link href="/news" className="hover:text-white transition-colors">News</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </nav>

        {/* 3. Smart Auth Section */}
        <div className="flex items-center gap-4 border-l border-white/10 pl-6 md:pl-8">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Loader2 className="w-4 h-4 text-ai-light animate-spin" />
            </div>
          ) : activeUser ? (
            <Link href={getDashboardLink()} className="flex items-center gap-3 group cursor-pointer">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-white leading-none group-hover:text-ai-light transition-colors line-clamp-1 max-w-[120px]">
                  {activeUser.name}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  {activeUser.role === 'USER' ? 'Investor' : activeUser.role.replace('_', ' ')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-ai to-blue-500 flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-transform border border-white/20 uppercase">
                {activeUser.name.charAt(0)}
              </div>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/5 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}