"use client";

import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, Flame, CheckCircle, Clock, MapPin,
  Phone, MessageSquare, TrendingUp, Search, Bell, ArrowRight,
  Loader2, LandPlot, Home as HomeIcon, Briefcase, Sparkles, Key, DoorOpen, 
  PlusCircle, Upload, Image as ImageIcon, CheckCircle2, DollarSign, X, 
  FileText, Ban, BarChart3, IdCard, NotebookPen, Video, Copy, Save, 
  BellRing, CalendarClock, BotMessageSquare, Send, LogOut, Info, Wallet, 
  Trophy, UserPlus, MessageCircle, Target, UserPlus2, UserCircle, 
  ListTodo, History, CheckSquare, Trash2, Plus, Shield, Building, Edit, 
  Medal, Award, Calendar, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
//import imageCompression from 'browser-image-compression'; // 🚀 INJECTED COMPRESSION SDK

import LeadNotifier from "../components/LeadNotifier";

// --- GLOBAL HELPERS ---
const formatDateTimeLocal = (dateString?: string | null) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

// NUMBER FORMATTERS & PKR WORD CONVERTER
const formatNumberInput = (val: string | number) => {
  if (!val) return "";
  const raw = val.toString().replace(/,/g, '');
  if (!isNaN(Number(raw)) && raw !== "") {
      return Number(raw).toLocaleString('en-US'); 
  }
  return val;
};

const parseNumberInput = (val: string) => {
  if (!val) return "";
  return val.replace(/,/g, ''); 
};

const getPKRWords = (value: string | number) => {
  if (!value) return "";
  const num = Number(value.toString().replace(/,/g, ''));
  if (isNaN(num) || num === 0) return ""; 
  if (num < 1000) return num.toString() + " Rupees";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);

  let parts = [];
  if (crore > 0) parts.push(`${crore} Crore`);
  if (lakh > 0) parts.push(`${lakh} Lakh`);
  if (thousand > 0) parts.push(`${thousand} Thousand`);

  return parts.join(' ') + " Rupees";
};

// SMART LINK GENERATOR FOR CHAT SUMMARIES
const renderTextWithLinks = (text: string) => {
  if (!text) return "No summary available.";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold underline hover:text-blue-300 break-all">{part}</a>;
    }
    return part;
  });
};

export default function PartnerDashboard() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'add_lead' | 'upload' | 'my_listings' | 'analytics' | 'notifications' | 'wallet' | 'team' | 'profile' | 'agent_performance'>('pipeline');
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AUTH STATE FOR RBAC
  const [activeUser, setActiveUser] = useState<{ id?: string; email?: string; agencyName?: string; name?: string; username?: string; role?: string } | null>(null);

  const isCaller = activeUser?.role === 'CALLER';
  const isExecutive = activeUser?.role === 'EXECUTIVE';
  const isAdmin = activeUser?.role === 'ADMIN' || activeUser?.role === 'AGENCY_PARTNER' || !activeUser?.role;
  const currentUserName = activeUser?.username || activeUser?.name || "Unassigned";

  // NOTIFICATION & HISTORY STATES
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastLeadsSnapshot = useRef<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());

  // PIPELINE FILTER STATE
  const [pipelineDateFilter, setPipelineDateFilter] = useState<'all'|'weekly'|'biweekly'|'monthly'|'quarterly'|'yearly'>('all');

  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  const [dealRoomLead, setDealRoomLead] = useState<any | null>(null);
  const [viewingSummaryLead, setViewingSummaryLead] = useState<any | null>(null);
  const [globalRate, setGlobalRate] = useState<number>(15);

  const [notesLead, setNotesLead] = useState<any | null>(null);
  const [notesForm, setNotesForm] = useState({ handledBy: "", agentNotes: "" });

  const [reminderLead, setReminderLead] = useState<any | null>(null);
  const [reminderForm, setReminderForm] = useState({ date: "", note: "" });

  const [expandedLead, setExpandedLead] = useState<any | null>(null);
  const [editLeadForm, setEditLeadForm] = useState({
    name: "", phone: "", location: "", budget: "", handledBy: "", agentNotes: "", manualSummary: ""
  });
  
  const [leadTasks, setLeadTasks] = useState<any[]>([]);
  const [leadLogs, setLeadLogs] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [isSavingMaster, setIsSavingMaster] = useState(false);

  const [closingForm, setClosingForm] = useState({
    price: "", rate: 15, receiptUrl: "", propertyId: "", clientIdFrontUrl: "", clientIdBackUrl: ""
  });
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const [agencyUsers, setAgencyUsers] = useState<any[]>([]);
  const [newAgentForm, setNewAgentForm] = useState({ username: "", password: "", role: "CALLER" });
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  // --- AGENT EDITING STATES ---
  const [showPassword, setShowPassword] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [editAgentForm, setEditAgentForm] = useState({ username: "", role: "", password: "" });
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [isFetchingProps, setIsFetchingProps] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);

  const [perfFilter, setPerfFilter] = useState<'all'|'weekly'|'biweekly'|'monthly'|'quarterly'|'yearly'>('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const triggerNotification = (title: string, message: string, leadId: string, performedBy?: string, showBanner: boolean = false) => {
    const newNote = { 
      id: Date.now().toString() + Math.random(), 
      title, 
      message, 
      leadId, 
      time: new Date(), 
      read: !showBanner, 
      performedBy: performedBy || currentUserName || "System"
    };
    setNotifications(prev => [newNote, ...prev]);
    if (showBanner) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const detectChanges = (newLeads: any[]) => {
    const currentDataString = JSON.stringify(newLeads.map(l => ({ id: l.id, upd: l.updatedAt, sum: l.chatSummary, st: l.status })));

    if (lastLeadsSnapshot.current && lastLeadsSnapshot.current !== currentDataString) {
      const oldData = JSON.parse(lastLeadsSnapshot.current);

      newLeads.forEach(lead => {
        const oldLead = oldData.find((ol: any) => ol.id === lead.id);

        if (!oldLead) {
          triggerNotification("New Lead Received", `Investor "${lead.name || 'Anonymous'}" entered the pipeline.`, lead.id, "AI Engine", true);
        } else if (oldLead.upd !== lead.updatedAt || oldLead.sum !== lead.chatSummary || oldLead.st !== lead.status) {
          triggerNotification("Lead Updated", `Data or Status changed for "${lead.name || 'Client'}".`, lead.id, "System Sync", false);
        }
      });
    }
    lastLeadsSnapshot.current = currentDataString;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      const fetchHistory = async () => {
        try {
          const res = await fetch('/api/activities');
          if (res.ok) {
            const data = await res.json();
            const historyNotes = data.map((log: any) => ({
              id: log.id,
              title: log.action.replace(/_/g, ' '),
              message: log.details,
              leadId: log.leadId || "system",
              time: log.createdAt,
              read: true, 
              performedBy: log.performedBy || 'System'
            }));
            
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newHistory = historyNotes.filter((h: any) => !existingIds.has(h.id));
              return [...newHistory, ...prev].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            });
          }
        } catch (error) {
          console.error("Failed to fetch global history", error);
        }
      };
      fetchHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'my_listings' && activeUser?.agencyName) {
      setIsFetchingProps(true);
      fetch(`/api/properties?agencyName=${encodeURIComponent(activeUser.agencyName)}`)
        .then(res => res.json())
        .then(data => { 
          setMyProperties(data.properties || data || []); 
          setIsFetchingProps(false); 
        })
        .catch(err => {
          console.error(err);
          setIsFetchingProps(false);
        });
    }
  }, [activeTab, activeUser]);

  useEffect(() => {
    const initializeDashboardData = async () => {
      try {
        const [settingsRes, authRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/auth/me')
        ]);

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings && settings.baseCommissionRate) {
            setGlobalRate(settings.baseCommissionRate);
          }
        }

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.isLoggedIn) {
            setActiveUser(authData.user);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard settings", error);
      }
    };

    initializeDashboardData();

    const eventSource = new EventSource('/api/leads/stream');

    eventSource.onopen = () => console.log("Real-time Lead Pipeline Connected");

    eventSource.addEventListener('update', (event) => {
      try {
        const liveLeads = JSON.parse(event.data);
        detectChanges(liveLeads); 
        setLeads(liveLeads);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to parse SSE leads data", error);
      }
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("SSE Stream closed seamlessly by frontend navigation.");
      } else {
        console.log("SSE Stream lost connection. Attempting to reconnect...");
      }
    };

    return () => {
      eventSource.close();
      console.log("Real-time Lead Pipeline Disconnected");
    };
  }, []);

  useEffect(() => {
    if (activeUser?.agencyName || activeUser?.id) {
      const fetchAgents = async () => {
        try {
          const res = await fetch(`/api/agency-users`); 
          if (res.ok) {
            const data = await res.json();
            const agencyStaff = data.filter((u: any) => u.agencyName === activeUser.agencyName || u.ownerId === activeUser.id);
            const mappedData = agencyStaff.map((user: any) => ({ ...user, activeLeads: 0, win: 0 }));
            setAgencyUsers(mappedData);
          }
        } catch (error) {
          console.error("Failed to fetch live roster", error);
        }
      };
      fetchAgents();
    }
  }, [activeUser?.agencyName, activeUser?.id]);

  useEffect(() => {
    if (aiChatEndRef.current) aiChatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const newMessages: {role: "user"|"ai", content: string}[] = [...aiMessages, { role: "user", content: aiInput }];
    setAiMessages(newMessages);
    setAiInput("");
    setIsAiLoading(true);

    const dashboardData = leads.map(l => ({
      shortId: l.id.substring(0, 5).toUpperCase(),
      name: l.name,
      phone: l.phone,
      status: l.status,
      budget: l.budget,
      location: l.location,
      intent: l.intent,
      chatSummary: l.chatSummary,
      agentNotes: l.agentNotes
    }));

    try {
      const res = await fetch("/api/agency-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newMessages, dashboardData }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setAiMessages([...newMessages, { role: "ai", content: data.reply }]);
      }
    } catch (error) {
      console.error("AI Error", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: string, additionalData: any = {}) => {
    if (isCaller) {
      alert("Callers are restricted from altering pipeline stages. Please consult an Executive or Admin.");
      return;
    }

    const targetLead = leads.find(l => l.id === id);
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus, ...additionalData } : lead));
    
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus, ...additionalData })
    });

    if (targetLead) {
      triggerNotification("Pipeline Status Updated", `Moved "${targetLead.name || 'Client'}" to ${newStatus.replace('_', ' ')}.`, id, currentUserName, false);
    }
  };

  const handleSaveExpandedLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedLead) return;
    setIsSavingMaster(true);

    const updatedData = { ...editLeadForm };
    setLeads(leads.map(lead => lead.id === expandedLead.id ? { ...lead, ...updatedData } : lead));

    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expandedLead.id, ...updatedData })
      });
      triggerNotification("CRM Details Updated", `Core profile updated for "${expandedLead.name}".`, expandedLead.id, currentUserName, false);
      setExpandedLead(null);
    } catch (error) {
      console.error("Failed to save master lead details", error);
    } finally {
      setIsSavingMaster(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle || !newTaskDate || !expandedLead) return;
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: expandedLead.id,
          title: newTaskTitle,
          dueDate: newTaskDate,
          assignedTo: currentUserName
        })
      });

      if (res.ok) {
        const newTask = await res.json();
        setLeadTasks(prev => [newTask, ...prev]); 
        
        const logDetail = `Task added: "${newTask.title}" due on ${new Date(newTask.dueDate).toLocaleDateString()}`;

        setLeadLogs(prev => [{
          id: Date.now().toString(),
          action: "TASK_CREATED",
          details: logDetail,
          performedBy: newTask.assignedTo,
          createdAt: new Date().toISOString()
        }, ...prev]);

        triggerNotification("New Task Created", logDetail, expandedLead.id, currentUserName, false);

        setNewTaskTitle("");
        setNewTaskDate("");
      } else {
        alert("Failed to save task to database.");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const taskToUpdate = leadTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const newCompletionStatus = !taskToUpdate.isCompleted;
    setLeadTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: newCompletionStatus } : t));

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          isCompleted: newCompletionStatus,
          performedBy: currentUserName
        })
      });

      if (res.ok && newCompletionStatus) {
         const logDetail = `Task completed: "${taskToUpdate.title}"`;
         
         setLeadLogs(prev => [{
           id: Date.now().toString(),
           action: "TASK_COMPLETED",
           details: logDetail,
           performedBy: currentUserName,
           createdAt: new Date().toISOString()
         }, ...prev]);

         triggerNotification("Task Completed! ✅", logDetail, expandedLead.id, currentUserName, false);

      } else if (!res.ok) {
        throw new Error("Failed to update task in database");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setLeadTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !newCompletionStatus } : t));
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesLead) return;

    setLeads(leads.map(lead => lead.id === notesLead.id ? { ...lead, handledBy: notesForm.handledBy, agentNotes: notesForm.agentNotes } : lead));

    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notesLead.id, handledBy: notesForm.handledBy, agentNotes: notesForm.agentNotes })
    });

    triggerNotification("Agent Note Logged", `Update logged for "${notesLead.name}".`, notesLead.id, currentUserName, false);
    setNotesLead(null);
  };

  const openNotesModal = (lead: any) => {
    setNotesLead(lead);
    setNotesForm({ handledBy: lead.handledBy || currentUserName, agentNotes: lead.agentNotes || "" });
  };

  const handleSaveQuickReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderLead) return;

    const isoDate = reminderForm.date ? new Date(reminderForm.date).toISOString() : null;

    setLeads(leads.map(lead => lead.id === reminderLead.id ? { ...lead, reminderDate: isoDate, reminderNote: reminderForm.note } : lead));

    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reminderLead.id, reminderDate: isoDate, reminderNote: reminderForm.note })
    });

    triggerNotification("SLA Reminder Set", `Timer armed for "${reminderLead.name}".`, reminderLead.id, currentUserName, true);
    setReminderLead(null);
  };

  const openReminderModal = (lead: any) => {
    setReminderLead(lead);
    setReminderForm({ date: formatDateTimeLocal(lead.reminderDate), note: lead.reminderNote || "" });
  };

  const dismissReminder = async (id: string) => {
    setDismissedReminders(prev => new Set(prev).add(id));
    setLeads(leads.map(lead => lead.id === id ? { ...lead, reminderDate: null } : lead));

    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reminderDate: null })
    });
  };

  const openExpandedLead = async (lead: any) => {
    setExpandedLead(lead);
    setEditLeadForm({
      name: lead.name || "",
      phone: lead.phone || "",
      location: lead.location || "",
      budget: lead.budget || "",
      handledBy: lead.handledBy || currentUserName,
      agentNotes: lead.agentNotes || "",
      manualSummary: lead.manualSummary || ""
    });
    
    try {
      const taskRes = await fetch(`/api/tasks?leadId=${lead.id}`);
      if (taskRes.ok) {
        const tasksData = await taskRes.json();
        setLeadTasks(tasksData);
      }
    } catch (e) { console.error(e); }

    setLeadLogs(lead.activityLogs || [
      { id: '1', action: 'STATUS_CHANGED', details: 'Lead created in pipeline.', performedBy: 'System', createdAt: lead.createdAt }
    ]);
  };

  const handleCloseDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealRoomLead || !closingForm.price || !closingForm.receiptUrl || !closingForm.clientIdFrontUrl || !closingForm.clientIdBackUrl) return;
    setIsClosing(true);

    const priceNum = Number(parseNumberInput(closingForm.price));
    const isManual = dealRoomLead.source === 'MANUAL';
    const rateNum = isManual ? 0 : Number(closingForm.rate);
    const finalFee = priceNum * (rateNum / 100);

    const payload = {
      id: dealRoomLead.id,
      status: "closed",
      closingPrice: priceNum,
      commissionRate: rateNum,
      commissionFee: finalFee,
      tokenReceipt: closingForm.receiptUrl,
      closedPropertyId: closingForm.propertyId,
      clientIdFront: closingForm.clientIdFrontUrl,
      clientIdBack: closingForm.clientIdBackUrl
    };

    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setLeads(leads.map(l => l.id === dealRoomLead.id ? { ...l, ...payload } : l));
      triggerNotification("🏆 Deal Won!", `Successfully closed "${dealRoomLead.name}" for PKR ${priceNum.toLocaleString()}`, dealRoomLead.id, currentUserName, false);
      setDealRoomLead(null);
      setClosingForm({ price: "", rate: globalRate, receiptUrl: "", propertyId: "", clientIdFrontUrl: "", clientIdBackUrl: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsClosing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'receiptUrl' | 'clientIdFrontUrl' | 'clientIdBackUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setClosingForm(prev => ({ ...prev, [targetField]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser?.id) {
      alert("Master Admin ID missing. Please refresh and try again.");
      return;
    }
    
    setIsCreatingAgent(true);
    
    try {
      const res = await fetch('/api/agency-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newAgentForm.username,
          password: newAgentForm.password,
          role: newAgentForm.role,
          agencyName: activeUser.agencyName,
          ownerId: activeUser.id 
        })
      });

      if (res.ok) {
        const newAgent = await res.json();
        setAgencyUsers(prev => [{ ...newAgent, activeLeads: 0, win: 0 }, ...prev]);
        setNewAgentForm({ username: "", password: "", role: "CALLER" });
        triggerNotification("Agent Created", `Sub-agent ${newAgent.username} added to the roster.`, "system", currentUserName, false);
        alert(`Agent ${newAgent.username} successfully created!`);
      } else {
        const errorData = await res.json();
        alert(`Failed to create agent: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Agent creation error", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (confirm("Are you sure you want to permanently revoke access for this agent?")) {
      const previousUsers = [...agencyUsers];
      setAgencyUsers(prev => prev.filter(u => u.id !== id));

      try {
        const res = await fetch(`/api/agency-users?id=${id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
           triggerNotification("Access Revoked", "Sub-agent was removed from your agency roster.", "system", currentUserName, false);
        } else {
          throw new Error("Failed to delete from server");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete agent. Reverting UI.");
        setAgencyUsers(previousUsers); 
      }
    }
  };

  const handleDeleteProperty = async (id: string, title: string) => {
    if (!isAdmin) {
      alert("Only the Admin can delete listings.");
      return;
    }
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      setMyProperties(prev => prev.filter(p => p.id !== id));
      try {
        await fetch(`/api/properties?id=${id}`, { method: 'DELETE' });
        triggerNotification("Listing Deleted", `Removed "${title}" from global inventory.`, "system", currentUserName, false);
      } catch (err) {
        console.error("Failed to delete property", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) window.location.href = "/agency-login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // CALLER FENCING & SEARCH FILTER
  const visibleLeads = leads.filter(l => {
    if (isCaller) {
      return l.handledBy?.toLowerCase() === currentUserName.toLowerCase();
    }
    return true;
  });

  const searchedLeads = visibleLeads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // PIPELINE TIME FILTER LOGIC
  const pipelineFilteredLeads = searchedLeads.filter(l => {
    if (pipelineDateFilter === 'all') return true;
    const lDate = new Date(l.updatedAt || l.createdAt).getTime();
    const cutoff = new Date();
    if (pipelineDateFilter === 'weekly') cutoff.setDate(cutoff.getDate() - 7);
    else if (pipelineDateFilter === 'biweekly') cutoff.setDate(cutoff.getDate() - 14);
    else if (pipelineDateFilter === 'monthly') cutoff.setMonth(cutoff.getMonth() - 1);
    else if (pipelineDateFilter === 'quarterly') cutoff.setMonth(cutoff.getMonth() - 3);
    else if (pipelineDateFilter === 'yearly') cutoff.setFullYear(cutoff.getFullYear() - 1);
    return lDate >= cutoff.getTime();
  });

  const getLeadsByStatus = (status: string) => pipelineFilteredLeads.filter(lead => lead.status === status);
  
  const calculatedFee = (Number(parseNumberInput(closingForm.price)) * (Number(closingForm.rate) / 100)) || 0;

  const totalClosed = pipelineFilteredLeads.filter(l => l.status === 'closed').length;
  const totalLost = pipelineFilteredLeads.filter(l => l.status === 'lost').length;
  const winRate = pipelineFilteredLeads.length > 0 ? ((totalClosed / pipelineFilteredLeads.length) * 100).toFixed(1) : "0";

  const pipelineData = [
    { name: 'New', count: getLeadsByStatus('new').length },
    { name: 'Engaged', count: getLeadsByStatus('engaged').length },
    { name: 'Site Visit', count: getLeadsByStatus('site_visit').length },
    { name: 'Negotiation', count: getLeadsByStatus('negotiation').length },
    { name: 'Closed', count: totalClosed },
    { name: 'Lost', count: totalLost }
  ];

  // AGENT PERFORMANCE LOGIC
  const getFilteredPerformanceLeads = () => {
    return leads.filter(l => {
      if (perfFilter === 'all') return true;
      const lDate = new Date(l.updatedAt || l.createdAt).getTime();
      const cutoff = new Date();
      if (perfFilter === 'weekly') cutoff.setDate(cutoff.getDate() - 7);
      else if (perfFilter === 'biweekly') cutoff.setDate(cutoff.getDate() - 14);
      else if (perfFilter === 'monthly') cutoff.setMonth(cutoff.getMonth() - 1);
      else if (perfFilter === 'quarterly') cutoff.setMonth(cutoff.getMonth() - 3);
      else if (perfFilter === 'yearly') cutoff.setFullYear(cutoff.getFullYear() - 1);
      return lDate >= cutoff.getTime();
    });
  };

  const agentStats = agencyUsers.map(agent => {
    const perfLeads = getFilteredPerformanceLeads();
    const agentLeads = perfLeads.filter(l => l.handledBy?.toLowerCase() === agent.username.toLowerCase());
    const closed = agentLeads.filter(l => l.status === 'closed');
    const revenue = closed.reduce((sum, l) => sum + (l.closingPrice || 0), 0);
    const agWinRate = agentLeads.length > 0 ? ((closed.length / agentLeads.length) * 100).toFixed(1) : "0";
    return { ...agent, assigned: agentLeads.length, closed: closed.length, revenue, winRate: agWinRate };
  }).sort((a, b) => b.revenue - a.revenue);

  const pendingPlatformFees = visibleLeads.filter(l => l.status === 'closed' && !l.isCommissionPaid && l.source !== 'MANUAL').reduce((sum, l) => sum + (l.commissionFee || 0), 0);
  const settledPlatformFees = visibleLeads.filter(l => l.status === 'closed' && l.isCommissionPaid && l.source !== 'MANUAL').reduce((sum, l) => sum + (l.commissionFee || 0), 0);
  const manualCommission = visibleLeads.filter(l => l.status === 'closed' && l.source === 'MANUAL').reduce((sum, l) => sum + (l.commissionFee || 0), 0);

  const totalGrossCommission = visibleLeads.filter(l => l.status === 'closed').reduce((sum, l) => {
    if (l.source === 'MANUAL') {
      return sum + (l.commissionFee || 0);
    } else {
      const agencyCut = (l.closingPrice || 0) * (100 - (l.commissionRate || 15)) / 100;
      const platformFee = l.commissionFee || 0;
      return sum + (agencyCut + platformFee);
    }
  }, 0);

  const activeReminders = visibleLeads.filter(l =>
    l.reminderDate &&
    new Date(l.reminderDate) <= currentTime &&
    !dismissedReminders.has(l.id) &&
    l.status !== 'closed' &&
    l.status !== 'lost'
  );

  // 🚀 HANDLE SECURE AGENT EDITING
  const handleSaveAgentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setIsSavingAgent(true);

    try {
      const res = await fetch('/api/agency-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAgent.id,
          username: editAgentForm.username,
          role: editAgentForm.role,
          password: editAgentForm.password // Backend will only hash this if it is not empty
        })
      });

      if (res.ok) {
        const updatedAgent = await res.json();
        setAgencyUsers(prev => prev.map(u => u.id === editingAgent.id ? { ...u, ...updatedAgent } : u));
        triggerNotification("Agent Updated", `Profile updated for ${updatedAgent.username}.`, "system", currentUserName, false);
        setEditingAgent(null);
        setEditAgentForm({ username: "", role: "", password: "" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update agent.");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSavingAgent(false);
    }
  };

  // 🚀 HOOK FOR POPULATING MODAL DATA
  useEffect(() => {
    if (editingAgent) {
      setEditAgentForm({
        username: editingAgent.username,
        role: editingAgent.role,
        password: "" // Always start blank for security
      });
      setShowEditPassword(false);
    }
  }, [editingAgent]);

  return (
    <div className="relative w-full min-h-screen bg-brand-dark flex overflow-hidden font-sans">

      {activeUser?.agencyName && <LeadNotifier agencyName={activeUser.agencyName} />}

      <div className="fixed top-24 inset-x-0 mx-auto w-full max-w-2xl z-[600] flex flex-col gap-3 px-4 pointer-events-none">
        {notifications.filter(n => !n.read).slice(0, 3).map(note => (
          <div key={note.id} className="bg-brand-dark/80 backdrop-blur-xl border border-ai/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.15)] flex items-center justify-between pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-ai/20 rounded-full animate-pulse shadow-inner"><Sparkles className="w-6 h-6 text-ai-light" /></div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-0.5">{note.title}</p>
                <p className="text-sm text-white">{note.message}</p>
              </div>
            </div>
            <button onClick={() => dismissNotification(note.id)} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors border border-transparent hover:border-red-500/30">
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-ai to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] z-[400] hover:scale-110 transition-transform border border-white/20 group"
      >
        <BotMessageSquare className="w-8 h-8 text-white group-hover:animate-pulse" />
      </button>

      <div className={`fixed top-0 right-0 h-screen w-full md:w-[400px] bg-[#101726] border-l border-white/10 z-[500] transform transition-transform duration-500 ease-in-out shadow-2xl flex flex-col ${isAiChatOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-gradient-to-r from-ai/20 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ai/20 rounded-full text-ai-light"><BotMessageSquare className="w-5 h-5" /></div>
            <div>
              <h3 className="text-white font-bold tracking-wide">Agency Deal AI</h3>
              <p className="text-[10px] text-ai-light uppercase tracking-widest">Sales Assistant Online</p>
            </div>
          </div>
          <button onClick={() => setIsAiChatOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-brand-dark/50">
          {aiMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4 opacity-80 px-4">
              <Sparkles className="w-10 h-10 text-ai" />
              <p className="text-sm">I have live access to your pipeline.<br/>Ask me how to follow up with a lead, request an SMS script, or get advice on closing a specific client.</p>
            </div>
          )}
          {aiMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-ai text-white rounded-tr-none' : 'bg-[#1e293b] text-gray-200 border border-white/10 rounded-tl-none whitespace-pre-wrap'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isAiLoading && (
            <div className="self-start max-w-[85%] bg-[#1e293b] border border-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-ai-light rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-150"></span>
            </div>
          )}
          <div ref={aiChatEndRef} />
        </div>

        <form onSubmit={handleAiSubmit} className="p-4 border-t border-white/10 bg-[#162032] shrink-0">
          <div className="relative flex items-center">
            <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} disabled={isAiLoading} placeholder="Ask about a lead..." className="w-full bg-brand-dark border border-white/10 text-white rounded-full pl-4 pr-12 py-3 text-sm outline-none focus:border-ai transition-colors disabled:opacity-50" />
            <button type="submit" disabled={isAiLoading || !aiInput.trim()} className="absolute right-2 w-8 h-8 bg-ai hover:bg-ai-light rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"><Send className="w-4 h-4 ml-0.5" /></button>
          </div>
        </form>
      </div>

      {expandedLead && (
        <div className="fixed inset-0 z-[300] bg-brand-dark/90 backdrop-blur-md flex items-start justify-center p-4 py-12 overflow-y-auto">
          <div className="bg-[#162032] border border-white/10 rounded-3xl p-8 w-full max-w-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 relative my-auto shrink-0">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-ai-light" /> Lead Master CRM</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-gray-400 text-sm font-mono">ID: {expandedLead.id.substring(0,8)}</p>
                  {expandedLead.source === 'MANUAL' ? (
                    <span className="text-[10px] text-gold-light font-black uppercase tracking-widest bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">Manual CRM Entry</span>
                  ) : (
                    <span className="text-[10px] text-ai-light font-black uppercase tracking-widest bg-ai/10 border border-ai/30 px-2 py-0.5 rounded-full">LPG AI Platform Lead</span>
                  )}
                </div>
              </div>
              <button onClick={() => setExpandedLead(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveExpandedLead} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-5">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1.5 block">Lead Name</label>
                    <input type="text" value={editLeadForm.name} onChange={e => setEditLeadForm({...editLeadForm, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-ai transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <input type="text" value={editLeadForm.phone} onChange={e => setEditLeadForm({...editLeadForm, phone: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-emerald-400 font-mono outline-none focus:border-ai transition-colors pr-24" />
                      {editLeadForm.phone && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <a href={`https://wa.me/${editLeadForm.phone}?text=Hi ${editLeadForm.name}, I am reaching out from ${activeUser?.agencyName || 'our agency'}. I have some premium properties matching your requirement for ${editLeadForm.location}.`} target="_blank" title="WhatsApp Pitch" className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a href={`tel:${editLeadForm.phone}`} title="Call Lead" className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1.5 block">Target Location</label>
                    <input type="text" value={editLeadForm.location} onChange={e => setEditLeadForm({...editLeadForm, location: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-ai transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1.5 block">Estimated Budget</label>
                    <input type="text" value={formatNumberInput(editLeadForm.budget)} onChange={e => setEditLeadForm({...editLeadForm, budget: parseNumberInput(e.target.value)})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-ai transition-colors" />
                    {getPKRWords(editLeadForm.budget) && <p className="text-[10px] text-emerald-400 font-bold mt-1 tracking-wider">{getPKRWords(editLeadForm.budget)}</p>}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Current Status <span className="text-[10px] lowercase tracking-normal font-normal opacity-70">(Read Only)</span></p>
                    <p className="text-white uppercase font-bold text-sm tracking-wider text-ai-light">{expandedLead.status.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><NotebookPen className="w-4 h-4 text-gray-400" /> Executive CRM Notes</h4>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1.5 block">Handled By</label>
                    <select disabled={isCaller} value={editLeadForm.handledBy} onChange={e => setEditLeadForm({...editLeadForm, handledBy: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="Unassigned">Unassigned</option>
                      {isAdmin && activeUser?.name && <option value={activeUser.name}>{activeUser.name} (Admin)</option>}
                      <option value={editLeadForm.handledBy} className="hidden">{editLeadForm.handledBy}</option>
                      {agencyUsers.map(u => (
                        <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1.5 block">Detailed Note</label>
                    <textarea value={editLeadForm.agentNotes} onChange={e => setEditLeadForm({...editLeadForm, agentNotes: e.target.value})} placeholder="Type ongoing notes here..." className="w-full h-24 bg-brand-dark border border-white/10 rounded-xl p-3 text-sm text-gray-300 outline-none focus:border-white/30 transition-colors resize-none custom-scrollbar whitespace-pre-wrap" />
                  </div>
                </div>

                <button type="submit" disabled={isSavingMaster} className="w-full py-4 bg-ai hover:bg-ai-light text-white font-black text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSavingMaster ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Core Changes</>}
                </button>
              </div>

              <div className="space-y-6 flex flex-col h-full max-h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-10">
                
                {expandedLead.source === 'MANUAL' ? (
                  <div className="bg-gold/5 border border-gold/20 p-6 rounded-2xl relative overflow-hidden shrink-0">
                    <h4 className="text-sm font-bold text-gold-light mb-2 flex items-center gap-2"><UserPlus2 className="w-4 h-4" /> Client Summary / Inquiry Details</h4>
                    <textarea value={editLeadForm.manualSummary} onChange={e => setEditLeadForm({...editLeadForm, manualSummary: e.target.value})} placeholder="Enter the client's requirements, backstory, or inquiry details here..." className="w-full h-24 bg-brand-dark/50 border border-white/10 rounded-xl p-3 text-sm text-gray-300 outline-none focus:border-gold transition-colors resize-none custom-scrollbar whitespace-pre-wrap" />
                  </div>
                ) : (
                  <div className="bg-ai/5 border border-ai/20 p-6 rounded-2xl relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 bg-ai text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-lg">SCORE: {expandedLead.score}/100</div>
                    <h4 className="text-sm font-bold text-ai-light mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Chat Intelligence</h4>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{renderTextWithLinks(expandedLead.chatSummary)}</p>
                  </div>
                )}

                <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl space-y-4 shrink-0">
                  <h4 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2"><ListTodo className="w-4 h-4" /> Task Manager</h4>
                  
                  <div className="space-y-2 mb-4">
                    {leadTasks.length === 0 && <p className="text-xs text-gray-500 italic">No pending tasks.</p>}
                    {leadTasks.map(task => (
                      <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.isCompleted ? 'bg-white/5 border-white/5 opacity-60' : 'bg-brand-dark border-blue-500/30'}`}>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => toggleTaskCompletion(task.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-500 hover:border-blue-400 text-transparent'}`}>
                            <CheckSquare className="w-3 h-3" />
                          </button>
                          <div>
                            <p className={`text-sm font-medium ${task.isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>{task.title}</p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {new Date(task.dueDate).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest bg-white/5 px-2 py-1 rounded-md text-gray-400">{task.assignedTo}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                    <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New task description..." className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
                    <div className="flex gap-2">
                      <input type="datetime-local" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} className="flex-grow bg-brand-dark border border-white/10 rounded-xl p-3 text-sm text-gray-300 outline-none focus:border-blue-500 transition-colors cursor-pointer" />
                      <button type="button" onClick={handleAddTask} disabled={!newTaskTitle || !newTaskDate} className="px-4 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"><Plus className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#162032] border border-white/10 p-6 rounded-2xl flex-grow flex flex-col">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><History className="w-4 h-4 text-gray-400" /> Activity Timeline</h4>
                  <div className="space-y-4 border-l border-white/10 ml-2 pl-4 py-2 relative flex-grow overflow-y-auto custom-scrollbar">
                    {leadLogs.map((log, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 bg-brand-dark border-2 border-gray-500 rounded-full"></div>
                        <p className="text-xs text-gray-500 font-mono mb-1">{new Date(log.createdAt).toLocaleString()}</p>
                        <p className="text-sm text-gray-300 font-medium">{log.details}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">By: {log.performedBy}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      {reminderLead && (
        <div className="fixed inset-0 z-[250] bg-brand-dark/90 backdrop-blur-md flex items-start justify-center p-4 py-12 overflow-y-auto">
          <div className="bg-[#162032] border border-blue-500/30 rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-in zoom-in-95 duration-200 relative my-auto shrink-0">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><CalendarClock className="w-6 h-6 text-blue-400" /> Set Reminder</h3>
                <p className="text-gray-400 text-sm mt-1">Lead: <strong className="text-white">{reminderLead.name}</strong></p>
              </div>
              <button onClick={() => setReminderLead(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveQuickReminder} className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Date & Time</label>
                <input required type="datetime-local" value={reminderForm.date} onChange={e => setReminderForm({...reminderForm, date: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors cursor-pointer" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Action Note</label>
                <input required type="text" value={reminderForm.note} onChange={e => setReminderForm({...reminderForm, note: e.target.value})} placeholder="e.g. Schedule site visit..." className="w-full bg-brand-dark border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors" />
              </div>
              <button type="submit" className="w-full py-4 mt-2 bg-blue-500 hover:bg-blue-400 text-white font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                Save & Start Timer
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingSummaryLead && (
        <div className="fixed inset-0 z-[250] bg-brand-dark/90 backdrop-blur-md flex items-start justify-center p-4 py-12 overflow-y-auto">
          <div className="bg-[#162032] border border-ai/30 rounded-3xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(139,92,246,0.15)] animate-in zoom-in-95 duration-200 relative my-auto shrink-0">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><MessageSquare className="w-6 h-6 text-ai-light" /> {viewingSummaryLead.source === 'MANUAL' ? 'Lead Summary' : 'AI Chat Intelligence'}</h3>
                <p className="text-gray-400 text-sm mt-1">Lead: <strong className="text-white">{viewingSummaryLead.name}</strong></p>
              </div>
              <button onClick={() => setViewingSummaryLead(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-brand-dark/50 p-5 rounded-2xl border border-white/5 text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
              {viewingSummaryLead.source === 'MANUAL' ? viewingSummaryLead.manualSummary : renderTextWithLinks(viewingSummaryLead.chatSummary)}
            </div>
          </div>
        </div>
      )}

      {notesLead && (
        <div className="fixed inset-0 z-[250] bg-brand-dark/90 backdrop-blur-md flex items-start justify-center p-4 py-12 overflow-y-auto">
          <div className="bg-[#162032] border border-gold/30 rounded-3xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(217,119,6,0.15)] animate-in zoom-in-95 duration-200 relative my-auto shrink-0">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><NotebookPen className="w-6 h-6 text-gold" /> Internal CRM Notes</h3>
                <p className="text-gray-400 text-sm mt-1">Lead: <strong className="text-white">{notesLead.name}</strong></p>
              </div>
              <button onClick={() => setNotesLead(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveNotes} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Handled By (Agent Name)</label>
                <select disabled={isCaller} value={notesForm.handledBy} onChange={e => setNotesForm({...notesForm, handledBy: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-4 text-white outline-none focus:border-gold transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="Unassigned">Unassigned</option>
                  {isAdmin && activeUser?.name && <option value={activeUser.name}>{activeUser.name} (Admin)</option>}
                  <option value={notesForm.handledBy} className="hidden">{notesForm.handledBy}</option>
                  {agencyUsers.map(u => (
                    <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Log Notes / Updates</label>
                <textarea value={notesForm.agentNotes} onChange={e => setNotesForm({...notesForm, agentNotes: e.target.value})} placeholder="e.g. Tried calling, not picking up..." className="w-full h-32 bg-brand-dark border border-white/10 rounded-xl p-4 text-white outline-none focus:border-gold transition-colors resize-none custom-scrollbar whitespace-pre-wrap" />
              </div>
              <button type="submit" className="w-full py-4 mt-2 bg-gold hover:bg-gold-light text-brand-dark font-black text-lg rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                Save Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {dealRoomLead && (
        <div className="fixed inset-0 z-[200] bg-brand-dark/90 backdrop-blur-md flex items-start justify-center p-4 py-12 overflow-y-auto">
          <div className="bg-[#162032] border border-emerald-500/30 rounded-3xl p-8 w-full max-w-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-300 relative my-auto shrink-0">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign className="w-6 h-6 text-emerald-400" /> Secure Deal Room</h3>
                <p className="text-gray-400 text-sm mt-1">Closing Lead: <strong className="text-white">{dealRoomLead.name || "Anonymous Lead"}</strong></p>
              </div>
              <button onClick={() => setDealRoomLead(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCloseDeal} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Final Closing Price (PKR)</label>
                  <input required type="text" value={formatNumberInput(closingForm.price)} onChange={e => setClosingForm({...closingForm, price: parseNumberInput(e.target.value)})} placeholder="e.g. 60000000" className="w-full bg-brand-dark border border-white/10 rounded-xl p-4 text-white font-mono outline-none focus:border-emerald-500 transition-colors" />
                  {getPKRWords(closingForm.price) && <p className="text-[10px] text-emerald-400 font-bold mt-1 tracking-wider">{getPKRWords(closingForm.price)}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Property ID / Reference</label>
                  <input required type="text" value={closingForm.propertyId} onChange={e => setClosingForm({...closingForm, propertyId: e.target.value})} placeholder="e.g. DHA-9-PRISM-124" className="w-full bg-brand-dark border border-white/10 rounded-xl p-4 text-white font-mono outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-4">
                <div className="w-1/3">
                  <label className="text-xs text-emerald-400/70 uppercase tracking-widest font-bold mb-2 block">
                    {dealRoomLead.source === 'MANUAL' ? 'Agency Rate (%)' : 'Your Rate (%)'}
                  </label>
                  <input required type="number" step="0.1" value={closingForm.rate} onChange={e => setClosingForm({...closingForm, rate: Number(e.target.value)})} className="w-full bg-brand-dark border border-emerald-500/30 rounded-lg p-3 text-emerald-400 font-bold outline-none focus:border-emerald-400 text-center" />
                </div>
                <div className="w-2/3">
                  <label className="text-xs text-emerald-400/70 uppercase tracking-widest font-bold mb-2 block">
                    {dealRoomLead.source === 'MANUAL' ? 'Calculated Agency Fee' : 'Calculated Master Fee'}
                  </label>
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-400 font-bold text-right">
                    PKR {calculatedFee.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {dealRoomLead.source === 'MANUAL' && (
                <div className="bg-gold/10 border border-gold/30 p-4 rounded-xl text-center">
                  <p className="text-sm text-gold font-bold">Manual CRM Deal</p>
                  <p className="text-xs text-gray-400 mt-1">This is your private agency lead. The fee calculated above is your agency revenue. No platform commission will be deducted.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2 block">Token Receipt</label>
                  <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={e => handleFileUpload(e, 'receiptUrl')} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors overflow-hidden ${closingForm.receiptUrl ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-600 bg-brand-dark hover:border-white/30 text-gray-400'}`}>
                    {closingForm.receiptUrl ? <img src={closingForm.receiptUrl} className="w-full h-full object-cover opacity-80" alt="Uploaded" /> : <><Upload className="w-5 h-5 mb-1" /><span className="text-xs">Upload</span></>}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2 block">Client ID (Front)</label>
                  <input type="file" accept="image/*,application/pdf" ref={idFrontRef} onChange={e => handleFileUpload(e, 'clientIdFrontUrl')} className="hidden" />
                  <button type="button" onClick={() => idFrontRef.current?.click()} className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors overflow-hidden ${closingForm.clientIdFrontUrl ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-600 bg-brand-dark hover:border-white/30 text-gray-400'}`}>
                    {closingForm.clientIdFrontUrl ? <img src={closingForm.clientIdFrontUrl} className="w-full h-full object-cover opacity-80" alt="Uploaded" /> : <><IdCard className="w-5 h-5 mb-1" /><span className="text-xs">Front ID</span></>}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2 block">Client ID (Back)</label>
                  <input type="file" accept="image/*,application/pdf" ref={idBackRef} onChange={e => handleFileUpload(e, 'clientIdBackUrl')} className="hidden" />
                  <button type="button" onClick={() => idBackRef.current?.click()} className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors overflow-hidden ${closingForm.clientIdBackUrl ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-600 bg-brand-dark hover:border-white/30 text-gray-400'}`}>
                    {closingForm.clientIdBackUrl ? <img src={closingForm.clientIdBackUrl} className="w-full h-full object-cover opacity-80" alt="Uploaded" /> : <><IdCard className="w-5 h-5 mb-1" /><span className="text-xs">Back ID</span></>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isClosing || !closingForm.price || !closingForm.receiptUrl || !closingForm.clientIdFrontUrl || !closingForm.clientIdBackUrl} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
                {isClosing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Lock Deal & Close Lead</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 EDIT LISTING MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 z-[400] bg-brand-dark/90 backdrop-blur-md flex items-start justify-center p-4 py-12 overflow-y-auto">
          <div className="bg-[#162032] border border-emerald-500/30 rounded-3xl p-8 w-full max-w-4xl shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-300 relative my-auto shrink-0">
            <button onClick={() => setEditingProperty(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-30">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6 border-b border-white/10 pb-4"><Edit className="w-6 h-6 text-emerald-400" /> Edit Active Listing</h2>
            <EditPropertyForm 
              initialData={editingProperty} 
              activeUser={activeUser} 
              onClose={() => setEditingProperty(null)}
              onSuccess={(updatedProp: any) => {
                setMyProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
                setEditingProperty(null);
                triggerNotification("Listing Updated", `Modifications saved for "${updatedProp.title}".`, "system", currentUserName, false);
              }} 
            />
          </div>
        </div>
      )}

      <aside className="w-64 bg-glass-gradient backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col sticky top-0 h-screen shrink-0 z-[100]">
        <div className="p-6 border-b border-white/10">
          <span className="text-ai-light font-bold text-xl tracking-tighter block">LPG <span className="text-white font-light">Partner</span></span>
          <p className="text-xs text-emerald-light mt-1 uppercase tracking-widest">{activeUser?.agencyName || "Agency Partner"}</p>
          {activeUser?.role && (
            <span className={`inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest ${isCaller ? 'bg-blue-500/20 text-blue-400' : isExecutive ? 'bg-gold/20 text-gold' : 'bg-red-500/20 text-red-400'}`}>
              Role: {activeUser.role}
            </span>
          )}
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('pipeline')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'pipeline' ? 'bg-ai/10 text-ai-light border border-ai/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard className="w-5 h-5" /> <span className="font-medium">Lead Pipeline</span>
          </button>

          <button onClick={() => setActiveTab('add_lead')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'add_lead' ? 'bg-gold/10 text-gold-light border border-gold/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <UserPlus2 className="w-5 h-5" /> <span className="font-medium">Add Manual Lead</span>
          </button>

          {!isCaller && (
            <button onClick={() => setActiveTab('my_listings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'my_listings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Building className="w-5 h-5" /> <span className="font-medium">My Listings</span>
            </button>
          )}

          {!isCaller && (
            <button onClick={() => setActiveTab('upload')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'upload' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <PlusCircle className="w-5 h-5" /> <span className="font-medium">Upload Inventory</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('agent_performance')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'agent_performance' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Medal className="w-5 h-5" /> <span className="font-medium">Agent Performance</span>
              </button>

              <button onClick={() => setActiveTab('wallet')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'wallet' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Wallet className="w-5 h-5" /> <span className="font-medium">Earnings Ledger</span>
              </button>
              
              <button onClick={() => setActiveTab('team')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'team' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <UserPlus className="w-5 h-5" /> <span className="font-medium">Agency Roster</span>
              </button>
              
              <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${activeTab === 'analytics' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <BarChart3 className="w-5 h-5" /> <span className="font-medium">B2B Analytics</span>
              </button>

              <button onClick={() => { setActiveTab('notifications'); setUnreadCount(0); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left relative ${activeTab === 'notifications' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Bell className="w-5 h-5" /> <span className="font-medium">Notifications</span>
                {unreadCount > 0 && <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg">{unreadCount}</span>}
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 group">
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
          </button>
          <div className="px-4">
            <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-2">  ← Back to Main Portal  </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white relative">
        <header className="h-20 border-b border-white/10 bg-brand-dark/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0 gap-4 z-40">
          <h1 className="text-2xl font-bold text-white capitalize">
            {activeTab === 'pipeline' ? 'AI Lead Pipeline' : activeTab === 'add_lead' ? 'Add Manual CRM Lead' : activeTab === 'upload' ? 'Upload New Listing' : activeTab === 'my_listings' ? 'My Agency Inventory' : activeTab === 'notifications' ? 'Notifications Hub' : activeTab === 'wallet' ? 'Earnings Ledger' : activeTab === 'team' ? 'Agency Team' : activeTab === 'profile' ? 'User Hub' : activeTab === 'agent_performance' ? 'Agent Performance Hub' : 'Agency Analytics'}
          </h1>

          <div className="flex items-center gap-4 flex-1 justify-end">
            {activeTab === 'pipeline' && (
              <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search leads by ID, Name, or Phone..." className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-ai/50 transition-colors" />
              </div>
            )}
            
            {isAdmin && (
              <button onClick={() => { setActiveTab('notifications'); setUnreadCount(0); }} className="p-2 bg-white/5 border border-white/10 rounded-full text-gray-400 relative shrink-0 hover:bg-white/10 transition-all cursor-pointer">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-brand-dark animate-pulse shadow-lg"></span>}
                {unreadCount === 0 && activeReminders.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-brand-dark animate-pulse"></span>}
              </button>
            )}

            <button 
              onClick={() => setActiveTab('profile')} 
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform hover:scale-105 shadow-lg ${activeTab === 'profile' ? 'border-white bg-white/10 text-white' : 'border-brand-dark bg-gradient-to-tr from-gold to-gold-light text-brand-dark'}`}
            >
              <UserCircle className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative custom-scrollbar z-10">

          {/* AGENT PERFORMANCE HUB */}
          {activeTab === 'agent_performance' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <div className="flex justify-between items-center mb-6 bg-glass-gradient border border-white/10 p-6 rounded-3xl shadow-lg">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Medal className="w-6 h-6 text-purple-400" /> Executive Leaderboard</h2>
                  <p className="text-sm text-gray-400 mt-1">Track detailed performance and reward your top closers.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <select 
                    value={perfFilter} 
                    onChange={(e: any) => setPerfFilter(e.target.value)} 
                    className="bg-brand-dark border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-purple-500 transition-colors font-bold text-sm cursor-pointer appearance-none"
                  >
                    <option value="all">All Time History</option>
                    <option value="weekly">This Week</option>
                    <option value="biweekly">Past 14 Days</option>
                    <option value="monthly">This Month</option>
                    <option value="quarterly">This Quarter</option>
                    <option value="yearly">This Year</option>
                  </select>
                </div>
              </div>

              {/* Top 3 Podium */}
              {agentStats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
                  {agentStats[1] && agentStats[1].revenue > 0 && (
                    <div className="bg-[#162032] border border-gray-400/30 p-6 rounded-t-3xl shadow-lg text-center transform translate-y-4">
                      <div className="w-16 h-16 mx-auto bg-gray-400/10 text-gray-300 rounded-full flex items-center justify-center font-black text-2xl border-4 border-gray-400 mb-3 shadow-[0_0_20px_rgba(156,163,175,0.3)]">2</div>
                      <h3 className="text-xl font-bold text-white mb-1">{agentStats[1].username}</h3>
                      <p className="text-emerald-400 font-mono font-bold">PKR {agentStats[1].revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">{agentStats[1].closed} Deals</p>
                    </div>
                  )}
                  {agentStats[0] && agentStats[0].revenue > 0 && (
                    <div className="bg-glass-gradient border border-gold/50 p-8 rounded-t-3xl shadow-[0_0_40px_rgba(217,119,6,0.2)] text-center relative z-10">
                      <Award className="absolute top-4 right-4 w-6 h-6 text-gold" />
                      <div className="w-20 h-20 mx-auto bg-gold/10 text-gold rounded-full flex items-center justify-center font-black text-4xl border-4 border-gold mb-3 shadow-[0_0_30px_rgba(217,119,6,0.5)] animate-pulse">1</div>
                      <h3 className="text-2xl font-black text-white mb-1">{agentStats[0].username}</h3>
                      <p className="text-emerald-400 font-mono font-black text-xl">PKR {agentStats[0].revenue.toLocaleString()}</p>
                      <p className="text-xs text-gold-light uppercase tracking-widest font-bold mt-2">{agentStats[0].closed} Deals Closed</p>
                    </div>
                  )}
                  {agentStats[2] && agentStats[2].revenue > 0 && (
                    <div className="bg-[#162032] border border-orange-700/30 p-6 rounded-t-3xl shadow-lg text-center transform translate-y-8">
                      <div className="w-16 h-16 mx-auto bg-orange-700/10 text-orange-500 rounded-full flex items-center justify-center font-black text-2xl border-4 border-orange-700 mb-3 shadow-[0_0_20px_rgba(194,65,12,0.3)]">3</div>
                      <h3 className="text-xl font-bold text-white mb-1">{agentStats[2].username}</h3>
                      <p className="text-emerald-400 font-mono font-bold">PKR {agentStats[2].revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">{agentStats[2].closed} Deals</p>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Performance Table */}
              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Detailed Metrics ({perfFilter.toUpperCase()})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="pb-3 px-4">Rank / Agent Name</th>
                        <th className="pb-3 px-4 text-center">Assigned Leads</th>
                        <th className="pb-3 px-4 text-center">Deals Closed</th>
                        <th className="pb-3 px-4 text-center">Win Rate</th>
                        <th className="pb-3 px-4 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentStats.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">No agent data available.</td></tr>}
                      {agentStats.map((agent, index) => (
                        <tr key={agent.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 flex items-center gap-3">
                            <span className="text-xs font-black text-gray-500 w-4">{index + 1}.</span>
                            <div className="w-8 h-8 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center font-black uppercase border border-purple-500/20">{agent.username.charAt(0)}</div>
                            <span className="font-bold text-white">{agent.username}</span>
                          </td>
                          <td className="py-4 px-4 text-center text-white font-mono">{agent.assigned}</td>
                          <td className="py-4 px-4 text-center text-emerald-400 font-bold font-mono">{agent.closed}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black ${Number(agent.winRate) > 10 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                              {agent.winRate}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-emerald-400 font-bold font-mono">PKR {agent.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USER PROFILE HUB */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
              <div className="bg-glass-gradient border border-white/10 rounded-3xl p-8 shadow-glass relative overflow-hidden">
                <button onClick={() => setActiveTab('pipeline')} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-30">
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute top-0 right-0 p-8 opacity-5"><Shield className="w-64 h-64" /></div>
                
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-gold to-gold-light border-4 border-brand-dark shadow-[0_0_30px_rgba(217,119,6,0.3)] flex items-center justify-center text-brand-dark">
                    <UserCircle className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white">{activeUser?.name || "Agent Name"}</h2>
                    <p className="text-gold-light font-bold text-lg">{activeUser?.agencyName || "Agency Partner"}</p>
                    <span className="inline-block mt-2 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest bg-white/10 border border-white/20">Clearance: {activeUser?.role || "Admin"}</span>
                  </div>
                </div>

                {isAdmin ? (
                  <form className="space-y-6 relative z-10 border-t border-white/10 pt-8">
                    <h3 className="text-lg font-bold text-white mb-4">Master Agency Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Owner Full Name</label>
                        <input type="text" defaultValue={activeUser?.name || ""} className="w-full bg-brand-dark/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-gold transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Account Email</label>
                        <input type="email" defaultValue={activeUser?.email || ""} disabled className="w-full bg-brand-dark/30 border border-white/5 rounded-xl p-4 text-gray-500 cursor-not-allowed" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Official Agency Name</label>
                        <input type="text" defaultValue={activeUser?.agencyName || ""} className="w-full bg-brand-dark/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-gold transition-colors" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Agency Logo Upload</label>
                        <div className="w-full h-24 border-2 border-dashed border-white/20 hover:border-gold/50 rounded-xl flex flex-col items-center justify-center text-gray-400 transition-colors cursor-pointer bg-brand-dark/50">
                          <Upload className="w-6 h-6 mb-1 text-gold/70" />
                          <span className="text-xs">Browse files to update logo</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => alert("Settings saved locally! API required for permanent sync.")} className="px-8 py-4 mt-2 bg-gold hover:bg-gold-light text-brand-dark font-black rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" /> Save Profile Configurations
                    </button>
                  </form>
                ) : (
                  <div className="border-t border-white/10 pt-8 relative z-10 text-center">
                    <p className="text-gray-400 text-sm">Your account is managed by the Master Agency Admin. <br/>Contact your boss to update credentials or permissions.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MY LISTINGS (INVENTORY HUB) WITH EDITING */}
          {activeTab === 'my_listings' && !isCaller && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Building className="w-6 h-6 text-emerald-400" /> Active Inventory</h2>
                  <p className="text-sm text-gray-400 mt-1">Manage the properties your agency is actively pitching on the LPG Platform.</p>
                </div>
                <button onClick={() => setActiveTab('upload')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                  <PlusCircle className="w-4 h-4" /> Add New
                </button>
              </div>

              {isFetchingProps ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
              ) : myProperties.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                  <Building className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Your agency currently has no active listings.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProperties.map(property => (
                    <div key={property.id} className="bg-[#162032] border border-white/10 rounded-2xl overflow-hidden shadow-lg group hover:border-emerald-500/30 transition-all flex flex-col">
                      <div className="h-40 relative overflow-hidden">
                        <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-brand-dark/80 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-white/10">
                          {property.category} • {property.subCategory}
                        </div>
                        {property.paymentMode === 'Installment' && (
                          <div className="absolute top-2 left-2 bg-blue-500/90 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-lg">
                            Installments
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col">
                        <h3 className="font-bold text-white text-lg mb-1 truncate" title={property.title}>{property.title}</h3>
                        <p className="text-emerald-400 font-bold font-mono mb-4">{property.priceFormatted}</p>
                        
                        <div className="flex flex-col gap-2 mb-4 text-sm text-gray-300">
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /> <span className="truncate">{property.location}</span></div>
                          {property.paymentMode === 'Installment' && (
                            <div className="flex items-center gap-2 text-blue-400"><Wallet className="w-4 h-4" /> <span className="truncate text-xs font-medium">{property.installmentPlan}</span></div>
                          )}
                        </div>

                        <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Submitted By</p>
                            <p className="text-xs text-white font-medium">{property.submittedBy || "Agency User"}</p>
                            <p className="text-[9px] text-gray-600 font-mono mt-0.5">{new Date(property.createdAt).toLocaleDateString()}</p>
                          </div>
                          
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingProperty(property)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors" title="Edit Listing">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => {
                                if (confirm(`Delete "${property.title}" permanently?`)) {
                                  fetch(`/api/properties?id=${property.id}`, { method: 'DELETE' }).catch(console.error);
                                  setMyProperties(prev => prev.filter(p => p.id !== property.id));
                                  triggerNotification("Listing Deleted", `Removed "${property.title}" from global inventory.`, "system", currentUserName, false);
                                }
                              }} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Delete Listing">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EARNINGS LEDGER */}
          {activeTab === 'wallet' && isAdmin && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-glass-gradient border border-emerald-500/30 p-6 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet className="w-32 h-32" /></div>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mb-2">Total Commission Earned</p>
                  <p className="text-3xl font-black text-white">PKR {totalGrossCommission.toLocaleString()}</p>
                  <p className="text-[9px] text-emerald-400/80 mt-2 border-t border-emerald-500/20 pt-2 font-medium">Gross value (Platform + Manual).</p>
                </div>
                <div className="bg-[#162032] border border-gold/30 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10"><UserPlus2 className="w-32 h-32" /></div>
                  <p className="text-[10px] text-gold uppercase tracking-widest font-black mb-2">Private Manual Comm.</p>
                  <p className="text-3xl font-black text-white">PKR {manualCommission.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-400 mt-2 border-t border-white/10 pt-2">100% kept by your agency.</p>
                </div>
                <div className="bg-[#162032] border border-red-500/30 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10"><DollarSign className="w-32 h-32" /></div>
                  <p className="text-[10px] text-red-400 uppercase tracking-widest font-black mb-2">Pending Platform Fees</p>
                  <p className="text-3xl font-black text-white">PKR {pendingPlatformFees.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-400 mt-2 border-t border-white/10 pt-2">Excludes Manual Deals.</p>
                </div>
                <div className="bg-[#162032] border border-blue-500/30 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10"><CheckCircle2 className="w-32 h-32" /></div>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest font-black mb-2">Settled Platform Fees</p>
                  <p className="text-3xl font-black text-white">PKR {settledPlatformFees.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-400 mt-2 border-t border-white/10 pt-2">Cleared payments.</p>
                </div>
              </div>

              <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Closed Deal Ledger</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="pb-3 px-4">Deal ID / Client</th>
                        <th className="pb-3 px-4">Source</th>
                        <th className="pb-3 px-4">Closing Price</th>
                        <th className="pb-3 px-4">Total Gross</th>
                        <th className="pb-3 px-4">Platform Fee</th>
                        <th className="pb-3 px-4">Settlement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLeads.filter(l => l.status === 'closed').length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No closed deals to display.</td></tr>}
                      {visibleLeads.filter(l => l.status === 'closed').map(lead => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4"><p className="font-bold text-white">{lead.name}</p><p className="text-xs text-gray-500 font-mono">ID: {lead.id.substring(0,6)}</p></td>
                          <td className="py-4 px-4">
                            {lead.source === 'MANUAL' ? (
                              <span className="text-[10px] text-gold-light font-black uppercase tracking-widest bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">Manual CRM</span>
                            ) : (
                              <span className="text-[10px] text-ai-light font-black uppercase tracking-widest bg-ai/10 border border-ai/30 px-2 py-0.5 rounded-full">Platform</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-300 font-mono">PKR {(lead.closingPrice || 0).toLocaleString()}</td>
                          <td className="py-4 px-4 text-emerald-400 font-bold font-mono">
                            PKR {lead.source === 'MANUAL' ? (lead.commissionFee || 0).toLocaleString() : (((lead.closingPrice || 0) * (100 - (lead.commissionRate || 15)) / 100) + (lead.commissionFee||0)).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-gray-300 font-mono">{lead.source === 'MANUAL' ? '-' : `PKR ${(lead.commissionFee || 0).toLocaleString()}`}</td>
                          <td className="py-4 px-4">
                            {lead.source === 'MANUAL' ? (
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">N/A</span>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lead.isCommissionPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'}`}>
                                {lead.isCommissionPaid ? 'Settled' : 'Pending'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-AGENT ROSTER / TEAM TAB */}
          {activeTab === 'team' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-glass-gradient border border-white/10 p-6 rounded-3xl shadow-lg h-fit">
                  <div className="mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-400" /> Invite Agent</h2>
                    <p className="text-xs text-gray-400 mt-1">Create login credentials for your staff.</p>
                  </div>
                  <form onSubmit={handleCreateAgent} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 block">Agent Username</label>
                      <input required type="text" value={newAgentForm.username} onChange={e => setNewAgentForm({...newAgentForm, username: e.target.value})} placeholder="e.g. waqas_khan" className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 block">Login Password</label>
                      <div className="relative">
                        <input 
                          required 
                          type={showPassword ? "text" : "password"} 
                          value={newAgentForm.password} 
                          onChange={e => setNewAgentForm({...newAgentForm, password: e.target.value})} 
                          placeholder="Secure password" 
                          className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 pr-10 text-white outline-none focus:border-blue-500 transition-colors text-sm" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 block">Access Role</label>
                      <select required value={newAgentForm.role} onChange={e => setNewAgentForm({...newAgentForm, role: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors text-sm appearance-none cursor-pointer">
                        <option value="CALLER">Caller (Read-Only Pipeline + Notes)</option>
                        <option value="EXECUTIVE">Executive (Full CRM Access)</option>
                      </select>
                    </div>
                    <button type="submit" disabled={isCreatingAgent} className="w-full py-3 mt-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {isCreatingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Credentials</>}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">Live Agency Roster</h3>
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{agencyUsers.length} Active Accounts</span>
                  </div>

                  {agencyUsers.length === 0 ? (
                    <div className="w-full h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500">
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No sub-agents created yet.</p>
                    </div>
                  ) : (
                    agencyUsers.map((agent) => (
                      <div key={agent.id} className="bg-[#162032] border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg hover:border-blue-500/30 transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-black text-xl uppercase border border-blue-500/20">{agent.username.charAt(0)}</div>
                          <div>
                            <h4 className="text-white font-bold">{agent.username}</h4>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block ${agent.role === 'EXECUTIVE' ? 'bg-gold/20 text-gold-light' : 'bg-white/10 text-gray-300'}`}>
                              {agent.role}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                           <button 
                             onClick={() => setEditingAgent(agent)} 
                             title="Edit Agent" 
                             className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors border border-transparent hover:border-blue-500/30"
                           >
                             <Edit className="w-5 h-5" />
                           </button>
                           <button 
                             onClick={() => handleDeleteAgent(agent.id)} 
                             title="Revoke Access" 
                             className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors border border-transparent hover:border-red-500/30"
                           >
                             <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 🚀 EDIT AGENT MODAL */}
              {editingAgent && (
                <div className="fixed inset-0 z-[500] bg-brand-dark/90 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-[#162032] border border-blue-500/30 rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-in zoom-in-95 duration-200 relative">
                    <button onClick={() => { setEditingAgent(null); setEditAgentForm({ username: "", role: "", password: "" }); setShowEditPassword(false); }} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <div className="mb-6 border-b border-white/10 pb-4">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Edit className="w-6 h-6 text-blue-400" /> Edit Agent Profile</h3>
                      <p className="text-sm text-gray-400 mt-1">Updating credentials for: <strong className="text-white">{editingAgent.username}</strong></p>
                    </div>
                    
                    <form onSubmit={handleSaveAgentEdit} className="space-y-5">
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 block">Update Username</label>
                        <input required type="text" value={editAgentForm.username} onChange={e => setEditAgentForm({...editAgentForm, username: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors text-sm" />
                      </div>
                      
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 block">Change Role</label>
                        <select required value={editAgentForm.role} onChange={e => setEditAgentForm({...editAgentForm, role: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors text-sm appearance-none cursor-pointer">
                          <option value="CALLER">Caller (Read-Only Pipeline + Notes)</option>
                          <option value="EXECUTIVE">Executive (Full CRM Access)</option>
                        </select>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <label className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-1.5 flex justify-between">
                          <span>Overwrite Password</span>
                          <span className="text-gray-500 font-normal normal-case">(Leave blank to keep current)</span>
                        </label>
                        <div className="relative">
                          <input 
                            type={showEditPassword ? "text" : "password"} 
                            value={editAgentForm.password} 
                            onChange={e => setEditAgentForm({...editAgentForm, password: e.target.value})} 
                            placeholder="Type new password..." 
                            className="w-full bg-brand-dark border border-blue-500/30 rounded-xl p-3 pr-10 text-white outline-none focus:border-blue-500 transition-colors text-sm" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowEditPassword(!showEditPassword)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" disabled={isSavingAgent} className="w-full py-4 mt-2 bg-blue-500 hover:bg-blue-400 text-white font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSavingAgent ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS HUB (GLOBAL HISTORY) */}
          {activeTab === 'notifications' && isAdmin && (
            <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><History className="w-5 h-5 text-ai-light" /> Global CRM History</h2>
                <button onClick={() => setNotifications([])} className="text-xs text-gray-500 hover:text-red-400 font-bold uppercase transition-colors">Clear Audit Log</button>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                  <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">No recent actions logged.</p>
                </div>
              ) : (
                notifications.map(note => (
                  <div key={note.id} className="bg-[#162032] border border-white/10 p-5 rounded-2xl flex items-start gap-4 group hover:border-ai/30 transition-all shadow-lg relative">
                    <div className="p-3 bg-ai/10 rounded-xl text-ai-light group-hover:bg-ai group-hover:text-white transition-all"><Info className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">{note.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed mb-2">{note.message}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-600 uppercase font-black tracking-widest mt-2">
                        {note.leadId !== "system" && <span>Lead Ref: {note.leadId.substring(0, 5)}</span>}
                        {note.leadId !== "system" && <span>•</span>}
                        <span>{new Date(note.time).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-gold-light">By: {note.performedBy}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* B2B ANALYTICS */}
          {activeTab === 'analytics' && isAdmin && (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
              <div className="bg-glass-gradient border border-gold/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(217,119,6,0.1)] mb-6 flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center shrink-0 border border-gold/50 shadow-inner">
                  <Trophy className="w-10 h-10 text-gold drop-shadow-lg" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gold uppercase tracking-widest font-black mb-1">Global SaaS Leaderboard</p>
                  <h3 className="text-2xl font-bold text-white mb-1">Top Producers Ranking</h3>
                  <p className="text-sm text-gray-400">See how your agency performs against the platform average.</p>
                </div>
                <div className="flex-1 grid grid-cols-1 gap-2 w-full">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center"><span className="text-sm font-bold text-white flex items-center gap-2"><span className="text-gold font-black">#1</span> Titanium Agency (Mock)</span><span className="text-xs text-gray-400">42 Closed</span></div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center"><span className="text-sm font-bold text-white flex items-center gap-2"><span className="text-gray-400 font-black">#2</span> Ali Saqlain Estate (Mock)</span><span className="text-xs text-gray-400">38 Closed</span></div>
                  <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 flex justify-between items-center shadow-inner"><span className="text-sm font-bold text-gold flex items-center gap-2"><span className="text-gold-light font-black">#3</span> {activeUser?.agencyName || "Your Agency"}</span><span className="text-xs text-gold-light font-bold">{totalClosed} Closed</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-lg">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Total Leads Received</p>
                  <p className="text-3xl font-black text-white">{pipelineFilteredLeads.length}</p>
                </div>
                <div className="bg-[#162032] border border-emerald-500/30 rounded-2xl p-6 shadow-lg">
                  <p className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-black mb-2">Deals Closed</p>
                  <p className="text-3xl font-black text-emerald-400">{totalClosed}</p>
                </div>
                <div className="bg-[#162032] border border-red-500/30 rounded-2xl p-6 shadow-lg">
                  <p className="text-[10px] text-red-500/70 uppercase tracking-widest font-black mb-2">Deals Lost</p>
                  <p className="text-3xl font-black text-red-400">{totalLost}</p>
                </div>
                <div className="bg-[#162032] border border-gold/30 rounded-2xl p-6 shadow-lg">
                  <p className="text-[10px] text-gold/70 uppercase tracking-widest font-black mb-2">Win Rate</p>
                  <p className="text-3xl font-black text-gold-light">{winRate}%</p>
                </div>
              </div>

              <div className="bg-[#162032] border border-white/10 rounded-2xl p-8 shadow-lg h-[400px]">
                <h3 className="text-lg font-bold text-white mb-6">Pipeline Conversion Funnel</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="count" name="Leads in Stage" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 🚀 KANBAN PIPELINE WITH DYNAMIC TIME FILTER */}
          {activeTab === 'pipeline' && (
            isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-ai-light animate-spin" /></div>
            ) : (
              <div className="flex flex-col h-full min-w-max pb-4 pt-6">
                
                {/* 🚀 UPGRADED PIPELINE HEADER STATS & FILTERS */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-4">
                    <div className="bg-[#162032] border border-gray-600/30 px-6 py-4 rounded-xl shadow-lg min-w-[160px]">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Total Leads Received</p>
                      <p className="text-3xl font-black text-white">{pipelineFilteredLeads.length}</p>
                    </div>
                    <div className="bg-[#162032] border border-emerald-500/50 px-6 py-4 rounded-xl shadow-lg min-w-[160px]">
                      <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-black mb-2">Deals Closed</p>
                      <p className="text-3xl font-black text-emerald-400">{totalClosed}</p>
                    </div>
                    <div className="bg-[#162032] border border-red-500/50 px-6 py-4 rounded-xl shadow-lg min-w-[160px]">
                      <p className="text-[10px] text-red-500 uppercase tracking-widest font-black mb-2">Deals Lost</p>
                      <p className="text-3xl font-black text-red-400">{totalLost}</p>
                    </div>
                    <div className="bg-[#162032] border border-orange-500/50 px-6 py-4 rounded-xl shadow-lg min-w-[160px]">
                      <p className="text-[10px] text-orange-500 uppercase tracking-widest font-black mb-2">Win Rate</p>
                      <p className="text-3xl font-black text-orange-400">{winRate}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <select 
                      value={pipelineDateFilter} 
                      onChange={(e: any) => setPipelineDateFilter(e.target.value)} 
                      className="bg-brand-dark border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-ai transition-colors font-bold text-sm cursor-pointer appearance-none"
                    >
                      <option value="all">All Time Pipeline</option>
                      <option value="weekly">This Week</option>
                      <option value="biweekly">Past 14 Days</option>
                      <option value="monthly">This Month</option>
                      <option value="quarterly">This Quarter</option>
                      <option value="yearly">This Year</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-6 flex-1 overflow-x-auto">
                  {['new', 'engaged', 'site_visit', 'negotiation', 'closed', 'lost'].map((status) => (
                    <div key={status} className="w-80 flex flex-col h-full opacity-100 animate-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center justify-between mb-4 px-1 border-b border-white/5 pb-2">
                        <h2 className="text-white font-semibold flex items-center gap-2 capitalize">
                          {status === 'new' && <Flame className="w-4 h-4 text-gold-light" />}
                          {status === 'engaged' && <MessageSquare className="w-4 h-4 text-blue-400" />}
                          {status === 'site_visit' && <MapPin className="w-4 h-4 text-ai-light" />}
                          {status === 'negotiation' && <TrendingUp className="w-4 h-4 text-yellow-400" />}
                          {status === 'closed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {status === 'lost' && <Ban className="w-4 h-4 text-red-400" />}
                          {status.replace('_', ' ')}
                        </h2>
                        <span className="bg-white/10 text-gray-300 text-xs px-2.5 py-1 rounded-full font-bold">{getLeadsByStatus(status).length}</span>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2 pb-20">
                        {getLeadsByStatus(status).length === 0 && (
                          <div className="w-full p-4 border border-dashed border-white/10 rounded-xl text-center text-xs text-gray-500 font-bold tracking-widest uppercase">Drop Zone</div>
                        )}
                        {getLeadsByStatus(status).map(lead => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            agencyName={activeUser?.agencyName}
                            isCaller={isCaller} 
                            onCardClick={() => openExpandedLead(lead)}
                            onViewSummary={(e: any) => { e.stopPropagation(); setViewingSummaryLead(lead); }}
                            onOpenNotes={(e: any) => { e.stopPropagation(); openNotesModal(lead); }}
                            onOpenReminder={(e: any) => { e.stopPropagation(); openReminderModal(lead); }}
                            onMarkLost={(e: any) => { e.stopPropagation(); updateLeadStatus(lead.id, 'lost'); }}
                            onMarkDuplicate={(e: any) => { e.stopPropagation(); updateLeadStatus(lead.id, 'lost', { isDuplicate: true }); }}
                            onMove={(e: any) => {
                              e.stopPropagation();
                              if (status === 'new') updateLeadStatus(lead.id, 'engaged');
                              else if (status === 'engaged') updateLeadStatus(lead.id, 'site_visit');
                              else if (status === 'site_visit') updateLeadStatus(lead.id, 'negotiation');
                              else if (status === 'negotiation') {
                                setClosingForm(prev => ({ ...prev, rate: globalRate }));
                                setDealRoomLead(lead);
                              }
                            }}
                            nextAction={status === 'new' ? "Accept" : status === 'engaged' ? "Visit Set" : status === 'site_visit' ? "Negotiate" : "Close"}
                            isClosed={status === 'closed'}
                            isLost={status === 'lost'}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* UPLOAD INVENTORY TAB */}
          {activeTab === 'upload' && !isCaller && (
            <div className="max-w-4xl mx-auto">
              <PropertyUploadForm activeUser={activeUser} onSuccess={() => {
                triggerNotification("Property Uploaded", `New inventory published to public platform.`, "system", currentUserName, false);
                setActiveTab('my_listings');
              }} />
            </div>
          )}

          {/* ADD MANUAL LEAD TAB */}
          {activeTab === 'add_lead' && (
            <div className="max-w-4xl mx-auto">
              <ManualLeadUploadForm activeUser={activeUser} onSuccess={() => {
                triggerNotification("Manual Lead Added", `Private CRM lead injected.`, "system", currentUserName, false);
                setActiveTab('pipeline');
              }} leads={leads} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// --- LeadCard ---
function LeadCard({ lead, onCardClick, onMove, onViewSummary, onOpenNotes, onOpenReminder, onMarkLost, onMarkDuplicate, nextAction, isClosed, isLost, agencyName, isCaller }: any) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (lead.status !== "new" || isClosed || isLost || lead.source === 'MANUAL') return;

    const timer = setInterval(() => {
      const createdTime = new Date(lead.createdAt).getTime();
      const expiryTime = createdTime + 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft("SLA BREACH");
        clearInterval(timer);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lead.createdAt, lead.status, isClosed, isLost, lead.source]);

  const formattedDate = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown Date";
  const formattedTime = lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
  const isDuplicate = lead.isDuplicate === true;

  return (
    <div
      onClick={!isClosed && !isLost ? onCardClick : undefined}
      className={`bg-glass-gradient backdrop-blur-md border rounded-2xl p-5 shadow-glass transition-all duration-300 group relative
      ${timeLeft === "SLA BREACH" ? "border-red-500/40" : isLost ? "border-red-900/40 opacity-70 grayscale" : lead.source === 'MANUAL' ? "border-gold/20" : "border-white/10"}
      ${!isClosed && !isLost ? "hover:border-ai/50 hover:scale-[1.02] cursor-pointer" : "cursor-default"}
      `}
    >
      {lead.isDuplicate && lead.source === 'MANUAL' && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border border-red-400 z-50 animate-bounce">
          ⚠️ AUDIT FLAG
        </span>
      )}

      {!isClosed && !isLost && !isCaller && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={onMarkDuplicate} title="Mark as Duplicate" className="p-1.5 bg-yellow-500/80 text-white rounded-md hover:bg-yellow-500 transition-colors">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={onMarkLost} title="Mark Lead as Lost" className="p-1.5 bg-red-500/80 text-white rounded-md hover:bg-red-500 transition-colors">
            <Ban className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-4 pr-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-white font-black font-mono tracking-tighter bg-white/10 px-2 py-0.5 rounded shadow-inner border border-white/5 inline-block w-fit">ID: {lead.id.substring(0, 5).toUpperCase()}</span>
            {lead.source === 'MANUAL' ? (
              <span className="text-[9px] text-gold-light font-black uppercase tracking-widest bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(217,119,6,0.3)]">{agencyName || 'Agency'} Lead</span>
            ) : (
              <span className="text-[9px] text-ai-light font-black uppercase tracking-widest bg-ai/10 border border-ai/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]">LPG Platform</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white leading-tight mt-1">{lead.name || "Anonymous Lead"}</h3>
          {lead.handledBy && <span className="text-[10px] text-gold-light mt-0.5">Handled by: {lead.handledBy}</span>}
        </div>
        <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 ${lead.score >= 80 ? 'border-gold text-gold-light bg-gold/10' : 'border-ai text-ai-light bg-ai/10'}`}>
          <span className="text-xs font-bold">{lead.score}</span>
        </div>
      </div>

      {lead.status === "new" && lead.source !== 'MANUAL' && (
        <div className={`mb-4 px-3 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-black uppercase tracking-widest ${timeLeft === "SLA BREACH" ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-gold/10 text-gold"}`}>
          <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Handshake SLA</div>
          <span>{timeLeft}</span>
        </div>
      )}

      {!isClosed && !isLost && lead.budget && lead.location && lead.source !== 'MANUAL' && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest shadow-inner animate-pulse">
          <Target className="w-3.5 h-3.5" /> AI Inventory Match
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${lead.purpose === 'rent' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
          {lead.purpose === 'rent' ? <DoorOpen className="w-3 h-3" /> : <Key className="w-3 h-3" />}{lead.purpose || 'Buy'}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300">
          {lead.category === 'Plot' ? <LandPlot className="w-3 h-3 text-gold-light" /> : lead.category === 'Commercial' ? <Briefcase className="w-3 h-3 text-ai-light" /> : <HomeIcon className="w-3 h-3 text-emerald-light" />}{lead.category || 'Home'}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mb-5 bg-white/5 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 text-sm text-gray-300"><TrendingUp className="w-4 h-4 text-emerald-400" /> <span className="font-semibold text-white">{formatNumberInput(lead.budget) || "Budget TBD"}</span></div>
        <div className="flex items-center gap-2 text-sm text-gray-300"><MapPin className="w-4 h-4 text-ai-light" /> <span className="truncate">{lead.location || "Location TBD"}</span></div>
        <div className="flex items-center gap-2 text-sm text-gray-300"><Phone className="w-4 h-4 text-gray-400" /> {lead.phone || "No Phone"}</div>
      </div>

      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500 uppercase font-black tracking-widest mr-1"><Clock className="w-3 h-3 text-gray-600" /> {formattedDate} • {formattedTime}</div>

          {!isClosed && !isLost && (lead.chatSummary || lead.manualSummary) && (
            <button onClick={onViewSummary} title="Read Summary" className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors border border-blue-500/30 z-10">
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}

          {!isClosed && !isLost && (
            <button onClick={onOpenReminder} title="Set Reminder" className={`p-1.5 rounded-md transition-colors border z-10 ${lead.reminderDate && new Date(lead.reminderDate) > new Date() ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
              <BellRing className="w-3.5 h-3.5" />
            </button>
          )}

          <button onClick={onOpenNotes} title="Agent Notes" className={`p-1.5 rounded-md transition-colors border z-10 ${lead.agentNotes ? 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
            <NotebookPen className="w-3.5 h-3.5" />
          </button>
        </div>

        {!isClosed && !isLost ? (
          <button
            disabled={isCaller} 
            onClick={onMove}
            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full transition-all z-10 ${isCaller ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500' : lead.status === 'new' ? 'bg-gold/20 text-gold-light hover:bg-gold/30' : 'bg-ai/10 text-ai-light hover:bg-ai/30'}`}
          >
            {nextAction} <ArrowRight className="w-3 h-3" />
          </button>
        ) : isClosed ? (
          <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Won</span>
        ) : (
          <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${isDuplicate ? 'text-yellow-500' : 'text-red-400'}`}>
            {isDuplicate ? <><Copy className="w-3 h-3" /> Duplicate</> : <><Ban className="w-3 h-3" /> Lost</>}
          </span>
        )}
      </div>
    </div>
  );
}

function ManualLeadUploadForm({ onSuccess, leads, activeUser }: { onSuccess: () => void, leads: any[], activeUser: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "", phone: "", location: "", budget: "", purpose: "buy", category: "Home", subCategory: "House", intent: "Manual Walk-in", handledBy: activeUser?.username || activeUser?.name || "", manualSummary: ""
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const potentialDuplicate = leads.find(l => 
      (l.phone && l.phone === formData.phone) || 
      (l.location?.toLowerCase() === formData.location.toLowerCase() && parseNumberInput(l.budget) === parseNumberInput(formData.budget) && l.purpose === formData.purpose && l.category === formData.category)
    );

    let isFlagged = false;

    if (potentialDuplicate) {
      const proceed = window.confirm(`⚠️ CRITICAL AUDIT WARNING ⚠️\n\nA lead with similar details already exists in your pipeline (ID: ${potentialDuplicate.id.substring(0,5).toUpperCase()}).\n\nIf you are attempting to re-enter a platform lead manually to bypass fees, your account will be suspended.\n\nDo you still want to proceed and flag this for Admin Review?`);
      if (!proceed) {
        setIsSubmitting(false);
        return; 
      }
      isFlagged = true; 
    }

    const payload = {
      ...formData,
      budget: parseNumberInput(formData.budget), 
      source: "MANUAL", 
      score: 50,
      isDuplicate: isFlagged
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Lead successfully added to your private CRM!");
        setTimeout(() => { setSuccessMsg(""); onSuccess(); }, 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><UserPlus2 className="w-6 h-6 text-gold" /> Add Manual Client</h2>
        <p className="text-sm text-gray-400 mt-1">Leads added here are strictly private to your agency and do not incur platform fees.</p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 font-bold">
          <CheckCircle className="w-5 h-5" /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Client Name</label>
            <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Ahmed Raza" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Phone Number</label>
            <input required name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. +92 300..." className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Target Location</label>
            <input required name="location" value={formData.location} onChange={handleChange} placeholder="e.g. DHA Phase 6" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Budget</label>
            <input required type="text" name="budget" value={formatNumberInput(formData.budget)} onChange={(e) => setFormData(prev => ({...prev, budget: parseNumberInput(e.target.value)}))} placeholder="e.g. 40000000" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50" />
            {getPKRWords(formData.budget) && <p className="text-[10px] text-emerald-400 font-bold mt-1 tracking-wider">{getPKRWords(formData.budget)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Purpose</label>
            <select name="purpose" value={formData.purpose} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50 appearance-none">
              <option value="buy">Buying</option>
              <option value="rent">Renting</option>
              <option value="sell">Selling</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50 appearance-none">
              <option value="Home">Home</option>
              <option value="Plot">Plot</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Handled By</label>
            <input required name="handledBy" value={formData.handledBy} onChange={handleChange} placeholder="Your Name" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50" />
          </div>
        </div>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Lead Summary / Initial Notes</label>
          <textarea required name="manualSummary" value={formData.manualSummary} onChange={handleChange} placeholder="Type the backstory, requirements, or meeting notes here..." className="w-full h-32 bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-gold/50 resize-none custom-scrollbar whitespace-pre-wrap" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gold hover:bg-gold-light text-brand-dark font-black text-lg rounded-2xl transition-colors shadow-[0_0_20px_rgba(217,119,6,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus2 className="w-5 h-5" /> Push to Pipeline</>}
        </button>
      </form>
    </div>
  );
}

// REPLACE YOUR PropertyUploadForm WITH THIS VERSION
function PropertyUploadForm({ activeUser, onSuccess }: { activeUser: any, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "", purpose: "buy", category: "Home", subCategory: "House",
    price: "", priceFormatted: "", size: "", location: "", city: "Lahore",
    bedrooms: "", bathrooms: "", isFurnished: false,
    paymentMode: "Cash", installmentPlan: "",
    criticalNotes: "",
    images: [] as string[], videoUrl: ""
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'category') {
        if (value === 'Commercial') newData.subCategory = 'Shop';
        else if (value === 'Flats') newData.subCategory = 'Standard Flat';
        else if (value === 'Home') newData.subCategory = 'House';
        else if (value === 'Plot') newData.subCategory = 'Residential Plot';
      }
      return newData;
    });
  };

  // 🚀 ENTERPRISE UPGRADE: Direct to Google Cloud Storage (With Webpack Interop Fix)
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 12) {
      alert("Maximum 12 images allowed per property.");
      return;
    }

    setIsCompressing(true);

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    try {
      const uploadedUrls = [];
      
      // 🚀 THE TRUE FIX: Dynamically import the library only on the client side
      const imageCompressionModule = await import('browser-image-compression');
      // Safely extract the default export regardless of how Webpack bundled it
      const compressImage = imageCompressionModule.default || imageCompressionModule;

      for (const file of files) {
        // Compress using the dynamically loaded function
        const compressedFile = await compressImage(file, options);
        
        const uploadData = new FormData();
        uploadData.append("file", compressedFile, file.name);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    
    } catch (error) {
      console.error("GCS Upload failed", error);
      alert("Failed to upload images to Cloud Storage. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      alert("Please upload at least 1 image for the property.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      price: parseNumberInput(formData.price),
      images: formData.images, 
      agencyName: activeUser?.agencyName || "LPG Premium",
      submittedBy: activeUser?.username || activeUser?.name || "System"
    };

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Property successfully pushed to Cloud Database!");
        setFormData({ title: "", purpose: "buy", category: "Home", subCategory: "House", price: "", priceFormatted: "", size: "", location: "", city: "Lahore", bedrooms: "", bathrooms: "", isFurnished: false, paymentMode: "Cash", installmentPlan: "", criticalNotes: "", images: [], videoUrl: "" });
        setTimeout(() => { setSuccessMsg(""); onSuccess(); }, 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUnitLabel = () => {
    if (formData.category === 'Commercial') {
      if (formData.subCategory === 'Office') return 'Rooms';
      if (formData.subCategory === 'Plaza') return 'Floors';
    }
    return 'Bedrooms';
  };

  const showUnits = formData.category !== 'Plot' && formData.subCategory !== 'Shop';
  const showBaths = formData.category !== 'Plot' && formData.subCategory !== 'Shop' && formData.subCategory !== 'Plaza';
  const showFurnished = formData.category === 'Home' || formData.category === 'Flats';

  return (
    <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Upload className="w-6 h-6 text-emerald-400" /> Upload New Listing</h2>
        <p className="text-sm text-gray-400 mt-1">Properties uploaded here are securely compressed and saved to Google Cloud Storage.</p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 font-bold">
          <CheckCircle className="w-5 h-5" /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
          <div className="col-span-1 md:col-span-3">
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Listing Title</label>
            <input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. 1 Kanal Modern Villa in Prism" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Purpose</label>
            <select name="purpose" value={formData.purpose} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
              <option value="buy">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
              <option value="Home">Home</option>
              <option value="Plot">Plot</option>
              <option value="Commercial">Commercial</option>
              <option value="Flats">Flats</option>
            </select>
          </div>

          {formData.category === 'Commercial' ? (
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Commercial Type</label>
              <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
                <option value="Shop">Shop</option>
                <option value="Plaza">Plaza</option>
                <option value="Office">Office</option>
              </select>
            </div>
          ) : formData.category === 'Flats' ? (
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Flat Type</label>
              <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
                <option value="Studio">Studio</option>
                <option value="Standard Flat">Standard Flat</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Sub Category</label>
              <input name="subCategory" value={formData.subCategory} onChange={handleChange} placeholder={formData.category === 'Home' ? "e.g. House" : "e.g. File"} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Payment Mode</label>
            <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
              <option value="Cash">Cash / Upfront</option>
              <option value="Installment">Installment Plan</option>
            </select>
          </div>
          {formData.paymentMode === 'Installment' && (
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Installment Details</label>
              <input type="text" name="installmentPlan" value={formData.installmentPlan} onChange={handleChange} placeholder="e.g. 20% Down, 3 Yrs Monthly..." className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Raw Price (Numbers)</label>
            <input required type="text" name="price" value={formatNumberInput(formData.price)} onChange={(e) => setFormData(prev => ({...prev, price: parseNumberInput(e.target.value)}))} placeholder="e.g. 35000000" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
            {getPKRWords(formData.price) && <p className="text-[10px] text-emerald-400 font-bold mt-1 tracking-wider">{getPKRWords(formData.price)}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Display Price</label>
            <input required name="priceFormatted" value={formData.priceFormatted} onChange={handleChange} placeholder="e.g. PKR 3.5 Crore" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Size</label>
            <input required name="size" value={formData.size} onChange={handleChange} placeholder="e.g. 1 Kanal" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
          </div>
        </div>

        {showUnits || showBaths || showFurnished ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 items-end">
            {showUnits && (
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">{getUnitLabel()}</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} placeholder={`e.g. ${getUnitLabel() === 'Floors' ? '3' : '5'}`} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
              </div>
            )}
            {showBaths && (
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Bathrooms</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} placeholder="e.g. 6" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
              </div>
            )}
            {showFurnished && (
              <div className="flex items-center gap-3 py-3">
                <input type="checkbox" name="isFurnished" checked={formData.isFurnished} onChange={handleChange} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" id="furnish" />
                <label htmlFor="furnish" className="text-sm text-white cursor-pointer font-bold">Fully Furnished</label>
              </div>
            )}
          </div>
        ) : null}

        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-6">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Location</label>
            <input required name="location" value={formData.location} onChange={handleChange} placeholder="e.g. DHA Phase 9 Prism" className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-ai-light" /> Critical Notes (AI Analyzed)</label>
            <textarea name="criticalNotes" value={formData.criticalNotes} onChange={handleChange} placeholder="e.g. Grey structure, corner plot, facing park, urgently selling..." className="w-full h-24 bg-brand-dark/50 border border-white/10 text-white rounded-xl p-4 outline-none focus:border-ai/50 resize-none custom-scrollbar" />
            <p className="text-[10px] text-gray-500 mt-2">These notes are fed directly to the AI Concierge so it can perfectly pitch this listing to buyers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 flex justify-between">
                <span>Property Images (Max 12)</span>
                <span className="text-emerald-400">{formData.images.length}/12 Uploaded</span>
              </label>

              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleMultipleImageUpload} className="hidden" />

              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={formData.images.length >= 12 || isCompressing} className="w-full h-24 border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-brand-dark/50">
                {isCompressing ? <Loader2 className="w-6 h-6 mb-1 text-emerald-400 animate-spin" /> : <ImageIcon className="w-6 h-6 mb-1 text-emerald-400/70" />}
                <span className="text-xs">{isCompressing ? "Uploading to Cloud..." : "Browse Files to Upload"}</span>
              </button>

              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {formData.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group shadow-md">
                      <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-brand-dark text-[8px] font-black text-center py-0.5 uppercase tracking-widest">Main</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Video Tour URL (Optional)</label>
              <div className="relative">
                <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="e.g. YouTube or Vimeo link..." className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:border-emerald-500/50" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Add a drone or walkthrough video URL to increase buyer engagement on the property page.</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting || isCompressing} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-black text-lg rounded-2xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Push to Google Cloud Server</>}
        </button>
      </form>
    </div>
  );
}

function EditPropertyForm({ initialData, activeUser, onClose, onSuccess }: { initialData: any, activeUser: any, onClose: () => void, onSuccess: (data: any) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    id: initialData.id,
    title: initialData.title || "", purpose: initialData.purpose || "buy", category: initialData.category || "Home", subCategory: initialData.subCategory || "House",
    price: initialData.price || "", priceFormatted: initialData.priceFormatted || "", size: initialData.size || "", location: initialData.location || "", city: initialData.city || "Lahore",
    bedrooms: initialData.bedrooms || "", bathrooms: initialData.bathrooms || "", isFurnished: initialData.isFurnished || false,
    paymentMode: initialData.paymentMode || "Cash", installmentPlan: initialData.installmentPlan || "",
    criticalNotes: initialData.criticalNotes || "",
    images: initialData.imageUrls && initialData.imageUrls.length > 0 ? initialData.imageUrls : (initialData.imageUrl ? [initialData.imageUrl] : []),
    videoUrl: initialData.videoUrl || ""
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'category') {
        if (value === 'Commercial') newData.subCategory = 'Shop';
        else if (value === 'Flats') newData.subCategory = 'Standard Flat';
        else if (value === 'Home') newData.subCategory = 'House';
        else if (value === 'Plot') newData.subCategory = 'Residential Plot';
      }
      return newData;
    });
  };

  // 🚀 ENTERPRISE UPGRADE: Direct to Google Cloud Storage (With Webpack Interop Fix)
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 12) {
      alert("Maximum 12 images allowed per property.");
      return;
    }

    setIsCompressing(true);

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    try {
      const uploadedUrls = [];
      
      // 🚨 WEBPACK ESM/CJS FIX
      const compressFn = typeof imageCompression === "function" 
        ? imageCompression 
        : (imageCompression as any).default;

      for (const file of files) {
        const compressedFile = await compressFn(file, options);
        
        const uploadData = new FormData();
        uploadData.append("file", compressedFile, file.name);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error) {
      console.error("GCS Upload failed", error);
      alert("Failed to upload images to Cloud Storage. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_: string, idx: number) => idx !== indexToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      price: parseNumberInput(formData.price.toString())
    };

    try {
      const res = await fetch('/api/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSuccess(payload);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUnitLabel = () => {
    if (formData.category === 'Commercial') {
      if (formData.subCategory === 'Office') return 'Rooms';
      if (formData.subCategory === 'Plaza') return 'Floors';
    }
    return 'Bedrooms';
  };

  const showUnits = formData.category !== 'Plot' && formData.subCategory !== 'Shop';
  const showBaths = formData.category !== 'Plot' && formData.subCategory !== 'Shop' && formData.subCategory !== 'Plaza';
  const showFurnished = formData.category === 'Home' || formData.category === 'Flats';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
        <div className="col-span-1 md:col-span-3">
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Listing Title</label>
          <input required name="title" value={formData.title} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Purpose</label>
          <select name="purpose" value={formData.purpose} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
            <option value="buy">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
            <option value="Home">Home</option>
            <option value="Plot">Plot</option>
            <option value="Commercial">Commercial</option>
            <option value="Flats">Flats</option>
          </select>
        </div>

        {formData.category === 'Commercial' ? (
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Commercial Type</label>
            <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
              <option value="Shop">Shop</option>
              <option value="Plaza">Plaza</option>
              <option value="Office">Office</option>
            </select>
          </div>

        ) : formData.category === 'Flats' ? (
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Flat Type</label>
            <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
              <option value="Studio">Studio</option>
              <option value="Standard Flat">Standard Flat</option>
              <option value="Penthouse">Penthouse</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Sub Category</label>
            <input name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Payment Mode</label>
          <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none">
            <option value="Cash">Cash / Upfront</option>
            <option value="Installment">Installment Plan</option>
          </select>
        </div>
        {formData.paymentMode === 'Installment' && (
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Installment Details</label>
            <input type="text" name="installmentPlan" value={formData.installmentPlan} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Raw Price (Numbers)</label>
          <input required type="text" name="price" value={formatNumberInput(formData.price)} onChange={(e) => setFormData(prev => ({...prev, price: parseNumberInput(e.target.value)}))} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
          {getPKRWords(formData.price) && <p className="text-[10px] text-emerald-400 font-bold mt-1 tracking-wider">{getPKRWords(formData.price)}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Display Price</label>
          <input required name="priceFormatted" value={formData.priceFormatted} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Size</label>
          <input required name="size" value={formData.size} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
        </div>
      </div>

      {showUnits || showBaths || showFurnished ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 items-end">
          {showUnits && (
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">{getUnitLabel()}</label>
              <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
            </div>
          )}
          {showBaths && (
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Bathrooms</label>
              <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
            </div>
          )}
          {showFurnished && (
            <div className="flex items-center gap-3 py-3">
              <input type="checkbox" name="isFurnished" checked={formData.isFurnished} onChange={handleChange} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" id="furnish" />
              <label htmlFor="furnish" className="text-sm text-white cursor-pointer font-bold">Fully Furnished</label>
            </div>
          )}
        </div>
      ) : null}

      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-6">
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Location</label>
          <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-ai-light" /> Critical Notes (AI Analyzed)</label>
          <textarea name="criticalNotes" value={formData.criticalNotes} onChange={handleChange} className="w-full h-24 bg-brand-dark/50 border border-white/10 text-white rounded-xl p-4 outline-none focus:border-ai/50 resize-none custom-scrollbar" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 flex justify-between">
              <span>Property Images (Max 12)</span>
              <span className="text-emerald-400">{formData.images.length}/12 Uploaded</span>
            </label>

            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleMultipleImageUpload} className="hidden" />

            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={formData.images.length >= 12 || isCompressing} className="w-full h-24 border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-brand-dark/50">
              {isCompressing ? <Loader2 className="w-6 h-6 mb-1 text-emerald-400 animate-spin" /> : <ImageIcon className="w-6 h-6 mb-1 text-emerald-400/70" />}
              <span className="text-xs">{isCompressing ? "Uploading to Cloud..." : "Browse Files to Upload"}</span>
            </button>

            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {formData.images.map((img: string, idx: number) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group shadow-md">
                    <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-brand-dark text-[8px] font-black text-center py-0.5 uppercase tracking-widest">Main</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Video Tour URL (Optional)</label>
            <div className="relative">
              <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input name="videoUrl" value={formData.videoUrl} onChange={handleChange} className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:border-emerald-500/50" />
            </div>
          </div>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting || isCompressing} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-black text-lg rounded-2xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Listing Updates</>}
      </button>
    </form>
  );
}