"use client";

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";

export default function ProjectGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-ai-light"/> Media Gallery</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedImage(img)}
              className={`rounded-2xl overflow-hidden border border-white/10 shadow-glass cursor-pointer relative group ${idx === 0 ? 'col-span-2 row-span-2 h-64 md:h-80' : 'h-32 md:h-[154px]'}`}
            >
              <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Gallery ${idx}`} />
              <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/30 transition-colors flex items-center justify-center">
                 <span className="bg-brand-dark/80 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">View Full</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      {selectedImage && (
        <div className="fixed inset-0 z-[999999] bg-brand-dark/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md">
            <X className="w-6 h-6" />
          </button>
          <img src={selectedImage} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Enlarged View" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}