"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, UploadCloud, Wand2, Sparkles, Image as ImageIcon, 
  Download, Loader2, LayoutTemplate, RefreshCw, Layers, Send
} from "lucide-react";

const ARCHITECTURE_STYLES = [
  { id: "pakistani", name: "Pakistani Modern", prompt: "Modern Pakistani luxury house design, straight lines, grey concrete and wood accents, terrace gardens, Lahore-style contemporary architecture, 8k resolution" },
  { id: "modern", name: "Ultra-Modern Minimalist", prompt: "Ultra-modern minimalist villa, floor-to-ceiling glass, flat roof, infinity pool, 8k resolution, architectural photography" },
  { id: "spanish", name: "Spanish Mediterranean", prompt: "Luxury Spanish Mediterranean villa, terracotta roof tiles, white stucco walls, arched windows, lush landscaping, warm lighting" },
  { id: "victorian", name: "Classic Victorian", prompt: "Classic Victorian estate, intricate brickwork, steep gabled roof, wrap-around porch, elegant historical architecture" },
];

export default function PlotVisualizer() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState(ARCHITECTURE_STYLES[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setGeneratedImage(null); // Reset generated image on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (isModification = false) => {
    if (!originalImage) return;
    setIsGenerating(true);

    // If modifying, we send the generated image back to the AI. 
    // Otherwise, we send the original plot.
    const imageToProcess = isModification ? generatedImage : originalImage;
    const finalPrompt = isModification ? modificationPrompt : (customPrompt.trim() !== "" ? customPrompt : activeStyle.prompt);

    try {
      const res = await fetch("/api/generate-plot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageToProcess,
          prompt: finalPrompt,
          style: activeStyle.name,
          isModification: isModification // Tell backend this is an edit
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedImage(data.generatedImage);
        setModificationPrompt(""); // Clear input after success
      }
    } catch (error) {
      console.error("Failed to generate:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "AI_Architecture_Concept.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans overflow-x-hidden flex flex-col">
      {/* 🚀 HEADER */}
      <header className="h-20 border-b border-white/10 bg-brand-dark/80 backdrop-blur-md flex items-center px-6 md:px-12 shrink-0 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-8">
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ai/20 border border-ai/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Wand2 className="w-5 h-5 text-ai-light" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Generative Plot Visualizer</h1>
            <p className="text-[10px] text-ai-light uppercase tracking-widest font-black">Powered by Gemini AI</p>
          </div>
        </div>
      </header>

      {/* 🚀 MAIN STUDIO GRID */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* STEP 1: Upload */}
          <div className="bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-glass">
            <h2 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-widest"><Layers className="w-4 h-4 text-emerald-400" /> Step 1: Upload Plot</h2>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${originalImage ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-600 bg-brand-dark hover:border-white/30 text-gray-400'}`}
            >
              {originalImage ? (
                <div className="w-full h-full relative p-2">
                  <img src={originalImage} className="w-full h-full object-cover rounded-lg opacity-80" alt="Original Plot" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-brand-dark/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2"><RefreshCw className="w-3 h-3" /> Change Image</span>
                  </div>
                </div>
              ) : (
                <><UploadCloud className="w-8 h-8 mb-3 text-gray-500" /><span className="text-sm font-bold">Drag & Drop or Click to Upload</span><span className="text-xs text-gray-500 mt-1">Empty plot, dirt, or raw land photo</span></>
              )}
            </button>
          </div>

          {/* STEP 2: Style Selection */}
          <div className={`bg-[#162032] border border-white/10 rounded-2xl p-6 shadow-glass transition-opacity duration-300 ${!originalImage && 'opacity-50 pointer-events-none'}`}>
            <h2 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-widest"><LayoutTemplate className="w-4 h-4 text-ai-light" /> Step 2: Architecture Style</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {ARCHITECTURE_STYLES.map((style) => (
                <button 
                  key={style.id}
                  onClick={() => setActiveStyle(style)}
                  className={`p-3 rounded-xl text-left border transition-all flex flex-col gap-1 ${activeStyle.id === style.id ? 'bg-ai/10 border-ai/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'bg-brand-dark border-white/5 hover:border-white/20'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeStyle.id === style.id ? 'bg-ai-light shadow-[0_0_5px_#A78BFA]' : 'bg-gray-600'}`}></span>
                  <span className={`text-xs font-bold mt-1 ${activeStyle.id === style.id ? 'text-white' : 'text-gray-400'}`}>{style.name}</span>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Or Custom Prompt (Optional)</label>
              <textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. A futuristic glass mansion with a helipad..."
                className="w-full bg-brand-dark border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-ai/50 resize-none h-20 placeholder-gray-600"
              />
            </div>

            <button 
              onClick={() => handleGenerate(false)}
              disabled={isGenerating || !originalImage}
              className="w-full py-4 bg-gradient-to-r from-ai to-blue-600 hover:from-ai-light hover:to-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Rendering AI Model...</> : <><Sparkles className="w-5 h-5" /> Generate Architecture</>}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: VISUALIZER CANVAS */}
        <div className="lg:col-span-8 bg-[#0B1120] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
          {/* Canvas Header */}
          <div className="h-14 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500/50"></span>
              <span className="w-3 h-3 rounded-full bg-gold/50"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/50"></span>
            </div>
            {generatedImage && (
              <div className="flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-gray-400 italic">Please Save your concept →</span>
                <button onClick={triggerDownload} className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full transition-colors">
                  <Download className="w-3 h-3" /> Save Concept
                </button>
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative flex items-center justify-center p-6 min-h-[500px]">
            {isGenerating && (
              <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
                <Loader2 className="w-12 h-12 text-ai-light animate-spin mb-4" />
                <p className="text-ai-light tracking-widest uppercase font-black animate-pulse text-xs">AI is building your vision...</p>
              </div>
            )}

            {generatedImage ? (
              <div className="w-full h-full relative flex flex-col items-center gap-6">
                <div className="relative group w-full flex justify-center">
                  <img src={generatedImage} alt="AI Generated Architecture" className="max-h-[550px] w-auto object-contain rounded-xl shadow-2xl border border-white/10" />
                  <div className="absolute bottom-4 left-4 bg-brand-dark/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai-light" />
                    <span className="text-xs font-bold text-white">AI Concept: {activeStyle.name}</span>
                  </div>
                </div>

                {/* 🚀 DESIGN IMPROVISOR BOX */}
                <div className="w-full max-w-2xl bg-[#162032] border border-ai/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(139,92,246,0.1)] flex items-center gap-4 animate-slide-up">
                  <div className="bg-ai/20 p-2 rounded-lg"><Sparkles className="w-5 h-5 text-ai-light" /></div>
                  <input 
                    type="text" 
                    value={modificationPrompt}
                    onChange={(e) => setModificationPrompt(e.target.value)}
                    placeholder="Refine this design: 'Park two white cars in front'..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate(true)}
                  />
                  <button 
                    onClick={() => handleGenerate(true)}
                    disabled={!modificationPrompt.trim() || isGenerating}
                    className="bg-ai text-white p-2 rounded-xl hover:bg-ai-light transition-colors disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : originalImage ? (
              <div className="w-full h-full relative flex justify-center">
                 <img src={originalImage} alt="Uploaded Plot" className="max-h-[550px] w-auto object-contain rounded-xl opacity-60 grayscale blur-[2px]" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-brand-dark/90 text-white px-6 py-3 rounded-full font-bold shadow-2xl border border-white/10">Ready for AI Generation</span>
                 </div>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center opacity-30">
                <ImageIcon className="w-24 h-24 mb-4" />
                <h3 className="text-2xl font-bold">Awaiting Plot Image</h3>
                <p className="text-sm">Upload an image on the left to begin.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}