import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { YouTubeChannelConnect } from "./youtube-channel-connect";
import type { YouTubeChannelInfo } from "@/lib/youtube-oauth.functions";
import {
  Upload,
  Radio,
  FileText,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface YouTubeCreateMenuProps {
  channelConnected?: boolean;
  onChannelConnect?: (channelInfo: YouTubeChannelInfo) => void;
}

export function YouTubeCreateMenu({ channelConnected = false, onChannelConnect }: YouTubeCreateMenuProps) {
  const navigate = useNavigate();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showLiveDialog, setShowLiveDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [startingLive, setStartingLive] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [showChannelConnectDialog, setShowChannelConnectDialog] = useState(false);

  const handleChannelConnected = (channelInfo: YouTubeChannelInfo) => {
    if (onChannelConnect) onChannelConnect(channelInfo);
  };

  const handleUploadVideo = async () => {
    if (!channelConnected) {
      toast.error("Please connect your YouTube channel first");
      setShowUploadDialog(false);
      setShowConnectDialog(true);
      return;
    }
    setUploading(true);
    try {
      // This would open a file picker and upload to YouTube
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Video upload started. Check YouTube Studio for progress.");
      setShowUploadDialog(false);
    } catch (err) {
      toast.error("Failed to start video upload");
    } finally {
      setUploading(false);
    }
  };

  const handleGoLive = async () => {
    if (!channelConnected) {
      toast.error("Please connect your YouTube channel first");
      setShowLiveDialog(false);
      setShowConnectDialog(true);
      return;
    }
    setStartingLive(true);
    try {
      // Navigate to live streaming setup with auto-live flag
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate({ to: "/live-streaming-setup", search: { auto: "true" } });
      setShowLiveDialog(false);
    } catch (err) {
      toast.error("Failed to start live stream");
    } finally {
      setStartingLive(false);
    }
  };

  const handleCreatePost = async () => {
    if (!channelConnected) {
      toast.error("Please connect your YouTube channel first");
      setShowPostDialog(false);
      setShowConnectDialog(true);
      return;
    }
    setCreatingPost(true);
    try {
      // This would open a post creation dialog
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Opening YouTube Studio to create a post...");
      setShowPostDialog(false);
    } catch (err) {
      toast.error("Failed to create post");
    } finally {
      setCreatingPost(false);
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

          {!channelConnected && (
            <>
              <DropdownMenuItem onClick={() => setShowChannelConnectDialog(true)} className="cursor-pointer">
                <LinkIcon className="w-4 h-4 mr-2 text-[color:var(--gold)]" />
                <span>Connect Channel</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={() => setShowUploadDialog(true)}
            className="cursor-pointer"
            disabled={!channelConnected}
          >
            <Upload className="w-4 h-4 mr-2 text-[color:var(--gold)]" />
            <span>Upload Video</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowLiveDialog(true)}
            className="cursor-pointer"
            disabled={!channelConnected}
          >
            <Radio className="w-4 h-4 mr-2 text-red-500" />
            <span>Go Live</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowPostDialog(true)}
            className="cursor-pointer"
            disabled={!channelConnected}
          >
            <FileText className="w-4 h-4 mr-2 text-[color:var(--gold)]" />
            <span>Create Post</span>
          </DropdownMenuItem>
          {channelConnected && (
  <DropdownMenuItem
    onClick={() => {
      localStorage.removeItem("youtube_channel");
      localStorage.removeItem("youtube_tokens");
      toast.success("YouTube channel disconnected");
      window.location.reload();
    }}
    className="cursor-pointer text-red-500"
  >
    Disconnect Channel
  </DropdownMenuItem>
)}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* YouTube Channel Connect Dialog */}
      <YouTubeChannelConnect
        isOpen={showChannelConnectDialog}
        onOpenChange={setShowChannelConnectDialog}
        onConnected={handleChannelConnected}
      />

      {/* Upload Video Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Video to YouTube</DialogTitle>
            <DialogDescription>
              Select a video file to upload to your YouTube channel. You'll be able to add title, description, and privacy settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-6 rounded-lg border-2 border-dashed border-[color:var(--gold)]/30 bg-card/40 text-center cursor-pointer hover:border-[color:var(--gold)]/60 transition">
              <Upload className="w-8 h-8 text-[color:var(--gold)] mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Click to select video</p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-2">MP4, MOV, AVI up to 256GB</p>
            </div>
            <button
              onClick={handleUploadVideo}
              disabled={uploading}
              className="w-full py-2.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium text-sm glow-gold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Video
                </>
              )}
            </button>
            <button
              onClick={() => setShowUploadDialog(false)}
              className="w-full py-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm transition"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Go Live Dialog */}
      <Dialog open={showLiveDialog} onOpenChange={setShowLiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Live Stream</DialogTitle>
            <DialogDescription>
              Set up and start a live stream directly to your YouTube channel. Configure your stream settings and go live instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-400 mb-1">Live Stream Status</p>
                  <p className="text-xs text-red-300">You're ready to go live. Your stream will be broadcast to all your YouTube subscribers.</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleGoLive}
              disabled={startingLive}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition"
            >
              {startingLive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  Go Live Now
                </>
              )}
            </button>
            <button
              onClick={() => setShowLiveDialog(false)}
              className="w-full py-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm transition"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Community Post</DialogTitle>
            <DialogDescription>
              Share updates, images, and links with your YouTube community. Posts appear on your channel page and in subscribers' feeds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              placeholder="What's on your mind? Share with your community…"
              className="w-full px-4 py-3 rounded-lg bg-background/60 border border-border focus:border-[color:var(--gold)]/60 outline-none text-sm resize-none"
              rows={4}
            />
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm transition">
                Add Image
              </button>
              <button className="flex-1 py-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm transition">
                Add Link
              </button>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={creatingPost}
              className="w-full py-2.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium text-sm glow-gold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {creatingPost ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Create Post
                </>
              )}
            </button>
            <button
              onClick={() => setShowPostDialog(false)}
              className="w-full py-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm transition"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
