import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  Youtube,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Users,
  Video,
  Radio,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  exchangeOAuthCode,
  getYouTubeChannelInfo,
  getYouTubeLatestVideos,
  getYouTubeLiveStreamStatus,
  formatNumber,
  formatDuration,
  type YouTubeChannelInfo,
  type YouTubeVideo,
  type YouTubeLiveStreamStatus,
} from "@/lib/youtube-oauth.functions";
import {
  saveYouTubeChannel,
  saveYouTubeVideos,
  disconnectYouTubeChannel,
} from "@/lib/youtube-persistence.functions";

const YOUTUBE_OAUTH_STATE_KEY = "youtube_oauth_state";
const YOUTUBE_CHANNEL_CONNECTED_EVENT = "youtube-channel-connected";

function maskToken(token: string | undefined) {
  if (!token) return { received: false };
  return {
    received: true,
    length: token.length,
    prefix: token.slice(0, 8),
    suffix: token.slice(-4),
  };
}

function encodeOAuthState(state: { nonce: string; openerOrigin: string; redirectUri: string }) {
  return btoa(JSON.stringify(state));
}

function decodeOAuthState(
  value: string | null,
): { nonce: string; openerOrigin: string; redirectUri: string } | null {
  if (!value) return null;

  try {
    return JSON.parse(atob(value));
  } catch (error) {
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      console.error("[YouTubeOAuth] Failed to decode OAuth state", error);
      return null;
    }
  }
}


function publishYouTubeConnected(channelInfo: YouTubeChannelInfo, dbChannelId: string) {
  const payload = {
    channelId: channelInfo.channelId,
    dbChannelId,
    title: channelInfo.title,
    connectedAt: new Date().toISOString(),
  };
  console.log("[YouTubeOAuth] Publishing connected event", payload);
  localStorage.setItem("youtube_channel_connected_at", payload.connectedAt);
  window.dispatchEvent(new CustomEvent(YOUTUBE_CHANNEL_CONNECTED_EVENT, { detail: payload }));
}

interface YouTubeChannelConnectProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: (channelInfo: YouTubeChannelInfo) => void;
}

export function YouTubeChannelConnect({
  isOpen,
  onOpenChange,
  onConnected,
}: YouTubeChannelConnectProps) {
  const [step, setStep] = useState<"connect" | "loading" | "connected">("connect");
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [latestVideos, setLatestVideos] = useState<YouTubeVideo[]>([]);
  const [liveStatus, setLiveStatus] = useState<YouTubeLiveStreamStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dbChannelId, setDbChannelId] = useState<string | null>(null);

  const exchangeCodeFn = useServerFn(exchangeOAuthCode);
  const getChannelInfoFn = useServerFn(getYouTubeChannelInfo);
  const getVideosFn = useServerFn(getYouTubeLatestVideos);
  const getLiveStatusFn = useServerFn(getYouTubeLiveStreamStatus);
  const saveChannelFn = useServerFn(saveYouTubeChannel);
  const saveVideosFn = useServerFn(saveYouTubeVideos);
  const disconnectChannelFn = useServerFn(disconnectYouTubeChannel);

  const handleConnectClick = () => {
    const clientId = "796816914839-v0t7t9rd8vtcgns4pi6vq33sfkf44dvq.apps.googleusercontent.com";
    const redirectUri = new URL("/auth/google/callback", window.location.origin).toString();
    const nonce = crypto.randomUUID();
    const oauthState = { nonce, openerOrigin: window.location.origin, redirectUri };
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
    // Ensure prompt=consent to always get a refresh token on reconnection
    authUrl.searchParams.set("prompt", "consent select_account");
    authUrl.searchParams.set("state", encodeOAuthState(oauthState));

    // Store the redirect URI and nonce for callback verification.
    sessionStorage.setItem("youtube_oauth_redirect", redirectUri);
    sessionStorage.setItem(YOUTUBE_OAUTH_STATE_KEY, JSON.stringify(oauthState));
    console.log("[YouTubeOAuth] Opening OAuth popup", {
      redirectUri,
      openerOrigin: oauthState.openerOrigin,
      nonce,
      scopes,
    });

    // Open OAuth consent screen
    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const popup = window.open(
      authUrl.toString(),
      "youtube-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      toast.error("Failed to open OAuth window. Please check your popup blocker.");
      return;
    }

    // Listen for OAuth code from callback.
    const handleMessage = async (event: MessageEvent) => {
      console.log("[YouTubeOAuth] Message received from origin:", event.origin, "Type:", event.data?.type);
      const expectedCallbackOrigin = new URL(redirectUri).origin;
      // Relaxed origin check: allow both exact match and current window origin
      const isAllowedOrigin = 
        event.origin === expectedCallbackOrigin || 
        event.origin === window.location.origin;

      if (!isAllowedOrigin) {
        console.warn("[YouTubeOAuth] Ignoring OAuth message from unexpected origin", {
          receivedOrigin: event.origin,
          expectedCallbackOrigin,
          windowOrigin: window.location.origin
        });
        return;
      }

      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "youtube-oauth-error") {
        window.removeEventListener("message", handleMessage);
        popup.close();
        console.error("[YouTubeOAuth] OAuth callback returned error", event.data);
        toast.error(event.data.errorDescription || event.data.error || "Google OAuth failed");
        setStep("connect");
        setConnecting(false);
        return;
      }

      if (event.data.type === "youtube-oauth-code") {
        const storedState = decodeOAuthState(sessionStorage.getItem(YOUTUBE_OAUTH_STATE_KEY));
        const returnedState = decodeOAuthState(event.data.state ?? null);
        console.log("[YouTubeOAuth] OAuth callback message received", {
          origin: event.origin,
          hasCode: Boolean(event.data.code),
          returnedState,
          storedState,
        });

        if (!storedState || !returnedState || storedState.nonce !== returnedState.nonce) {
          console.error("[YouTubeOAuth] OAuth state mismatch", { storedState, returnedState });
          toast.error("Google OAuth verification failed. Please try connecting again.");
          return;
        }

        window.removeEventListener("message", handleMessage);
        popup.close();

        setConnecting(true);
        setStep("loading");
        console.log("[YouTubeOAuth] Transitioned to loading step");

        try {
          console.log("[YouTubeOAuth] 1. Exchanging OAuth code", {
            redirectUri,
            codeLength: String(event.data.code || "").length,
          });
          const tokens = await exchangeCodeFn({
            data: {
              code: event.data.code,
              redirectUri: redirectUri,
            },
          });
          
          if (!tokens || !tokens.access_token) {
            console.error("[YouTubeOAuth] exchangeCodeFn returned no tokens or access_token", tokens);
            throw new Error("Failed to receive access token from Google");
          }

          console.log("[YouTubeOAuth] 2. OAuth tokens received", {
            accessToken: maskToken(tokens.access_token),
            refreshToken: maskToken(tokens.refresh_token),
            expiresIn: tokens.expires_in,
          });

          // Store tokens securely (in production, use httpOnly cookies or secure storage)
          localStorage.setItem("youtube_access_token", tokens.access_token);
          if (tokens.refresh_token) {
            localStorage.setItem("youtube_refresh_token", tokens.refresh_token);
          }
          localStorage.setItem(
            "youtube_token_expires",
            String(Date.now() + tokens.expires_in * 1000),
          );

          // Fetch channel info
          console.log("[YouTubeOAuth] 3. Fetching YouTube channel details");
          const info = await getChannelInfoFn({ data: { access_token: tokens.access_token } });
          if (!info || !info.channelId) {
            console.error("[YouTubeOAuth] getChannelInfoFn returned invalid info", info);
            throw new Error("Failed to fetch YouTube channel details");
          }
          console.log("[YouTubeOAuth] YouTube channel details fetched", { 
            channelId: info.channelId, 
            title: info.title 
          });
          setChannelInfo(info);

          // Fetch latest videos
          console.log("[YouTubeOAuth] 4. Fetching latest YouTube videos");
          const videos = await getVideosFn({
            data: { access_token: tokens.access_token, maxResults: 5 },
          });
          console.log("[YouTubeOAuth] Latest YouTube videos fetched", { count: videos?.length ?? 0 });
          setLatestVideos(videos || []);

          // Fetch live status
          try {
            console.log("[YouTubeOAuth] Fetching YouTube live status");
            const live = await getLiveStatusFn({ data: { access_token: tokens.access_token } });
            console.log("[YouTubeOAuth] YouTube live status fetched", live);
            setLiveStatus(live);
          } catch (liveError) {
            console.warn("[YouTubeOAuth] Failed to fetch live status; continuing", liveError);
            setLiveStatus({ isLive: false });
          }

          // Get current user
          console.log("[YouTubeOAuth] 5. Getting current Supabase session");
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user.id) {
            console.error("[YouTubeOAuth] No Supabase session found during flow");
            throw new Error("Your session has expired. Please log in again.");
          }

          console.log("[YouTubeOAuth] 6. Saving YouTube channel to database", {
            userId: session.user.id,
            channelId: info.channelId,
            title: info.title,
          });

          const saveResult = await saveChannelFn({
            data: {
              userId: session.user.id,
              channelInfo: info,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
            },
          });

          if (!saveResult || !saveResult.channelId) {
            console.error("[YouTubeOAuth] saveChannelFn failed to return channelId", saveResult);
            throw new Error("Failed to save YouTube channel connection to database");
          }

          console.log("[YouTubeOAuth] 7. YouTube channel saved successfully", { 
            dbChannelId: saveResult.channelId 
          });
          setDbChannelId(saveResult.channelId);

          // Save videos to database. Video caching is helpful, but it must not block channel connection.
          try {
            console.log("[YouTubeOAuth] Saving YouTube videos to database", {
              dbChannelId: saveResult.channelId,
              count: videos.length,
            });
            await saveVideosFn({
              data: {
                channelId: saveResult.channelId,
                videos: videos,
              },
            });
            console.log("[YouTubeOAuth] YouTube videos saved", {
              dbChannelId: saveResult.channelId,
              count: videos.length,
            });
          } catch (videoSaveError) {
            console.warn(
              "[YouTubeOAuth] Channel saved but video cache save failed",
              videoSaveError,
            );
          }

          console.log("[YouTubeOAuth] Finalizing connection state");
          setStep("connected");
          publishYouTubeConnected(info, saveResult.channelId);
          console.log("[YouTubeOAuth] Event published, calling onConnected callback");
          toast.success("YouTube channel connected successfully!");
          onConnected?.(info);
          console.log("[YouTubeOAuth] Closing dialog");
          onOpenChange(false);
        } catch (error) {
          console.error("[YouTubeOAuth] Failed to complete YouTube OAuth flow", error);
          toast.error(error instanceof Error ? error.message : "Failed to connect YouTube channel");
          setStep("connect");
        } finally {
          setConnecting(false);
          sessionStorage.removeItem(YOUTUBE_OAUTH_STATE_KEY);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup after 10 minutes
    setTimeout(
      () => {
        window.removeEventListener("message", handleMessage);
      },
      10 * 60 * 1000,
    );
  };

  const handleRefresh = async () => {
    if (!channelInfo) return;

    setRefreshing(true);
    try {
      const accessToken = localStorage.getItem("youtube_access_token");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const info = await getChannelInfoFn({ data: { access_token: accessToken } });
      setChannelInfo(info);

      const videos = await getVideosFn({ data: { access_token: accessToken, maxResults: 5 } });
      setLatestVideos(videos);

      try {
        const live = await getLiveStatusFn({ data: { access_token: accessToken } });
        setLiveStatus(live);
      } catch {
        setLiveStatus({ isLive: false });
      }

      // Update database if we have a channel ID
      if (dbChannelId) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user.id) {
            await saveChannelFn({
              data: {
                userId: session.user.id,
                channelInfo: info,
                accessToken: accessToken,
              },
            });

            await saveVideosFn({
              data: {
                channelId: dbChannelId,
                videos: videos,
              },
            });
          }
        } catch (persistError) {
          console.error("Failed to update YouTube data in database:", persistError);
        }
      }

      toast.success("Channel data refreshed!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh channel data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    // Disconnect from database if we have a channel ID
    if (dbChannelId) {
      try {
        await disconnectChannelFn({ data: { channelId: dbChannelId } });
      } catch (error) {
        console.error("Failed to disconnect channel from database:", error);
      }
    }

    localStorage.removeItem("youtube_access_token");
    localStorage.removeItem("youtube_refresh_token");
    localStorage.removeItem("youtube_token_expires");
    setChannelInfo(null);
    setLatestVideos([]);
    setLiveStatus(null);
    setDbChannelId(null);
    setStep("connect");
    toast.success("YouTube channel disconnected");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "connect" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                Connect Your YouTube Channel
              </DialogTitle>
              <DialogDescription>
                Sign in with your Google account to access YouTube channel analytics, upload videos,
                and manage live streams.
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

        {step === "connected" && channelInfo && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <img
                    src={channelInfo.profileImageUrl}
                    alt={channelInfo.title}
                    className="w-12 h-12 rounded-full border border-[color:var(--gold)]/30"
                  />
                  <div>
                    <DialogTitle>{channelInfo.title}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Channel ID: {channelInfo.channelId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 transition disabled:opacity-60"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Channel Statistics */}
              <div>
                <h3 className="font-medium mb-3 text-sm">Channel Statistics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-[color:var(--gold)]/20 bg-card/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-[color:var(--gold)]" />
                      <span className="text-xs text-muted-foreground">Subscribers</span>
                    </div>
                    <p className="font-display text-lg text-[color:var(--gold)]">
                      {formatNumber(channelInfo.subscriberCount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-[color:var(--gold)]/20 bg-card/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-[color:var(--gold)]" />
                      <span className="text-xs text-muted-foreground">Total Views</span>
                    </div>
                    <p className="font-display text-lg text-[color:var(--gold)]">
                      {formatNumber(channelInfo.viewCount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-[color:var(--gold)]/20 bg-card/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-4 h-4 text-[color:var(--gold)]" />
                      <span className="text-xs text-muted-foreground">Videos</span>
                    </div>
                    <p className="font-display text-lg text-[color:var(--gold)]">
                      {formatNumber(channelInfo.videoCount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Stream Status */}
              {liveStatus && (
                <div>
                  <h3 className="font-medium mb-3 text-sm">Live Stream Status</h3>
                  {liveStatus.isLive ? (
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 animate-pulse" />
                        <div className="text-sm">
                          <p className="font-medium text-red-400 mb-1">{liveStatus.title}</p>
                          <p className="text-xs text-red-300">
                            {liveStatus.viewerCount} viewers • Started{" "}
                            {new Date(liveStatus.startTime!).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-muted-foreground/20 bg-card/40">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Radio className="w-4 h-4" />
                        <span>No active live stream</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Latest Videos */}
              {latestVideos.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-sm">Latest Videos</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {latestVideos.map((video) => (
                      <a
                        key={video.videoId}
                        href={`https://youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 p-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 bg-card/40 transition group"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-16 h-16 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium group-hover:text-[color:var(--gold)] transition line-clamp-2">
                            {video.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatNumber(video.viewCount)} views •{" "}
                            {new Date(video.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel Description */}
              {channelInfo.description && (
                <div>
                  <h3 className="font-medium mb-3 text-sm">About Channel</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {channelInfo.description}
                  </p>
                </div>
              )}

              {/* Channel Link */}
              <a
                href={`https://youtube.com/channel/${channelInfo.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-lg border border-[color:var(--gold)]/50 hover:border-[color:var(--gold)] text-center text-sm font-medium transition"
              >
                View on YouTube
              </a>

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="w-full py-2 rounded-lg border border-red-500/50 hover:border-red-500 text-red-500 hover:bg-red-500/10 text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Channel
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
