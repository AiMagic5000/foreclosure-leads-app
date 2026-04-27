"use client";

import { useState, useEffect, useRef } from "react";
import { X, Gift } from "lucide-react";
import { EmailCaptureForm } from "./EmailCaptureForm";

const STORAGE_KEY = "usfrl_exit_popup_dismissed";
const POPUP_DELAY_MS = 8000;
const SCROLL_TRIGGER_PERCENT = 0.45;

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

  function show() {
    if (shown.current) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    shown.current = true;
    setVisible(true);
  }

  useEffect(() => {
    // Exit intent: mouse leaves viewport at top (desktop)
    function onMouseOut(e: MouseEvent) {
      if (e.clientY <= 0) show();
    }

    // Scroll depth trigger (mobile fallback — fires after 45% scroll)
    function onScroll() {
      const scrolled =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled >= SCROLL_TRIGGER_PERCENT) show();
    }

    // Time delay trigger (fires after 8s regardless)
    const timer = setTimeout(show, POPUP_DELAY_MS);

    document.addEventListener("mouseleave", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] px-6 pt-8 pb-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mx-auto mb-4">
            <Gift className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">
            Before you go — get the free guide
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            The 50 States Surplus Funds Guide covers claim windows, fee caps,
            and which states are easiest to work in.
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          <EmailCaptureForm
            source="exit_intent_popup"
            variant="popup"
            onSuccess={dismiss}
          />
        </div>

        {/* Skip */}
        <div className="text-center pb-5">
          <button
            onClick={dismiss}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            No thanks, I don&apos;t want the free guide
          </button>
        </div>
      </div>
    </div>
  );
}
