import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/google/callback")({
  component: GoogleOAuthCallback,
});

function GoogleOAuthCallback() {
  useEffect(() => {
    // Get the authorization code from URL parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      // Send error to opener
      window.opener?.postMessage(
        {
          type: "youtube-oauth-error",
          error: error,
          errorDescription: params.get("error_description"),
        },
        window.location.origin
      );
      window.close();
      return;
    }

    if (code) {
      // Send code to opener
      window.opener?.postMessage(
        {
          type: "youtube-oauth-code",
          code: code,
        },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[color:var(--gold)] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
}
