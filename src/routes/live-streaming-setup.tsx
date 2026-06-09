
// src/routes/live-streaming-setup.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LiveStreamingSetupClient } from "@/components/live-streaming-setup-client";

export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupClient,
});
