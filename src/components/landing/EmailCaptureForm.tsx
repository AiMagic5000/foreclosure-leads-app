"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Download, Loader2 } from "lucide-react";

interface Props {
  source?: string;
  variant?: "hero" | "popup";
  onSuccess?: () => void;
}

export function EmailCaptureForm({
  source = "hero_form",
  variant = "hero",
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      onSuccess?.();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className={`flex flex-col items-center text-center gap-3 py-4 ${
          variant === "popup" ? "py-6" : ""
        }`}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <p className="font-semibold text-gray-900 text-lg">Check your email!</p>
        <p className="text-gray-600 text-sm max-w-xs">
          Your free 50 States Guide is on its way. Check your inbox (and spam
          folder just in case).
        </p>
        <a
          href="/states-guide"
          className="text-sm font-medium text-[#1e3a5f] underline underline-offset-2"
        >
          Or view it instantly online &rarr;
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {variant === "hero" && (
        <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Free Download — 50 States Surplus Funds Guide
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="First name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`flex-1 min-w-0 ${
            variant === "hero" ? "h-11 bg-white border-gray-300" : "h-11"
          }`}
          disabled={status === "loading"}
        />
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`flex-[2] min-w-0 ${
            variant === "hero" ? "h-11 bg-white border-gray-300" : "h-11"
          }`}
          disabled={status === "loading"}
        />
        <Button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="h-11 bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white font-semibold px-5 whitespace-nowrap shrink-0"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Get Free Guide"
          )}
        </Button>
      </div>
      {status === "error" && (
        <p className="text-red-600 text-xs mt-2">{errorMsg}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
