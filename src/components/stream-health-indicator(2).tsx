/**
 * Stream Health Indicator Component
 * Displays connection status, publishing status, and stream health metrics
 */

import { Wifi, WifiOff, Radio, AlertCircle, CheckCircle2 } from "lucide-react";

export interface StreamHealthIndicatorProps {
  isConnected: boolean;
  isPublishing: boolean;
  isLive: boolean;
  error?: string | null;
  connectionQuality?: "excellent" | "good" | "fair" | "poor" | "unknown";
  bitrate?: number;
  frameRate?: number;
}

export function StreamHealthIndicator({
  isConnected,
  isPublishing,
  isLive,
  error,
  connectionQuality = "unknown",
  bitrate,
  frameRate,
}: StreamHealthIndicatorProps) {
  const getConnectionColor = () => {
    if (error) return "text-red-500";
    if (!isConnected) return "text-violet-500";
    if (isPublishing) return "text-green-500";
    return "text-blue-500";
  };

  const getConnectionIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4" />;
    if (!isConnected) return <WifiOff className="w-4 h-4" />;
    if (isPublishing) return <Radio className="w-4 h-4 animate-pulse" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getConnectionText = () => {
    if (error) return "Connection Error";
    if (!isConnected) return "Connecting...";
    if (isPublishing && isLive) return "Broadcasting";
    if (isPublishing) return "Publishing";
    return "Connected";
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-blue-500";
      case "fair":
        return "bg-violet-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-card/40">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={getConnectionColor()}>{getConnectionIcon()}</div>
          <span className="text-sm font-medium">{getConnectionText()}</span>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="text-xs text-red-500 font-medium">{error}</div>}

      {/* Stream Quality Indicators */}
      {isPublishing && isLive && (
        <div className="space-y-2 pt-2 border-t border-border">
          {/* Connection Quality */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Quality</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1 h-3 rounded-sm ${
                      connectionQuality === "unknown"
                        ? "bg-gray-500/30"
                        : bar <=
                            (connectionQuality === "excellent"
                              ? 5
                              : connectionQuality === "good"
                                ? 4
                                : connectionQuality === "fair"
                                  ? 3
                                  : 2)
                          ? getQualityColor()
                          : "bg-gray-500/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium capitalize">{connectionQuality}</span>
            </div>
          </div>

          {/* Bitrate */}
          {bitrate !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bitrate</span>
              <span className="text-xs font-medium">{(bitrate / 1000).toFixed(1)} Mbps</span>
            </div>
          )}

          {/* Frame Rate */}
          {frameRate !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Frame Rate</span>
              <span className="text-xs font-medium">{frameRate} fps</span>
            </div>
          )}
        </div>
      )}

      {/* Status Dots */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-violet-500"}`}
          />
          <span className="text-[10px] text-muted-foreground">Connected</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${isPublishing ? "bg-green-500" : "bg-gray-500/50"}`}
          />
          <span className="text-[10px] text-muted-foreground">Publishing</span>
        </div>
        <div
          className={`w-2 h-2 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-gray-500/50"}`}
        />
        <span className="text-[10px] text-muted-foreground">Live</span>
      </div>
    </div>
  );
}
