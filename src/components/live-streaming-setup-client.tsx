
// src/components/live-streaming-setup-client.tsx
import { useState, useEffect } from "react";
import { Camera, Radio, Tv, Monitor, Video, ImageIcon, Upload, Sparkles, Copy, Check, Power, X, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function MobileCameraPreviewPlayer({ roomName, isActive }: { roomName: string; isActive: boolean }) {
  if (!isActive) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center text-zinc-600 text-xs gap-2">
        <Video className="w-8 h-8 text-zinc-800" />
        <span className="font-mono text-zinc-500">Waiting for Mobile QR Scan...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
      {/* మొబైల్ ఫీడ్‌ని సిమ్యులేట్ చేయడానికి డెమో వీడియో ప్లేయర్ */}
      <video 
        src="https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-smartphone-close-up-40033-large.mp4"
        autoPlay 
        playsInline 
        muted 
        loop
        className="w-full h-full object-cover" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded animate-pulse uppercase tracking-wider">
            REMOTE LIVE
          </span>
          <span className="text-[9px] bg-black/60 text-zinc-300 font-mono px-1.5 py-0.5 rounded border border-zinc-700">
            Mobile Node
          </span>
        </div>
        <div className="font-mono text-left">
          <p className="text-white text-[11px] font-sans font-bold uppercase tracking-wide">Mobile Camera Connected</p>
          <p className="text-green-400 text-[10px] mt-0.5">Room: {roomName}</p>
        </div>
      </div>
    </div>
  );
}

export function LiveStreamingSetupClient() {
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [thumbnailMode, setThumbnailMode] = useState<"manual" | "ai">("manual");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [connectionStatus, setConnectionStatus] = useState<"offline" | "waiting" | "connected">("offline");
  const [copied, setCopied] = useState(false);

  const safeRoomName = streamTitle 
    ? `room-${streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}` 
    : "live-studio-room";

  const targetMobileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/mobile-cam?camId=${selectedCamera || 1}&room=${safeRoomName}`
    : "";

  useEffect(() => {
    if (showQrModal && selectedCamera && connectionStatus !== "connected") {
      setConnectionStatus("waiting");
    }
  }, [showQrModal, selectedCamera]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      toast.success("Image selected successfully!");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(targetMobileUrl);
      setCopied(true);
      toast.success("Streaming link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // బటన్ క్లిక్ చేయగానే మోడల్ బాక్స్ క్లోజ్ అయ్యి స్క్రీన్ వెనకాల ఫీడ్ యాక్టివేట్ అవుతుంది
  const simulateMobileConnection = () => {
    setConnectionStatus("connected");
    toast.success(`Camera Node ${selectedCamera} Connected!`);
    setShowQrModal(false); // మోడల్‌ని వెంటనే క్లోజ్ చేస్తున్నాం
  };

  const qrCodeUrl = selectedCamera
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(targetMobileUrl)}`
    : "";

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 font-sans">
      
      {/* HEADER */}
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
        
        {/* LEFT PANELS */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* PREVIEW BOX */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider w-fit">
                Preview (Green Room)
              </span>
              <div className="aspect-video w-full">
                <MobileCameraPreviewPlayer roomName={safeRoomName} isActive={connectionStatus === "connected"} />
              </div>
            </div>

            {/* PROGRAM BOX */}
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

          {/* STATUS BAR */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === "connected" ? "bg-green-500" : connectionStatus === "waiting" ? "bg-amber-500 animate-pulse" : "bg-red-500"
              }`} />
              Hardware Sync:{" "}
              <span className="text-zinc-400">
                {connectionStatus === "connected" 
                  ? "Wireless Mobile Camera Node Active" 
                  : connectionStatus === "waiting" 
                  ? "Waiting for response..." 
                  : "Waiting for Node..."}
              </span>
            </div>
            {connectionStatus !== "offline" && (
              <button 
                onClick={() => {
                  setConnectionStatus("offline");
                  toast.error("Camera Node Disconnected.");
                }}
                className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded flex items-center gap-1 transition"
              >
                <Power className="w-2.5 h-2.5" /> Disconnect Node
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
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

          {/* THUMBNAIL CONFIG */}
          <div className="border border-[#2f2f2f] rounded-lg p-3 bg-[#111113] flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Thumbnail Config
              </span>
              <div className="flex bg-black p-0.5 rounded border border-zinc-800">
                <button type="button" onClick={() => setThumbnailMode("manual")} className={`px-2 py-0.5 text-[10px] rounded ${thumbnailMode === "manual" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}>Manual</button>
                <button type="button" onClick={() => setThumbnailMode("ai")} className={`px-2 py-0.5 text-[10px] rounded ${thumbnailMode === "ai" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}>AI Create</button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2.5 items-center">
              <div className="col-span-5 aspect-video bg-black border border-zinc-800 rounded flex items-center justify-center overflow-hidden">
                {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <span className="text-[9px] text-zinc-600">No Asset</span>}
              </div>
              <div className="col-span-7">
                {thumbnailMode === "manual" ? (
                  <label className="w-full py-2 bg-zinc-900 border border-dashed border-zinc-700 rounded flex items-center justify-center gap-1.5 text-[11px] cursor-pointer hover:text-white text-zinc-400">
                    <Upload className="w-3 h-3" /> Upload File
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <input type="text" placeholder="Prompt Context" className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-[11px]" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                    <button type="button" onClick={() => {
                      const tid = toast.loading("Generating AI Image...");
                      setTimeout(() => {
                        setPreviewUrl(`https://image.pollinations.ai/p/${encodeURIComponent(aiPrompt || "studio")}?width=1280&height=720&seed=${Math.floor(Math.random()*1000)}&nologo=true`);
                        toast.success("AI Asset Ready!", {id: tid});
                      }, 1200);
                    }} className="w-full py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-medium text-[11px] rounded border border-emerald-600/20 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> Generate AI
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CAMERA SOURCES */}
          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Camera Sources Configuration</span>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {Array.from({ length: 20 }, (_, i) => {
                const camId = i + 1;
                const isSelected = selectedCamera === camId;
                return (
                  <button
                    key={camId}
                    type="button"
                    onClick={() => {
                      setSelectedCamera(camId);
                      setShowQrModal(true);
                    }}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-[9px] font-mono uppercase text-zinc-500 block">Cam</span>
                    <span className="text-sm font-bold font-mono tracking-tight">{camId}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2">
            <Radio className="w-4 h-4" /> Go Live Now
          </button>
        </div>
      </div>

      {/* QR MODAL */}
      {showQrModal && selectedCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4 relative">
            
            <button 
              onClick={() => {
                setShowQrModal(false);
                setSelectedCamera(null);
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-white">Camera {selectedCamera} Setup</h3>
              <p className="text-[11px] text-zinc-400">Scan code or open link on mobile to initialize feed.</p>
            </div>

            {/* QR CODE BOX */}
            <div className="bg-white p-3 rounded-lg flex items-center justify-center">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-[160px] h-[160px]" />}
            </div>

            {/* STREAM LINK */}
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex items-center justify-between gap-2">
              <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[240px] text-left">
                {targetMobileUrl}
              </p>
              <button 
                onClick={copyToClipboard}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition flex items-center justify-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* CONNECTION STATUS */}
            <div className="w-full border-t border-zinc-800 pt-3 flex flex-col gap-2">
              
              {connectionStatus === "waiting" && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold font-mono w-full">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                    Waiting for response...
                  </div>
                  
                  {/* ఈ బటన్ క్లిక్ చేయగానే కనెక్షన్ యాక్టివేట్ అయ్యి మోడల్ క్లోజ్ అవుతుంది */}
                  <button
                    type="button"
                    onClick={simulateMobileConnection}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Simulate Mobile Connection
                  </button>
                </div>
              )}

              {connectionStatus === "connected" && (
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-semibold font-mono w-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Connected Successfully
                </div>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  setSelectedCamera(null);
                  setConnectionStatus("offline");
                  toast.error(`Camera ${selectedCamera} Node Disconnected.`);
                }}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-zinc-800 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 mt-1"
              >
                <Power className="w-3 h-3" /> Disconnect Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
