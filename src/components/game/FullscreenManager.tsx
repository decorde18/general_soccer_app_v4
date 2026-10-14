"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Maximize2, Minimize2, Monitor, X } from "lucide-react";

interface FullscreenManagerProps {
  className?: string;
}

// Module-level guard to ensure preference is checked strictly once per browser session
let hasCheckedGlobalFsPref = false;

export default function FullscreenManager({ className = "" }: FullscreenManagerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [rememberPref, setRememberPref] = useState(true);

  // Monitor fullscreen change events from browser/OS
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(active);
      if (active) {
        setShowResumeBanner(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Initial preference check - strictly run once per browser session across all component mounts
    if (!hasCheckedGlobalFsPref) {
      hasCheckedGlobalFsPref = true;

      const pref = typeof window !== "undefined" ? localStorage.getItem("gamestats_fullscreen_pref") : null;
      const isCurrentlyFs = Boolean(
        typeof document !== "undefined" &&
        (document.fullscreenElement ||
         (document as any).webkitFullscreenElement ||
         (document as any).mozFullScreenElement)
      );

      setIsFullscreen(isCurrentlyFs);

      if (pref === null) {
        // First time visiting gamestats -> show onboarding modal
        setShowFirstTimeModal(true);
      } else if (pref === "true" && !isCurrentlyFs) {
        // User previously preferred fullscreen -> show one-tap resume banner
        setShowResumeBanner(true);
      }
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const requestFs = useCallback(() => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err: any) => console.warn("Fullscreen error:", err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }, []);

  const exitFs = useCallback(() => {
    const doc = document as any;
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch((err: any) => console.warn("Exit fullscreen error:", err));
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }, []);

  const handleToggle = () => {
    if (!isFullscreen) {
      requestFs();
      localStorage.setItem("gamestats_fullscreen_pref", "true");
      setShowResumeBanner(false);
    } else {
      exitFs();
      localStorage.setItem("gamestats_fullscreen_pref", "false");
    }
  };

  const handleModalConfirm = () => {
    requestFs();
    if (rememberPref) {
      localStorage.setItem("gamestats_fullscreen_pref", "true");
    }
    setShowFirstTimeModal(false);
  };

  const handleModalDismiss = () => {
    if (rememberPref) {
      localStorage.setItem("gamestats_fullscreen_pref", "false");
    }
    setShowFirstTimeModal(false);
  };

  return (
    <>
      {/* ─── Persistent Toggle Button ─── */}
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen Mode"}
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4 text-primary" />
        ) : (
          <Maximize2 className="h-4 w-4 text-muted hover:text-text" />
        )}
      </button>

      {/* ─── First-Time Onboarding Modal ─── */}
      {showFirstTimeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-border/80 bg-surface p-6 shadow-2xl text-text">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">Immersive Fullscreen Mode</h3>
                <p className="text-xs text-muted">Optimal view for live soccer match tracking</p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-4">
              Would you like to open Match Stats in fullscreen? This removes browser address bars and OS toolbars for a distraction-free scoring and roster tracking console.
            </p>

            <label className="flex items-center space-x-2 text-xs text-muted mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberPref}
                onChange={(e) => setRememberPref(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Remember this preference for future game stats sessions</span>
            </label>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleModalDismiss}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:bg-muted/20 hover:text-text transition-colors"
              >
                Stay in Window
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                Enter Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Resume Fullscreen Floating Pill (if preferred but not active) ─── */}
      {showResumeBanner && !isFullscreen && !showFirstTimeModal && (
        <div className="fixed bottom-4 right-4 z-[9998] flex items-center space-x-2 rounded-lg border border-primary/30 bg-surface/95 backdrop-blur px-3 py-2 shadow-lg animate-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={requestFs}
            className="flex items-center space-x-1.5 text-xs font-medium text-text hover:text-primary transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5 text-primary" />
            <span>Resume Fullscreen</span>
          </button>
          <button
            type="button"
            onClick={() => setShowResumeBanner(false)}
            className="text-muted hover:text-text p-0.5"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
