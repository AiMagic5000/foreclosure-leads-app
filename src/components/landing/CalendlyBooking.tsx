"use client";

import { Calendar } from "lucide-react";

// Update this URL when the Calendly account is configured
const CALENDLY_URL = "https://calendly.com/foreclosurerecovery/15min";

export function CalendlyBooking() {
  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">
            Not Ready to Commit?
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Book a 15-Minute Platform Walkthrough
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            See the lead platform live, ask questions, and get a feel for how
            the surplus fund recovery process works -- no sales pressure, no
            obligation.
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-[#1e3a5f] hover:bg-[#2d4a7a] text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-[#1e3a5f]/20 text-base"
          >
            <Calendar className="h-5 w-5" />
            Schedule Free Walkthrough
          </a>
          <p className="text-xs text-gray-400 mt-4">
            15 minutes &bull; No obligation &bull; Zoom or phone
          </p>
        </div>
      </div>
    </section>
  );
}
