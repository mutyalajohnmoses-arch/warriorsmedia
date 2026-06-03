
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  Tv,
  Link2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Wand2,
  Layers
} from "lucide-react";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import {
  generateLiveKitToken,
  createYouTubeLivePipeline,
  startLiveKitEgress,
  stopLiveKitEgress,
  generateAIThumbnailServerFn // Real server function imported here
} from "@/lib/live-actions.functions";
import { getOrRefreshYouTubeToken } from "@/lib/youtube-token-manager.functions";

export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

function LiveStreamingSetupPage() {
  const navigate = useNavigate();

  // YouTube States
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isYouTubeLinked, setIsYouTubeLinked] = useState<boolean>(false);
  const [isCheckingChannel, setIsCheckingChannel] = useState<boolean>(true);

  // Thumbnail States
  const [thumbnailMode, setThumbnailMode] = useState<"manual" | "ai">("manual");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null); // Optional AI reference image state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [freeAiPrompt, setFreeAiPrompt] = useState("");
  const [isGeneratingFree, setIsGeneratingFree] = useState(false);

  // Connection Pipelines
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEgressActive, setIsEgressActive] = useState(false); 
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [currentEgressId, setCurrentEgressId] = useState<string | null>(null);
  const [generatedRtmpUrl, setGeneratedRtmpUrl] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("Host");
  const videoRef = useRef<HTMLVideoElement>(null);

  const generateTokenFn = useServerFn(generateLiveKitToken);
  const createYouTubePipelineFn = useServerFn(createYouTubeLivePipeline);
  const startEgressFn = useServerFn(startLiveKitEgress);
  const stopEgressFn = useServerFn(stopLiveKitEgress);
  const generateAIThumbnailFn = useServerFn(generateAIThumbnailServerFn); // Hook initialization

  const safeRoomName = streamTitle ? `room-${streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "live-studio-room";

  const { room, isConnected, error, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: liveKitUrl || "",
    token: liveKitToken || "",
    roomName: safeRoomName,
    onConnected: () => {
      toast.info("LiveKit Studio Connected. Launching Egress pipeline...");
    },
    onDisconnected: () => {
      setIsConnecting(false);
      setIsEgressActive(false);
      setCurrentEgressId(null);
      setGeneratedRtmpUrl(null);
    },
    onError: (err) => {
      setIsConnecting(false);
      toast.error(`Studio Error: ${err.message}`);
    },
  });

  const fetchYouTubeFn = useServerFn(getOrRefreshYouTubeToken);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setIsCheckingChannel(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle();
        if (profile?.full_name && !cancelled) setParticipantName(profile.full_name);

        const { data: channel } = await supabase
          .from("youtube_channels")
          .select("id, is_connected")
          .eq("user_id", session.user.id)
          .eq("is_connected", true)
          .maybeSingle();

        if (channel && !cancelled) {
          setIsYouTubeLinked(true);
          try {
            const tok = await fetchYouTubeFn({ data: { userId: session.user.id } });
            if (!cancelled) setGoogleToken(tok.access_token);
          } catch (err: any) {
            console.error("[live-streaming-setup] token fetch failed", err);
            if (!cancelled) {
              toast.error("YouTube token refresh failed. Please reconnect your channel from the dashboard.");
            }
          }
        }
      } finally {
        if (!cancelled) setIsCheckingChannel(false);
      }
    };
    checkSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!room || !isConnected || !generatedRtmpUrl || currentEgressId || isEgressActive) return;

    const pipelineExecution = async () => {
      try {
        setIsConnecting(true);
        const tId = toast.loading("Connecting live stream to YouTube...");
        
        const res = await startEgressFn({
          data: { roomName: safeRoomName, youtubeRtmpUrl: generatedRtmpUrl }
        });

        if (res?.egressId) {
          setCurrentEgressId(res.egressId);
          setIsEgressActive(true);
          toast.success("SUCCESS: Your stream is now live on YouTube!", { id: tId });
        }
      } catch (err: any) {
        toast.error(`Egress pipeline failed: ${err.message}`);
      } finally {
        setIsConnecting(false);
      }
    };

    if ((room.localParticipant?.videoTrackPublications.size ?? 0) > 0) {
      pipelineExecution();
    } else {
      room.once(RoomEvent.LocalTrackPublished, () => {
        setTimeout(pipelineExecution, 1000);
      });
    }
  }, [isConnected, room, generatedRtmpUrl, safeRoomName, currentEgressId, isEgressActive]);

  useEffect(() => {
    if (liveKitToken && liveKitUrl && !isConnected) {
      connect();
    }
  }, [liveKitToken, liveKitUrl, isConnected, connect]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success("Thumbnail image selected successfully!");
    }
  };

  // Function to handle optional AI reference photo
  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReferenceFile(e.target.files[0]);
      toast.success("AI reference photo attached successfully!");
    }
  };

  // Helper function to convert image file to Base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Replaced old simulation code with real OpenAI API caller logic
  const handleGenerateAIThumbnail = async () => {
    const promptToUse = aiPrompt.trim() || streamTitle.trim();
    if (!promptToUse) {
      toast.error("Please enter a Stream Title or Custom Prompt to create an AI Thumbnail.");
      return;
    }

    setIsGeneratingAI(true);
    setPremiumError(null);
    const toastId = toast.loading("Generating AI Thumbnail...");
    console.log("[AI Thumbnail] Starting generation", { promptToUse, streamTitle, hasRef: !!referenceFile });

    try {
      let baseImageB64: string | null = null;
      if (referenceFile) {
        baseImageB64 = await fileToBase64(referenceFile);
      }

      // Backend server function execution
      const res = await generateAIThumbnailFn({
        data: {
          prompt: promptToUse,
          streamTitle: streamTitle,
          baseImageB64: baseImageB64,
        },
      });

      console.log("[AI Thumbnail] Server response:", res);

      if (res?.imageUrl) {
        setPreviewUrl(res.imageUrl);
        toast.success("AI Thumbnail generated successfully!", { id: toastId });
      } else {
        console.error("[AI Thumbnail] Empty imageUrl in response", res);
        toast.error("AI Generation Failed: No image URL was returned from the server.", { id: toastId });
      }
    } catch (err: any) {
      console.error("[AI Thumbnail] Generation error:", err);
      const raw = String(err?.message || err || "Unknown error");
      const lower = raw.toLowerCase();

      let friendly = raw;
      if (lower.includes("quota") || lower.includes("insufficient_quota")) {
        friendly = "OpenAI quota exceeded. Please check your OpenAI plan and billing.";
      } else if (lower.includes("billing") || lower.includes("payment")) {
        friendly = "OpenAI billing issue. Add a valid payment method to your OpenAI account.";
      } else if (lower.includes("rate") && lower.includes("limit")) {
        friendly = "OpenAI rate limit hit. Please wait a moment and try again.";
      } else if (lower.includes("timeout") || lower.includes("etimedout") || lower.includes("network")) {
        friendly = "Network timeout reaching OpenAI. Please try again.";
      } else if (lower.includes("content_policy") || lower.includes("safety")) {
        friendly = "Prompt was rejected by OpenAI's content policy. Try rephrasing.";
      } else if (lower.includes("openai_api_key") || lower.includes("missing openai")) {
        friendly = "Server is missing OPENAI_API_KEY. Add it in project secrets.";
      }

      if (
        lower.includes("quota") ||
        lower.includes("billing") ||
        lower.includes("payment") ||
        lower.includes("insufficient")
      ) {
        setPremiumError(
          "⚠️ You need to add some money for premium AI creation. Please check your OpenAI account balance or contact support team at support@warriorsmedia.com"
        );
      }

      toast.error(`AI Generation Failed: ${friendly}`, { id: toastId });
    } finally {
      setIsGeneratingAI(false);
    }
  };


  const handleStartFullPipeline = async () => {
    if (!googleToken) {
      toast.error("Please log in with Google first.");
      return;
    }
    if (!streamTitle) {
      toast.error("Please enter a Stream Title.");
      return;
    }

    setIsConnecting(true);
    try {
      const ytId = toast.loading("Creating YouTube Broadcast & Stream...");
      const ytPipeline = await createYouTubePipelineFn({
        data: { accessToken: googleToken, title: streamTitle, description: streamDescription, privacy: privacyStatus }
      });

      if (!ytPipeline?.youtubeRtmpUrl) {
        throw new Error("Could not fetch RTMP endpoints from YouTube API.");
      }
      setGeneratedRtmpUrl(ytPipeline.youtubeRtmpUrl);
      toast.success("YouTube RTMP URL received successfully!", { id: ytId });

      const tokenResponse = await generateTokenFn({
        data: { roomName: safeRoomName, participantName },
      });

      if (tokenResponse?.token && tokenResponse?.url) {
        setLiveKitToken(tokenResponse.token);
        setLiveKitUrl(tokenResponse.url);
      }
    } catch (err: any) {
      toast.error(`Pipeline Failed: ${err.message}`);
      setIsConnecting(false);
    }
  };

  const handleStopPipeline = async () => {
    setIsConnecting(true);
    try {
      if (currentEgressId) {
        await stopEgressFn({ data: { egressId: currentEgressId } });
      }
    } catch (e) {
      console.error(e);
    }
    if (isConnected) {
      await disconnect();
    }
    setLiveKitToken(null);
    setLiveKitUrl(null);
    setCurrentEgressId(null);
    setGeneratedRtmpUrl(null);
    setIsEgressActive(false);
    setIsConnecting(false);
    toast.success("Streaming Studio Session Closed.");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col lg:flex-row p-6 gap-6">
      
      <div className="w-full lg:w-5/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#2f2f2f] pb-3">
          <Tv className="text-red-500 w-5 h-5" />
          <h2 className="text-lg font-bold tracking-wide">YouTube Live Automations</h2>
        </div>

        {isCheckingChannel ? (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-gray-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking YouTube connection…
          </div>
        ) : isYouTubeLinked && googleToken ? (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>YouTube Channel Connected — ready to stream</span>
          </div>
        ) : isYouTubeLinked && !googleToken ? (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <span>Token expired. Please reconnect from the dashboard to refresh.</span>
          </div>
        ) : (
          <Link
            to="/dashboard"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition"
          >
            <Link2 className="w-4 h-4" /> Connect YouTube Channel in Dashboard
          </Link>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Stream Title (YouTube)</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Enter live video event title"
              className="w-full bg-[#121212] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none text-white"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              disabled={isConnected}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="Describe what this live stream is about..."
            className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-red-500 outline-none resize-none text-white"
            value={streamDescription}
            onChange={(e) => setStreamDescription(e.target.value)}
            disabled={isConnected}
          />
        </div>

        {/* --- BRAND NEW THUMBNAIL MODULE --- */}
        <div className="border border-[#2f2f2f] rounded-lg p-4 bg-[#161616] flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#2f2f2f] pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
              <ImageIcon className="w-4 h-4 text-red-400" />
              <span>Video Thumbnail Configuration</span>
            </div>
            <div className="flex bg-[#121212] p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => setThumbnailMode("manual")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition flex items-center gap-1 ${thumbnailMode === "manual" ? "bg-zinc-800 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
              >
                <Upload className="w-3 h-3" /> Manual
              </button>
              <button
                type="button"
                onClick={() => setThumbnailMode("ai")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition flex items-center gap-1 ${thumbnailMode === "ai" ? "bg-zinc-800 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" /> AI Create
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5 aspect-video bg-[#121212] border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden relative group">
              {previewUrl ? (
                <img src={previewUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-600 font-medium text-center p-2">No preview asset specified</span>
              )}
            </div>

            <div className="sm:col-span-7 flex flex-col gap-2">
              {thumbnailMode === "manual" ? (
                <div>
                  <label className="w-full py-2.5 px-3 bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg flex items-center justify-center gap-2 text-xs font-medium cursor-pointer text-gray-300 hover:text-white transition">
                    <Upload className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isConnected} />
                  </label>
                  <p className="text-[10px] text-zinc-500 mt-1">Recommended size: 1280x720 (16:9 ratio)</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    placeholder="AI Prompt (Optional: defaults to title)"
                    className="w-full bg-[#121212] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-amber-500"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={isConnected || isGeneratingAI}
                  />

                  {/* Reference Image Picker Setup */}
                  <label className="w-full py-1.5 px-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md flex items-center justify-between text-[11px] cursor-pointer text-gray-400 hover:text-white transition">
                    <span className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      {referenceFile ? referenceFile.name : "Attach Reference Photo (Optional)"}
                    </span>
                    <span className="text-[10px] text-amber-500 font-mono bg-amber-500/10 px-1 rounded">Photo AI</span>
                    <input type="file" accept="image/*" onChange={handleReferenceFileChange} className="hidden" disabled={isConnected || isGeneratingAI} />
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateAIThumbnail}
                    disabled={isConnected || isGeneratingAI}
                    className="w-full py-2 px-3 bg-amber-600/10 border border-amber-600/30 hover:bg-amber-600/20 text-amber-400 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Art Asset...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Generate Artwork via AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* --- END OF THUMBNAIL MODULE --- */}

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Privacy Visibility</label>
          <select
            className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none"
            value={privacyStatus}
            onChange={(e) => setPrivacyStatus(e.target.value)}
            disabled={isConnected}
          >
            <option value="public">🌐 Public</option>
            <option value="unlisted">🔗 Unlisted</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>

        {generatedRtmpUrl && (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Auto-Generated Endpoints</p>
            <p className="text-xs text-red-400 font-mono break-all select-all">{generatedRtmpUrl}</p>
          </div>
        )}
      </div>

      <div className="w-full lg:w-7/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4 justify-between">
        <div className="flex items-center justify-between border-b border-[#2f2f2f] pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isEgressActive ? "bg-red-500 animate-pulse" : "bg-gray-600"}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {isEgressActive ? "LIVE TO YOUTUBE" : "STUDIO IDLE"}
            </span>
          </div>
        </div>

        <div className="relative aspect-video bg-black rounded-xl border border-[#2f2f2f] overflow-hidden flex items-center justify-center">
          {isConnecting && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 gap-2 text-xs">
              <Loader2 className="animate-spin text-red-500 w-6 h-6" />
              <p className="text-gray-400 font-medium">Executing Pipeline: Creating YouTube Broadcast & LiveKit Egress...</p>
            </div>
          )}
          {isConnected && !isCameraEnabled && (
            <div className="absolute inset-0 bg-[#121212] flex flex-col items-center justify-center text-gray-500 text-xs gap-1">
              <VideoOff className="w-8 h-8" /> Camera Feed Suspended
            </div>
          )}
          {isConnected && isCameraEnabled && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          )}
          {!isConnected && !isConnecting && (
            <div className="text-center text-gray-600 flex flex-col items-center gap-1.5 text-xs">
              <Radio className="w-10 h-10 text-[#2e2e2e]" />
              <p>Complete configurations to activate pipeline</p>
            </div>
          )}
        </div>

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

        <div>
          {!isConnected ? (
            <button
              onClick={handleStartFullPipeline}
              disabled={isConnecting || !googleToken || !streamTitle}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-2 transition uppercase tracking-wider"
            >
              <Radio className="w-4 h-4" /> Trigger Automation Pipeline
            </button>
          ) : (
            <button
              onClick={handleStopPipeline}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-transparent border border-red-600/40 hover:bg-red-600/10 flex items-center justify-center gap-2 transition uppercase tracking-wider"
            >
              <PowerOff className="w-4 h-4 text-red-500" /> Disconnect Stream
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
            <span>Egress Pipeline running! Data feeding directly into YouTube Live.</span>
          </div>
        )}
      </div>

    </div>
  );
}
