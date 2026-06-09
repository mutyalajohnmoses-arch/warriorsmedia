import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";
import { Video, VideoOff, Smartphone, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Query parameters capture schema define cheyali
export const Route = createFileRoute("/mobile-cam")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      camId: (search.camId as string) || "1",
      room: (search.room as string) || "studio-cam-1",
    };
  },
});

export default function MobileCameraStreamPage() {
  const { camId, room: roomName } = useSearch({ from: "/mobile-cam" });
  
  const [permissionStatus, setPermissionStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 1. Hardware Camera Stream Permissions Auto-Trigger
  useEffect(() => {
    async function initMobileCamera() {
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Production stream kabatti back/rear camera context default load avthundi
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true // micro phone track configuration
        });

        mediaStreamRef.current = stream;
        setPermissionStatus("granted");
        setIsStreaming(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Feedback loop wrap control loop control validation
          await localVideoRef.current.play();
        }
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setPermissionStatus("denied");
        setStreamError(err?.message || "Could not access hardware camera devices.");
        toast.error("Please grant camera permissions and use HTTPS terminal.");
      }
    }

    initMobileCamera();

    // Cleanup tracks on unmount context frame stability
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [camId]);

  return (
    <div className="fixed inset-0 bg-[#09090b] text-zinc-100 flex flex-col justify-between p-4 font-sans select-none">
      
      {/* Top Floating Badge Header Controls */}
      <div className="flex justify-between items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isStreaming ? "bg-red-500 animate-pulse" : "bg-zinc-600"}`} />
          <div>
            <h2 className="text-sm font-bold text-zinc-200">WIRELESS NODE: CAM {camId}</h2>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wide">Target: {roomName}</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono uppercase">
          Local Link
        </div>
      </div>

      {/* Main Stream Hardware Monitor Viewframe Container */}
      <div className="absolute inset-0 w-full h-full z-0 bg-black flex items-center justify-center overflow-hidden">
        <video 
          ref={localVideoRef} 
          playsInline 
          webkit-playsinline="true"
          className="w-full h-full object-cover transform scale-x-100"
        />

        {/* State Context Render Condition Overlays */}
        {permissionStatus === "pending" && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-20">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-sm font-medium">Requesting Hardware Secure Camera Link...</p>
          </div>
        )}

        {permissionStatus === "denied" && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-20">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-zinc-200">Permission Blocked</h3>
            <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-4">{streamError}</p>
            <p className="text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
              *Mobile browsers require secure <b>HTTPS://</b> tunnels or local validation mapping overrides to execute video capturing.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Control Actions Dynamic Controls Dashboard */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center backdrop-blur-md z-10 space-y-3">
        <div className="flex justify-around items-center text-xs">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Device Feed</span>
            <span className="text-green-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Broadcasting Live
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Battery Save</span>
            <span className="text-zinc-400 font-mono font-medium">Do Not Lock Screen</span>
          </div>
        </div>
      </div>

    </div>
  );
}
