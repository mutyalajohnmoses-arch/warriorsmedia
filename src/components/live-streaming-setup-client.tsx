
// src/components/live-streaming-setup-client.tsx
import { useState, useEffect, useRef } from "react";
import { Camera, Radio, Tv, Monitor, Video, ShieldCheck, ImageIcon, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

// సర్వర్-సైడ్ బిల్డ్ క్రాష్ అవ్వకుండా ఉండటానికి క్లయింట్-సైడ్ సేఫ్ QR కాంపోనెంట్
function SafeClientQRCode({ value, size }: { value: string; size: number }) {
  const [QRComponent, setQRComponent] = useState<any>(null);

  useEffect(() => {
    // బ్రౌజర్‌లో మాత్రమే ఈ లైబ్రరీని డైనమిక్‌గా ఇంపోర్ట్ చేస్తుంది
    import("qrcode.react").then((mod) => {
      setQRComponent(() => mod.QRCodeSVG);
    });
  }, []);

  if (!QRComponent) {
    return (
      <div className="w-[160px] h-[160px] bg-zinc-900 animate-pulse rounded flex items-center justify-center text-[10px] text-zinc-500">
        Generating Matrix...
      </div>
    );
  }

  const Component = QRComponent;
  return <Component value={value} size={size} level="M" />;
}

// వైర్‌లెస్ కెమెరా ఫీడ్ హ్యాండ్‌షేక్ ప్రివ్యూ
function RemoteCameraStream({ camId }: { camId: number }) {
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLinked(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [camId]);

  return (
    <div className="w-full aspect-video bg-[#121212] border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center relative">
      {isLinked ? (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-xs text-green-400 font-mono">
          <div className="text-center">
            <span className="w-2 h-2 inline-block rounded-full bg-green-500 animate-pulse mr-2" />
            Cam {camId} Live Stream Active
          </div>
        </div>
      ) : (
        <div className="text-zinc-600 text-xs p-4 flex flex-col items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mb-1" />
          <p className="font-medium text-[11px] text-zinc-400">Waiting for device handshake...</p>
        </div>
      )}
    </div>
  );
}

// మెయిన్ స్టూడియో సెటప్ UI కాంపోనెంట్
export function LiveStreamingSetupClient() {
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [thumbnailMode, setThumbnailMode] = useState<"manual" | "ai">("manual");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const safeRoomName = streamTitle 
    ? `room-${streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}` 
    : "live-studio-room";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      toast.success("Image selected successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Tv className="w-6 h-6 text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Advanced Broadcaster Studio</h1>
            <p className="text-xs text-zinc-400">Multi-cam production control deck</p>
          </div>
        </div>
        <button className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5" /> Initialize Monitors
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANELS: MONITOR LAYOUT */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider w-fit">
                Preview (Green Room)
              </span>
              <div className="aspect-video bg-black rounded-lg border border-zinc-900 flex flex-col items-center justify-center text-zinc-600 text-xs gap-2">
                <Video className="w-8 h-8 text-zinc-800" />
                <span>Monitor offline</span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider w-fit">
                Program (Live Feed)
              </span>
              <div className="aspect-video bg-black rounded-lg border border-zinc-900 flex flex-col items-center justify-center text-zinc-600 text-xs gap-2">
                <Radio className="w-8 h-8 text-zinc-800" />
                <span>Monitor offline</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 flex items-center gap-6 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Camera Hardware: <span className="text-zinc-400">Not Detected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Audio Hardware: <span className="text-zinc-400">Not Detected</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CONFIGURATIONS */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl flex flex-col gap-5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 font-mono">Stream Configuration</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Broadcast Title</label>
                <input
                  type="text"
                  placeholder="e.g., Sunday Worship Live Stream"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide details about your live broadcast..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition resize-none"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* DUAL AI/MANUAL THUMBNAIL MODULE */}
          <div className="border border-[#2f2f2f] rounded-lg p-3 bg-[#111113] flex flex
