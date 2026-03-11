"use client";

import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, FileSearch, Megaphone, GitMerge, DollarSign, Settings,
  Bell, AlertTriangle, CheckCircle, CheckCircle2, UploadCloud, Save, Plus, Phone, Building, Star, ImageIcon, Trash2, Edit, Link as LinkIcon, X, Users, Target, MessageSquare, Clock, Sparkles, LogOut, UserCog, Search, RefreshCw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from "next/link";

// --- PRO HELPER: LIVE SLA TRACKING ENGINE ---
function TableSLATimer({ createdAt, status }: { createdAt: string | Date; status: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    if (status !== "new") return;

    const interval = setInterval(() => {
      const createdTime = new Date(createdAt).getTime();
      const expiryTime = createdTime + 60 * 60 * 1000; // 1-Hour SLA Countdown
      const now = new Date().getTime();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setIsBreached(true);
        setTimeLeft("SLA BREACHED");
        clearInterval(interval);
      } else {
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status !== "new") {
    return (
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-tighter">
        <CheckCircle2 className="w-3 h-3" /> Handshake Done
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 font-mono text-xs font-bold ${isBreached ? 'text-red-500 animate-pulse' : 'text-gold-light'}`}>
      <Clock className={`w-3 h-3 ${isBreached ? 'text-red-500' : 'text-gold'}`} />
      {timeLeft || "Initialising..."}
    </div>
  );
}

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('leads');

  // 🚀 SYNC STATE
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- REAL LIVE STATES ---
  const [properties, setProperties] = useState<any[]>([]);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);

  // --- CRM States ---
  const [leads, setLeads] = useState<any[]>([]);
  const [viewingLead, setViewingLead] = useState<any | null>(null);

  // --- User Management States ---
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const [lifestyles, setLifestyles] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    baseCommissionRate: 15, bpoAlertThreshold: 30, geminiApiKey: "", whatsappWebhookUrl: "",
    autoApproveListings: false, maintenanceMode: false
  });

  const [newRule, setNewRule] = useState("");
  const [rules, setRules] = useState([
    "If Lead Budget > 5 Crore and Location is 'DHA Phase 9', instantly assign to Ali Saqlain Estate."
  ]);

  const [adForm, setAdForm] = useState({ title: "", imageUrl: "", placement: "homepage", revenue: "" });
  const [lifestyleForm, setLifestyleForm] = useState({ title: "", countText: "", imageUrl: "", targetUrl: "/" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🚀 BULLETPROOF FETCH LOGIC: Decoupled and Path Corrected
  const fetchAllData = async () => {
    setIsRefreshing(true);
    const ts = new Date().getTime();

    // 1. Fetch core app data (Properties, Leads, etc)
    try {
      const [propsRes, lifeRes, adsRes, setRes, leadsRes] = await Promise.all([
        fetch(`/api/inventory?t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/lifestyles?t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/ads?t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/settings?t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/leads?t=${ts}`, { cache: 'no-store' })
      ]);

      if (propsRes.ok) setProperties(await propsRes.json());
      if (lifeRes.ok) setLifestyles(await lifeRes.json());
      if (adsRes.ok) setAds(await adsRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (setRes.ok) {
        const s = await setRes.json();
        setSettings({ ...s });
      }
    } catch (err) {
      console.error("Error loading core data", err);
    }

    // 2. Fetch Users EXPLICTLY and safely (Notice the path is /api/user to match your folder)
    try {
      const usersRes = await fetch(`/api/user?t=${ts}`, { cache: 'no-store' });
      
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setAllUsers(Array.isArray(userData) ? userData : []);
      } else {
        // If it fails, read the error message from the backend and alert the admin
        const errorText = await usersRes.text();
        console.error("Failed to fetch users:", errorText);
        alert(`Failed to fetch users. Server returned status: ${usersRes.status}. Check your VS Code terminal.`);
      }
    } catch (userErr) {
      console.error("Network error fetching users:", userErr);
      alert("Network error: Could not reach the /api/user endpoint.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Run on initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // --- LIVE ACTION HANDLERS ---
  const handleLeadUpdate = async (id: string, updates: any) => {
    setLeads(leads.map(l => l.id === id ? { ...l, ...updates } : l));
    if (viewingLead && viewingLead.id === id) {
      setViewingLead({ ...viewingLead, ...updates });
    }

    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
    } catch (err) {
      console.error("Failed to update lead", err);
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/inventory', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isFeatured: !currentStatus }) });
      if (res.ok) setProperties(properties.map(p => p.id === id ? { ...p, isFeatured: !currentStatus } : p));
    } catch (err) { console.error(err); }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this listing?")) {
      try {
        const res = await fetch('/api/inventory', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (res.ok) setProperties(properties.filter(p => p.id !== id));
      } catch (err) { console.error(err); }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingProperty)
      });
      if (res.ok) {
        const updatedProp = await res.json();
        setProperties(properties.map(p => p.id === updatedProp.id ? updatedProp : p));
        setEditingProperty(null);
      }
    } catch (err) { console.error(err); }
  };

  // 🚀 USER MANAGEMENT HANDLERS (Path updated to /api/user)
  const handleUserEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setAllUsers(allUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        setEditingUser(null);
        alert("User profile updated successfully!");
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this user and all their associated data?")) {
      try {
        const res = await fetch('/api/user', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (res.ok) setAllUsers(allUsers.filter(u => u.id !== id));
      } catch (err) { console.error(err); }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLifestyleForm({ ...lifestyleForm, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleLifestyleSubmit = async (e: any) => {
    e.preventDefault();
    if (lifestyleForm.title && lifestyleForm.imageUrl) {
      try {
        const res = await fetch('/api/lifestyles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lifestyleForm) });
        if (res.ok) {
          const newLife = await res.json();
          setLifestyles([newLife, ...lifestyles]);
          setLifestyleForm({ title: "", countText: "", imageUrl: "", targetUrl: "/" });
          alert("Lifestyle Collection saved to database!");
        }
      } catch (err) { console.error(err); }
    } else {
      alert("Please select an image first.");
    }
  };

  const handleDeleteLifestyle = async (id: string) => {
    if (confirm("Remove this collection from homepage?")) {
      try {
        const res = await fetch('/api/lifestyles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (res.ok) setLifestyles(lifestyles.filter(l => l.id !== id));
      } catch (err) { console.error(err); }
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if (res.ok) alert("Global SaaS Configuration saved securely!");
    } catch (err) { console.error(err); }
  };

  const handleAdSubmit = async (e: any) => {
    e.preventDefault();
    if(adForm.title) {
      try {
        const res = await fetch('/api/ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adForm) });
        if (res.ok) {
          const { ad } = await res.json();
          setAds([ad, ...ads]);
          setAdForm({ title: "", imageUrl: "", placement: "homepage", revenue: "" });
          alert("Ad pushed to live website!");
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleAddRule = (e: any) => { e.preventDefault(); if(newRule.trim()) { setRules([newRule, ...rules]); setNewRule(""); alert("Rule injected!"); } };

  // 🚀 LOGOUT FUNCTION
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

  // 🚀 DYNAMIC DASHBOARD CALCULATIONS
  const realizedRevenue = leads.filter(l => l.status === 'closed' && l.isCommissionPaid).reduce((acc, l) => acc + (l.commissionFee || 0), 0);
  const overdueCommission = leads.filter(l => l.status === 'closed' && !l.isCommissionPaid).reduce((acc, l) => acc + (l.commissionFee || 0), 0);
  const overdueCount = leads.filter(l => l.status === 'closed' && !l.isCommissionPaid).length;

  const financeData = [
    { month: 'Jan', subs: 100000, commission: 2500000, adRevenue: 150000 },
    { month: 'Feb', subs: 120000, commission: 3200000, adRevenue: 200000 },
    { month: 'Mar', subs: 150000, commission: 4100000, adRevenue: 350000 },
  ];

  // Safely filter users so null names don't crash it
  const filteredUsers = allUsers.filter(user => {
    const nameMatch = (user.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  return (
    <div className="fixed inset-0 z-[100] flex h-screen bg-brand-dark text-white font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 bg-glass-gradient backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">G</div>
          <div><h1 className="font-bold text-white leading-tight">Digital Guru</h1><p className="text-[10px] text-gray-400 uppercase tracking-widest">Command Center</p></div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <SidebarBtn icon={LayoutDashboard} label="Dashboard" active={activeTab==='dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarBtn icon={Users} label="Lead Intelligence" active={activeTab==='leads'} onClick={() => setActiveTab('leads')} />
          <SidebarBtn icon={Building} label="Inventory & Content" active={activeTab==='inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarBtn icon={UserCog} label="User Management" active={activeTab==='users'} onClick={() => setActiveTab('users')} />
          <SidebarBtn icon={FileSearch} label="Commission Auditing" active={activeTab==='auditing'} onClick={() => setActiveTab('auditing')} />
          <SidebarBtn icon={Megaphone} label="Global Ad Manager" active={activeTab==='ads'} onClick={() => setActiveTab('ads')} />
          <SidebarBtn icon={GitMerge} label="Routing Rules" active={activeTab==='routing'} onClick={() => setActiveTab('routing')} />
          <SidebarBtn icon={DollarSign} label="Financials" active={activeTab==='financials'} onClick={() => setActiveTab('financials')} />
          <SidebarBtn icon={Settings} label="SaaS Settings" active={activeTab==='settings'} onClick={() => setActiveTab('settings')} className="mt-auto" />
        </nav>

        {/* LOGOUT SECTION */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B1120]">
        <header className="h-20 border-b border-white/10 bg-brand-dark/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <h2 className="text-2xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            {/* GLOBAL REFRESH BUTTON */}
            <button
              onClick={fetchAllData}
              disabled={isRefreshing}
              className={`p-2 rounded-full border border-transparent transition-all ${isRefreshing ? 'text-blue-400 border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Force Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 text-gray-400 hover:text-white relative">
              <Bell className="w-5 h-5" />
              {overdueCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-600 border border-white/20 overflow-hidden"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop" alt="Admin" /></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">

          {/* 🚀 EDIT USER MODAL */}
          {editingUser && (
            <div className="fixed inset-0 z-[200] bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><UserCog className="w-5 h-5 text-ai-light"/> Edit User Profile</h3>
                  <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleUserEditSubmit} className="space-y-4">
                  <div><label className="text-xs text-gray-400 mb-1 block">Full Name</label><input value={editingUser.name || ""} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Email Address</label><input value={editingUser.email || ""} onChange={e=>setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Access Role</label>
                    <select value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500">
                      <option value="USER">Standard User (Investor)</option>
                      <option value="AGENCY_PARTNER">Agency Partner (Broker)</option>
                      <option value="MASTER_ADMIN">Master Admin</option>
                    </select>
                  </div>
                  {editingUser.role === 'AGENCY_PARTNER' && (
                    <div><label className="text-xs text-gray-400 mb-1 block">Assigned Agency Name</label><input value={editingUser.agencyName || ""} onChange={e=>setEditingUser({...editingUser, agencyName: e.target.value})} placeholder="e.g. Titanium Agency" className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  )}
                  <div><label className="text-xs text-gray-400 mb-1 block">Reset Password (Leave blank to keep current)</label><input type="password" onChange={e=>setEditingUser({...editingUser, passwordHash: e.target.value || editingUser.passwordHash})} placeholder="••••••••" className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 rounded-lg font-bold text-gray-400 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 bg-ai hover:bg-ai-light text-white py-3 rounded-lg font-bold transition-colors">Save Profile</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RECEIPT MODAL */}
          {viewingReceipt && (
            <div className="fixed inset-0 z-[300] bg-brand-dark/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#162032] border border-white/10 rounded-3xl p-4 w-full max-w-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileSearch className="w-5 h-5 text-blue-400" /> Uploaded Token Receipt</h3>
                  <button onClick={() => setViewingReceipt(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="w-full h-[70vh] rounded-2xl overflow-hidden bg-brand-dark/50 border border-white/5 flex items-center justify-center">
                  {viewingReceipt.startsWith('data:application/pdf') ? (
                    <iframe src={viewingReceipt} className="w-full h-full rounded-2xl" />
                  ) : (
                    <img src={viewingReceipt} className="max-w-full max-h-full object-contain rounded-2xl" alt="Token Receipt" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EDIT PROPERTY MODAL */}
          {editingProperty && (
            <div className="fixed inset-0 z-[200] bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Edit Property</h3>
                  <button onClick={() => setEditingProperty(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div><label className="text-xs text-gray-400 mb-1 block">Title</label><input value={editingProperty.title} onChange={e=>setEditingProperty({...editingProperty, title: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Price (Formatted for UI)</label><input value={editingProperty.priceFormatted} onChange={e=>setEditingProperty({...editingProperty, priceFormatted: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Agency Name</label><input value={editingProperty.agencyName} onChange={e=>setEditingProperty({...editingProperty, agencyName: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Image URL</label><input value={editingProperty.imageUrl} onChange={e=>setEditingProperty({...editingProperty, imageUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditingProperty(null)} className="flex-1 py-3 rounded-lg font-bold text-gray-400 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-3 rounded-lg font-bold transition-colors">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* UPGRADED LEAD INTEL MODAL */}
          {viewingLead && (
            <div className="fixed inset-0 z-[200] bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#162032] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Target className="w-6 h-6 text-ai-light" /> Lead Intelligence Report</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Captured: {new Date(viewingLead.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <button onClick={() => setViewingLead(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-2xl">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Contact Info</p>
                    <p className="text-lg font-bold text-white mb-1">{viewingLead.name || "Unknown User"}</p>
                    <p className="text-emerald-400 font-mono font-medium flex items-center gap-2"><Phone className="w-4 h-4" /> {viewingLead.phone || "No Phone Provided"}</p>
                  </div>

                  <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Assigned Agency</p>
                      <select 
                        value={viewingLead.assignedAgency || "Pending Assignment"}
                        onChange={(e) => handleLeadUpdate(viewingLead.id, { assignedAgency: e.target.value })}
                        className="w-full bg-brand-dark border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Pending Assignment">Pending Assignment</option>
                        <option value="Ali Saqlain Estate">Ali Saqlain Estate</option>
                        <option value="Titanium Agency">Titanium Agency</option>
                        <option value="Chohan Estate">Chohan Estate</option>
                        <option value="Zameen Connect">Zameen Connect</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Pipeline Status</p>
                      <select 
                        value={viewingLead.status}
                        onChange={(e) => handleLeadUpdate(viewingLead.id, { status: e.target.value })}
                        className="w-full bg-brand-dark border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 cursor-pointer uppercase"
                      >
                        <option value="new">New (Uncontacted)</option>
                        <option value="engaged">Engaged</option>
                        <option value="site_visit">Site Visit</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed">Closed (Won)</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 shadow-lg ${viewingLead.score > 80 ? 
                    'border-red-500 text-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : viewingLead.score > 50 ? 'border-gold text-gold bg-gold/10' : 'border-gray-500 text-gray-400 bg-white/5'}`}>
                    {viewingLead.score}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">AI Lead Score</h4>
                    <p className="text-sm text-gray-400">{viewingLead.score > 80 ? 'Hot Lead: Immediate routing advised.' : 'Warm Lead: Needs nurturing.'}</p>
                  </div>
                </div>

                <div className="bg-brand-dark/80 border border-ai/30 rounded-2xl p-5 shadow-inner">
                  <h4 className="text-sm font-bold text-ai-light flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4" /> AI Chat Summary & Intent</h4>
                  <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{viewingLead.chatSummary || viewingLead.intent || "No chat summary available. User may have only browsed without interacting with AI."}</p>
                </div>
              </div>
            </div>
          )}

          {/* 🚀 NEW USER MANAGEMENT TAB (With Sync Button) */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserCog className="w-5 h-5 text-ai-light" /> Master User Directory</h3>
                    <p className="text-sm text-gray-400 mt-1">Control access roles, reset passwords, and manage agency affiliations.</p>
                  </div>
                  
                  {/* SEARCH & SYNC BUTTONS */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-brand-dark border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-full md:w-56"
                      />
                    </div>
                    <button 
                      onClick={fetchAllData} 
                      disabled={isRefreshing}
                      className="flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                      {isRefreshing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="pb-3 px-4">User Details</th>
                        <th className="pb-3 px-4">Contact Email</th>
                        <th className="pb-3 px-4">Account Role</th>
                        <th className="pb-3 px-4">Affiliation</th>
                        <th className="pb-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">No users found. Try clicking "Sync Now".</td></tr>}
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white uppercase">{user.name?.charAt(0) || '?'}</div>
                              <div>
                                <p className="font-bold text-white">{user.name || "No Name"}</p>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {user.id?.substring(0,8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-300 font-medium">{user.email}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'MASTER_ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : user.role === 'AGENCY_PARTNER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-gray-300 border border-white/10'}`}>
                              {user.role?.replace('_', ' ') || 'USER'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-emerald-400 text-xs font-bold">{user.agencyName || "Independent"}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingUser(user)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors" title="Edit User"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors" title="Delete User"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LEADS CRM TAB WITH PRO SLA ENGINE */}
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-glass-gradient border border-blue-500/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(59,130,246,0.1)] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Master CRM Pipeline</h2>
                  <p className="text-gray-400">Monitor all incoming traffic, AI conversations, and active deals routed to agencies.</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 px-6 py-3 rounded-xl text-center">
                  <p className="text-xs text-blue-300 uppercase tracking-widest font-bold">Total Leads</p>
                  <p className="text-3xl font-extrabold text-blue-400">{leads.length}</p>
                </div>
              </div>

              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="pb-3 px-4">Lead ID / Name</th>
                        <th className="pb-3 px-4">Phone Extracted</th>
                        <th className="pb-3 px-4">AI Score</th>
                        <th className="pb-3 px-4 text-gold-light">Handshake SLA</th>
                        <th className="pb-3 px-4">Assigned Agency</th>
                        <th className="pb-3 px-4">Pipeline Status</th>
                        <th className="pb-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">No leads captured yet. Run a chat on the homepage!</td></tr>}
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 px-4">
                            <p className="font-bold text-white">{lead.name || "Anonymous Guest"}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">ID: {lead.id.substring(0,8).toUpperCase()}</p>
                          </td>
                          <td className="py-4 px-4 text-gray-300 font-mono">{lead.phone || "---"}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${lead.score > 80 ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-white/10 text-gray-300'}`}>{lead.score}/100</span>
                          </td>
                          
                          <td className="py-4 px-4">
                            <TableSLATimer createdAt={lead.createdAt} status={lead.status} />
                          </td>

                          <td className="py-4 px-4 text-emerald-400 font-medium">{lead.assignedAgency || "Pending Assignment"}</td>
                          <td className="py-4 px-4">
                            <span className={`bg-brand-dark border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${lead.status === 'new' ? 'text-gold-light' : 'text-emerald-400'}`}>
                              {lead.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {lead.status === 'new' && (
                                <button title="Trigger BPO Call" className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"><Phone className="w-3 h-3" /></button>
                              )}
                              <button onClick={() => setViewingLead(lead)} className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-blue-500/20">View Intel</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY & CONTENT CMS */}
          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Building className="w-5 h-5 text-blue-400" /> Master Property Inventory</h3>
                    <p className="text-sm text-gray-400 mt-1">Manage all agency listings. Edit, delete, or push them to the Homepage Premium Carousel.</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold">Total: {properties.length} Active</div>
                </div>
                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead><tr className="text-gray-400 border-b border-white/10"><th className="pb-3 w-16">Image</th><th className="pb-3">Property Title</th><th className="pb-3">Uploading Agency</th><th className="pb-3">Price</th><th className="pb-3 text-center">Homepage Featured</th><th className="pb-3 text-right">Actions</th></tr></thead>
                    <tbody>
                      {properties.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No properties found. Please upload listings first.</td></tr>}
                      {properties.map((prop) => (
                        <tr key={prop.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-3"><img src={prop.imageUrl} className="w-12 h-12 rounded-lg object-cover border border-white/10" alt="prop" /></td>
                          <td className="py-3 font-bold text-white">{prop.title}</td>
                          <td className="py-3 text-gray-400">{prop.agencyName}</td>
                          <td className="py-3 text-emerald-400 font-medium">{prop.priceFormatted}</td>
                          <td className="py-3 flex justify-center">
                            <button onClick={() => toggleFeatured(prop.id, prop.isFeatured)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${prop.isFeatured ? 
                              'bg-gold/20 text-gold border-gold/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-gray-800 text-gray-400 border-gray-600 hover:text-white'}`}>
                              <Star className={`w-3 h-3 ${prop.isFeatured ? 'fill-current' : ''}`} /> {prop.isFeatured ? 'Featured' : 'Mark Premium'}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingProperty(prop)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors" title="Edit Listing"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteProperty(prop.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors" title="Delete Listing"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                  <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-emerald-400" /> New Lifestyle Card</h4>
                  <form onSubmit={handleLifestyleSubmit} className="flex flex-col gap-4">
                    <div><label className="text-xs text-gray-400 mb-1 block">Collection Title</label><input required value={lifestyleForm.title} onChange={e=>setLifestyleForm({...lifestyleForm, title: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none" placeholder="e.g. Golf Estates" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Property Count Text</label><input required value={lifestyleForm.countText} onChange={e=>setLifestyleForm({...lifestyleForm, countText: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none" placeholder="e.g. 14 Properties" /></div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Card Background Image</label>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-24 bg-brand-dark border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-500 transition-colors overflow-hidden">
                        {lifestyleForm.imageUrl ? <img src={lifestyleForm.imageUrl} className="w-full h-full object-cover opacity-60" /> : <><UploadCloud className="w-6 h-6 mb-2" /><span className="text-xs font-medium">Click to upload image</span></>}
                      </button>
                    </div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Destination Link (On Click)</label><div className="relative"><LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" /><input required value={lifestyleForm.targetUrl} onChange={e=>setLifestyleForm({...lifestyleForm, targetUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg pl-9 p-3 text-sm text-white outline-none" placeholder="/search?category=commercial" /></div></div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2 transition-colors"><Save className="w-4 h-4" /> Push to Database</button>
                  </form>
                </div>
                <div className="xl:col-span-2 bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                  <h4 className="text-sm font-bold text-gray-300 mb-4 border-b border-white/5 pb-3">Active Lifestyle Collections</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lifestyles.length === 0 && <p className="text-gray-500 text-sm">No collections saved yet.</p>}
                    {lifestyles.map(life => (
                      <a href={life.targetUrl} key={life.id} onClick={(e) => e.preventDefault()} className="relative h-40 rounded-xl overflow-hidden shadow-glass border border-white/10 group block">
                        <img src={life.imageUrl} alt={life.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-3 left-3">
                          <h5 className="text-white font-bold">{life.title}</h5>
                          <p className="text-xs text-emerald-400">{life.countText}</p>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteLifestyle(life.id); }} className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400"><Trash2 className="w-4 h-4" /></button>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD TAB (RESTORED SECTIONS + DYNAMIC FINANCIALS) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-glass-gradient border border-blue-500/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(59,130,246,0.1)] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome back, Admin.</h2>
                  <p className="text-gray-400">Your SaaS platform has generated <strong className="text-emerald-400">PKR {realizedRevenue.toLocaleString()}</strong> in realized revenue.
                  {overdueCount > 0 && <span className="text-red-400 ml-1">You have {overdueCount} overdue invoice(s) requiring action.</span>}</p>
                </div>
                <button onClick={() => setActiveTab('auditing')} className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-bold transition-colors">Go to Ledger</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Realized Revenue" value={`PKR ${realizedRevenue.toLocaleString()}`} success />
                <StatCard title="Overdue Commission" value={`PKR ${overdueCommission.toLocaleString()}`} alert={overdueCommission > 0} />
                <StatCard title="Active Campaigns" value={`${ads.length} Ads`} />
                <StatCard title="Total Listings" value={properties.length.toString()} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#162032] border border-white/10 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-gray-300 mb-4 border-b border-white/5 pb-3">Recent Activity</h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-white">Titanium Agency</span> moved DL-102 to "Closed". 
                    <span className="text-gray-500 text-xs ml-auto">2 hrs ago</span></li>
                    <li className="flex items-center gap-3 text-sm"><span className="w-2 h-2 rounded-full bg-blue-500"></span>New AI Routing Rule injected by <span className="text-white">Admin</span>. 
                    <span className="text-gray-500 text-xs ml-auto">5 hrs ago</span></li>
                    <li className="flex items-center gap-3 text-sm"><span className="w-2 h-2 rounded-full bg-gold"></span>DHA Prism Ad reached <span className="text-white">150k impressions</span>. 
                    <span className="text-gray-500 text-xs ml-auto">1 day ago</span></li>
                  </ul>
                </div>
                <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-blue-400" /></div>
                  <h4 className="text-white font-bold mb-2">System Optimal</h4>
                  <p className="text-sm text-gray-400">All database connections, AI webhook endpoints, and frontend routers are operating normally.</p>
                </div>
              </div>
            </div>
          )}

          {/* 🚀 UPGRADED DYNAMIC COMMISSION AUDITING TAB */}
          {activeTab === 'auditing' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
              <div className="xl:col-span-2 bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                <h4 className="text-sm font-bold text-gray-300 mb-4 border-b border-white/5 pb-3">Commission Ledger & Document Audit</h4>
                <div className="overflow-x-auto custom-scrollbar pb-4">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="pb-3 px-2">Agency</th>
                        <th className="pb-3 px-2">Deal ID</th>
                        <th className="pb-3 px-2">Closing Amount</th>
                        <th className="pb-3 px-2">Our Cut (PKR)</th>
                        <th className="pb-3 px-2 text-center">Status</th>
                        <th className="pb-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.filter(l => l.status === 'closed').length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-gray-500">No closed deals reported by agencies yet.</td></tr>
                      )}
                      {leads.filter(l => l.status === 'closed').map((lead) => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-2 text-white font-medium">{lead.assignedAgency || "Direct"}</td>
                          <td className="py-4 px-2 text-gray-400 font-mono">DL-{lead.id.substring(0,5).toUpperCase()}</td>
                          <td className="py-4 px-2 text-white font-mono">{(lead.closingPrice || 0).toLocaleString()}</td>
                          <td className="py-4 px-2">
                            <span className="font-bold text-white block">{(lead.commissionFee || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-400 uppercase tracking-widest">{lead.commissionRate || 15}% Rate</span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            {/* INSTANT PAYMENT TOGGLE */}
                            <button 
                              onClick={() => handleLeadUpdate(lead.id, { isCommissionPaid: !lead.isCommissionPaid })}
                              className={`px-3 py-1.5 rounded font-bold uppercase text-[10px] transition-all w-full tracking-wider ${lead.isCommissionPaid ? 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20' : 'text-red-400 bg-red-400/10 hover:bg-red-400/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}
                            >
                              {lead.isCommissionPaid ? 'Paid & Settled' : 'Unpaid (Click to clear)'}
                            </button>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {lead.tokenReceipt && (
                                <button onClick={() => setViewingReceipt(lead.tokenReceipt)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white text-xs border border-blue-500/30 font-bold transition-colors">View Receipt</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 🚀 LIVE BPO VERIFICATION LOOP (Fetches Site Visit Deals) */}
              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col">
                <h4 className="text-sm font-bold text-gray-300 mb-4 border-b border-white/5 pb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-ai-light" /> BPO Verification Loop</h4>
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar max-h-[60vh] pr-2">
                  {leads.filter(l => l.status === 'site_visit').length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-10">
                      <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No deals currently stuck in Site Visit.</p>
                    </div>
                  ) : (
                    leads.filter(l => l.status === 'site_visit').map(stuckLead => (
                      <div key={stuckLead.id} className="bg-brand-dark/50 border border-white/5 p-4 rounded-xl group hover:border-red-500/30 transition-colors">
                        <p className="text-xs text-gray-400 mb-2">Agency: <span className="text-white font-bold">{stuckLead.assignedAgency}</span></p>
                        <p className="text-sm text-gray-300 leading-relaxed mb-3">Deal <span className="font-bold text-white font-mono">DL-{stuckLead.id.substring(0,5).toUpperCase()}</span> is marked as Site Visit. 
                        Trigger verification to ensure agency isn't hiding a close.</p>
                        <button className="text-xs font-bold bg-white/5 text-gray-300 px-3 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors w-full flex items-center justify-center gap-2"><Phone className="w-3 h-3"/> Call Buyer ({stuckLead.name})</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AD MANAGER TAB */}
          {activeTab === 'ads' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              <div className="lg:col-span-1 bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-blue-400" /> Deploy New Campaign</h4>
                <form onSubmit={handleAdSubmit} className="flex flex-col gap-4">
                  <div><label className="text-xs text-gray-400 mb-1 block">Campaign Title</label><input required value={adForm.title} onChange={e=>setAdForm({...adForm, title: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Image URL</label><input required value={adForm.imageUrl} onChange={e=>setAdForm({...adForm, imageUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Placement</label><select value={adForm.placement} onChange={e=>setAdForm({...adForm, placement: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-sm text-white outline-none"><option value="homepage">Homepage Hero</option><option value="sidebar">Property Sidebar</option></select></div>
                  <button type="submit" className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-400 transition-colors"><Save className="w-4 h-4" /> Go Live</button>
                </form>
              </div>
              <div className="lg:col-span-2 flex flex-col gap-4">
                {ads.map((ad: any) => (
                  <div key={ad.id} className="bg-[#162032] border border-white/10 p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-4"><img src={ad.imageUrl} className="w-16 h-10 object-cover rounded" alt="banner" /><div><h4 className="text-white font-bold">{ad.title}</h4><p className="text-[10px] text-blue-400 uppercase font-black">{ad.placement}</p></div></div>
                    <div className="flex gap-6 text-center"><div><p className="text-lg font-bold text-white">{(ad.impressions || 0).toLocaleString()}</p><p className="text-[10px] text-gray-500 uppercase">Views</p></div><div><p className="text-lg font-bold text-emerald-400">{(ad.clicks || 0).toLocaleString()}</p><p className="text-[10px] text-gray-500 uppercase">Clicks</p></div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI ROUTING RULES TAB */}
          {activeTab === 'routing' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-brand-dark/50 border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-ai-light" /> Instruct the AI Engine</h3>
                <p className="text-sm text-gray-300 mb-4">Write rules in plain English to redirect incoming leads.</p>
                <form onSubmit={handleAddRule} className="flex gap-3"><input value={newRule} onChange={e=>setNewRule(e.target.value)} placeholder="e.g. 'Redirect all Titanium leads to Ali Saqlain...'" className="flex-1 bg-brand-dark border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500/50" /><button type="submit" className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 rounded-xl flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Inject Rule</button></form>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {rules.map((rule, idx) => (
                  <div key={idx} className="bg-[#162032] border border-l-4 border-l-blue-500 p-4 rounded-xl flex items-center justify-between"><p className="text-sm text-white font-medium italic">"{rule}"</p><button className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1 rounded-full">Revoke</button></div>
                ))}
              </div>
            </div>
          )}

          {/* FINANCIALS TAB */}
          {activeTab === 'financials' && (
            <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg h-[450px] flex gap-6 animate-in fade-in duration-500">
              <div className="flex-1 flex flex-col">
                <h4 className="text-sm font-bold text-gray-300 mb-6 uppercase tracking-widest">SaaS Revenue Forecast (2026)</h4>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="subs" name="Lite Subscriptions" stackId="a" fill="#3B82F6" />
                      <Bar dataKey="commission" name="Partner Commissions" stackId="a" fill="#10B981" />
                      <Bar dataKey="adRevenue" name="Ad Revenue" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="w-72 shrink-0 flex flex-col justify-center gap-4">
                <div className="bg-[#1E293B] border border-emerald-500/30 p-6 rounded-2xl shadow-xl text-center">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Realized Revenue</p>
                  <p className="text-2xl font-black text-emerald-400">PKR {realizedRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-[#1E293B] border border-gold/30 p-6 rounded-2xl shadow-xl text-center">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Overdue Pipeline</p>
                  <p className="text-2xl font-black text-white">PKR {overdueCommission.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* SAAS SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl animate-in fade-in duration-500 pb-20">
              <div className="bg-[#162032] border border-white/10 rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-400" /> Global SaaS Configuration</h3>
                <div className="space-y-8">
                  <div><h4 className="text-xs font-black text-gray-500 mb-4 uppercase tracking-widest">Financial Rules & BPO</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div><label className="text-xs text-gray-400 mb-1 block">Default Commission Rate (%)</label><input type="number" value={settings.baseCommissionRate} onChange={e=>setSettings({...settings, baseCommissionRate: Number(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500" /></div>
                      <div><label className="text-xs text-gray-400 mb-1 block">BPO Alert Threshold (Days in Site Visit)</label><input type="number" value={settings.bpoAlertThreshold} onChange={e=>setSettings({...settings, bpoAlertThreshold: Number(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500" /></div>
                    </div>
                  </div>
                  <div><h4 className="text-xs font-black text-gray-500 mb-4 uppercase tracking-widest border-t border-white/5 pt-6">API & Integrations</h4>
                    <div className="space-y-4">
                      <div><label className="text-xs text-gray-400 mb-1 block">Gemini AI Engine Key</label><input type="password" value={settings.geminiApiKey || 
                        ""} onChange={e=>setSettings({...settings, geminiApiKey: e.target.value})} className="w-full bg-brand-dark border border-emerald-500/30 rounded-lg p-3 text-emerald-400 font-mono text-sm outline-none" /></div>
                      <div><label className="text-xs text-gray-400 mb-1 block">WhatsApp Lead-Gen Webhook</label><input type="text" value={settings.whatsappWebhookUrl || 
                        ""} onChange={e=>setSettings({...settings, whatsappWebhookUrl: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-white outline-none" /></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-widest border-t border-white/5 pt-6">Platform Controls</h4>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between bg-brand-dark p-4 rounded-xl border border-white/10 cursor-pointer hover:border-white/20">
                        <div><p className="font-bold text-white text-sm">Auto-Approve Agency Listings</p><p className="text-xs text-gray-400 mt-0.5">If disabled, new listings go to the Inventory Tab for manual approval.</p></div>
                        <input type="checkbox" checked={settings.autoApproveListings} onChange={e=>setSettings({...settings, autoApproveListings: e.target.checked})} className="w-5 h-5 accent-blue-500 cursor-pointer" />
                      </label>
                      <label className="flex items-center justify-between bg-red-500/10 p-4 rounded-xl border border-red-500/20 cursor-pointer hover:border-red-500/40">
                        <div><p className="font-bold text-red-400 text-sm">Enable Maintenance Mode</p><p className="text-xs text-red-300/60 mt-0.5">Instantly blocks all public traffic and shows a "Be Back Soon" page.</p></div>
                        <input type="checkbox" checked={settings.maintenanceMode} onChange={e=>setSettings({...settings, maintenanceMode: e.target.checked})} className="w-5 h-5 accent-red-500 cursor-pointer" />
                      </label>
                    </div>
                  </div>
                  <button onClick={handleSaveSettings} className="bg-blue-500 hover:bg-blue-400 text-white font-black py-4 px-8 rounded-xl transition-all w-full flex justify-center items-center gap-2 shadow-lg"><Save className="w-5 h-5" /> Commit Changes to Database</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function SidebarBtn({ icon: Icon, label, active, onClick, className="" }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${active ? 
      'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${className}`}>
      <Icon className="w-5 h-5" /> <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ title, value, alert, success }: any) {
  return (
    <div className={`bg-[#162032] border rounded-2xl p-6 shadow-lg ${alert ? 'border-red-500/30' : success ? 'border-emerald-500/30' : 'border-white/10'}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">{title}</p>
      <p className={`text-3xl font-black ${alert ? 'text-red-400' : success ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}