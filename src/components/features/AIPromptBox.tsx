"use client"; // This tells Next.js this component uses interactivity (state, buttons)

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

export default function AIPromptBox() {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the page from reloading when you press Enter
    
    // For now, we will just show an alert. 
    // Later, we will connect this to our backend AI routing!
    alert(`Sending to AI: "${prompt}"`);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="relative flex w-full items-center rounded-full border border-slate-300 bg-white p-2 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 hover:shadow-md"
    >
      <Search className="ml-4 h-6 w-6 text-slate-400" />
      
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="E.g., A 10 Marla house in DHA Phase 6 under 5 Crore..."
        className="w-full flex-1 border-none bg-transparent px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 sm:text-lg"
        required
      />
      
      <button
        type="submit"
        className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline">Search with AI</span>
      </button>
    </form>
  );
}