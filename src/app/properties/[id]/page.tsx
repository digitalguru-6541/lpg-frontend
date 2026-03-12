"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Sparkles, Send, Bot, Star, User, ArrowLeft, MapPin, Square, TrendingUp, Bed, Bath, Car, ShieldCheck, Wifi, Trees, Calculator, FileText, Wallet, Coffee, Zap, Info, BarChart3, Loader2, ArrowRight, Heart, Map as MapIcon, Image as ImageIcon, ChevronLeft, ChevronRight, X, Building, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Legend } from 'recharts';
import GlobalHeader from "../../components/GlobalHeader";
import { useRouter, useParams } from "next/navigation";

// --- Interfaces ---
interface Message { role: "user" | "ai"; content: string; recommendedProperties?: any[] }
interface Property { id: string; title: string; price: number; priceFormatted: string; size: string; bedrooms: number; bathrooms: number; location: string;
imageUrl: string; imageUrls?: string[]; purpose: 'buy' | 'rent'; isFeatured: boolean; category: string; subCategory: string; city: string; description?: string; paymentMode: string;
installmentPlan?: string; agencyName: string; }

// Dynamic Formatter Helper
const formatPKR = (value: number) => {
if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
if (value >= 100000) return `${(value / 100000).toFixed(1)} L`;
return value.toLocaleString();
};

export default function PropertyDetailPage() {
// SURGICAL FIX: Using useParams for universal Next.js compatibility
const params = useParams();
const propertyId = params?.id as string;
const router = useRouter();

// --- LIVE DATA STATE ---
const [property, setProperty] = useState<Property | null>(null);
const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
const [isFetchingData, setIsFetchingData] = useState(true);

// 🚀 IDENTITY & WISHLIST STATES
const [isSaved, setIsSaved] = useState(false);
const [activeUser, setActiveUser] = useState<{ id: string, name: string, role: string } | null>(null);

// --- DEV MODE TOGGLE ---
const [viewPurpose, setViewPurpose] = useState<'buy' | 'rent'>('buy');

// --- State ---
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState("");
const [isLoading, setIsLoading] = useState(false);

// 🧠 Sticky Chat Session State
const [sessionId, setSessionId] = useState<string>("");

// Finance State
const [downPaymentPct, setDownPaymentPct] = useState(30);
const [tenureYears, setTenureYears] = useState(5);
const [rentTenure, setRentTenure] = useState(3);

// Gallery State
const [isGalleryOpen, setIsGalleryOpen] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);

const chatScrollRef = useRef<HTMLDivElement>(null);

// 1. Fetch Live Property, Session Memory, Saved Status & User Auth
useEffect(() => {
const initPage = async () => {
if (!propertyId) return;
try {
// 🧠 A. Get or Create Persistent Session ID (Match Homepage logic)
let currentSessionId = localStorage.getItem("lpg_session_id");
if (!currentSessionId) {
currentSessionId = "session_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
localStorage.setItem("lpg_session_id", currentSessionId);
}
setSessionId(currentSessionId);

// 🧠 B. Fetch Database Chat Memory
const chatMemRes = await fetch(`/api/gemini?sessionId=${currentSessionId}`);
if (chatMemRes.ok) {
const chatData = await chatMemRes.json();
if (chatData.messages && chatData.messages.length > 0) {
setMessages(chatData.messages);
}
}

// C. Fetch Property Data
const res = await fetch(`/api/properties/${propertyId}`);
if (res.ok) {
const data = await res.json();
setProperty(data.property);
setSimilarProperties(data.similarProperties);
if(data.property.purpose === 'rent') setViewPurpose('rent');
}

// 🚀 Fetch Auth State
const authRes = await fetch('/api/auth/me');
if (authRes.ok) {
const authData = await authRes.json();
if (authData.isLoggedIn) {
setActiveUser(authData.user);
}
}

// 🚀 Fetch if user has saved this property
const savedRes = await fetch(`/api/user/saved-properties?propertyId=${propertyId}`);
if (savedRes.ok) {
const savedData = await savedRes.json();
setIsSaved(savedData.isSaved);
}
} catch (error) {
console.error("Failed to load property", error);
} finally {
setIsFetchingData(false);
}
};
initPage();
}, [propertyId]);

useEffect(() => {
if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
}, [messages]);

// TOGGLE SAVE FUNCTION (With unauthenticated fallback)
const toggleSave = async () => {
const previousState = isSaved;
setIsSaved(!isSaved);

try {
const method = previousState ? 'DELETE' : 'POST';
const res = await fetch('/api/user/saved-properties', {
method,
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ propertyId })
});

if (res.status === 401) {
setIsSaved(previousState);
window.location.href = `/login?redirect=/properties/${propertyId}`;
} else if (!res.ok) {
setIsSaved(previousState);
}
} catch (error) {
setIsSaved(previousState);
console.error("Toggle save failed", error);
}
};

const handleNextImage = (e: any) => {
e.stopPropagation();
setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
};

const handlePrevImage = (e: any) => {
e.stopPropagation();
setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
};

// Dynamic Finance Variables
const propertyValue = property?.price || 35000000;
const downPaymentAmount = (propertyValue * downPaymentPct) / 100;
const loanAmount = propertyValue - downPaymentAmount;
const monthlyInstallment = loanAmount / (tenureYears * 12);

const monthlyRent = property?.purpose === 'rent' ? property.price : propertyValue * 0.005;
const securityDeposit = monthlyRent * 2;
const advanceRent = monthlyRent * 1;
const agencyFee = monthlyRent * 0.5;
const totalMoveIn = securityDeposit + advanceRent + agencyFee;
const totalRentSpent = monthlyRent * 12 * rentTenure;

// AI Predictive Valuation Data Generators
const generatePredictiveData = () => {
const currentYear = new Date().getFullYear();
const annualAppreciationRate = 1.12;
let currentVal = propertyValue;
return Array.from({ length: 5 }).map((_, i) => {
const yearData = { year: (currentYear + i).toString(), price: currentVal, label: i === 0 ? "Current" : "Projected" };
currentVal = currentVal * annualAppreciationRate;
return yearData;
});
};
const dynamicPriceData = generatePredictiveData();

const generateRentVsBuyData = () => {
const yearsToSimulate = [1, 3, 5];
const annualRentIncrease = 1.05;
const annualAppreciationRate = 1.12;
return yearsToSimulate.map(year => {
let cumulativeRent = 0;
let currentYearRent = monthlyRent * 12;
for(let i = 0; i < year; i++) { cumulativeRent += currentYearRent; currentYearRent *= annualRentIncrease; }
const futurePropertyValue = propertyValue * Math.pow(annualAppreciationRate, year);
const equityBuilt = futurePropertyValue - propertyValue;
return { year: `Year ${year}`, rentLost: cumulativeRent, equityBuilt: equityBuilt };
});
};
const dynamicRentVsBuyData = generateRentVsBuyData();

// 🚀 BULLETPROOF FIX: Contextual Payload Construction (Stripping massive image URLs!)
const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
if (!input.trim() || !property) return;

const newMessages: Message[] = [...messages, { role: "user", content: input }];
setMessages(newMessages); setInput(""); setIsLoading(true);

const activeFinancialContext = viewPurpose === 'buy' ? {
contextType: "Property For Sale",
downPaymentRequired: formatPKR(downPaymentAmount),
monthlyInstallment: formatPKR(monthlyInstallment),
predictiveValuation5Years: dynamicPriceData,
annualAppreciationRate: "12%"
} : {
contextType: "Property For Rent",
advanceRentRequired: formatPKR(advanceRent),
securityDepositRequired: formatPKR(securityDeposit),
agencyFee: formatPKR(agencyFee),
totalCashNeededToMoveIn: formatPKR(totalMoveIn),
rentVsBuyForecast: dynamicRentVsBuyData,
totalRentWastedOverTenure: formatPKR(totalRentSpent)
};

// 🚀 THE FIX: Explicitly map safe properties to prevent token crash
const safeCurrentProperty = {
id: property.id,
title: property.title,
priceFormatted: property.priceFormatted,
location: property.location,
purpose: property.purpose,
category: property.category,
subCategory: property.subCategory,
size: property.size,
bedrooms: property.bedrooms,
bathrooms: property.bathrooms,
paymentMode: property.paymentMode,
installmentPlan: property.installmentPlan,
};

try {
const res = await fetch("/api/gemini", {
method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify({
history: newMessages,
sessionId: sessionId,
currentProperty: safeCurrentProperty,
financialContext: activeFinancialContext,
userContext: {
isLoggedIn: !!activeUser,
userName: activeUser?.name,
userId: activeUser?.id,
hasSavedThisProperty: isSaved
}
}),
});
const data = await res.json();
if (res.ok && data.reply) {
const finalMessages: Message[] = [...newMessages, { role: "ai", content: data.reply, recommendedProperties: data.properties }];
setMessages(finalMessages);
}
} catch (error) { console.error("Fetch error:", error); }
finally { setIsLoading(false); }
};

if (isFetchingData) return <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 text-ai-light animate-spin" /></div>;
if (!property) return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white text-2xl font-bold">Property Not Found</div>;

const galleryImages = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls : [property.imageUrl];

return (
<div className="min-h-screen bg-brand-dark font-sans text-white pb-20">
<GlobalHeader />

<div className="max-w-7xl mx-auto px-6 pt-32 space-y-8 relative">
{/* Background Overlay */}
<div className="fixed inset-0 pointer-events-none z-0"><img src="https://images.unsplash.com/photo-1627883216894-f20387438c7f?q=80&w=2000&auto=format&fit=crop" alt="Lahore Skyline" className="w-full h-full object-cover opacity-5 mix-blend-overlay" /></div>

{/* Navigation & Header */}
<div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
<div>
<button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm font-bold uppercase tracking-widest">
<ArrowLeft className="w-4 h-4" /> Back to Search
</button>
<div className="flex items-center gap-3 mb-2">
<span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
{property.purpose === 'buy' ? 'For Sale' : 'For Rent'}
</span>
<span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
{property.category} • {property.subCategory}
</span>
</div>
<h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{property.title}</h1>
<p className="text-gray-400 flex items-center gap-2 mt-3 text-lg"><MapPin className="w-5 h-5 text-emerald-500" /> {property.location}, {property.city}</p>
</div>

<div className="flex flex-col items-end gap-4">
<h2 className="text-4xl md:text-5xl font-black text-emerald-400 font-mono tracking-tighter">{property.priceFormatted}</h2>
<div className="flex items-center gap-3">
<button onClick={toggleSave} className={`p-3 rounded-full border transition-all ${isSaved ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
<Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
</button>
</div>
</div>
</div>

<div className="w-full flex flex-col lg:flex-row gap-6 items-start relative z-10">

{/* LEFT COLUMN */}
<div className="w-full lg:w-2/3 flex flex-col gap-6">

{/* Cinematic Masonry Grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[450px] rounded-3xl overflow-hidden shadow-glass border border-white/10 relative">
{property.isFeatured && <div className="absolute top-4 left-4 z-20 bg-gold text-white text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg"><Star className="w-4 h-4 fill-current" /> Premium Listing</div>}

<div className="md:col-span-2 relative group cursor-pointer overflow-hidden bg-brand-dark/50" onClick={() => setIsGalleryOpen(true)}>
<img src={galleryImages[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Main" />
<div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-80"></div>
</div>

<div className="hidden md:flex flex-col gap-2 h-full">
{galleryImages[1] ? (
<div className="h-1/2 relative group cursor-pointer overflow-hidden bg-brand-dark/50" onClick={() => { setCurrentImageIndex(1); setIsGalleryOpen(true); }}>
<img src={galleryImages[1]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Secondary" />
</div>
) : (
<div className="h-1/2 bg-white/5 flex items-center justify-center border-b border-white/10"><Building className="w-8 h-8 text-gray-600" /></div>
)}

{galleryImages[2] ? (
<div className="h-1/2 relative group cursor-pointer overflow-hidden bg-brand-dark/50" onClick={() => { setCurrentImageIndex(2); setIsGalleryOpen(true); }}>
<img src={galleryImages[2]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Tertiary" />
{galleryImages.length > 3 && (
<div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center transition-colors group-hover:bg-brand-dark/50">
<span className="text-white font-bold tracking-widest text-lg">+{galleryImages.length - 3} Photos</span>
</div>
)}
</div>
) : (
<div className="h-1/2 bg-white/5 flex items-center justify-center"><Building className="w-8 h-8 text-gray-600" /></div>
)}
</div>
</div>

{/* Vital Stats Bar */}
<div className="flex flex-wrap gap-4">
<div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex-1 min-w-[150px] shadow-sm">
<Square className="w-6 h-6 text-gold" />
<div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Area Size</p><p className="text-xl font-bold">{property.size}</p></div>
</div>
{property.bedrooms && (
<div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex-1 min-w-[150px] shadow-sm">
<Bed className="w-6 h-6 text-blue-400" />
<div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{property.category === 'Commercial' ? 'Rooms' : 'Bedrooms'}</p><p className="text-xl font-bold">{property.bedrooms}</p></div>
</div>
)}
{property.bathrooms && (
<div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex-1 min-w-[150px] shadow-sm">
<Bath className="w-6 h-6 text-cyan-400" />
<div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Bathrooms</p><p className="text-xl font-bold">{property.bathrooms}</p></div>
</div>
)}
</div>

{/* Description & Features */}
<div className="space-y-8 pb-8">
<div>
<h3 className="text-2xl font-bold mb-4">Property Overview</h3>
<p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg opacity-90">
{property.description || `An exclusive ${property.size} ${property.subCategory} located in the highly sought-after ${property.location}.
This premium listing is currently available on a ${property.paymentMode.toLowerCase()} basis.`}
</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="bg-glass-gradient border border-white/10 p-6 rounded-3xl">
<h4 className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-4">Listing Features</h4>
<ul className="space-y-3">
<li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Premium {property.category} Location</li>
{/* SURGICAL FIX: Handling potential undefined property.isFurnished safely */}
{(property as any).isFurnished && <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Fully Furnished & Styled</li>}
<li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Verified via Agency: {property.agencyName}</li>
</ul>
</div>

<div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl">
<h4 className="text-sm text-blue-400 uppercase tracking-widest font-bold mb-4">Financial Details</h4>
<div className="space-y-4">
<div>
<p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Payment Mode</p>
<p className="text-lg font-bold text-white">{property.paymentMode}</p>
</div>
{property.paymentMode === 'Installment' && property.installmentPlan && (
<div>
<p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Installment Schedule</p>
<p className="text-sm text-blue-300 font-medium">{property.installmentPlan}</p>
</div>
)}
</div>
</div>
</div>
</div>

{/* AI Insights & Financial Simulators */}
{viewPurpose === 'buy' ? (
<>
<div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-glass flex flex-col md:flex-row gap-8 items-center">
<div className="w-full md:w-1/2">
<h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><Calculator className="w-5 h-5 text-emerald-light" /> Smart Payment Plan</h3>
<div className="mb-6 mt-6"><div className="flex justify-between text-sm mb-2"><span className="text-gray-300">Down Payment</span><span className="font-bold text-white">{downPaymentPct}%</span></div><input type="range" min="10" max="80" step="5" value={downPaymentPct} onChange={(e) => setDownPaymentPct(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg accent-emerald-500" /></div>
<div><div className="flex justify-between text-sm mb-2"><span className="text-gray-300">Tenure (Years)</span><span className="font-bold text-white">{tenureYears} Years</span></div><input type="range" min="1" max="10" step="1" value={tenureYears} onChange={(e) => setTenureYears(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg accent-emerald-500" /></div>
</div>
<div className="w-full md:w-1/2 bg-brand-dark/50 border border-emerald/20 p-6 rounded-3xl text-center shadow-inner">
<div className="mb-4 pb-4 border-b border-white/10"><p className="text-sm text-gray-400 mb-1">Initial Deposit</p><p className="text-2xl font-bold text-white">{formatPKR(downPaymentAmount)}</p></div>
<div><p className="text-sm text-emerald-100 mb-1">Estimated Monthly</p><p className="text-3xl font-extrabold text-emerald-400">{formatPKR(monthlyInstallment)}</p></div>
</div>
</div>
</>
) : (
<>
<div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-glass">
<h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Wallet className="w-5 h-5 text-emerald-light" /> Transparent Move-In Cost</h3>
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
<div className="bg-brand-dark/50 p-4 rounded-2xl border border-white/5 text-center"><span className="text-xs text-gray-400 mb-1 block">Advance (1 Mo)</span><span className="text-lg font-bold text-white">{formatPKR(advanceRent)}</span></div>
<div className="bg-brand-dark/50 p-4 rounded-2xl border border-white/5 text-center"><span className="text-xs text-gray-400 mb-1 block">Security (2 Mo)</span><span className="text-lg font-bold text-white">{formatPKR(securityDeposit)}</span></div>
<div className="bg-brand-dark/50 p-4 rounded-2xl border border-white/5 text-center"><span className="text-xs text-gray-400 mb-1 block">Agency Fee</span><span className="text-lg font-bold text-white">{formatPKR(agencyFee)}</span></div>
<div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 text-center"><span className="text-xs text-emerald-200 mb-1 block">Total Cash Needed</span><span className="text-2xl font-extrabold text-emerald-400">{formatPKR(totalMoveIn)}</span></div>
</div>
</div>
<div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-glass flex flex-col md:flex-row gap-8 items-center">
<div className="w-full md:w-1/3">
<h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><BarChart3 className="w-5 h-5 text-ai-light" /> Rent vs. Buy AI</h3>
<div className="mb-6"><div className="flex justify-between text-sm mb-2"><span className="text-gray-300">If you rent for:</span><span className="font-bold text-white">{rentTenure} Years</span></div><input type="range" min="1" max="10" step="1" value={rentTenure} onChange={(e) => setRentTenure(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg accent-ai" /></div>
<div className="mt-8 p-4 bg-ai/10 border border-ai/20 rounded-2xl"><p className="text-xs text-ai-200 mb-1">Total Rent Wasted:</p><p className="text-2xl font-extrabold text-ai-light">{formatPKR(totalRentSpent)}</p></div>
</div>
<div className="w-full md:w-2/3 h-[250px]">
<ResponsiveContainer width="100%" height="100%">
<BarChart data={dynamicRentVsBuyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
<XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
<YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} tickFormatter={(value) => formatPKR(value)} />
<Tooltip formatter={(value: any) => formatPKR(value)} cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)' }} />
<Bar dataKey="rentLost" name="Rent Wasted" fill="#ef4444" radius={[4, 4, 0, 0]} />
<Bar dataKey="equityBuilt" name="Capital Gains (If Bought)" fill="#10B981" radius={[4, 4, 0, 0]} />
</BarChart>
</ResponsiveContainer>
</div>
</div>
</>
)}

{/* 🚀 NEW: ECOSYSTEM MARKETING TOOLS */}
<div className="w-full mt-2 pb-8">
<h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
<Sparkles className="w-5 h-5 text-ai-light" /> Platform Ecosystem
</h3>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
<Link href="/heatmap" className="group">
<div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-glass hover:border-ai/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all h-full flex flex-col justify-between">
<div>
<div className="w-10 h-10 bg-ai/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><MapIcon className="w-5 h-5 text-ai-light" /></div>
<h4 className="text-base font-bold text-white mb-2 group-hover:text-ai-light transition-colors">Predictive Heatmap</h4>
<p className="text-xs text-gray-400 leading-relaxed">View 3D geospatial investment hot-zones and 5-year capital appreciation forecasts.</p>
</div>
<div className="mt-4 flex items-center gap-1 text-[10px] font-black text-ai-light uppercase tracking-widest">
Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
</div>
</div>
</Link>

<Link href="/visualizer" className="group">
<div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-glass hover:border-gold/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all h-full flex flex-col justify-between">
<div>
<div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ImageIcon className="w-5 h-5 text-gold-light" /></div>
<h4 className="text-base font-bold text-white mb-2 group-hover:text-gold-light transition-colors">AI Plot Visualizer</h4>
<p className="text-xs text-gray-400 leading-relaxed">Upload a photo of raw land and generate localized, photorealistic architectural overlays.</p>
</div>
<div className="mt-4 flex items-center gap-1 text-[10px] font-black text-gold-light uppercase tracking-widest">
Visualize <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
</div>
</div>
</Link>

<Link href="/verify" className="group">
<div className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-glass hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all h-full flex flex-col justify-between">
<div>
<div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
<h4 className="text-base font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Document Verifier</h4>
<p className="text-xs text-gray-400 leading-relaxed">Instantly scan, parse, and verify real estate files and token receipts for anomalies.</p>
</div>
<div className="mt-4 flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
Verify <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
</div>
</div>
</Link>
</div>
</div>

</div>

{/* RIGHT COLUMN: Chatbot & Sidebar Elements */}
<div className="w-full lg:w-1/3 flex flex-col gap-6">
<div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col sticky top-24 h-[600px] overflow-hidden shrink-0 z-50 ring-1 ring-white/20">
<div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-brand-dark to-brand/80">
<div className="flex items-center gap-3">
<div className="p-2 bg-ai/20 rounded-full relative"><Bot className="w-5 h-5 text-ai-light" /><span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-brand-dark"></span></div>
<div><h3 className="text-lg font-semibold text-white leading-tight">AI Concierge</h3><p className="text-xs text-emerald-light">Instantly Available</p></div>
</div>
</div>

<div ref={chatScrollRef} className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-brand-dark/30">
{messages.length === 0 && (
<div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4 opacity-70">
<Sparkles className="w-8 h-8 text-ai-light" />
<p className="text-sm">Why fill a form? <br/> Ask me to "Show more properties in {property.location}" or schedule a viewing right now.</p>
</div>
)}
{messages.map((msg, idx) => (
<div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
<div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
<div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ?
'bg-brand-light' : 'bg-ai/20 border border-ai/30'}`}>{msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-ai-light" />}</div>
<div className={`p-3 rounded-2xl max-w-[85%] text-sm md:text-base shadow-md ${msg.role === 'user' ?
'bg-brand-light text-white rounded-tr-none' : 'bg-brand-dark/80 text-gray-200 rounded-tl-none border border-white/10'}`}><p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p></div>
</div>

{msg.recommendedProperties && msg.recommendedProperties.length > 0 && (
<div className="flex flex-col gap-3 mt-2 pl-11 w-full max-w-[90%]">
{msg.recommendedProperties.map((recProp: any) => (
<Link href={`/properties/${recProp.id}`} key={recProp.id} className="block w-full bg-brand-dark border border-white/10 rounded-xl overflow-hidden hover:border-ai/50 transition-colors flex items-center group">
<img src={recProp.imageUrl} className="w-20 h-20 object-cover shrink-0 group-hover:scale-105 transition-transform" alt="prop" />
<div className="p-3 flex-grow">
<h4 className="text-white text-xs font-bold line-clamp-1 mb-1">{recProp.title}</h4>
<p className="text-ai-light text-sm font-black">{recProp.priceFormatted}</p>
</div>
</Link>
))}
</div>
)}
</div>
))}
{isLoading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-ai/20 flex items-center justify-center border border-ai/30"><Bot className="w-4 h-4 text-ai-light" /></div><div className="p-4 rounded-2xl bg-brand-dark/80 rounded-tl-none border border-white/10 flex gap-2"><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce"></span><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-75"></span><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-150"></span></div></div>}
</div>

<form onSubmit={handleSubmit} className="p-4 bg-brand-dark/90 border-t border-white/10 flex gap-2 items-center shrink-0">
<input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} placeholder="Ask to schedule a viewing..." className="flex-grow bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm rounded-full px-4 py-3 outline-none focus:border-ai/50 transition-colors disabled:opacity-50" />
<button type="submit" disabled={isLoading || !input.trim()} className="w-12 h-12 bg-ai hover:bg-ai-light text-white rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 shadow-ai-glow"><Send className="w-5 h-5 ml-1" /></button>
</form>
</div>

{/* AI Predictive Sidebar (Moves under chat on desktop) */}
{viewPurpose === 'buy' && (
<div className="bg-glass-gradient border border-ai/30 p-6 rounded-3xl shadow-[0_0_40px_rgba(139,92,246,0.15)] hidden lg:block">
<div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
<div className="p-3 bg-ai/20 rounded-xl animate-pulse"><Sparkles className="w-6 h-6 text-ai-light" /></div>
<div>
<h3 className="font-bold text-white text-lg">AI Investment Thesis</h3>
<p className="text-[10px] text-ai-light uppercase tracking-widest font-black">5-Year Predictive Model</p>
</div>
</div>

<div className="h-48 w-full mb-6">
<ResponsiveContainer width="100%" height="100%">
{/* SURGICAL FIX: Using the correct data array and mapping dataKey to 'price' */}
<AreaChart data={dynamicPriceData}>
<defs>
<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
<stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
<stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
</linearGradient>
</defs>
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
<Tooltip
formatter={(value: any) => `PKR ${value.toLocaleString()}`}
contentStyle={{ backgroundColor: '#101726', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
/>
<Area type="monotone" dataKey="price" stroke="#A78BFA" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
</AreaChart>
</ResponsiveContainer>
</div>

<div className="space-y-4">
<p className="text-sm text-gray-300 leading-relaxed">
Based on historical trajectory in <strong className="text-white">{property.location}</strong>, this asset shows high resistance to inflation.
</p>
<div className="bg-white/5 border border-white/10 p-4 rounded-xl">
<p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Projected 2028 Value</p>
<p className="text-xl font-mono font-black text-emerald-400">PKR {dynamicPriceData[4].price.toLocaleString()}</p>
</div>
</div>
</div>
)}
</div>
</div>

{/* BOTTOM SLIDER: Recommended Properties */}
{similarProperties.length > 0 && (
<div className="w-full mt-8 pt-8 border-t border-white/10">
<h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6"><Sparkles className="w-6 h-6 text-emerald-400" /> Recommended {property.category}s in {property.location}</h2>
<div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
{similarProperties.map((simProp) => (
<Link href={`/properties/${simProp.id}`} key={simProp.id} className="min-w-[300px] w-[300px] shrink-0 snap-start group">
<div className="h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300">
<div className="h-48 overflow-hidden relative">
<img src={simProp.imageUrl} alt={simProp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
<div className="absolute top-2 right-2 bg-brand-dark/80 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-white/10">{simProp.purpose === 'buy' ?
'Sale' : 'Rent'}</div>
</div>
<div className="p-5">
<h4 className="text-lg font-bold text-white line-clamp-1 mb-1 group-hover:text-emerald-400 transition-colors">{simProp.title}</h4>
<p className="text-gray-400 text-xs mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" />{simProp.location}</p>
<div className="flex items-center justify-between pt-3 border-t border-white/10">
<p className={`font-extrabold text-lg ${simProp.purpose === 'buy' ? 'text-emerald-400' : 'text-ai-light'}`}>{simProp.priceFormatted}</p>
<span className="text-white bg-white/10 p-2 rounded-full group-hover:bg-emerald-500 group-hover:text-brand-dark transition-colors"><ArrowRight className="w-4 h-4" /></span>
</div>
</div>
</div>
</Link>
))}
</div>
</div>
)}

</div>

{/* FULL SCREEN LIGHTBOX GALLERY */}
{isGalleryOpen && (
<div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
<button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
<X className="w-6 h-6" />
</button>

<button onClick={handlePrevImage} className="absolute left-6 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all hover:-translate-x-1 z-50">
<ChevronLeft className="w-8 h-8" />
</button>

<div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center p-4">
<img
src={galleryImages[currentImageIndex]}
className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
alt={`Gallery Image ${currentImageIndex + 1}`}
/>
<div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 bg-white/10 px-4 py-2 rounded-full text-sm font-bold text-white tracking-widest">
{currentImageIndex + 1} / {galleryImages.length}
</div>
</div>

<button onClick={handleNextImage} className="absolute right-6 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all hover:translate-x-1 z-50">
<ChevronRight className="w-8 h-8" />
</button>
</div>
)}
</div>
);
}