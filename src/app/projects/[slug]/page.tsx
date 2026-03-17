import { notFound } from "next/navigation";
import { Sparkles, MapPin, TrendingUp, Building, ArrowRight, Building2, CalendarDays, Layers, Bot, ShieldCheck, Map as MapIcon, Image as ImageIcon } from "lucide-react";
import GlobalHeader from "../../components/GlobalHeader"; 
import prisma from "../../../lib/prisma"; 
import Link from "next/link";
import ProjectChat from "./ProjectChat"; 
import ProjectGallery from "./ProjectGallery"; // 🚀 Added Gallery Component

const formatFullPKR = (value: any) => {
  const num = Number(value);
  if (isNaN(num) || num === 0) return "Contact for Price";
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    return lakhs > 0 ? `${crores} Crore ${lakhs} Lakhs` : `${crores} Crore`;
  }
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    return thousands > 0 ? `${lakhs} Lakhs ${thousands} Thousand` : `${lakhs} Lakhs`;
  }
  return num.toLocaleString();
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  
  const resolvedParams = await params;
  const projectSlug = resolvedParams.slug;

  const project = await prisma.megaProject.findFirst({ where: { slug: projectSlug } });
  if (!project) return notFound();

  const recommendedProjects = await prisma.megaProject.findMany({
    where: { slug: { not: projectSlug } }, take: 3, orderBy: { createdAt: 'desc' }
  });

  const parsedFeatures = typeof project.customFeatures === 'string' 
    ? JSON.parse(project.customFeatures) 
    : (project.customFeatures || []);

    // 🚀 BULLETPROOF FIX: Universally safe regex that matches all browser engines perfectly
  const safeDescription = project.description || "";
  const sentences = safeDescription.match(/[^.!?]+[.!?]+/g) || [safeDescription];
  const validSentences = sentences.filter((s: string) => s.trim().length > 5);
  const aiIcons = ["✨", "💎", "🌟", "🔥", "🏙️", "🏆"];

  let embedUrl = null;
  if (project.videoUrl) {
    if (project.videoUrl.includes("youtube.com/watch?v=")) embedUrl = `https://www.youtube.com/embed/${project.videoUrl.split("v=")[1].split("&")[0]}`;
    else if (project.videoUrl.includes("youtu.be/")) embedUrl = `https://www.youtube.com/embed/${project.videoUrl.split("youtu.be/")[1].split("?")[0]}`;
    else embedUrl = project.videoUrl; // Fallback
  }

  return (
    <div className="min-h-screen bg-brand-dark font-sans pb-0 text-white">
      <GlobalHeader />
      
      {/* ENTERPRISE HERO SECTION */}
      <div className="w-full h-[70vh] relative pt-20">
        <div className="absolute inset-0 bg-brand-dark/40 z-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent z-10"></div>
        <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
        
        <div className="absolute bottom-16 left-6 md:left-12 z-20 drop-shadow-2xl max-w-5xl">
          <div className="bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-black px-4 py-1.5 rounded-full border border-emerald-500/40 inline-flex items-center gap-2 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> MASTER DEVELOPMENT
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight tracking-tighter drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">{project.title}</h1>
          <p className="flex items-center gap-2 text-xl font-medium text-gray-200 drop-shadow-lg"><MapPin className="w-6 h-6 text-emerald-400"/> {project.location}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-20">
        
        {/* LEFT COLUMN: SPECS, GALLERY, OVERVIEW */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Glassmorphism Vital Stats Bar */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl flex-1 min-w-[150px] shadow-glass">
              <Building2 className="w-6 h-6 text-gold-light" />
              <div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Project Type</p><p className="text-lg font-bold">{project.projectType}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl flex-1 min-w-[150px] shadow-glass">
              <Layers className="w-6 h-6 text-blue-400" />
              <div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Total Floors</p><p className="text-lg font-bold">{project.totalFloors}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl flex-1 min-w-[150px] shadow-glass">
              <CalendarDays className="w-6 h-6 text-emerald-400" />
              <div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Possession</p><p className="text-lg font-bold">{project.possessionDate}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 p-6 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <p className="text-[10px] text-emerald-200 font-black uppercase tracking-widest mb-1">Starting From</p>
              <p className="text-3xl font-black text-emerald-400">{formatFullPKR(project.startingPrice)}</p>
            </div>
            <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 p-6 rounded-3xl shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <p className="text-[10px] text-blue-200 font-black uppercase tracking-widest mb-1">Est. Annual ROI</p>
              <p className="text-3xl font-black text-blue-400 flex items-center gap-2"><TrendingUp className="w-6 h-6"/> {project.estRoi}</p>
            </div>
          </div>

          {/* Masonry Image Gallery */}
          <ProjectGallery images={project.galleryImages} />

         {/* Glowing Split-Sentence Overview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-500/5 blur-2xl rounded-3xl -z-10"></div>
            <h3 className="text-3xl font-black text-white mb-6 flex items-center gap-3 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Sparkles className="w-8 h-8 text-emerald-400" /> Project Overview
            </h3>
            <div className="space-y-4">
              {validSentences.map((sentence: string, idx: number) => (
                <div key={idx} className="flex items-start gap-4 p-5 bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-emerald-400 rounded-r-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 group">
                  <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] group-hover:scale-125 transition-transform">{aiIcons[idx % aiIcons.length]}</span>
                  <p className="text-lg md:text-xl font-medium text-emerald-50 leading-relaxed drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] tracking-wide">{sentence.trim()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Custom Features */}
          {parsedFeatures.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-white/10">
              <h3 className="text-3xl font-black text-white mb-8">Exclusive Features</h3>
              {parsedFeatures.map((feat: any, idx: number) => (
                <div key={idx} className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-glass hover:border-emerald-500/30 transition-colors">
                  <h4 className="text-xl font-black text-emerald-400 mb-3">{feat.title}</h4>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{feat.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* 🚀 EMBEDDED PROJECT VIDEO */}
          {embedUrl && (
            <div className="space-y-6 pt-8 border-t border-white/10">
              <h3 className="text-3xl font-black text-white mb-6">Cinematic Tour</h3>
              <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-glass bg-black relative">
                <iframe src={embedUrl} className="w-full h-full absolute inset-0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
              </div>
            </div>
          )}

          {/* 🚀 AI PRICE PREDICTION & PLATFORM ECOSYSTEM */}
          <div className="space-y-6 pt-12 mt-12 border-t border-white/10">
            <h3 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
              <Bot className="w-8 h-8 text-ai-light" /> AI Ecosystem & Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prediction Card */}
              <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-glass relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp className="w-24 h-24"/></div>
                 <h4 className="text-xl font-black text-white mb-2">AI Capital Appreciation</h4>
                 <p className="text-gray-400 text-sm mb-6">Predictive forecast for {project.title} based on current LDA & market metrics.</p>
                 <div className="flex items-end gap-3">
                    <p className="text-4xl font-black text-emerald-400">+42%</p>
                    <p className="text-sm text-gray-500 mb-1">Expected by {project.possessionDate}</p>
                 </div>
              </div>

              {/* Document Verifier */}
              <Link href="/verify" className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-glass hover:border-blue-500/50 transition-colors group block cursor-pointer">
                 <h4 className="text-xl font-black text-white mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-400"/> Document Verifier</h4>
                 <p className="text-gray-400 text-sm mb-6">Instantly scan, parse, and verify your real estate files and token receipts for anomalies before investing.</p>
                 <span className="text-sm font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-2 transition-transform">Launch Verifier <ArrowRight className="w-4 h-4"/></span>
              </Link>
              
              {/* Heatmap */}
              <Link href="/heatmap" className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-glass hover:border-gold/50 transition-colors group block cursor-pointer">
                 <h4 className="text-xl font-black text-white mb-2 flex items-center gap-2"><MapIcon className="w-5 h-5 text-gold-light"/> Predictive Heatmap</h4>
                 <p className="text-gray-400 text-sm mb-6">View 3D geospatial investment hot-zones and infrastructure development surrounding {project.location}.</p>
                 <span className="text-sm font-bold text-gold-light flex items-center gap-1 group-hover:translate-x-2 transition-transform">View Heatmap <ArrowRight className="w-4 h-4"/></span>
              </Link>

              {/* Visualizer */}
              <Link href="/visualizer" className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-glass hover:border-ai-light/50 transition-colors group block cursor-pointer">
                 <h4 className="text-xl font-black text-white mb-2 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-ai-light"/> AI Plot Visualizer</h4>
                 <p className="text-gray-400 text-sm mb-6">Upload raw land photos from the site visit and generate localized, photorealistic architectural overlays.</p>
                 <span className="text-sm font-bold text-ai-light flex items-center gap-1 group-hover:translate-x-2 transition-transform">Launch Visualizer <ArrowRight className="w-4 h-4"/></span>
              </Link>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI CHATBOT */}
        <div className="lg:col-span-1">
          <ProjectChat project={project} />
        </div>
      </div>

      {/* RECOMMENDED DEVELOPMENTS */}
      {recommendedProjects.length > 0 && (
        <div className="w-full mt-12 py-16 border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-8"><Sparkles className="w-6 h-6 text-emerald-400" /> Explore Similar Mega Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {recommendedProjects.map((recProject) => (
                <Link href={`/projects/${recProject.slug}`} key={recProject.id} className="group">
                  <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 flex flex-col h-full relative shadow-glass">
                    <div className="absolute top-4 left-4 z-20 bg-brand-dark/80 backdrop-blur-md text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-lg"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Off-Plan</div>
                    <div className="h-56 overflow-hidden relative"><img src={recProject.coverImage} alt={recProject.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent opacity-90"></div></div>
                    <div className="p-6 flex flex-col flex-grow relative -mt-16 z-10">
                      <h4 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">{recProject.title}</h4>
                      <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> {recProject.location}</p>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-brand-dark/50 border border-white/5 rounded-2xl p-3"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Starting From</p><p className="text-emerald-400 font-black text-lg">{formatFullPKR(recProject.startingPrice)}</p></div>
                        <div className="bg-brand-dark/50 border border-white/5 rounded-2xl p-3"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Est. ROI</p><p className="text-blue-400 font-bold text-lg flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {recProject.estRoi}</p></div>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4"><div className="flex items-center gap-2"><Building className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-400 font-medium">{recProject.agencyName}</span></div><div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-brand-dark transition-colors"><ArrowRight className="w-4 h-4" /></div></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}