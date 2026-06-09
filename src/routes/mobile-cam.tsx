import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/mobile-cam")({
  component: MobileCamPage,
});

function MobileCamPage() {
  const searchParams = Route.useSearch() as { camId?: string; room?: string; token?: string };
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        // మొబైల్ వెనుక కెమెరా (Back Camera) ని యాక్సెస్ చేయడానికి
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, 
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-sm font-bold mb-2">Camera Node {searchParams.camId || "#"} Connected</h2>
      <div className="w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden max-w-md">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>
      <p className="text-xs text-zinc-500 mt-2">Streaming data to LiveKit Room: {searchParams.room}</p>
    </div>
  );
}
