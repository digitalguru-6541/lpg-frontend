"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Sparkles, Send, Bot, Star, User, MapPin, TrendingUp, LayoutList, Map as MapIcon, ChevronRight, Flame, Calculator, Play, Building, ShieldCheck, ExternalLink, Image as ImageIcon, FileText, Phone, X } from "lucide-react";
import Link from "next/link";

// --- Interfaces ---
interface Property { id: string; title: string; price: string; matchScore: string; roiBadge: string; imageUrl: string; isFeatured: boolean; }
interface Message { role: "user" | "ai"; content: string; }
interface LeadData { score: number; extractedName: string; extractedLocation: string; extractedBudget: string; intent: string; }
interface AdData { id: string; title: string; imageUrl: string; placement: string; }
interface Lifestyle { id: string; title: string; countText: string; imageUrl: string; targetUrl: string; isActive: boolean; }

// --- Static Data ---
const QUICK_PROMPTS = [
  "💰 Plots under 5 Crore in DHA", "🏢 High-ROI Commercial Projects",
  "🌍 I am an Overseas Investor", "🏠 Bahria Town Installment Plans"
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentProperties, setCurrentProperties] = useState<Property[]>([]);
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  // 🚀 Live Database States
  const [heroAd, setHeroAd] = useState<AdData | null>(null);
  const [sidebarAd, setSidebarAd] = useState<AdData | null>(null);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [lifestyleCollections, setLifestyleCollections] = useState<Lifestyle[]>([]);

  // 🧠 Sticky Chat Session State & Mobile Toggle
  const [sessionId, setSessionId] = useState<string>("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [investment, setInvestment] = useState(5);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Session Memory & Live Database Data on Load
  useEffect(() => {
    // 🧠 1. Get or Create Persistent Session ID
    let currentSessionId = localStorage.getItem("lpg_session_id");
    if (!currentSessionId) {
      currentSessionId = "session_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("lpg_session_id", currentSessionId);
    }
    setSessionId(currentSessionId);

    // 🧠 2. Fetch Database Chat Memory
    const fetchChatMemory = async () => {
      try {
        const res = await fetch(`/api/gemini?sessionId=${currentSessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            setHasStarted(true);
          }
        }
      } catch (err) { console.error("Memory Fetch Error:", err); }
    };
    fetchChatMemory();

    // 3. Load UI states
    const savedProps = sessionStorage.getItem("lpg_current_props");
    if (savedProps) { setCurrentProperties(JSON.parse(savedProps)); }

    // 🚀 Unified Data Fetch (Ads, Inventory, Lifestyles)
    const fetchInitialData = async () => {
      try {
        const resAds = await fetch('/api/ads');
        if (resAds.ok) {
          const fetchedAds = await resAds.json();
          const homeBanner = fetchedAds.find((a: AdData) => a.placement === 'homepage');
          const sideBanner = fetchedAds.find((a: AdData) => a.placement === 'sidebar');
          if (homeBanner) setHeroAd(homeBanner);
          if (sideBanner) setSidebarAd(sideBanner);
        }

        const resProps = await fetch('/api/inventory');
        if (resProps.ok) {
          const fetchedProps = await resProps.json();
          const featured = fetchedProps.filter((p: Property) => p.isFeatured).slice(0, 10);
          setFeaturedProperties(featured);
        }

        const resLifestyles = await fetch('/api/lifestyles');
        if (resLifestyles.ok) {
          const fetchedLifestyles = await resLifestyles.json();
          setLifestyleCollections(fetchedLifestyles.filter((l: Lifestyle) => l.isActive));
        }
      } catch (err) { console.error("Initial Data Fetch Error:", err); }
    };
    fetchInitialData();
  }, []);

  // 🚀 INSTANT RANDOM PROPERTIES: Fill screen while AI is loading
  useEffect(() => {
    if (hasStarted && currentProperties.length === 0 && featuredProperties.length > 0) {
      // Create a heavily duplicated and shuffled array for that "unlimited scrolling" feel
      const extendedProperties = [...featuredProperties, ...featuredProperties].sort(() => 0.5 - Math.random());
      setCurrentProperties(extendedProperties);
    }
  }, [hasStarted, currentProperties.length, featuredProperties]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isMobileChatOpen]);

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) { alert("Voice search is not supported in this browser. Try Chrome!"); return; }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => { setInput(event.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleQuickPrompt = (prompt: string) => setInput(prompt);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages); setInput(""); setHasStarted(true); setIsLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newMessages, sessionId: sessionId }),
      });
      const data = await res.json();

      if (res.ok && data.reply) {
        const finalMessages: Message[] = [...newMessages, { role: "ai", content: data.reply }];
        setMessages(finalMessages); setLeadData(data.leadData);
        if (data.properties && data.properties.length > 0) {
          setCurrentProperties(data.properties);
          sessionStorage.setItem("lpg_current_props", JSON.stringify(data.properties));
        }
      }
    } catch (error) { console.error("Fetch error:", error); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-start pt-24 pb-0 px-4 md:px-8">
      <div className="fixed inset-0 bg-brand-dark z-0"><img src="https://images.unsplash.com/photo-1627883216894-f20387438c7f?q=80&w=2000&auto=format&fit=crop" alt="Lahore Skyline" className="w-full h-full object-cover opacity-10 mix-blend-overlay fixed" /></div>

      <div className="z-10 w-full max-w-7xl flex flex-col items-center flex-grow">
        <div className={`text-center transition-all duration-700 ${hasStarted ? 'mb-6 scale-90 hidden md:block' : 'mt-12 mb-10 scale-100'}`}>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">Discover <span className="text-gold-light">Lahore</span> With AI.</h1>
          {!hasStarted && <p className="text-gray-400 text-lg">Pakistan's first predictive real estate engine.</p>}
        </div>

        {!hasStarted && (
          <div className="w-full max-w-3xl flex flex-col items-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <form onSubmit={handleSubmit} className="w-full bg-glass-gradient backdrop-blur-md shadow-glass border border-white/10 rounded-full p-2 flex items-center transition-all duration-500 focus-within:shadow-ai-glow focus-within:border-ai/50 mb-6">
              <div className="pl-6 pr-4 text-ai-light"><Sparkles className="w-6 h-6 animate-pulse-slow" /></div>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or speak your requirements..." className="flex-grow bg-transparent text-white placeholder-gray-400 text-lg outline-none py-4" />
              <button type="button" onClick={handleVoiceInput} className={`p-4 mr-2 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Mic className="w-5 h-5" /></button>
              <button type="submit" disabled={!input.trim()} className="p-4 bg-ai hover:bg-ai-light text-white rounded-full transition-colors disabled:opacity-50 shadow-ai-glow"><Send className="w-5 h-5" /></button>
            </form>
            <div className="flex flex-wrap justify-center gap-3">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button key={idx} onClick={() => handleQuickPrompt(prompt)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white transition-all hover:border-ai/30 hover:-translate-y-0.5">{prompt}</button>
              ))}
            </div>
          </div>
        )}

        {/* --- PRE-CHAT EXTENDED HOMEPAGE --- */}
        {!hasStarted && (
          <div className="w-full flex flex-col gap-16 animate-in fade-in duration-1000 delay-300 pb-24">
            {/* 🚀 DYNAMIC HOMEPAGE AD PLACEMENT */}
            {heroAd && (
              <div className="relative w-full h-32 md:h-48 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] group cursor-pointer animate-in zoom-in-95 duration-700">
                <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-white/20">Sponsored</div>
                <img src={heroAd.imageUrl} alt={heroAd.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/40 to-transparent"></div>
                <div className="absolute inset-y-0 left-8 md:left-12 flex flex-col justify-center">
                  <h3 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">{heroAd.title}</h3>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold group-hover:text-emerald-300 transition-colors">
                    View Project <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* Row 1: Market Intel & Carousel */}
            <div className="w-full flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/3 bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-glass flex flex-col">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="p-2 bg-emerald/20 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-light" /></div>
                  <div><h3 className="text-xl font-bold text-white leading-tight">Live Market Intel</h3><p className="text-xs text-gray-400">Lahore • Q1 2026</p></div>
                </div>
                <div className="space-y-4 flex-grow">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-xs text-ai-light font-bold uppercase tracking-wider mb-1 block">Market Sentiment</span>
                    <div className="flex items-end gap-2"><span className="text-2xl font-bold text-white">Bullish</span><span className="text-emerald-400 text-sm mb-1">+4.2% YoY</span></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-gold-light" /> Top 5 Hot Zones</h4>
                    <ul className="space-y-3">
                      {['DHA Phase 9 Prism', 'Bahria Town Sector F', 'Gulberg Commercial', 'Lake City Golf Estate', 'Ravi Riverfront'].map((zone, i) => (
                        <li key={i} className="flex items-center justify-between text-sm"><span className="text-gray-300"><span className="text-gray-500 mr-2">{i+1}.</span>{zone}</span><TrendingUp className="w-3 h-3 text-emerald-400" /></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-2/3 bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-glass overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><Star className="w-5 h-5 text-gold-light" /> Premium Listings</h3>
                  <Link href="#" className="text-xs text-ai-light hover:text-white flex items-center gap-1 transition-colors">View All <ChevronRight className="w-3 h-3" /></Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
                  {featuredProperties.map((prop) => (
                    <Link href={`/properties/${prop.id}`} key={prop.id} className="min-w-[280px] w-[280px] shrink-0 snap-start group block">
                      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-gold/50 transition-colors cursor-pointer relative h-full">
                        <div className="absolute top-3 left-3 z-20 bg-gold text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg"><Star className="w-3 h-3 fill-current" /> Featured</div>
                        <div className="h-40 overflow-hidden"><img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                        <div className="p-4"><h4 className="text-lg font-bold text-white line-clamp-1 mb-1 group-hover:text-gold-light transition-colors">{prop.title}</h4><p className="text-emerald-light font-semibold">{prop.price || (prop as any).priceFormatted}</p></div>
                      </div>
                    </Link>
                  ))}
                  {featuredProperties.length === 0 && (
                    <div className="text-gray-500 text-sm flex items-center h-40">Loading premium inventory...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Lifestyle Collections */}
            <div>
              <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-white flex items-center gap-2"><Building className="w-6 h-6 text-ai-light" /> Explore by Lifestyle</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {lifestyleCollections.map((collection) => (
                  <Link href={collection.targetUrl || "#"} key={collection.id}>
                    <div className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer shadow-glass border border-white/10">
                      <img src={collection.imageUrl} alt={collection.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6"><h4 className="text-2xl font-bold text-white mb-1">{collection.title}</h4><p className="text-sm text-ai-light font-medium">{collection.countText}</p></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Row 3: ROI Calculator & Drone Tours */}
            <div className="w-full flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/2 bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald/20 rounded-2xl"><Calculator className="w-6 h-6 text-emerald-light" /></div>
                  <div><h3 className="text-2xl font-bold text-white">AI Investment Calculator</h3><p className="text-sm text-gray-400">Forecasted 5-Year Return</p></div>
                </div>
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-400 mb-4"><span>Initial Investment</span><span className="font-bold text-white">PKR {investment} Crore</span></div>
                  <input type="range" min="1" max="20" step="0.5" value={investment} onChange={(e) => setInvestment(parseFloat(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
                <div className="p-6 bg-emerald/10 border border-emerald/20 rounded-2xl text-center">
                  <p className="text-sm text-emerald-100 mb-1">Projected Value (2030)</p>
                  <p className="text-4xl font-extrabold text-emerald-400">PKR {(investment * 1.58).toFixed(1)} Cr*</p>
                </div>
              </div>
              <div className="w-full lg:w-1/2 relative rounded-3xl overflow-hidden shadow-glass border border-white/10 group cursor-pointer h-[400px]">
                <img src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=1200&auto=format&fit=crop" alt="Drone View" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-brand-dark/40 group-hover:bg-brand-dark/20 transition-colors flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"><Play className="w-8 h-8 text-white ml-1" /></div>
                  <h3 className="text-2xl font-bold text-white mt-6 drop-shadow-lg">Cinematic Drone Tours</h3>
                  <p className="text-white/80 mt-2 font-medium">Explore DHA Phase 9 Prism from above</p>
                </div>
              </div>
            </div>

            {/* 🚀 NEW ROW: AI ECOSYSTEM & PLATFORM TOOLS */}
            <div className="w-full pt-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-ai-light" /> AI Tool Ecosystem</h3>
                  <p className="text-sm text-gray-400 mt-1">Leverage predictive analytics, computer vision, and market algorithms.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/heatmap" className="group">
                  <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-glass hover:border-ai/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all h-full">
                    <div className="w-12 h-12 bg-ai/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><MapIcon className="w-6 h-6 text-ai-light" /></div>
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-ai-light transition-colors">Predictive Heatmap</h4>
                    <p className="text-sm text-gray-400">View 3D geospatial investment hot-zones and 5-year capital appreciation forecasts.</p>
                  </div>
                </Link>

                <Link href="/visualizer" className="group">
                  <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-glass hover:border-gold/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all h-full">
                    <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ImageIcon className="w-6 h-6 text-gold-light" /></div>
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-gold-light transition-colors">AI Plot Visualizer</h4>
                    <p className="text-sm text-gray-400">Upload a photo of raw land and generate localized, photorealistic architectural overlays.</p>
                  </div>
                </Link>

                <Link href="/verify" className="group">
                  <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-glass hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all h-full">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ShieldCheck className="w-6 h-6 text-emerald-400" /></div>
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Document Verifier</h4>
                    <p className="text-sm text-gray-400">Instantly scan, parse, and verify real estate files and token receipts for anomalies.</p>
                  </div>
                </Link>

                <Link href="/insights" className="group">
                  <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-glass hover:border-blue-500/50 transition-all h-full">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6 text-blue-400" /></div>
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">AI Market Insights</h4>
                    <p className="text-sm text-gray-400">Read dynamically generated reports and sentiment analysis on Lahore's shifting market.</p>
                  </div>
                </Link>

                <Link href="/news" className="group">
                  <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-glass hover:border-white/30 transition-all h-full">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6 text-gray-300" /></div>
                    <h4 className="text-lg font-bold text-white mb-2">Real Estate News</h4>
                    <p className="text-sm text-gray-400">Stay updated on the latest infrastructure developments like RUDA and LDA approvals.</p>
                  </div>
                </Link>

                <Link href="/contact" className="group">
                  <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-glass hover:border-brand-light/50 transition-all h-full">
                    <div className="w-12 h-12 bg-brand-light/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Phone className="w-6 h-6 text-brand-light" /></div>
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-brand-light transition-colors">Contact Concierge</h4>
                    <p className="text-sm text-gray-400">Get direct support from our master admins for onboarding or premium B2B queries.</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Row 4: B2B Trust Bar */}
            <div className="border-y border-white/5 py-12 flex flex-col items-center">
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-8 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Trusted by Top Agencies</p>
              <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-2xl font-black tracking-tighter text-white">Ali Saqlain Estate</div>
                <div className="text-2xl font-serif italic font-bold text-white">Chohan Estate</div>
                <div className="text-2xl font-bold uppercase tracking-widest text-white">Zameen Connect</div>
                <div className="text-2xl font-light tracking-widest text-white">I L A A N</div>
              </div>
            </div>
          </div>
        )}

        {/* --- ACTIVE CHAT LAYOUT --- */}
        {hasStarted && (
          <div className="w-full flex flex-col lg:flex-row gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 🚀 MOBILE FAB TOGGLE BUTTON */}
            {!isMobileChatOpen && (
              <button
                onClick={() => setIsMobileChatOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-ai text-white rounded-full shadow-[0_0_30px_rgba(139,92,246,0.6)] flex items-center justify-center z-[100] transition-transform hover:scale-105"
              >
                <Bot className="w-6 h-6" />
              </button>
            )}

            {/* Sticky Chat Container */}
            <div className={`
              ${isMobileChatOpen ? 'fixed inset-0 z-[100] p-4 pt-16 bg-brand-dark/20 backdrop-blur-md flex flex-col overflow-y-auto custom-scrollbar' : 'hidden lg:flex'}
              w-full lg:w-1/3 lg:flex-col lg:gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:p-0 lg:bg-transparent lg:z-40 shrink-0
            `}>
              
              {/* Close button for Mobile */}
              {isMobileChatOpen && (
                 <div className="flex justify-end mb-2 lg:hidden shrink-0">
                   <button onClick={() => setIsMobileChatOpen(false)} className="p-2 bg-brand-dark/40 rounded-full text-white hover:bg-brand-dark/60 transition-colors backdrop-blur-xl shadow-lg border border-white/10">
                     <X className="w-6 h-6" />
                   </button>
                 </div>
              )}

              <div className="bg-brand-dark/40 lg:bg-brand-dark/70 backdrop-blur-xl lg:backdrop-blur-2xl border border-white/10 rounded-3xl shadow-glass flex flex-col flex-grow overflow-hidden shrink-0 ring-1 ring-white/20 min-h-[400px]">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-brand-dark/20 lg:bg-brand-dark/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ai/20 rounded-full"><Bot className="w-5 h-5 text-ai-light" /></div>
                    <div><h3 className="text-lg font-semibold text-white leading-tight">AI Advisor</h3><p className="text-xs text-emerald-light">Online • Lahore Expert</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    {leadData && (
                      <div className="hidden md:flex flex-col items-end text-xs text-gray-400">
                        <span title="Secret B2B Lead Score" className="font-bold text-white">Score: {leadData.score}/100</span>
                        <span className="text-gold-light">{leadData.extractedName ? `Lead: ${leadData.extractedName}` : 'Lead: Unnamed'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div ref={chatScrollRef} className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-transparent">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-brand-light' : 'bg-ai/30 border border-ai/50'}`}>{msg.role === 'user' ?
                        <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-ai-light" />}</div>
                      <div className={`p-3 rounded-2xl max-w-[85%] text-sm md:text-base shadow-md ${msg.role === 'user' ?
                        'bg-brand-light text-white rounded-tr-none' : 'bg-brand-dark/60 lg:bg-brand-dark/80 backdrop-blur-md text-gray-100 rounded-tl-none border border-white/10'}`}><p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p></div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-ai/30 flex items-center justify-center shrink-0 border border-ai/50"><Bot className="w-4 h-4 text-ai-light" /></div>
                      <div className="p-4 rounded-2xl bg-brand-dark/60 lg:bg-brand-dark/80 backdrop-blur-md rounded-tl-none border border-white/10 flex gap-2 items-center"><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce"></span><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-75"></span><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-150"></span></div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="p-4 bg-brand-dark/30 lg:bg-brand-dark/60 border-t border-white/10 flex gap-2 items-center shrink-0">
                  <button type="button" onClick={handleVoiceInput} className={`p-2 rounded-full transition-all shrink-0 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}><Mic className="w-5 h-5" /></button>
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} placeholder="Reply to AI..." className="flex-grow bg-white/10 border border-white/10 text-white placeholder-gray-300 text-sm rounded-full px-4 py-2.5 outline-none focus:border-ai/50 transition-colors disabled:opacity-50" />
                  <button type="submit" disabled={isLoading || !input.trim()} className="w-10 h-10 bg-ai hover:bg-ai-light text-white rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 shadow-ai-glow"><Send className="w-4 h-4" /></button>
                </form>
              </div>
            </div>

            {/* Right Area: Results & Ads (Now designed to scroll smoothly forever) */}
            <div className="w-full lg:w-2/3 flex flex-col gap-4 pb-12">

              {/* 🚀 DYNAMIC SIDEBAR AD PLACEMENT */}
              {sidebarAd && (
                <div className="w-full bg-[#162032]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-glass flex items-center gap-4 group cursor-pointer hover:border-blue-500/30 transition-colors">
                  <img src={sidebarAd.imageUrl} className="w-24 h-16 object-cover rounded-xl" alt="Sponsored" />
                  <div className="flex-grow">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Sponsored Partner</span>
                    <h4 className="text-white font-bold">{sidebarAd.title}</h4>
                  </div>
                  <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">View</div>
                </div>
              )}

              {currentProperties.length > 0 && (
                <div className="flex justify-end mb-2">
                  <div className="bg-glass-gradient backdrop-blur-md border border-white/10 p-1 rounded-full flex gap-1">
                    <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === 'list' ?
                      'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}><LayoutList className="w-4 h-4" /> List</button>
                    <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === 'map' ?
                      'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}><MapIcon className="w-4 h-4" /> Radar Map</button>
                  </div>
                </div>
              )}

              {/* The "Loading" screen is now replaced instantly with properties above, but we keep this fallback just in case */}
              {currentProperties.length === 0 && isLoading && <div className="w-full h-64 border border-dashed border-white/20 rounded-3xl flex items-center justify-center text-gray-500 bg-brand-dark/20 backdrop-blur-sm">AI is analyzing the market for you...</div>}

              {viewMode === 'list' && currentProperties.map((prop, idx) => (
                <Link href={`/properties/${prop.id}`} key={`${prop.id}-${idx}`} className="block">
                  <div className={`group backdrop-blur-md border rounded-3xl overflow-hidden flex flex-col sm:flex-row transition-all duration-300 cursor-pointer ${prop.isFeatured ?
                    'bg-gold/5 border-gold/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-gold/70 hover:-translate-y-1' : 'bg-brand-dark/40 border-white/10 shadow-glass hover:border-ai/50 hover:-translate-y-1'}`}>
                    <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden relative shrink-0">
                      {prop.isFeatured && <div className="absolute top-3 left-3 z-20 bg-gold text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg"><Star className="w-3 h-3 fill-current" /> Featured</div>}
                      <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                      <div><h4 className={`text-xl font-bold mb-2 line-clamp-2 ${prop.isFeatured ? 'text-gold-light' : 'text-white'}`}>{prop.title}</h4><p className="text-emerald-light font-semibold text-lg mb-4">{prop.price || (prop as any).priceFormatted}</p></div>
                      <div className="inline-flex items-center gap-2 bg-brand-light/50 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full w-fit group-hover:bg-white/10 transition-colors"><Sparkles className={`w-4 h-4 shrink-0 ${prop.isFeatured ?
                        'text-gold-light' : 'text-ai-light'}`} /><span className="text-sm font-medium">Match: Highly Relevant</span></div>
                    </div>
                  </div>
                </Link>
              ))}

              {viewMode === 'map' && currentProperties.length > 0 && (
                <div className="w-full h-[80vh] bg-brand-dark rounded-3xl border border-white/10 shadow-glass overflow-hidden relative animate-in zoom-in-95 duration-500">
                  <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop" alt="Map View" className="w-full h-full object-cover opacity-30 grayscale contrast-150 mix-blend-screen" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,rgba(15,23,42,0.8)_100%)]"></div>
                  {currentProperties.slice(0, 5).map((prop, i) => (
                    <div key={`${prop.id}-${i}`} className="absolute group cursor-pointer hover:z-50" style={{ top: `${20 + (i * 15)}%`, left: `${20 + (i * 12) + (i % 2 === 0 ? 20 : -10)}%` }}>
                      <div className={`w-4 h-4 rounded-full shadow-lg border-2 border-brand-dark animate-pulse-slow ${prop.isFeatured ? 'bg-gold shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 'bg-ai shadow-[0_0_15px_rgba(139,92,246,0.8)]'}`}></div>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
                        <img src={prop.imageUrl} className="w-full h-16 object-cover rounded-md mb-2" />
                        <p className={`text-xs font-bold line-clamp-1 ${prop.isFeatured ? 'text-gold-light' : 'text-white'}`}>{prop.title}</p>
                        <p className="text-emerald-400 text-xs font-semibold">{prop.price || (prop as any).priceFormatted}</p>
                      </div>
                    </div>
                  ))}
                  <div className="absolute bottom-4 left-4 bg-brand-dark/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2"><MapPin className="w-4 h-4 text-ai-light" /> <span className="text-sm font-medium text-white">Showing {currentProperties.length} Matches</span></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="w-full border-t border-white/10 bg-brand-dark/80 backdrop-blur-xl mt-auto py-12 px-8 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tighter mb-2">LahorePropertyGuide<span className="text-ai-light">.com</span></h2>
            <p className="text-gray-500 text-sm">Empowering B2B Agencies & Overseas Investors with AI.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-400 justify-center md:justify-end">
            <Link href="/insights" className="hover:text-white transition-colors">AI Insights</Link>
            <Link href="/news" className="hover:text-white transition-colors">News</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/command-center" className="hover:text-gold-light transition-colors">Command Center</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}