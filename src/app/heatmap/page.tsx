"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { 
  ArrowLeft, Map as MapIcon, TrendingUp, AlertTriangle, 
  Sparkles, Layers, Activity, Building, MapPin, Compass, Briefcase
} from "lucide-react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// 🚀 Custom Dark Mode Google Map Styles
const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#212124" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212124" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
];

// 🚀 EXPANDED Lahore Boundaries (Wider buffer for a softer UX)
const LAHORE_BOUNDS = {
  north: 31.9500, // Pushed north to clearly show RUDA & KSK
  south: 31.0500, // Pushed south past Bahria Orchard/Raiwind
  west: 73.8500,  // Pushed west towards Multan Road edge
  east: 74.8500,  // Pushed east towards Wagah border
};

// 🚀 Heatmap Layer Component
const PredictiveHeatmapLayer = ({ data }: { data: any }) => {
  const map = useMap();
  const visualization = useMapsLibrary("visualization");
  const [heatmap, setHeatmap] = useState<any>(null);

  useEffect(() => {
    if (!map || !visualization || !data) return;

    const heatData = data.features.map((feature: any) => ({
      location: new google.maps.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]),
      weight: feature.properties.weight * 10,
    }));

    if (heatmap) {
      heatmap.setData(heatData);
    } else {
      const newHeatmap = new visualization.HeatmapLayer({
        data: heatData,
        map: map,
        radius: 50, // 🚀 INCREASED from 40 to 50 so it looks richer when zoomed out
        opacity: 0.8,
        gradient: [
          "rgba(11, 17, 32, 0)",
          "rgba(59, 130, 246, 0.5)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.9)",
        ],
      });
      setHeatmap(newHeatmap);
    }

    return () => {
      if (heatmap) heatmap.setMap(null);
    };
  }, [map, visualization, data]);

  return null;
};

export default function PredictiveHeatmap() {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/heatmap-data")
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  return (
    <div className="relative w-full h-screen bg-brand-dark text-white font-sans overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="absolute top-0 w-full h-20 border-b border-white/10 bg-brand-dark/80 backdrop-blur-md flex items-center px-6 md:px-12 z-50">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-8">
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <MapIcon className="w-5 h-5 text-gold-light" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Predictive AI Smart Map</h1>
            <p className="text-[10px] text-gold-light uppercase tracking-widest font-black">Powered by Google Maps Data</p>
          </div>
        </div>
      </header>

      {/* GOOGLE MAPS CONTAINER */}
      <div className="flex-1 w-full h-full relative">
        {!GOOGLE_MAPS_API_KEY ? (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-dark z-40">
            <div className="text-center p-8 bg-[#162032] border border-white/10 rounded-3xl shadow-2xl">
              <AlertTriangle className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Google Maps Key Required</h2>
              <p className="text-sm text-gray-400">Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.</p>
            </div>
          </div>
        ) : (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultCenter={{ lat: 31.4800, lng: 74.3200 }} // 🚀 Shifted center slightly south to balance the view
              defaultZoom={10.8} // 🚀 Zoomed out for a beautiful macro view
              minZoom={10}       // 🚀 Allows users to zoom out more before stopping
              maxZoom={16}
              restriction={{
                latLngBounds: LAHORE_BOUNDS,
                strictBounds: false, // 🚀 FIX: Changes rigid wall to a smooth, premium "bounce back" effect
              }}
              gestureHandling={"greedy"}
              disableDefaultUI={true}
              styles={darkModeStyles}
            >
              {geoData && <PredictiveHeatmapLayer data={geoData} />}
            </Map>
          </APIProvider>
        )}

        {/* AI INSIGHTS SIDEBAR */}
        <div className="absolute top-24 right-6 w-80 bg-brand-dark/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-40 pointer-events-auto flex flex-col max-h-[calc(100vh-120px)]">
          
          <div className="mb-4 shrink-0">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-ai-light" /> AI Market Intel
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              AI Analyzing LDA master plans, Ring Road expansions, and historical inflation data.
            </p>
          </div>

          {/* SCROLLABLE LIST CONTAINER FOR TOP 8 */}
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-2 custom-scrollbar flex-1">
            
            {/* 1. RUDA */}
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-red-400 tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3" /> RUDA Waterfront</span>
                <span className="text-[10px] font-bold text-white bg-red-500/20 px-2 py-0.5 rounded-full">94%</span>
              </div>
              <p className="text-[11px] text-gray-300">Extreme growth anticipated. Expected ROI: +120% by 2028.</p>
            </div>

            {/* 2. DHA Phase 9 */}
            <div className="bg-gold/10 border border-gold/30 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-gold tracking-widest flex items-center gap-1"><Layers className="w-3 h-3" /> DHA Phase 9 Prism</span>
                <span className="text-[10px] font-bold text-white bg-gold/20 px-2 py-0.5 rounded-full">88%</span>
              </div>
              <p className="text-[11px] text-gray-300">Ring Road SL-3 connectivity driving immediate capital influx.</p>
            </div>

            {/* 3. Lahore Smart City */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-1"><Compass className="w-3 h-3" /> Lahore Smart City</span>
                <span className="text-[10px] font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded-full">82%</span>
              </div>
              <p className="text-[11px] text-gray-300">Motorway access and fast-tracked commercial zones ensuring steady appreciation.</p>
            </div>

            {/* 4. Bahria Orchard */}
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3" /> Bahria Orchard Ph 4</span>
                <span className="text-[10px] font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded-full">76%</span>
              </div>
              <p className="text-[11px] text-gray-300">High trade volume. Population shift triggering rising plot valuations.</p>
            </div>

            {/* 5. Al Kabir Town */}
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-1"><Briefcase className="w-3 h-3" /> Al Kabir Town</span>
                <span className="text-[10px] font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded-full">71%</span>
              </div>
              <p className="text-[11px] text-gray-300">Excellent liquidity in the low-budget category. Fast flipping potential.</p>
            </div>

            {/* 6. DHA Phase 7 */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest flex items-center gap-1"><Building className="w-3 h-3" /> DHA Phase 7</span>
                <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">65%</span>
              </div>
              <p className="text-[11px] text-gray-400">Maturing infrastructure. Safe haven for steady, low-risk long term holding.</p>
            </div>

            {/* 7. Central Gulberg */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest flex items-center gap-1"><Activity className="w-3 h-3" /> Central Gulberg</span>
                <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">45%</span>
              </div>
              <p className="text-[11px] text-gray-400">Capital saturated. AI advises shifting investment to vertical rental yields.</p>
            </div>

            {/* 8. Bahria Town Sector F */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3" /> Bahria Sector F</span>
                <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">41%</span>
              </div>
              <p className="text-[11px] text-gray-400">Slower development pace. Best suited for end-users rather than investors.</p>
            </div>

          </div>

          <button className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] uppercase tracking-wider font-black rounded-xl transition-colors shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Download Full Audit Report
          </button>
        </div>
      </div>
    </div>
  );
}