"use client";

import { useState, useEffect, useRef, use } from "react";
import { Mic, Sparkles, Send, Bot, Star, User, ArrowLeft, MapPin, TrendingUp, ShieldCheck, HardHat, FileCheck, Car, School, ShoppingBag, Activity } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Interfaces ---
interface Message { role: "user" | "ai"; content: string; }
interface Property { id: string; title: string; price: string; matchScore: string; roiBadge: string; imageUrl: string; isFeatured: boolean; }

// --- THE "SMART" DATA DICTIONARY ---
const AREA_DATABASE: Record<string, any> = {
  "dha-phase-9": {
    title: "DHA Phase 9 Prism",
    location: "South Lahore, Ring Road Loop",
    tags: [{ icon: FileCheck, text: "NOC Approved (LDA)", color: "emerald" }, { icon: HardHat, text: "Rapid Development", color: "blue" }],
    heroImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
    score: 94,
    brief: "DHA Phase 9 Prism is currently Lahore's most lucrative canvas for mid-to-long term capital appreciation. Spanning 40,000 Kanal, it is the largest phase of DHA. The AI sentiment is overwhelmingly bullish due to the imminent completion of the Ring Road SL-3 interchange, which will drop commute times to the airport to under 15 minutes.",
    metrics: { security: 98, connectivity: 85, amenities: 70, securityLabel: "DHA Patrolled", connLabel: "Ring Road Access", amenLabel: "Developing" },
    projections: [
      { size: '5 Marla', current: 0.85, projected2030: 1.4 },
      { size: '10 Marla', current: 1.6, projected2030: 2.8 },
      { size: '1 Kanal', current: 3.5, projected2030: 6.2 },
    ],
    inventory: [
      { id: "a1", title: "1 Kanal Plot, Block J", price: "PKR 3.5 Crore", matchScore: "98%", roiBadge: "High ROI", imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop", isFeatured: true },
      { id: "a2", title: "10 Marla Plot, Block K", price: "PKR 1.6 Crore", matchScore: "92%", roiBadge: "Fast Growth", imageUrl: "https://images.unsplash.com/photo-1627883216894-f20387438c7f?q=80&w=800&auto=format&fit=crop", isFeatured: false },
    ],
    botName: "Phase 9 Specialist",
    botIntro: "I am trained specifically on DHA Phase 9 Prism data. Ask me about block possession status, map variances, or commercial zoning!"
  },
  "bahria-town": {
    title: "Bahria Town Lahore",
    location: "Canal Bank Road, South-West Lahore",
    tags: [{ icon: ShoppingBag, text: "World-Class Amenities", color: "gold" }, { icon: ShieldCheck, text: "Family Oriented", color: "blue" }],
    heroImage: "https://images.unsplash.com/photo-1575881875475-31023242e3f9?q=80&w=1200&auto=format&fit=crop", // A nice lifestyle/estate image
    score: 91,
    brief: "Bahria Town Lahore represents the pinnacle of self-sustaining, luxury community living. Known for its uninterrupted power supply, the Grand Jamia Mosque, and the Eiffel Tower replica, it offers an immediate, premium lifestyle. Our AI notes that Sector F and the new Golf View Residencia offer the highest short-term rental yields and stable 10-15% annual appreciation.",
    metrics: { security: 95, connectivity: 75, amenities: 99, securityLabel: "Gated Community", connLabel: "Canal Road Traffic", amenLabel: "Fully Operational" },
    projections: [
      { size: '5 Marla', current: 1.5, projected2030: 2.1 },
      { size: '10 Marla', current: 2.8, projected2030: 3.9 },
      { size: '1 Kanal', current: 6.0, projected2030: 8.5 },
    ],
    inventory: [
      { id: "b1", title: "10 Marla Villa, Sector E", price: "PKR 3.2 Crore", matchScore: "96%", roiBadge: "Rental Yield", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", isFeatured: true },
      { id: "b2", title: "5 Marla House, Sector F", price: "PKR 1.8 Crore", matchScore: "89%", roiBadge: "Ready to Move", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop", isFeatured: false },
    ],
    botName: "Bahria Town Expert",
    botIntro: "I know every sector of Bahria Town Lahore. Ask me about maintenance fees, school proximity, or current rental rates in Sector F!"
  }
};

export default function AreaGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const areaId = resolvedParams.id; 

  // Look up the area in our database. If it doesn't exist, default to DHA.
  const areaData = AREA_DATABASE[areaId] || AREA_DATABASE["dha-phase-9"];

  // --- Chat State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages); setInput(""); setIsLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newMessages }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages([...newMessages, { role: "ai", content: data.reply }]);
      }
    } catch (error) { console.error("Fetch error:", error); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-start pt-24 pb-12 px-4 md:px-8">
      
      {/* Background */}
      <div className="fixed inset-0 bg-brand-dark z-0">
        <img src="https://images.unsplash.com/photo-1627883216894-f20387438c7f?q=80&w=2000&auto=format&fit=crop" alt="Lahore Map" className="w-full h-full object-cover opacity-5 mix-blend-overlay fixed" />
      </div>

      <div className="z-10 w-full max-w-7xl flex flex-col items-start gap-6">
        
        {/* Back Button */}
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Discovery</span>
        </Link>

        {/* Dynamic Hero Area Banner */}
        <div className="w-full h-[350px] md:h-[400px] rounded-3xl overflow-hidden relative shadow-glass border border-white/10 flex flex-col justify-end p-8">
          <img src={areaData.heroImage} alt={areaData.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {areaData.tags.map((tag: any, i: number) => {
                  const Icon = tag.icon;
                  // Dynamic Tailwind colors based on the dictionary
                  const colorClasses = tag.color === 'emerald' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                                     : tag.color === 'blue' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                                     : 'bg-gold/20 border-gold/50 text-gold-light';
                  return (
                    <span key={i} className={`${colorClasses} border text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                      <Icon className="w-3 h-3" /> {tag.text}
                    </span>
                  );
                })}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{areaData.title}</h1>
              <p className="flex items-center gap-2 text-gray-300 text-lg"><MapPin className="w-5 h-5 text-ai-light" /> {areaData.location}</p>
            </div>
            
            {/* Area Rating Badge */}
            <div className="bg-glass-gradient backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center shadow-2xl">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">AI Area Score</p>
              <p className="text-4xl font-black text-gold-light">{areaData.score}<span className="text-lg text-gray-500">/100</span></p>
              <div className="flex justify-center gap-1 mt-1 text-gold">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current opacity-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT COLUMN: Data & Insights */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            {/* 1. Dynamic AI Market Brief */}
            <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-glass relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-ai/10 rounded-full blur-[80px] -z-10"></div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-4"><Activity className="w-6 h-6 text-ai-light" /> AI Market Brief</h3>
              <p className="text-gray-300 leading-relaxed md:text-lg">
                {areaData.brief}
              </p>
            </div>

            {/* 2. Dynamic Livability Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-brand-dark/50 border border-emerald/20 rounded-3xl p-6 flex flex-col items-center text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />
                <h4 className="text-white font-bold mb-1">Security & Safety</h4>
                <p className="text-2xl font-black text-emerald-300">{areaData.metrics.security}%</p>
                <p className="text-xs text-gray-400 mt-2">{areaData.metrics.securityLabel}</p>
              </div>
              <div className="bg-brand-dark/50 border border-blue/20 rounded-3xl p-6 flex flex-col items-center text-center">
                <Car className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="text-white font-bold mb-1">Connectivity</h4>
                <p className="text-2xl font-black text-blue-300">{areaData.metrics.connectivity}%</p>
                <p className="text-xs text-gray-400 mt-2">{areaData.metrics.connLabel}</p>
              </div>
              <div className="bg-brand-dark/50 border border-gold/20 rounded-3xl p-6 flex flex-col items-center text-center">
                <ShoppingBag className="w-8 h-8 text-gold-400 mb-3" />
                <h4 className="text-white font-bold mb-1">Amenities</h4>
                <p className="text-2xl font-black text-gold-300">{areaData.metrics.amenities}%</p>
                <p className="text-xs text-gray-400 mt-2">{areaData.metrics.amenLabel}</p>
              </div>
            </div>

            {/* 3. Predictive Price Matrix */}
            <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-glass">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-6 h-6 text-emerald-light" /> AI Price Forecasting</h3>
                  <p className="text-sm text-gray-400 mt-1">Current market rates vs. 2030 projections (in PKR Crore)</p>
                </div>
              </div>
              
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaData.projections} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="size" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} tickFormatter={(value) => `${value} Cr`} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="current" name="Current Value (2026)" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="projected2030" name="Projected Value (2030)" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Area Inventory (Horizontal Scroll) */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-gold-light" /> Verified Inventory
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
                {areaData.inventory.map((prop: any) => (
                  <Link href={`/properties/${prop.id}`} key={prop.id} className="min-w-[300px] w-[300px] shrink-0 snap-start group">
                    <div className="h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-ai/50 transition-all duration-300">
                      <div className="h-48 overflow-hidden relative">
                        {prop.isFeatured && <div className="absolute top-2 left-2 z-20 bg-gold text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg"><Star className="w-3 h-3 fill-current" /> Featured</div>}
                        <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-5">
                        <h4 className="text-lg font-bold text-white line-clamp-1 mb-1">{prop.title}</h4>
                        <p className="text-emerald-400 font-extrabold text-xl mb-3">{prop.price}</p>
                        <div className="inline-flex items-center gap-1 bg-brand-light/50 border border-white/10 text-gray-300 px-2 py-1 rounded-md text-xs">
                          <Bot className="w-3 h-3 text-ai-light" /><span>AI Match: {prop.matchScore}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: The Dynamic "Area Expert" AI Assistant */}
          <div className="w-full lg:w-1/3 bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col sticky top-24 self-start h-[80vh] overflow-hidden shrink-0 z-50 ring-1 ring-white/20">
            
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-brand-dark to-brand/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/20 rounded-full relative">
                  <Bot className="w-5 h-5 text-gold-light" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-brand-dark"></span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white leading-tight">{areaData.botName}</h3>
                  <p className="text-xs text-gold-light">AI Area Expert</p>
                </div>
              </div>
            </div>

            <div ref={chatScrollRef} className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-brand-dark/30">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4 opacity-70 px-4">
                  <MapPin className="w-8 h-8 text-gold-light" />
                  <p className="text-sm">{areaData.botIntro}</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-brand-light' : 'bg-gold/20 border border-gold/30'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gold-light" />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm md:text-base shadow-md ${msg.role === 'user' ? 'bg-brand-light text-white rounded-tr-none' : 'bg-brand-dark/80 text-gray-200 rounded-tl-none border border-white/10'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 border border-gold/30"><Bot className="w-4 h-4 text-gold-light" /></div>
                  <div className="p-4 rounded-2xl bg-brand-dark/80 rounded-tl-none border border-white/10 flex gap-2 items-center">
                    <span className="w-2 h-2 bg-gold-light rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gold-light rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gold-light rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-brand-dark/90 border-t border-white/10 flex gap-2 items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} placeholder="Ask me anything..." className="flex-grow bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm rounded-full px-4 py-3 outline-none focus:border-gold/50 transition-colors disabled:opacity-50" />
              <button type="submit" disabled={isLoading || !input.trim()} className="w-12 h-12 bg-gold hover:bg-gold-light text-brand-dark rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.4)]"><Send className="w-5 h-5 ml-1" /></button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}