"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Heart, MessageSquare, Clock, MapPin, CheckCircle2, ChevronRight, LogOut, User as UserIcon, Home, Sparkles, Building2, Loader2, Ban } from "lucide-react";
import Link from "next/link";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'inquiries'>('overview');
  
  // 🚀 LIVE DATA STATES
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 FETCH LIVE DATA ON LOAD
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setSavedProperties(data.savedProperties || []);
          setInquiries(data.inquiries || []);
        } else {
          // If unauthorized or expired, boot to login
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // 🚀 SECURE LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login"; 
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // 🚀 REMOVE FROM WISHLIST FUNCTION
  const handleUnsaveProperty = async (propertyId: string) => {
    // Optimistic UI Update for snappy feel
    setSavedProperties(savedProperties.filter(p => p.id !== propertyId));
    
    try {
      await fetch('/api/user/saved-properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      });
    } catch (error) {
      console.error("Failed to remove property", error);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending Review</span>;
      case 'engaged': return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><MessageSquare className="w-3 h-3"/> Agent Contacted</span>;
      case 'site_visit': return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><MapPin className="w-3 h-3"/> Visit Scheduled</span>;
      case 'negotiation': return <span className="bg-gold/10 text-gold border border-gold/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><Sparkles className="w-3 h-3"/> In Negotiation</span>;
      case 'closed': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3"/> Deal Acquired</span>;
      case 'lost': return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><Ban className="w-3 h-3"/> Deal Closed/Lost</span>;
      default: return <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-max">Processing</span>;
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-brand-dark flex items-center justify-center"><Loader2 className="w-10 h-10 text-ai-light animate-spin" /></div>;
  }

  return (
    <div className="relative w-full min-h-screen bg-brand-dark flex overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-ai/10 via-brand-dark to-brand-dark -z-10"></div>

      {/* User Sidebar */}
      <aside className="w-72 bg-glass-gradient backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col sticky top-0 h-screen shrink-0 z-40">
        <div className="p-8 border-b border-white/10">
          <Link href="/" className="text-2xl font-bold text-white tracking-tighter block mb-6 hover:opacity-80 transition-opacity">
            LPG<span className="text-ai-light">.com</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-ai to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg uppercase">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-white font-bold line-clamp-1">{user.name}</h3>
              <p className="text-xs text-gray-400">Investor Profile</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 flex flex-col gap-3">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all w-full text-left font-medium ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all w-full text-left font-medium ${activeTab === 'saved' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Heart className="w-5 h-5" /> Saved Properties
          </button>
          <button onClick={() => setActiveTab('inquiries')} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all w-full text-left font-medium ${activeTab === 'inquiries' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <MessageSquare className="w-5 h-5" /> My AI Inquiries
          </button>
        </nav>
        
        <div className="p-6 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full px-4 py-2 group">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative z-10">
        <header className="h-24 md:h-32 flex items-end pb-6 px-8 shrink-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {activeTab === 'overview' ? `Welcome back, ${user.name.split(' ')[0]}` : activeTab === 'saved' ? 'Your Saved Collection' : 'Inquiry Tracking'}
            </h1>
            <p className="text-gray-400 mt-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-ai-light"/> Your dedicated real estate portal.</p>
          </div>
        </header>

        <div className="p-8 max-w-6xl">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => setActiveTab('saved')} className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl cursor-pointer hover:border-ai/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-red-500/10 rounded-2xl"><Heart className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" /></div>
                    <span className="text-3xl font-black text-white">{savedProperties.length}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Saved Properties</h3>
                  <p className="text-sm text-gray-400">Properties you are tracking.</p>
                </div>
                <div onClick={() => setActiveTab('inquiries')} className="bg-glass-gradient backdrop-blur-xl border border-white/10 p-6 rounded-3xl cursor-pointer hover:border-ai/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl"><MessageSquare className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" /></div>
                    <span className="text-3xl font-black text-white">{inquiries.length}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Active Inquiries</h3>
                  <p className="text-sm text-gray-400">Conversations sent to agencies.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6">Recent Agency Updates</h3>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-2">
                  {inquiries.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">You haven't made any inquiries yet. Chat with the AI on the homepage to start!</div>
                  ) : (
                    inquiries.slice(0, 5).map((inq) => (
                      <div key={inq.id} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-brand-dark rounded-xl border border-white/5 group-hover:border-ai/30 transition-colors"><Building2 className="w-5 h-5 text-gray-400 group-hover:text-ai-light" /></div>
                          <div>
                            <p className="text-white font-bold mb-0.5">{inq.category} Inquiry in {inq.location}</p>
                            <p className="text-xs text-gray-500">Handling Agency: <span className="text-gray-300 font-medium">{inq.assignedAgency || "Pending"}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:block">{renderStatusBadge(inq.status)}</div>
                          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SAVED PROPERTIES */}
          {activeTab === 'saved' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {savedProperties.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-3xl text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>You haven't saved any properties yet.</p>
                  <Link href="/search" className="text-ai-light hover:underline mt-2 inline-block">Browse available inventory</Link>
                </div>
              )}
              
              {savedProperties.map((prop) => (
                <div key={prop.id} className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group">
                  <div className="h-48 overflow-hidden relative">
                    <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    
                    {/* 🚀 UNSAVE BUTTON */}
                    <button 
                      onClick={() => handleUnsaveProperty(prop.id)}
                      title="Remove from Saved"
                      className="absolute top-4 right-4 p-2 bg-brand-dark/50 backdrop-blur-md rounded-full border border-white/20 hover:bg-red-500/20 transition-colors"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-white mb-2 line-clamp-1">{prop.title}</h4>
                    <p className="text-emerald-400 font-extrabold text-lg mb-1">{prop.priceFormatted}</p>
                    <p className="text-xs text-gray-400 mb-5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {prop.location}, {prop.city}</p>
                    
                    <div className="flex gap-3">
                      <Link href={`/properties/${prop.id}`} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white text-center rounded-xl text-sm font-bold transition-colors">View Details</Link>
                      <button className="flex-1 py-3 bg-ai hover:bg-ai-light text-white text-center rounded-xl text-sm font-bold transition-colors shadow-ai-glow">Contact Agent</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {inquiries.length === 0 && (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>You have no active inquiries.</p>
                  <p className="text-sm mt-1">Talk to our AI Concierge on the homepage to start a search or list a property!</p>
                </div>
              )}

              {inquiries.map((inq) => (
                <div key={inq.id} className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-12 relative overflow-hidden group">
                  
                  {/* Dynamic Status Glow */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${inq.status === 'closed' ? 'bg-emerald-500' : inq.status === 'site_visit' ? 'bg-purple-500' : 'bg-ai'}`}></div>

                  <div className="absolute top-0 right-0 bg-white/5 border-b border-l border-white/10 px-4 py-2 rounded-bl-2xl text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    ID: {inq.id.substring(0,8).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-ai/10 rounded-xl border border-ai/20"><MessageSquare className="w-5 h-5 text-ai-light" /></div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{inq.purpose === 'sell' ? 'Selling' : 'Buying'} {inq.category} in {inq.location || "Lahore"}</h3>
                        <p className="text-xs text-gray-400 mt-1">Initiated on {new Date(inq.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-2xl">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">AI Captured Requirements</p>
                      <p className="text-sm text-gray-300 leading-relaxed">"{inq.chatSummary || inq.intent || "Basic inquiry initiated."}"</p>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3 flex flex-col justify-center space-y-5 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Processing Agency</p>
                      <p className="text-white font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" /> {inq.assignedAgency || "Pending Assignment"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Current Status</p>
                      {renderStatusBadge(inq.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}