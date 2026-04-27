"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import Link from "next/link";

const sections = [
  { id: "general", title: "General Disclaimer" },
  { id: "no-guarantee", title: "No Guarantee of Income" },
  { id: "testimonials", title: "Testimonials & Examples" },
  { id: "forward-looking", title: "Forward-Looking Statements" },
  { id: "individual-results", title: "Individual Results Vary" },
  { id: "due-diligence", title: "Due Diligence" },
  { id: "not-professional-advice", title: "Not Professional Advice" },
  { id: "risk-acknowledgment", title: "Risk Acknowledgment" },
  { id: "affiliate", title: "Affiliate & Referral Disclosure" },
  { id: "ftc-compliance", title: "FTC Compliance" },
  { id: "contact", title: "Contact Information" },
];

export default function IncomeDisclaimerPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetPosition = element.offsetTop - 80;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar TOC */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-lg shadow-lg p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Table of Contents
              </h2>
              <nav className="space-y-1">
                {sections.map(({ id, title }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                      activeSection === id
                        ? "bg-[#1e3a5f] text-white font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Mobile Dropdown TOC */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full bg-white rounded-lg shadow-lg px-4 py-3 flex items-center justify-between border border-slate-200"
            >
              <span className="font-semibold text-slate-900">
                Table of Contents
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  isMobileMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isMobileMenuOpen && (
              <div className="mt-2 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-y-auto">
                {sections.map(({ id, title }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`block w-full text-left px-4 py-3 text-sm border-b border-slate-100 transition-all ${
                      activeSection === id
                        ? "bg-blue-50 text-[#1e3a5f] font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8a] px-8 py-10 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wider text-white/70">
                    Legal Notice
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Income & Earnings Disclaimer
                </h1>
                <p className="mt-3 text-white/70 text-sm">
                  Foreclosure Recovery Inc. | Effective: March 8, 2026
                </p>
              </div>

              {/* Content */}
              <div className="px-8 py-10 space-y-12 text-slate-700 leading-relaxed">
                {/* General Disclaimer */}
                <section id="general">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    1. General Disclaimer
                  </h2>
                  <p className="mb-4">
                    The information provided by Foreclosure Recovery Inc. ("Company," "we," "us," or "our"), including but not limited to content on our websites (usforeclosurerecovery.com, usforeclosureleads.com, assetrecoverybusiness.com), webcast presentations, training materials, email communications, and all associated digital media, is for general informational and educational purposes only.
                  </p>
                  <p className="mb-4">
                    Nothing on this website, in our webcast, or in any materials we distribute should be construed as a promise, guarantee, or assurance that you will earn any specific amount of money, generate a particular level of income, or achieve any financial results whatsoever by using our products, services, information, or strategies.
                  </p>
                  <p>
                    The success or failure of each individual in the surplus funds recovery industry, like any business endeavor, depends on a wide variety of factors including but not limited to the individual's background, dedication, work ethic, market conditions, compliance with applicable laws, and numerous other circumstances over which we have no control.
                  </p>
                </section>

                {/* No Guarantee of Income */}
                <section id="no-guarantee">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    2. No Guarantee of Income
                  </h2>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg mb-4">
                    <p className="font-semibold text-amber-900">
                      THERE IS NO GUARANTEE THAT YOU WILL EARN ANY MONEY USING THE TECHNIQUES, IDEAS, INFORMATION, TOOLS, LEADS, OR STRATEGIES PRESENTED IN OUR MATERIALS.
                    </p>
                  </div>
                  <p className="mb-4">
                    We make absolutely no claims, representations, or warranties that by using our lead data, attending our webcast, or following our recovery process that you will earn money, recover funds, close deals, or achieve any level of success. Examples of income or earnings described in our materials, webcast, or marketing content are not to be interpreted as a guarantee or promise that you or anyone else will achieve those same results.
                  </p>
                  <p className="mb-4">
                    Surplus funds recovery involves complex legal processes, state-specific regulations, time-sensitive deadlines, and dealings with governmental entities. The outcome of each case depends on multiple variables including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>The existence and availability of surplus funds in any given case</li>
                    <li>State-specific laws governing the recovery and disbursement of surplus funds</li>
                    <li>The accuracy and completeness of publicly available records</li>
                    <li>Your ability to locate and communicate effectively with former homeowners</li>
                    <li>Regulatory requirements including licensing, bonding, or fee cap restrictions</li>
                    <li>Competition from other recovery agents or attorneys</li>
                    <li>The willingness of former homeowners to engage with your outreach efforts</li>
                    <li>Court or state processes, including processing times, approval procedures, and administrative hurdles</li>
                  </ul>
                  <p>
                    Many individuals who purchase lead data, educational products, or attend our webcast earn little to no money. We have no way of knowing how well you will do, as we do not know your work ethic, your commitment, your personal financial position, or your ability to follow through on a business opportunity.
                  </p>
                </section>

                {/* Testimonials & Examples */}
                <section id="testimonials">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    3. Testimonials & Examples
                  </h2>
                  <p className="mb-4">
                    Any earnings, income, or revenue figures referenced in testimonials, case studies, webcast content, or marketing materials are individual results and should not be considered typical. Testimonials presented on our websites or in our webcast represent the experience of specific individuals and are not intended to represent or guarantee that anyone will achieve the same or similar results.
                  </p>
                  <p className="mb-4">
                    Each individual's results will vary based on many factors including but not limited to their background, experience, work ethic, market conditions, and the state or locality in which they operate. Some testimonials may be from individuals who have prior business, legal, or real estate experience that may provide them with advantages not available to the average participant.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg mb-4">
                    <p className="text-sm text-slate-600">
                      <strong>Per FTC Guidelines:</strong> When we share results achieved by specific individuals, those results are not necessarily typical. Your results may be significantly better or significantly worse. We cannot and do not guarantee that you will achieve similar results. The testimonials and examples used are offered as illustration of what is possible, not as a promise that you will duplicate them.
                    </p>
                  </div>
                  <p>
                    Where applicable, all testimonials have been provided voluntarily without compensation, unless otherwise disclosed. We reserve the right to use pseudonyms, alter identifying details, or present composite illustrations for privacy protection, provided the underlying experience being represented is truthful.
                  </p>
                </section>

                {/* Forward-Looking Statements */}
                <section id="forward-looking">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    4. Forward-Looking Statements
                  </h2>
                  <p className="mb-4">
                    Our materials, webcast content, and marketing communications may contain forward-looking statements within the meaning of applicable securities and business communications law. These statements reflect our current expectations and projections about future events, trends, and the surplus funds recovery market.
                  </p>
                  <p className="mb-4">
                    Forward-looking statements are based on current information, assumptions, and beliefs that may change as conditions evolve. These statements may include references to industry growth, market opportunity, potential earnings, available surplus funds, or other projections. Actual outcomes may differ materially from those anticipated due to changes in laws, market conditions, economic conditions, or other factors beyond our control.
                  </p>
                  <p>
                    We undertake no obligation to update forward-looking statements to reflect subsequent events or changed circumstances.
                  </p>
                </section>

                {/* Individual Results Vary */}
                <section id="individual-results">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    5. Individual Results Vary
                  </h2>
                  <p className="mb-4">
                    Every person's situation is different. Factors that can affect your results include but are not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Your personal financial situation, resources, and available capital</li>
                    <li>The amount of time and effort you dedicate to the recovery business</li>
                    <li>Your geographic location and the state laws governing your operation</li>
                    <li>Your prior experience in business, sales, real estate, or legal work</li>
                    <li>The quality and effectiveness of your outreach and communication skills</li>
                    <li>Regulatory conditions and compliance obligations in your jurisdiction</li>
                    <li>Market saturation, competition, and the volume of available surplus fund cases</li>
                    <li>Economic conditions, interest rates, and foreclosure trends</li>
                  </ul>
                  <p>
                    For these reasons, we strongly caution against relying on the results described in any of our materials as an indicator of what you personally should expect. There is no substitute for performing your own due diligence and obtaining independent legal, financial, and business advice before committing time or resources to any endeavor.
                  </p>
                </section>

                {/* Due Diligence */}
                <section id="due-diligence">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    6. Due Diligence
                  </h2>
                  <p className="mb-4">
                    Before acting on any information provided by us, we strongly recommend that you conduct your own independent research, consult with a licensed attorney in your jurisdiction, and seek the advice of qualified financial and tax professionals. The surplus funds recovery industry is subject to varying laws, regulations, and administrative requirements that differ by state, and in some jurisdictions, by locality.
                  </p>
                  <p className="mb-4">
                    It is your responsibility to verify that you are operating in compliance with all applicable federal, state, and local laws. Some states require specific licenses, registrations, or bonds for individuals engaged in surplus funds recovery. Some states impose fee caps or other restrictions. Some states prohibit certain practices entirely.
                  </p>
                  <p>
                    Foreclosure Recovery Inc. does not provide legal advice and cannot guarantee the accuracy or completeness of legal information referenced in our materials. Laws change, regulations evolve, and judicial interpretations differ. You are solely responsible for ensuring your compliance with all applicable requirements.
                  </p>
                </section>

                {/* Not Professional Advice */}
                <section id="not-professional-advice">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    7. Not Professional Advice
                  </h2>
                  <p className="mb-4">
                    Nothing contained in our websites, webcast, training materials, lead data, or communications constitutes legal advice, financial advice, tax advice, investment advice, or professional advice of any kind. We are not a law firm. We are not a licensed financial advisory firm. We are not a registered investment advisor.
                  </p>
                  <p className="mb-4">
                    Our company provides informational and educational content related to the surplus funds recovery process, along with data and tools designed to assist individuals who choose to pursue surplus funds recovery independently. Any decisions you make based on our information are entirely at your own risk.
                  </p>
                  <p>
                    We strongly recommend that you work with qualified legal, tax, and financial professionals before making any business or financial decisions based on information obtained from our platforms.
                  </p>
                </section>

                {/* Risk Acknowledgment */}
                <section id="risk-acknowledgment">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    8. Risk Acknowledgment
                  </h2>
                  <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg mb-4">
                    <p className="font-semibold text-red-900">
                      All business endeavors carry risk. You acknowledge that pursuing surplus funds recovery, like any business, involves financial risk, including the potential loss of time and money invested.
                    </p>
                  </div>
                  <p className="mb-4">
                    By using our services, you acknowledge and agree that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>You are voluntarily participating in a business endeavor</li>
                    <li>Success is not guaranteed and depends on factors beyond our control</li>
                    <li>You may invest time and money without generating any return</li>
                    <li>Past results described by others do not predict your future performance</li>
                    <li>We are not responsible for your business decisions or their outcomes</li>
                    <li>You have had the opportunity to seek independent legal and financial advice before using our products or services</li>
                  </ul>
                </section>

                {/* Affiliate & Referral Disclosure */}
                <section id="affiliate">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    9. Affiliate & Referral Disclosure
                  </h2>
                  <p className="mb-4">
                    Foreclosure Recovery Inc. may receive compensation, commissions, or referral fees from third-party products, services, or tools mentioned or linked to on our websites, webcast, or marketing materials. This includes but is not limited to software tools, lead generation services, skip tracing providers, legal service referrals, and educational resources.
                  </p>
                  <p>
                    When we recommend third-party products or services, we may have a financial interest in doing so. We only recommend products and services that we believe provide genuine value, but you should evaluate each recommendation independently and not rely solely on our endorsement when making purchasing decisions.
                  </p>
                </section>

                {/* FTC Compliance */}
                <section id="ftc-compliance">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    10. FTC Compliance
                  </h2>
                  <p className="mb-4">
                    This Income & Earnings Disclaimer is provided in compliance with guidelines set forth by the Federal Trade Commission (FTC) regarding the use of endorsements and testimonials in advertising, as well as the FTC Act's prohibition against deceptive or misleading claims.
                  </p>
                  <p className="mb-4">
                    In accordance with FTC guidelines, we disclose that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Testimonials and income examples represent individual results, not typical outcomes</li>
                    <li>We do not guarantee income, earnings, or financial results of any kind</li>
                    <li>Material connections between endorsers and our company are disclosed where applicable</li>
                    <li>All marketing claims are made in good faith but should not be relied upon as guarantees</li>
                  </ul>
                  <p>
                    If you have questions about any claims made in our marketing or informational materials, please contact us using the information provided below.
                  </p>
                </section>

                {/* Contact Information */}
                <section id="contact">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#1e3a5f]/20">
                    11. Contact Information
                  </h2>
                  <p className="mb-4">
                    If you have any questions regarding this Income & Earnings Disclaimer, or any of our legal policies, you may contact us at:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-2">
                      Foreclosure Recovery Inc.
                    </p>
                    <p className="text-slate-600 mb-1">
                      Phone: (888) 545-8007
                    </p>
                    <p className="text-slate-600 mb-1">
                      Email: support@usforeclosurerecovery.com
                    </p>
                    <p className="text-slate-600 mb-4">
                      Website: usforeclosurerecovery.com
                    </p>
                    <p className="text-xs text-slate-400">
                      This disclaimer was last updated on March 8, 2026 and applies to all content published by Foreclosure Recovery Inc. across all platforms, including but not limited to usforeclosurerecovery.com, usforeclosureleads.com, and assetrecoverybusiness.com.
                    </p>
                  </div>
                </section>

                {/* Final Notice */}
                <div className="mt-12 pt-8 border-t-2 border-slate-200">
                  <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-lg p-6">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong>BY USING OUR WEBSITES, ATTENDING OUR WEBCAST, PURCHASING OUR PRODUCTS, OR USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS INCOME & EARNINGS DISCLAIMER.</strong> If you do not agree with this disclaimer, you should not use our websites, attend our presentations, or purchase any products or services from Foreclosure Recovery Inc.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <Link href="/terms" className="text-white/70 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/income-disclaimer" className="text-white/70 hover:text-white transition-colors">
              Income Disclaimer
            </Link>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Foreclosure Recovery Inc. in
            partnership with Start My Business Incorporated. All rights
            reserved.
          </p>
          <p className="text-xs text-slate-300 mt-2">
            Last Updated: March 8, 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
