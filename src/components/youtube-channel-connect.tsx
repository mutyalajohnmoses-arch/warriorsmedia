import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  Youtube,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  exchangeOAuthCode,
  getYouTubeChannelInfo,
  getYouTubeLatestVideos,
  getYouTubeLiveStreamStatus,
  type YouTubeChannelInfo,
} from "@/lib/youtube-oauth.functions";
import {
  saveYouTubeChannel,
  saveYouTubeVideos,
} from "@/lib/youtube-persistence.functions";

interface YouTubeChannelConnectProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: (channelInfo: YouTubeChannelInfo) => void;
}

export function YouTubeChannelConnect({ isOpen, onOpenChange, onConnected }: YouTubeChannelConnectProps) {
  const [step, setStep] = useState<"connect" | "loading" | "connected">("connect");
  const [connecting, setConnecting] = useState(false);

  const exchangeCodeFn = useServerFn(exchangeOAuthCode);
  const getChannelInfoFn = useServerFn(getYouTubeChannelInfo);
  const getVideosFn = useServerFn(getYouTubeLatestVideos);
  const getLiveStatusFn = useServerFn(getYouTubeLiveStreamStatus);
  const saveChannelFn = useServerFn(saveYouTubeChannel);
  const saveVideosFn = useServerFn(saveYouTubeVideos);

  const handleConnectClick = () => {
    const clientId = "796816914839-v0t7t9rd8vtcgns4pi6vq33sfkf44dvq.apps.googleusercontent.com";
    const redirectUri = "https://warriorsmedia.lovable.app/auth/google/callback";
    const scopes = [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    sessionStorage.setItem("youtube_oauth_redirect", redirectUri);

    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const popup = window.open(
      authUrl.toString(),
      "youtube-oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      toast.error("Failed to open OAuth window. Please check your popup blocker.");
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "youtube-oauth-code") {
        window.removeEventListener("message", handleMessage);
        popup.close();

        setConnecting(true);
        setStep("loading");

        try {
          const tokens = await exchangeCodeFn({
            data: {
              code: event.data.code,
              redirectUri: redirectUri,
            },
          });

          localStorage.setItem("youtube_access_token", tokens.access_token);
          if (tokens.refresh_token) {
            localStorage.setItem("youtube_refresh_token", tokens.refresh_token);
          }
          localStorage.setItem("youtube_token_expires", String(Date.now() + tokens.expires_in * 1000));

          const info = await getChannelInfoFn({ data: { access_token: tokens.access_token } });
          const videos = await getVideosFn({ data: { access_token: tokens.access_token, maxResults: 5 } });

          try {
            await getLiveStatusFn({ data: { access_token: tokens.access_token } });
          } catch {
            // Ignore live status errors
          }

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user.id) {
            try {
              const saveResult = await saveChannelFn({
                data: {
                  userId: session.user.id,
                  channelInfo: info,
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                },
              });

              if (saveResult.channelId) {
                await saveVideosFn({
                  data: {
                    channelId: saveResult.channelId,
                    videos: videos,
                  },
                });
              }
            } catch (persistError) {
              console.error("Failed to persist YouTube data:", persistError);
            }
          }

          setStep("connected");
          toast.success("YouTube channel connected successfully!");
          
          // Trigger immediate refresh of parent components
          if (onConnected) onConnected(info);
          onOpenChange(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to connect YouTube channel");
          setStep("connect");
        } finally {
          setConnecting(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    setTimeout(() => {
      window.removeEventListener("message", handleMessage);
    }, 10 * 60 * 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {step === "connect" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                Connect YouTube Channel
              </DialogTitle>
              <DialogDescription>
                Sign in with your Google account to access YouTube channel analytics, upload videos, and manage live streams.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[color:var(--gold)]/30 bg-card/40">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-2">What you'll get:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>✓ View channel analytics and statistics</li>
                      <li>✓ See your latest uploaded videos</li>
                      <li>✓ Check live stream status</li>
                      <li>✓ Manage channel from one dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={handleConnectClick}
                disabled={connecting}
                className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4" />
                    Connect with Google
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === "loading" && (
          <>
            <DialogHeader>
              <DialogTitle>Connecting YouTube Channel</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[color:var(--gold)]" />
              <p className="text-sm text-muted-foreground">Fetching your channel information...</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
