"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, Loader2, Plus, Trash2, AlertTriangle, ImageIcon } from "lucide-react";

export default function BulkImportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // 🚀 UPDATED: Changed 'file: null' to 'files: []'
  const [blocks, setBlocks] = useState([{ id: Date.now(), text: "", files: [] as File[] }]);

  const addBlock = () => {
    if (blocks.length < 5) {
      setBlocks([...blocks, { id: Date.now(), text: "", files: [] }]);
    }
  };

  const removeBlock = (id: number) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const handleTextChange = (id: number, value: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, text: value } : b));
  };

  // 🚀 UPDATED: Handles multiple files and limits to 12
  const handleFileChange = (id: number, fileList: FileList | null) => {
    if (!fileList) return;
    const selectedFiles = Array.from(fileList).slice(0, 12); // Enforce max 12
    setBlocks(blocks.map(b => b.id === id ? { ...b, files: selectedFiles } : b));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      blocks.forEach((block, index) => {
        if (block.text) formData.append(`text_${index}`, block.text);
        
        // 🚀 UPDATED: Append each file in the array to the same key
        block.files.forEach(file => {
          formData.append(`file_${index}`, file);
        });
      });
      formData.append("blockCount", blocks.length.toString());

      const res = await fetch("/api/bulk-import", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg("Bulk properties and galleries successfully saved to DB!");
        setBlocks([{ id: Date.now(), text: "", files: [] }]);
      } else {
        alert("AI Processing Failed. Check console.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="bg-glass-gradient backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Sparkles className="text-ai-light w-8 h-8" />
            AI Bulk Importer
          </h1>
          <p className="text-gray-400 mt-2">Paste Zameen details and upload up to 12 images per property. AI will extract data and push to your database.</p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle className="w-5 h-5" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {blocks.map((block, index) => (
            <div key={block.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group">
              {blocks.length > 1 && (
                <button type="button" onClick={() => removeBlock(block.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              
              <h3 className="text-white font-bold mb-4">Property Block {index + 1}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Raw Data / Description</label>
                  <textarea 
                    required 
                    value={block.text} 
                    onChange={(e) => handleTextChange(block.id, e.target.value)} 
                    placeholder="Paste Zameen title, price, description, etc..." 
                    className="w-full h-32 bg-brand-dark/50 border border-white/10 text-white rounded-xl p-4 outline-none focus:border-ai/50 resize-none custom-scrollbar" 
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 flex justify-between">
                    <span>Property Images (Max 12)</span>
                    <span className="text-emerald-400">{block.files.length}/12</span>
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple // 🚀 UPDATED: Allows multiple selection
                    required
                    onChange={(e) => handleFileChange(block.id, e.target.files)} 
                    className="w-full bg-brand-dark/50 border border-white/10 text-white rounded-xl p-3 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20" 
                  />
                  {block.files.length > 0 && (
                     <p className="text-[10px] text-gray-400 mt-2">
                       {block.files.length} file(s) selected. First image will be used as the main cover photo.
                     </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={addBlock} 
              disabled={blocks.length >= 5}
              className="flex-1 py-4 border-2 border-dashed border-white/20 hover:border-white/40 text-gray-300 font-bold rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Another Property (Max 5)
            </button>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-black text-lg rounded-2xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Process via AI & Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}