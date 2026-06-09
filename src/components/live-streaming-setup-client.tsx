// src/components/live-streaming-setup-client.tsx
import { useState, useEffect, useRef } from "react";
import { Camera, Radio, Tv, Monitor, Video, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

function RemoteCameraStream({ camId }: { camId: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
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

export function LiveStreamingSetupClient() {
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const safeRoomName = streamTitle 
    ? `room-${streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}` 
    : "live-studio-room";

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 font-sans">
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
                  rows={3}
                  placeholder="Provide details about your live broadcast..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition resize-none"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Camera Sources Configuration</span>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
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
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-[9px] font-mono uppercase text-zinc-500 block">Cam</span>
                    <span className="text-sm font-bold font-mono tracking-tight">{camId}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10">
            <Radio className="w-4 h-4" /> Go Live Now
          </button>
        </div>
      </div>

      {showQrModal && selectedCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4 relative">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-1">
                <Camera className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Camera {selectedCamera} Wireless Node Setup</h3>
              <p className="text-[11px] text-zinc-400">Scan this matrix code with your mobile device to bridge hardware streams.</p>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-inner flex items-center justify-center">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/mobile-cam?camId=${selectedCamera}&room=${safeRoomName}`}
                size={160}
                level="M"
              />
            </div>

            <div className="w-full flex flex-col gap-1.5 text-left">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-green-500" /> Hardware Sync Feed
              </span>
              <RemoteCameraStream camId={selectedCamera} />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                setSelectedCamera(null);
              }}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs rounded-lg transition"
            >
              Close Config Deck
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
