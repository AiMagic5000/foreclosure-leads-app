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
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!consent) {
      setErrorMsg("Please agree to the Terms and Privacy Policy to continue.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consent,
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
          Your free Surplus Funds Overages Guide is on its way. Check your inbox (and spam folder just in case).
        </p>
        <a
          href="/Foreclosure_Recovery_Business_Programs_Guide.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#1e3a5f] underline underline-offset-2"
        >
          Or download the PDF now &rarr;
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {variant === "hero" && (
        <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3 flex items-start gap-1.5">
          <Download className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Free Download — Surplus Funds Overages Guide
            <br />
            Become an Asset Recovery Agent
          </span>
        </p>
      )}
      <div className="flex flex-col gap-2">
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
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`flex-1 min-w-0 ${
              variant === "hero" ? "h-11 bg-white border-gray-300" : "h-11"
            }`}
            disabled={status === "loading"}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
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
      </div>
      <label className="flex items-start gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#1e3a5f]"
          required
        />
        <span className="text-[11px] text-gray-600 leading-snug">
          I agree to receive marketing emails, SMS, ringless voicemails, and phone calls from Foreclosure Recovery Inc. at the number and email provided. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to opt out. By submitting I accept the{" "}
          <a
            href="https://usforeclosurerecovery.com/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1e3a5f] underline"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="https://usforeclosurerecovery.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1e3a5f] underline"
          >
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {status === "error" && (
        <p className="text-red-600 text-xs mt-2">{errorMsg}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
