
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";
import { RoomEvent } from "livekit-client";
import { toast } from "sonner";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
  Radio,
  PowerOff,
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Tv,
  Key
} from "lucide-react";

// కరెక్ట్ సర్వర్ యాక్షన్ ఇంపోర్ట్ పాత్ (బిల్డ్ ఎర్రర్‌ను ఫిక్స్ చేస్తుంది)
import { generateLiveKitToken, startLiveKitEgress, stopLiveKitEgress } from "@/server/live-actions.server";

export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

function LiveStreamingSetupPage() {
  const navigate = useNavigate();

  // YouTube Config Form States
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [youtubeStreamKey, setYoutubeStreamKey] = useState("");
  const [streamCategory, setStreamCategory] = useState("22");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // States
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEgressActive, setIsEgressActive] = useState(false); 
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [currentEgressId, setCurrentEgressId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("Host");
  const videoRef = useRef<HTMLVideoElement>(null);

  const generateToken = useServerFn(generateLiveKitToken);
  const startEgress = useServerFn(startLiveKitEgress);
  const stopEgress = useServerFn(stopLiveKitEgress);

  const safeRoomName = streamTitle ? `room-${streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "live-studio-room";

  const { room, isConnected, error, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: liveKitUrl || "",
    token: liveKitToken || "",
    roomName: safeRoomName,
    onConnected: () => {
      toast.info("Studio కి కనెక్ట్ అయింది. కెమెరా ఫీడ్ లోడ్ అవుతోంది...");
    },
    onDisconnected: () => {
      setIsConnecting(false);
      setIsEgressActive(false);
      setCurrentEgressId(null);
      toast.info("Broadcast Studio Session Closed.");
    },
    onError: (err) => {
      setIsConnecting(false);
      toast.error(`LiveKit Error: ${err.message}`);
    },
  });

  // కెమెరా ట్రాక్ పూర్తిగా పబ్లిష్ అయిన తర్వాతే యూట్యూబ్‌కి కనెక్ట్ చేసే లాజిక్
  useEffect(() => {
    if (!room || !isConnected || currentEgressId || isEgressActive) return;

    const triggerYouTubeEgressPipeline = async () => {
      try {
        setIsConnecting(true);
        const toastId = toast.loading("YouTube Live కి స్ట్రీమ్ కనెక్ట్ చేస్తున్నాము...");
        
        const egressResp = await startEgress({
          data: { roomName: safeRoomName, youtubeStreamKey }
        });

        if (egressResp?.egressId) {
          setCurrentEgressId(egressResp.egressId);
          setIsEgressActive(true);
          toast.success("మీరు ఇప్పుడు YouTube లో LIVE లో ఉన్నారు!", { id: toastId });
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`YouTube sync connection failed: ${err.message}`);
      } finally {
        setIsConnecting(false);
      }
    };

    if (room.localParticipant?.isLocalTrackPublished) {
      triggerYouTubeEgressPipeline();
    } else {
      room.once(RoomEvent.LocalTrackPublished, () => {
        setTimeout(triggerYouTubeEgressPipeline, 1000); 
      });
    }
  }, [isConnected, room, safeRoomName, youtubeStreamKey, currentEgressId, isEgressActive]);

  useEffect(() => {
    if (liveKitToken && liveKitUrl && !isConnected) {
      connect();
    }
  }, [liveKitToken, liveKitUrl, isConnected, connect]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle();
        if (data?.full_name) setParticipantName(data.full_name);
      } else {
        navigate({ to: "/" });
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (room && videoRef.current) {
      const localVideoPub = Array.from(room.localParticipant?.videoTrackPublications.values() ?? [])[0];
      const localVideoTrack = localVideoPub?.videoTrack;
      if (localVideoTrack) {
        localVideoTrack.attach(videoRef.current);
        return () => { if (videoRef.current) localVideoTrack.detach(videoRef.current); };
      }
    }
  }, [room, isCameraEnabled]);

  const handleStartBroadcasting = async () => {
    if (!streamTitle || !youtubeStreamKey) {
      toast.error("దయచేసి Stream Title మరియు YouTube Stream Key ఎంటర్ చేయండి.");
      return;
    }

    setIsConnecting(true);
    try {
      const tokenResponse = await generateToken({
        data: { roomName: safeRoomName, participantName },
      });

      if (tokenResponse?.token && tokenResponse?.url) {
        setLiveKitToken(tokenResponse.token);
        setLiveKitUrl(tokenResponse.url);
      }
    } catch (err: any) {
      toast.error(`Studio boot failed: ${err.message}`);
      setIsConnecting(false);
    }
  };

  const handleStopBroadcasting = async () => {
    try {
      if (currentEgressId) {
        await stopEgress({ data: { egressId: currentEgressId } });
      }
    } catch (err) {
      console.error(err);
    }

    if (isConnected) {
      await disconnect();
      setLiveKitToken(null);
      setLiveKitUrl(null);
      setCurrentEgressId(null);
      setIsEgressActive(false);
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col lg:flex-row p-6 gap-6">
      
      {/* LEFT INPUT FORM */}
      <div className="w-full lg:w-5/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#2f2f2f] pb-3">
          <Tv className="text-red-500 w-5 h-5" />
          <h2 className="text-lg font-bold tracking-wide">Stream Configuration</h2>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Stream Title</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="e.g., Live Morning worship"
              className="w-full bg-[#121212] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              disabled={isConnected}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Tell your viewers about this live stream..."
            className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-red-500 outline-none resize-none"
            value={streamDescription}
            onChange={(e) => setStreamDescription(e.target.value)}
            disabled={isConnected}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">YouTube Stream Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="password"
              placeholder="Paste your standard YouTube RTMP Key here"
              className="w-full bg-[#121212] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none"
              value={youtubeStreamKey}
              onChange={(e) => setYoutubeStreamKey(e.target.value)}
              disabled={isConnected}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Category</label>
            <select
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              value={streamCategory}
              onChange={(e) => setStreamCategory(e.target.value)}
              disabled={isConnected}
            >
              <option value="22">People & Blogs</option>
              <option value="29">Nonprofits & Activism</option>
              <option value="10">Music</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Visibility</label>
            <select
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              value={privacyStatus}
              onChange={(e) => setPrivacyStatus(e.target.value)}
              disabled={isConnected}
            >
              <option value="public">🌐 Public</option>
              <option value="unlisted">🔗 Unlisted</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Stream Thumbnail</label>
          <div className="border border-dashed border-[#333] rounded-lg p-3 bg-[#121212] flex flex-col items-center justify-center relative min-h-[90px]">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-gray-500 mb-1" />
                <span className="text-xs text-gray-400">Click to upload banner</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files?.[0]) setThumbnailPreview(URL.createObjectURL(e.target.files[0]));
              }}
              disabled={isConnected}
            />
          </div>
        </div>
      </div>

      {/* RIGHT MONITOR VIEW PANEL */}
      <div className="w-full lg:w-7/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4 justify-between">
        
        <div className="flex items-center justify-between border-b border-[#2f2f2f] pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isEgressActive ? "bg-red-500 animate-pulse" : "bg-gray-600"}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {isEgressActive ? "STUDIO FEED ONLINE (LIVE TO YOUTUBE)" : "STUDIO FEED OFFLINE"}
            </span>
          </div>
        </div>

        <div className="relative aspect-video bg-black rounded-xl border border-[#2f2f2f] overflow-hidden flex items-center justify-center">
          {isConnecting && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 gap-2 text-xs">
              <Loader2 className="animate-spin text-red-500 w-6 h-6" />
              <p className="text-gray-400 font-medium">Synchronizing streaming pipes...</p>
            </div>
          )}
          {isConnected && !isCameraEnabled && (
            <div className="absolute inset-0 bg-[#121212] flex flex-col items-center justify-center text-gray-500 text-xs gap-1">
              <VideoOff className="w-8 h-8" /> Video Track Muted
            </div>
          )}
          {isConnected && isCameraEnabled && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          )}
          {!isConnected && !isConnecting && (
            <div className="text-center text-gray-600 flex flex-col items-center gap-1.5 text-xs">
              <Radio className="w-10 h-10 text-[#2e2e2e]" />
              <p>Configure and click "Start Stream Broadcast" below</p>
            </div>
          )}
        </div>

        {/* HW Toggle Toggles */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => { toggleCameraTrack(!isCameraEnabled); setIsCameraEnabled(!isCameraEnabled); }}
            disabled={!isConnected}
            className={`p-3 rounded-full border transition ${isCameraEnabled ? "border-[#333] text-white" : "bg-red-600/20 border-red-500/40 text-red-500"}`}
          >
            {isCameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { toggleMicTrack(!isMicEnabled); setIsMicEnabled(!isMicEnabled); }}
            disabled={!isConnected}
            className={`p-3 rounded-full border transition ${isMicEnabled ? "border-[#333] text-white" : "bg-red-600/20 border-red-500/40 text-red-500"}`}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Master CTA Operations */}
        <div>
          {!isConnected ? (
            <button
              onClick={handleStartBroadcasting}
              disabled={isConnecting || !streamTitle || !youtubeStreamKey}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-2 transition"
            >
              <Radio className="w-3.5 h-3.5" /> Start Stream Broadcast
            </button>
          ) : (
            <button
              onClick={handleStopBroadcasting}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-transparent border border-red-600/40 hover:bg-red-600/10 flex items-center justify-center gap-2 transition"
            >
              <PowerOff className="w-3.5 h-3.5 text-red-500" /> End Stream Broadcast
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center p-2.5 rounded-lg bg-red-500/10 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}
        {isEgressActive && (
          <div className="flex items-center p-2.5 rounded-lg bg-green-500/10 text-green-400 text-xs">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Stream Key active! Sending video feeds directly to YouTube...</span>
          </div>
        )}
      </div>

    </div>
  );
}
