"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, MapPin, Building, TrendingUp, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetching live inventory, focusing on featured or high-value properties as "Projects"
        const res = await fetch('/api/inventory?t=' + new Date().getTime(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // For the projects page, we'll show featured listings or filter as needed
          setProjects(data.filter((p: any) => p.isFeatured) || data.slice(0, 6)); 
        }
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-brand-dark flex flex-col items-center justify-start pt-28 pb-12 px-4 md:px-8 font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-brand-dark to-brand-dark"></div>
      </div>

      <div className="z-10 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Page Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Sparkles className="w-4 h-4" /> Live Developments
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-tight">
            Premium Mega <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Projects</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Discover highly vetted, AI-approved mega developments. Secure your allocation before public launch.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-400 font-medium tracking-widest uppercase text-sm">Syncing Live Inventory...</p>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link href={`/properties/${project.id}`} key={project.id} className="group block">
                <div className="bg-[#162032] border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition-all duration-500 h-full flex flex-col relative">
                  
                  {/* Image Container */}
                  <div className="h-64 relative overflow-hidden">
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#162032] via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-brand-dark/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Off-Plan
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">{project.title}</h3>
                    <p className="flex items-center gap-2 text-sm text-gray-400 mb-6"><MapPin className="w-4 h-4 text-blue-400" /> {project.location}, {project.city}</p>
                    
                    {/* Project Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-brand-dark/50 p-3 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Starting From</p>
                        <p className="font-extrabold text-emerald-400">{project.priceFormatted}</p>
                      </div>
                      <div className="bg-brand-dark/50 p-3 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Est. ROI</p>
                        <p className="font-extrabold text-blue-400 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> 18-22%</p>
                      </div>
                    </div>

                    {/* Developer Info & CTA */}
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{project.agencyName || "Master Developer"}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-blue-500 text-white flex items-center justify-center transition-colors">
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Building className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No featured projects available at the moment.</p>
          </div>
        )}

      </div>
    </div>
  );
}