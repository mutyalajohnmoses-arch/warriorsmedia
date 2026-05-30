import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { YouTubeChannelConnect } from "./youtube-channel-connect";
import {
  Upload,
  Radio,
  FileText,
  ChevronDown,
  Loader2,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  getConnectedYouTubeChannel,
  disconnectYouTubeChannel,
} from "@/lib/youtube-persistence.functions";

interface YouTubeCreateMenuProps {
  channelConnected?: boolean;
  onChannelConnect?: () => void;
  onChannelDisconnect?: () => void;
}

export function YouTubeCreateMenu({ 
  channelConnected: initialConnected = false, 
  onChannelConnect,
  onChannelDisconnect 
}: YouTubeCreateMenuProps) {
  const navigate = useNavigate();
  const [channelConnected, setChannelConnected] = useState(initialConnected);
  const [dbChannelId, setDbChannelId] = useState<string | null>(null);
  const [showChannelConnectDialog, setShowChannelConnectDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const getChannelFn = useServerFn(getConnectedYouTubeChannel);
  const disconnectChannelFn = useServerFn(disconnectYouTubeChannel);

  useEffect(() => {
    setChannelConnected(initialConnected);
  }, [initialConnected]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const channel = await getChannelFn({ data: { userId: "" } });
        if (channel) {
          setChannelConnected(true);
          setDbChannelId(channel.id);
        } else {
          setChannelConnected(false);
          setDbChannelId(null);
        }
      } catch (err) {
        console.error("Failed to check YouTube connection:", err);
      }
    };
    checkConnection();
  }, [getChannelFn, initialConnected]);

  const handleChannelConnected = () => {
    setChannelConnected(true);
    if (onChannelConnect) onChannelConnect();
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      if (dbChannelId) {
        await disconnectChannelFn({ data: { channelId: dbChannelId } });
      }
      
      localStorage.removeItem("youtube_access_token");
      localStorage.removeItem("youtube_refresh_token");
      localStorage.removeItem("youtube_token_expires");
      localStorage.removeItem("youtube_channel");
      localStorage.removeItem("youtube_tokens");
      
      setChannelConnected(false);
      setDbChannelId(null);
      
      toast.success("YouTube channel disconnected");
      if (onChannelDisconnect) onChannelDisconnect();
    } catch (error) {
      toast.error("Failed to disconnect channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-[color:var(--gold)]/50 text-xs transition bg-card/40">
            <span className="text-[color:var(--gold)]">Create</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            {channelConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>YouTube Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Connect YouTube</span>
              </>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {!channelConnected ? (
            <DropdownMenuItem onClick={() => setShowChannelConnectDialog(true)} className="cursor-pointer">
              <LinkIcon className="w-4 h-4 mr-2 text-[color:var(--gold)]" />
              <span>Connect Channel</span>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => navigate({ to: "/live-streaming-setup", search: { action: "upload" } })}
                className="cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2 text-[color:var(--gold)]" />
                <span>Upload Video</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate({ to: "/live-streaming-setup" })}
                className="cursor-pointer"
              >
                <Radio className="w-4 h-4 mr-2 text-red-500" />
                <span>Go Live</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate({ to: "/live-streaming-setup", search: { action: "post" } })}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2 text-[color:var(--gold)]" />
                <span>Create Post</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDisconnect}
                className="cursor-pointer text-red-500 focus:text-red-500"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                <span>Disconnect Channel</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <YouTubeChannelConnect
        isOpen={showChannelConnectDialog}
        onOpenChange={setShowChannelConnectDialog}
        onConnected={handleChannelConnected}
      />
    </>
  );
}
