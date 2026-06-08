import { createFileRoute } from "@tanstack/react-router";
import LiveStreamingSetupPage from "@/components/live-streaming-studio-client";

export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});
