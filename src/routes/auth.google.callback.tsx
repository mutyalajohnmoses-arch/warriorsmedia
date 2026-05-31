import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

function decodeOAuthState(
  value: string | null,
): { openerOrigin?: string; nonce?: string; redirectUri?: string } | null {
  if (!value) return null;
  try {
    return JSON.parse(atob(value));
  } catch (error) {
    console.error("[YouTubeOAuthCallback] Failed to decode OAuth state", error);
    return null;
  }
}

export const Route = createFileRoute("/auth/google/callback")({
  component: GoogleOAuthCallback,
});

function GoogleOAuthCallback() {
  useEffect(() => {
    // Get the authorization code from URL parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const state = params.get("state");
    const decodedState = decodeOAuthState(state);
    const targetOrigin = decodedState?.openerOrigin || window.location.origin;

    console.log("[YouTubeOAuthCallback] Callback route executed", {
      callbackOrigin: window.location.origin,
      targetOrigin,
      hasOpener: Boolean(window.opener),
      hasCode: Boolean(code),
      codeLength: code?.length ?? 0,
      error,
      decodedState,
    });

    if (error) {
      // Send error to opener
      console.error("[YouTubeOAuthCallback] OAuth callback error", {
        error,
        errorDescription: params.get("error_description"),
      });
      const errorPayload = {
        type: "youtube-oauth-error",
        error: error,
        errorDescription: params.get("error_description"),
        state,
      };
      window.opener?.postMessage(errorPayload, targetOrigin);
      if (targetOrigin !== window.location.origin) {
        window.opener?.postMessage(errorPayload, window.location.origin);
      }
      window.close();
      return;
    }

    if (code) {
      // Send code to opener
      console.log("[YouTubeOAuthCallback] Posting OAuth code to opener", {
        targetOrigin,
        codeLength: code.length,
      });
      const codePayload = {
        type: "youtube-oauth-code",
        code: code,
        state,
      };
      window.opener?.postMessage(codePayload, targetOrigin);
      if (targetOrigin !== window.location.origin) {
        window.opener?.postMessage(codePayload, window.location.origin);
      }
      window.close();
      return;
    }

    console.error("[YouTubeOAuthCallback] Callback missing both code and error");
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
