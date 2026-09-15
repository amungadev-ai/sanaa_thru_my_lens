"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleSignInProps {
  onSuccess?: () => void;
  showOneTap?: boolean;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleSignIn({ onSuccess, showOneTap = false }: GoogleSignInProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Handle the credential response from Google
  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/comment-auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        toast.success(`Welcome, ${data.name}!`);
        if (onSuccess) {
          onSuccess();
        } else {
          // Reload the page to update the comment section
          window.location.reload();
        }
      } else {
        toast.error(data.error ?? "Google sign-in failed");
      }
    } catch {
      toast.error("Network error during Google sign-in");
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (document.getElementById("google-identity-script")) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove the script — it might be needed by other instances
    };
  }, []);

  // Initialize Google Identity Services when script is loaded
  useEffect(() => {
    if (!scriptLoaded || !GOOGLE_CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the sign-in button
    const buttonContainer = document.getElementById("google-signin-button");
    if (buttonContainer) {
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "continue_with",
        shape: "rectangles",
      });
    }

    // Show One Tap if requested
    if (showOneTap) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap was dismissed or not shown — that's fine, the button is still there
        }
      });
    }
  }, [scriptLoaded, showOneTap, handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="w-full">
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-md border border-border bg-secondary/30 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in…
        </div>
      )}
      <div id="google-signin-button" className={loading ? "hidden" : "flex justify-center"} />
    </div>
  );
}
