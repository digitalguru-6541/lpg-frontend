"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Mic, X, Sparkles } from "lucide-react";

// --- Interfaces ---
interface Message { role: "user" | "ai"; content: string; }

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

export default function ProjectChat({ project }: { project: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll globally when mobile chat is open
  useEffect(() => {
    if (isMobileChatOpen) document.body.classList.add('chat-locked');
    else document.body.classList.remove('chat-locked');
    return () => document.body.classList.remove('chat-locked');
  }, [isMobileChatOpen]);

  // Initialize Session & Memory
  useEffect(() => {
    let currentSessionId = localStorage.getItem("lpg_session_id");
    if (!currentSessionId) {
      currentSessionId = "session_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("lpg_session_id", currentSessionId);
    }
    setSessionId(currentSessionId);

    const fetchChatMemory = async () => {
      try {
        const res = await fetch(`/api/gemini?sessionId=${currentSessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) setMessages(data.messages);
        }
      } catch (err) { console.error("Memory Fetch Error:", err); }
    };
    fetchChatMemory();
  }, []);

  // Smart Scroll
  useEffect(() => {
    if (chatScrollRef.current && messages.length > 0) {
      const userMessages = chatScrollRef.current.querySelectorAll('.user-message-marker');
      if (userMessages.length > 0) {
        userMessages[userMessages.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }
  }, [messages, isMobileChatOpen, isLoading]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !project) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages); setInput(""); setIsLoading(true);

    // 🚀 THE SPOOF: Format the project so the existing /api/gemini understands it perfectly
    const safeCurrentProperty = {
      id: project.id,
      title: project.title,
      priceFormatted: formatFullPKR(project.startingPrice),
      location: project.location,
      purpose: "buy",
      category: "Mega Project",
      subCategory: "Off-Plan Master Development",
      paymentMode: "Installment",
      agencyName: project.agencyName
    };

    const activeFinancialContext = {
      contextType: "Master Development Off-Plan",
      expectedRoi: project.estRoi,
      startingPrice: formatFullPKR(project.startingPrice)
    };

    try {
      const res = await fetch("/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newMessages, 
          sessionId: sessionId, 
          currentProperty: safeCurrentProperty, 
          financialContext: activeFinancialContext
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages([...newMessages, { role: "ai", content: data.reply }]);
      }
    } catch (error) { console.error("Fetch error:", error); }
    finally { setIsLoading(false); }
  };

  return (
    <>
      {/* GLOBAL MOBILE FAB */}
      {!isMobileChatOpen && (
        <button onClick={() => setIsMobileChatOpen(true)} className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-ai text-white rounded-full shadow-[0_0_50px_rgba(139,92,246,0.9)] flex items-center justify-center z-[99999] transition-all hover:scale-110 ring-4 ring-ai/40 animate-[pulse_1.5s_ease-in-out_infinite]">
          <Bot className="w-8 h-8" />
          <span className="absolute top-0 right-1 w-4 h-4 bg-emerald-400 border-2 border-brand-dark rounded-full"></span>
        </button>
      )}

      {/* STICKY CHAT CONTAINER */}
      <div className={`
        ${isMobileChatOpen ? 'fixed inset-0 z-[999999] p-4 pt-24 flex flex-col bg-brand-dark/95 backdrop-blur-3xl' : 'hidden lg:flex'}
        w-full lg:flex-col lg:sticky lg:top-32 lg:h-[calc(100vh-140px)] lg:p-0 lg:bg-transparent lg:z-40 shrink-0
      `}>
        <div className="bg-[#101726] border border-white/10 rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden ring-1 ring-white/10">
          
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ai/20 rounded-full relative"><Bot className="w-5 h-5 text-ai-light" /><span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-slate-900"></span></div>
              <div><h3 className="text-lg font-semibold text-white leading-tight">Project Concierge</h3><p className="text-xs text-emerald-light">Expert on {project.title.substring(0, 15)}...</p></div>
            </div>
            <button onClick={() => setIsMobileChatOpen(false)} className="lg:hidden p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"><X className="w-5 h-5" /></button>
          </div>

          <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-transparent">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-300 gap-4 opacity-90">
                <Sparkles className="w-8 h-8 text-ai-light" />
                <p className="text-sm">Ask me for the official brochure, ROI details, or floor plans for this development.</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse user-message-marker' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-brand-light' : 'bg-ai/30 border border-ai/50'}`}>{msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-ai-light" />}</div>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm md:text-base shadow-md ${msg.role === 'user' ? 'bg-brand-light text-white rounded-tr-none' : 'bg-white/10 backdrop-blur-md text-gray-100 rounded-tl-none border border-white/10'}`}><p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p></div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-ai/30 flex items-center justify-center shrink-0 border border-ai/50"><Bot className="w-4 h-4 text-ai-light" /></div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md rounded-tl-none border border-white/10 flex gap-2 items-center"><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce"></span><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-75"></span><span className="w-2 h-2 bg-ai-light rounded-full animate-bounce delay-150"></span></div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10 flex gap-2 items-center shrink-0">
            <button type="button" onClick={handleVoiceInput} className={`p-2 rounded-full transition-all shrink-0 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}><Mic className="w-5 h-5" /></button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} placeholder="Ask about payment plans..." className="grow bg-white/10 border border-white/10 text-white placeholder-gray-300 text-sm rounded-full px-4 py-2.5 outline-none focus:border-ai/50 transition-colors disabled:opacity-50" />
            <button type="submit" disabled={isLoading || !input.trim()} className="w-10 h-10 bg-ai hover:bg-ai-light text-white rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 shadow-ai-glow"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      </div>
    </>
  );
}