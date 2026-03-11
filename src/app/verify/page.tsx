"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, UploadCloud, ShieldCheck, Scan, AlertTriangle, 
  FileText, CheckCircle2, Loader2, XCircle, Search
} from "lucide-react";

export default function DocumentVerifier() {
  const [fileImage, setFileImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 🚀 NEW ERROR STATE
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileImage(reader.result as string);
        setAuditResult(null); 
        setErrorMsg(null); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!fileImage) return;
    setIsScanning(true);
    setErrorMsg(null); // Clear previous errors

    try {
      const res = await fetch("/api/verify-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: fileImage }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuditResult(data.auditReport);
      } else {
        // Show actual backend error on UI
        setErrorMsg(data.error || "Failed to analyze document."); 
      }
    } catch (error: any) {
      console.error("Scan failed:", error);
      setErrorMsg(error.message || "Network error occurred. Check terminal.");
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setFileImage(null);
    setAuditResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans flex flex-col">
      <header className="h-20 border-b border-white/10 bg-brand-dark/80 backdrop-blur-md flex items-center px-6 md:px-12 shrink-0 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-8">
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">AI Legal & Document Verifier</h1>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-black">BPO Grade OCR Audit</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col gap-6">
          <div className="bg-[#162032] border border-white/10 rounded-3xl p-8 shadow-glass relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-widest">
                <Scan className="w-4 h-4 text-blue-400" /> Optical Scanner
              </h2>
              {fileImage && (
                <button onClick={resetScanner} className="text-xs text-red-400 hover:text-red-300 font-bold tracking-wider uppercase">Reset</button>
              )}
            </div>

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            {!fileImage ? (
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-80 border-2 border-dashed border-gray-600 bg-brand-dark hover:border-blue-500/50 hover:bg-blue-500/5 rounded-2xl flex flex-col items-center justify-center transition-all group">
                <UploadCloud className="w-10 h-10 mb-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                <span className="text-lg font-bold text-white mb-1">Upload Property Document</span>
                <span className="text-xs text-gray-500 max-w-[250px] text-center">Upload Allotment Letters, Transfer Records, or Token Receipts for instant OCR verification.</span>
              </button>
            ) : (
              <div className="relative w-full h-[500px] bg-black rounded-2xl overflow-hidden border border-white/10">
                <img src={fileImage} className="w-full h-full object-contain opacity-80" alt="Document" />
                {isScanning && (
                  <>
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-500/10 z-10"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,1)] z-20 animate-scan-laser"></div>
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                      <div className="bg-brand-dark/90 backdrop-blur-md px-6 py-3 rounded-full border border-blue-500/50 flex items-center gap-3 shadow-2xl">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Extracting Data...</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 🚀 NEW: LIVE ERROR DISPLAY */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <button 
              onClick={handleScan}
              disabled={isScanning || !fileImage || auditResult !== null}
              className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" /> Initiate AI Audit
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 h-full">
          {auditResult ? (
            <div className="bg-glass-gradient border border-white/10 rounded-3xl p-8 shadow-glass animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
              <div className={`flex items-start gap-4 p-5 rounded-2xl border mb-8 ${auditResult.isVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className={`p-3 rounded-full ${auditResult.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {auditResult.isVerified ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`text-2xl font-black uppercase tracking-tight ${auditResult.isVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                    {auditResult.isVerified ? "Verified Document" : "Verification Failed"}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">AI Confidence Score: <strong className="text-white">{auditResult.confidenceScore}%</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Document Type</p>
                  <p className="font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> {auditResult.documentType}</p>
                </div>
                <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Owner / Title</p>
                  <p className="font-bold text-white">{auditResult.ownerName || "Not Detected"}</p>
                </div>
                <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Plot Details</p>
                  <p className="font-bold text-white">{auditResult.plotDetails || "Not Detected"}</p>
                </div>
                <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Reference No.</p>
                  <p className="font-mono text-emerald-400 font-bold">{auditResult.referenceNumber || "Not Detected"}</p>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4 text-gold-light" /> AI Analysis Notes
                </h4>
                <div className="bg-brand-dark/50 border border-white/5 rounded-xl p-4">
                  {auditResult.anomaliesFound.length === 0 ? (
                    <p className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> No tampering or anomalies detected. Text is clear.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {auditResult.anomaliesFound.map((anomaly: string, idx: number) => (
                        <li key={idx} className="text-sm text-red-300 flex items-start gap-2">
                          <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{anomaly}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#162032] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center h-full opacity-30 text-center">
              <ShieldCheck className="w-24 h-24 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Awaiting Document</h3>
              <p className="text-sm text-gray-400 max-w-xs">Upload a document and initiate the audit to view extracted data and verification status here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}