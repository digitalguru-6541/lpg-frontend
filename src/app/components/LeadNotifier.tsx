"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X, Target } from "lucide-react";

export default function LeadNotifier({ agencyName }: { agencyName: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const knownLeadIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!agencyName) return;

    const checkNewLeads = async () => {
      try {
        const res = await fetch(`/api/leads?t=${new Date().getTime()}`, { cache: 'no-store' });
        if (res.ok) {
          const leads = await res.json();
          // Filter leads assigned to THIS agency
          const agencyLeads = leads.filter((l: any) => l.assignedAgency === agencyName);

          if (isFirstLoad.current) {
            // On first load, just record the IDs so we don't spam notifications for old leads
            agencyLeads.forEach((l: any) => knownLeadIds.current.add(l.id));
            isFirstLoad.current = false;
            return;
          }

          // Check for brand NEW leads that are assigned and have status 'new'
          const brandNewLeads = agencyLeads.filter(
            (l: any) => l.status === 'new' && !knownLeadIds.current.has(l.id)
          );

          if (brandNewLeads.length > 0) {
            brandNewLeads.forEach((l: any) => {
              knownLeadIds.current.add(l.id); // Mark as seen
              // Add to notification stack
              setNotifications((prev) => [...prev, l]);
            });
            
            // Optional: Play a sound effect here if desired
            // new Audio('/alert.mp3').play().catch(() => {});
          }
        }
      } catch (err) {
        // Silent catch for background polling
      }
    };

    // Run immediately, then poll every 10 seconds
    checkNewLeads();
    const intervalId = setInterval(checkNewLeads, 10000);

    return () => clearInterval(intervalId);
  }, [agencyName]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none">
      {notifications.map((lead) => (
        <div 
          key={lead.id} 
          className="pointer-events-auto w-80 bg-[#162032] border-l-4 border-l-red-500 rounded-xl p-4 shadow-[0_10px_40px_rgba(239,68,68,0.2)] animate-in slide-in-from-bottom-5 fade-in duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2">
            <button onClick={() => dismissNotification(lead.id)} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/10 rounded-full shrink-0">
              <Target className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h4 className="text-white font-black text-sm mb-1">🚨 Hot Lead Dropped!</h4>
              <p className="text-xs text-gray-300 leading-relaxed mb-2">
                <strong className="text-white">{lead.name || "A new investor"}</strong> just matched with your agency via AI.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-1 rounded">SLA: 60 Mins</span>
                <span className="text-xs text-gold font-bold">Score: {lead.score}/100</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}