"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import Link from "next/link";

const sections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "service", title: "Description of Service" },
  { id: "program", title: "Asset Recovery Agent Partnership Program" },
  { id: "account", title: "Account Registration & Security" },
  { id: "billing", title: "Pricing & Payments" },
  { id: "guarantee", title: "Money Back Guarantee" },
  { id: "trial", title: "Trial Policy" },
  { id: "cancellation", title: "Refund Policy" },
  { id: "lead-delivery", title: "Lead Delivery" },
  { id: "acceptable-use", title: "Acceptable Use Policy" },
  { id: "data-accuracy", title: "Data Accuracy Disclaimer" },
  { id: "compliance", title: "Compliance Obligations" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "voice-biometric-media", title: "Voice, Biometric Data & Media Release" },
  { id: "sub-agent", title: "Sub-Agent Provisions (Reserved)" },
  { id: "white-label", title: "White-Label License (Reserved)" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "dispute-resolution", title: "Dispute Resolution & Arbitration" },
  { id: "governing-law", title: "Governing Law" },
  { id: "modifications", title: "Modifications to Terms" },
  { id: "severability", title: "Severability" },
  { id: "entire-agreement", title: "Entire Agreement" },
  { id: "contact", title: "Contact Information" },
];

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState("acceptance");
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
      element.scrollIntoView({ behavior: "smooth" });
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
                    className={`block w-full text-left px-4 py-3 text-sm border-b border-slate-100 last:border-b-0 ${
                      activeSection === id
                        ? "bg-[#1e3a5f] text-white font-semibold"
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
          <main className="flex-1 bg-white rounded-lg shadow-lg p-6 sm:p-8 lg:p-12 border border-slate-200">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold text-[#1e3a5f] mb-2">
                Terms of Service
              </h1>
              <p className="text-slate-600 mb-8">
                Last Updated: April 27, 2026
              </p>

              <div className="prose prose-slate max-w-none space-y-12">
                {/* Section 1 */}
                <section id="acceptance">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    These Terms of Service ("Terms") constitute a legally
                    binding agreement between you ("User," "you," or "your")
                    and Foreclosure Recovery Inc., operating in partnership with
                    Start My Business Incorporated ("Company," "we," "us," or
                    "our") governing your access to and use of the services
                    provided through usforeclosurerecovery.com (the "Platform"
                    or "Service").
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    By creating an account, accessing, or using the Platform,
                    you acknowledge that you have read, understood, and agree
                    to be bound by these Terms, including our Privacy Policy,
                    which is incorporated herein by reference. If you do not
                    agree to these Terms, you must immediately discontinue use
                    of the Service.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    You represent and warrant that you have the legal capacity
                    to enter into this agreement and that you are at least 18
                    years of age. If you are accessing the Service on behalf of
                    a business or entity, you represent that you have the
                    authority to bind that entity to these Terms.
                  </p>
                </section>

                {/* Section 2 */}
                <section id="service">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    2. Description of Service
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Foreclosure Recovery Inc. operates a software-as-a-service
                    (SaaS) platform that provides the following services to
                    Users:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      <strong>Foreclosure Surplus Fund Leads:</strong> Access
                      to lead data derived from public records related to
                      foreclosure surplus funds and excess proceeds from
                      property sales.
                    </li>
                    <li>
                      <strong>Skip Tracing Services:</strong> Tools and data to
                      locate contact information for property owners and
                      potential claimants.
                    </li>
                    <li>
                      <strong>Do Not Call (DNC) Scrubbing:</strong> Automated
                      screening of lead data against federal and state Do Not
                      Call registries to help Users maintain compliance.
                    </li>
                    <li>
                      <strong>Voicemail Automation:</strong> Technology to
                      automate delivery of voicemail messages to leads (optional
                      add-on service).
                    </li>
                    <li>
                      <strong>Dashboard and Analytics:</strong> User interface
                      for managing leads, tracking campaign performance, and
                      accessing reporting tools.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    The Service is intended for business use by professionals
                    engaged in foreclosure surplus recovery, real estate
                    services, or related industries. The Company reserves the
                    right to modify, suspend, or discontinue any aspect of the
                    Service at any time with or without notice.
                  </p>
                </section>

                {/* Section 3 -- Asset Recovery Agent Partnership Program */}
                <section id="program">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    3. Asset Recovery Agent Partnership Program
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company offers a single program: the <strong>Asset Recovery Agent Partnership</strong>. Enrollment in the program is governed by these Terms together with the program enrollment confirmation provided at checkout.
                  </p>
                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">3.1 Program Fee and Payment Options</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The total program fee is nine hundred ninety-five dollars (<strong>$995</strong>). Three payment options are available:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li><strong>Pay-in-Full:</strong> $995 paid in a single transaction at enrollment.</li>
                    <li><strong>Three Monthly Payments:</strong> Three (3) consecutive monthly payments of $331 each, totaling $995.</li>
                    <li><strong>In-House Financing:</strong> 0% interest, no third-party credit pull. Available for applicants whose budget does not fit the standard plan or whose credit limits other options. Subject to Company approval. Call (888) 545-8007 to apply.</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    No third-party "buy now, pay later" services (such as Klarna, Afterpay, or similar) are offered for the program fee.
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">3.2 Commission Structure</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Recovery fees are split <strong>50/50</strong> between the agent and Foreclosure Recovery Inc. The recovery fee is up to 30% of the recovered surplus, subject to applicable state caps. For example, Texas caps recovery agent fees at 20%. Balance payments to the agent are paid only from cases successfully closed under the program.
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">3.3 What the Program Includes</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>Fifty (50) verified, exclusive leads per week. "Exclusive" means each lead is assigned to a single agent and is not shared with other agents.</li>
                    <li>Certified letters mailed to leads on the agent's behalf, with proof of service, jurisdiction language, and a free claims guide for the homeowner.</li>
                    <li>Ongoing support via phone, email, and the platform dashboard.</li>
                    <li>Full training program access (audio, video, and written materials).</li>
                    <li>Outreach automation, including ringless voicemail drops, SMS drips, and email drips, all loaded with the agent's name and contact information.</li>
                    <li>A dedicated landing page on USForeclosureRecovery.com.</li>
                    <li>An assigned personal extension on the Company's shared 800 inbound number.</li>
                    <li>A professional email address at yourname@usforeclosurerecovery.com.</li>
                    <li>Dashboard-managed lead outreach.</li>
                    <li>Access to the company registration inbox and lead-tracking back office, allowing the agent to verify whether any of their clients have signed up or contacted the Company directly.</li>
                    <li>Free claim processing of every signed contingency through MyStateFunds.com (https://www.mystatefunds.com/), the same claim-processing platform the Company uses internally.</li>
                  </ul>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">3.4 No Business Entity Required</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Agents may participate as 1099 independent contractors without forming a business entity. Agents who already operate a business may elect to have the Company bill the business directly and pay case earnings into the business bank account in lieu of a 1099, subject to standard onboarding and tax documentation.
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">3.5 Vegas Vacation Client Incentive</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company provides a complimentary Vegas vacation that the agent may offer to the agent's <em>clients</em> (homeowners) when those clients sign their contingency agreement. This incentive is a closing tool intended to drive client urgency and lift conversion on outreach. It is not an agent reward and is not redeemable by the agent personally. The right to extend the offer to clients activates as follows:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li><strong>Pay-in-Full enrollees:</strong> may extend the offer to clients immediately upon enrollment.</li>
                    <li><strong>Three-Payment Plan enrollees:</strong> may extend the offer to clients once the third (final) monthly payment is received.</li>
                    <li><strong>In-House Financing enrollees:</strong> may extend the offer to clients once the final scheduled payment is received.</li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Trip details, fulfillment partners, and travel windows are determined and communicated by Foreclosure Recovery Inc. once the agent's client's signed contingency agreement is on file. The Company reserves the right to modify or substitute the incentive in its sole discretion, provided the substitute is of comparable value.
                  </p>
                </section>

                {/* Section 4 */}
                <section id="account">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    4. Account Registration & Security
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    To access the Service, you must create an account by
                    providing accurate, complete, and current information. You
                    agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      Maintain the confidentiality of your account credentials,
                      including your password.
                    </li>
                    <li>
                      Immediately notify the Company of any unauthorized access
                      to or use of your account.
                    </li>
                    <li>
                      Accept responsibility for all activities that occur under
                      your account.
                    </li>
                    <li>
                      Ensure that all registration information provided remains
                      accurate and up to date.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company reserves the right to suspend or terminate your
                    account if we suspect fraudulent activity, misuse of the
                    Service, or violation of these Terms. You may not transfer,
                    sell, or share your account credentials with any third
                    party.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Each account is licensed for use by a single individual or
                    entity. Multi-user access requires additional licensing
                    arrangements, which must be agreed upon in writing with the
                    Company.
                  </p>
                </section>

                {/* Section 5 */}
                <section id="billing">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    5. Pricing & Payments
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The current program offering is the Asset Recovery Agent Partnership at a total program fee of $995. Payment options and program inclusions are described in Section 3 (Asset Recovery Agent Partnership Program).
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Payments are processed by Start My Business Incorporated (StartMyBusiness.us) on behalf of Foreclosure Recovery Inc. and its affiliated entities, including the platforms operating at usforeclosurerecovery.com and assetrecoverybusiness.com. By providing payment information, you authorize the payment processor to charge the applicable fee, and any scheduled installment payments under the three-payment plan or in-house financing option, to your designated payment method on the agreed schedule.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Third-party "buy now, pay later" services (such as Klarna, Afterpay, or similar) are not offered for the program fee. The only available installment options are the three-payment plan and in-house financing described in Section 3.1.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Fees do not include applicable sales tax, value-added tax (VAT), or other governmental taxes or fees, which shall be your responsibility. If a scheduled installment payment fails, the Company will attempt to contact you and reattempt collection. The Company reserves the right to suspend access to the Service, including paused activation of the Vegas Vacation Client Incentive described in Section 3.5, until payments are brought current.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    The Company reserves the right to update pricing for future enrollments upon thirty (30) days' written notice. Price changes do not affect previously completed enrollments or payment plans already in progress.
                  </p>
                </section>

                {/* Section 6 -- Money Back Guarantee */}
                <section id="guarantee">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    6. Money Back Guarantee
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company offers a <strong>Money Back Guarantee</strong> on the Asset Recovery Agent Partnership program. If, after twelve (12) months of active participation, the agent has not closed a deal, the Company will refund the full $995 program payment, subject to the qualification and disqualification standards below.
                  </p>
                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">6.1 Qualification Requirements</h3>
                  <p className="text-slate-700 leading-relaxed mb-2">To qualify for the refund, the agent must, throughout the twelve-month period:</p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>Complete the training program within sixty (60) days of enrollment.</li>
                    <li>Work assigned leads each week.</li>
                    <li>Use the Company's phone system for client outreach (calls are recorded).</li>
                    <li>Maintain monthly contact with the support team.</li>
                    <li>Follow the scripts and processes provided in training and the dashboard.</li>
                    <li>Comply with all program terms and remain in good standing.</li>
                  </ul>
                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">6.2 Disqualification</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">An agent is disqualified from the Money Back Guarantee if the agent does not complete training, does not seek support, fails to document weekly outreach effort, or otherwise materially deviates from program processes.</p>
                  <p className="text-slate-700 leading-relaxed">The Money Back Guarantee replaces any prior "double your money back" or similar offer. No prior offer remains in effect.</p>
                </section>

                {/* Section 7 */}
                <section id="trial">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    7. Trial Policy
                  </h2>
                  <p className="text-slate-700 leading-relaxed">
                    The Company does not currently offer free trials. All access
                    to the Service requires a completed purchase. From time to
                    time, the Company may offer promotional pricing or
                    limited-time offers at its sole discretion.
                  </p>
                </section>

                {/* Section 8 */}
                <section id="cancellation">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    8. Refund Policy
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Due to the nature of our digital product and the significant
                    cost associated with lead qualification technology, all
                    purchases are generally non-refundable.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    <strong className="text-[#1e3a5f]">
                      Before Access:
                    </strong>{" "}
                    If you have not yet accessed or downloaded any lead data,
                    you may request a refund within seven (7) days of purchase
                    by contacting support@usforeclosurerecovery.com. Refunds
                    requested before any data access will be processed within
                    10 business days.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    <strong className="text-[#1e3a5f]">
                      After Access:
                    </strong>{" "}
                    Once you have accessed the lead dashboard, viewed lead data,
                    or downloaded any lead information (CSV exports, individual
                    lead details, or contact data), your eligibility for a
                    refund is substantially diminished. This is because:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      (a) The Company has invested significant capital in the
                      technology, data sources, and third-party services
                      required to qualify, skip-trace, enrich, and deliver
                      verified leads.
                    </li>
                    <li>
                      (b) Lead data, once viewed or downloaded, cannot be
                      returned or un-accessed.
                    </li>
                    <li>
                      (c) The cost of skip tracing, DNC verification, property
                      enrichment, and continuous data updates represents a
                      material per-lead expense that is incurred on your behalf
                      at the time of access.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    <strong className="text-[#1e3a5f]">
                      Dispute Resolution for Refund Requests:
                    </strong>{" "}
                    If you believe exceptional circumstances warrant a refund
                    after data access, you may submit a written request to
                    support@usforeclosurerecovery.com explaining your
                    circumstances. Each request will be evaluated individually
                    at the sole discretion of the Company.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    The Company reserves the right to terminate or suspend your
                    account immediately for violation of these Terms without
                    refund or credit.
                  </p>
                </section>

                {/* Section 9 -- Lead Delivery */}
                <section id="lead-delivery">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    9. Lead Delivery
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Enrolled agents receive fifty (50) verified leads per week, delivered through the platform dashboard. Each lead is exclusive to the agent to whom it is assigned and is not shared with any other agent. Leads are skip-traced and DNC-scrubbed prior to delivery.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    On the agent's behalf, the Company mails certified letters to the assigned leads, including proof of service, jurisdiction-appropriate language, and a free claims guide for the homeowner. The Company also runs ringless voicemail, SMS, and email drip outreach to the agent's leads using the agent's name and contact information.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company does not guarantee that any specific number of leads will respond, contract, or close. Lead volume targets are commercially reasonable estimates and may vary by week based on data availability, jurisdiction, and seasonal factors. The Company will, in good faith, replace verifiably duplicate or invalid leads.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Agents may not redistribute, resell, or transfer leads to any third party. Lead data is provided for the agent's exclusive use under this Agreement.
                  </p>
                </section>

                {/* Section 10 */}
                <section id="acceptable-use">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    10. Acceptable Use Policy
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You agree to use the Service in compliance with all
                    applicable federal, state, and local laws and regulations.
                    You expressly agree NOT to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      Use the Service for any unlawful, fraudulent, or
                      deceptive purpose.
                    </li>
                    <li>
                      Violate the Telephone Consumer Protection Act (TCPA), CAN-SPAM
                      Act, or any other consumer protection laws.
                    </li>
                    <li>
                      Contact individuals on federal or state Do Not Call
                      registries without proper authorization or exemption.
                    </li>
                    <li>
                      Harass, threaten, or abuse any individual through use of
                      the Service.
                    </li>
                    <li>
                      Scrape, copy, or redistribute lead data to third parties
                      without express written permission from the Company.
                    </li>
                    <li>
                      Attempt to reverse engineer, decompile, or otherwise
                      derive source code from the Platform.
                    </li>
                    <li>
                      Introduce viruses, malware, or any other harmful code to
                      the Service.
                    </li>
                    <li>
                      Interfere with or disrupt the integrity or performance of
                      the Service or its underlying infrastructure.
                    </li>
                    <li>
                      Use automated systems (bots, scripts) to access the
                      Service except as expressly permitted by the Platform's
                      functionality.
                    </li>
                    <li>
                      Impersonate the Company, its employees, or any other
                      person or entity.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Violation of this Acceptable Use Policy may result in
                    immediate termination of your account and may expose you to
                    civil and criminal liability.
                  </p>
                </section>

                {/* Section 11 */}
                <section id="data-accuracy">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    11. Data Accuracy Disclaimer
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The lead data, contact information, and other information
                    provided through the Service is derived from publicly
                    available records, third-party data sources, and automated
                    data processing systems. While the Company makes
                    commercially reasonable efforts to provide accurate and
                    up-to-date information, we make NO GUARANTEES OR WARRANTIES
                    regarding the accuracy, completeness, timeliness, or
                    reliability of any data provided.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Public records may contain errors, omissions, or outdated
                    information. Third-party data providers may supply
                    inaccurate or incomplete data. Users acknowledge and accept
                    that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      Lead data may not reflect current property ownership,
                      contact information, or legal status.
                    </li>
                    <li>
                      Skip tracing results may produce incorrect or outdated
                      contact details.
                    </li>
                    <li>
                      DNC scrubbing services are provided as a convenience and
                      do not guarantee absolute compliance with all applicable
                      Do Not Call regulations.
                    </li>
                    <li>
                      Some leads may be duplicates, invalid, or otherwise
                      unsuitable for your intended purpose.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                    ANY REPRESENTATIONS OR WARRANTIES OF ANY KIND. It is your
                    sole responsibility to verify the accuracy of all data
                    before using it for any business purpose. The Company shall
                    not be liable for any losses, damages, or consequences
                    arising from reliance on inaccurate or incomplete data.
                  </p>
                </section>

                {/* Section 12 */}
                <section id="compliance">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    12. Compliance Obligations
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You are solely responsible for ensuring that your use of
                    the Service complies with all applicable laws and
                    regulations, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      <strong>Telephone Consumer Protection Act (TCPA):</strong>{" "}
                      You must obtain proper consent before making automated
                      calls, sending text messages, or leaving pre-recorded
                      voicemails. You are responsible for maintaining records
                      of consent.
                    </li>
                    <li>
                      <strong>
                        Federal Trade Commission (FTC) Telemarketing Sales Rule:
                      </strong>{" "}
                      You must comply with Do Not Call regulations, including
                      maintaining an internal Do Not Call list and honoring
                      consumer opt-out requests.
                    </li>
                    <li>
                      <strong>State-Specific Laws:</strong> Many states have
                      additional telemarketing, data privacy, and consumer
                      protection laws. You are responsible for understanding
                      and complying with the laws of each state in which you
                      operate.
                    </li>
                    <li>
                      <strong>Fair Debt Collection Practices Act (FDCPAA):</strong>{" "}
                      If your activities constitute debt collection, you must
                      comply with all applicable debt collection laws.
                    </li>
                    <li>
                      <strong>CAN-SPAM Act:</strong> If you send commercial
                      email, you must comply with CAN-SPAM requirements,
                      including providing opt-out mechanisms and accurate
                      sender information.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company provides DNC scrubbing as a tool to assist with
                    compliance, but this service does not guarantee full
                    compliance with TCPA or other regulations. It is your
                    responsibility to verify compliance independently and to
                    implement additional safeguards as necessary.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Failure to comply with applicable laws may result in
                    significant fines, penalties, and legal liability. The
                    Company assumes no responsibility for your compliance and
                    shall not be liable for any violations or consequences
                    arising from your use of the Service.
                  </p>
                </section>

                {/* Section 13 */}
                <section id="intellectual-property">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    13. Intellectual Property
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    All content, software, code, design, graphics, logos,
                    trademarks, trade names, and other materials on the
                    Platform (collectively, "Intellectual Property") are owned
                    by or licensed to Foreclosure Recovery Inc. and are
                    protected by United States and international copyright,
                    trademark, patent, and other intellectual property laws.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Subject to your compliance with these Terms, the Company
                    grants you a limited, non-exclusive, non-transferable,
                    revocable license to access and use the Service for your
                    internal business purposes only. This license does not
                    grant you any rights to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      Copy, modify, distribute, sell, or lease any part of the
                      Service or its underlying software.
                    </li>
                    <li>
                      Reverse engineer, decompile, or attempt to extract source
                      code from the Platform.
                    </li>
                    <li>
                      Remove or alter any copyright, trademark, or proprietary
                      notices.
                    </li>
                    <li>
                      Use the Company's trademarks, logos, or branding without
                      prior written consent.
                    </li>
                    <li>
                      Create derivative works based on the Platform or its
                      content.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Unauthorized use of the Company's Intellectual Property may
                    result in termination of your account and legal action to
                    protect our rights.
                  </p>
                </section>

                {/* Section 14 */}
                <section id="voice-biometric-media">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    14. Voice, Biometric Data & Media Release
                  </h2>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">14.1 Call Recording & Voice Collection</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    All telephone calls placed to or received from the Company, its agents, partners, or affiliated phone systems are recorded for quality assurance, training, compliance verification, and dispute resolution purposes. By placing or receiving a call through any Company phone line, extension, or system, you acknowledge and consent to the recording and storage of that call in its entirety, including any voiceprint or biometric voice data captured during the recording.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company collects, processes, and stores biometric identifiers derived from voice recordings, including but not limited to voiceprints, vocal patterns, and speech characteristics. This biometric data may be used for identity verification, quality monitoring, agent training, and system improvement. Biometric data will be retained for the duration of your business relationship with the Company plus seven (7) years, or as required by applicable records retention laws, whichever is longer. Biometric data will be destroyed when it is no longer needed for the purposes described in this section, unless retention is required by law or necessary for the protection of either party in connection with a legal proceeding or dispute.
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">14.2 Use of Recordings for Training & Advertising</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company reserves the right to use call recordings, transcripts, and excerpts from calls for internal training purposes, including but not limited to onboarding new agents, demonstrating sales techniques, compliance training, and improving service delivery. Recordings may be anonymized or used in their original form at the Company's discretion.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company may also use call recordings, excerpts, and related content for marketing, advertising, promotional materials, case studies, and testimonials, provided that such use does not misrepresent the content or context of the original communication. By continuing to use the Service after being notified of this policy, you grant the Company a non-exclusive, royalty-free, worldwide license to use such recordings for the purposes described in this section.
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">14.3 Media Release & Likeness Rights</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    If you agree -- whether verbally (recorded), in writing, or through electronic acceptance -- to participate in any podcast, webinar, live call, live Zoom session, video recording, screen share, or any other media production organized by or affiliated with the Company, you grant the Company and its successors an irrevocable, perpetual, worldwide, royalty-free, fully transferable license to use, reproduce, distribute, display, perform, create derivative works from, and otherwise exploit your name, voice, likeness, image, statements, and any other identifying characteristics captured during such participation, in any and all media formats now known or hereafter developed, in perpetuity (ad infinitum), for any lawful purpose including but not limited to advertising, marketing, training, educational content, social media, broadcast media, and promotional materials.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company shall retain all rights granted under this section to the fullest extent permitted by applicable law. You acknowledge that you will not receive compensation beyond what has already been agreed upon (if any) for the Company's use of your likeness and media participation as described herein.
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">14.4 Removal Requests & Legal Limitations</h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company respects individual privacy rights and will comply with all applicable federal and state laws governing biometric data, voice recordings, and likeness rights, including but not limited to the Illinois Biometric Information Privacy Act (BIPA), the California Consumer Privacy Act (CCPA), the Texas Capture or Use of Biometric Identifier Act (CUBI), and any other applicable state biometric privacy statutes.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You may submit a written request to have your voice recordings, biometric data, or media content removed by contacting the Company at the address provided in the Contact Information section of these Terms. The Company will process removal requests in accordance with applicable law, provided that such removal:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      Does not conflict with any applicable rules of civil procedure, litigation hold obligations, or court orders requiring the preservation of evidence.
                    </li>
                    <li>
                      Does not violate any federal, state, or local records retention requirements applicable to the Company's industry or business operations.
                    </li>
                    <li>
                      Does not compromise the Company's ability to protect its rights or the rights of other parties in connection with any pending or reasonably anticipated legal dispute, investigation, audit, or regulatory proceeding.
                    </li>
                    <li>
                      Does not apply to recordings or materials that have already been incorporated into published training materials, advertisements, or content distributed to third parties prior to the date of the removal request, where recall or deletion is not commercially practicable.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company will acknowledge receipt of any removal request within ten (10) business days and will provide a substantive response, including any applicable limitations or exceptions, within thirty (30) days. Where removal is not possible due to the exceptions listed above, the Company will explain the basis for its determination and, where feasible, offer reasonable alternatives such as anonymization or redaction.
                  </p>

                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">14.5 Consent</h3>
                  <p className="text-slate-700 leading-relaxed">
                    By registering for an account, using the Service, placing or receiving calls through the Company's phone systems, or participating in any media production as described in this section, you represent and warrant that you have read, understood, and voluntarily consent to the collection, storage, use, and disclosure of your voice data, biometric identifiers, call recordings, and likeness as described herein. If you do not consent to these terms, you must discontinue use of the Service and notify the Company immediately.
                  </p>
                </section>

                {/* Section 15 -- Sub-Agent Provisions (Reserved) */}
                <section id="sub-agent">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    15. Sub-Agent Provisions (Reserved)
                  </h2>
                  <p className="text-slate-700 leading-relaxed">
                    This Section is reserved. The Asset Recovery Agent Partnership program does not include sub-agent recruitment, override commissions, or downstream agent management rights. Any future sub-agent program offered by the Company will be governed by a separate written agreement.
                  </p>
                </section>

                {/* Section 16 -- White-Label License (Reserved) */}
                <section id="white-label">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    16. White-Label License (Reserved)
                  </h2>
                  <p className="text-slate-700 leading-relaxed">
                    This Section is reserved. The Asset Recovery Agent Partnership program does not include a white-label license, branded website clone, or rights to operate the Company's platform under the agent's own brand. Any future white-label license offered by the Company will be governed by a separate written agreement.
                  </p>
                </section>

                {/* Section 17 */}
                <section id="liability">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    17. Limitation of Liability
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4 uppercase font-semibold">
                    TO THE FULLEST EXTENT PERMITTED BY LAW, FORECLOSURE
                    RECOVERY INC., ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS,
                    AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT,
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                    INCLUDING BUT NOT LIMITED TO LOST PROFITS, LOST REVENUE,
                    LOST DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR
                    RELATED TO YOUR USE OF THE SERVICE, EVEN IF THE COMPANY HAS
                    BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    IN NO EVENT SHALL THE COMPANY'S TOTAL LIABILITY TO YOU FOR
                    ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE
                    SERVICE EXCEED THE TOTAL AMOUNT OF FEES PAID BY YOU TO THE
                    COMPANY IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING
                    RISE TO LIABILITY.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company shall not be liable for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      Any inaccuracies, errors, or omissions in lead data or
                      other information provided through the Service.
                    </li>
                    <li>
                      Any failure or delay in the Service caused by factors
                      outside the Company's reasonable control, including third-party
                      data provider failures, internet outages, or force
                      majeure events.
                    </li>
                    <li>
                      Any legal claims, fines, penalties, or damages arising
                      from your failure to comply with applicable laws,
                      including TCPA, FDCPA, or DNC regulations.
                    </li>
                    <li>
                      Any business losses, lost opportunities, or damages
                      resulting from your reliance on data provided by the
                      Service.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    Some jurisdictions do not allow the exclusion or limitation
                    of certain damages. If these laws apply to you, some or all
                    of the above disclaimers, exclusions, or limitations may
                    not apply, and you may have additional rights.
                  </p>
                </section>

                {/* Section 18 */}
                <section id="indemnification">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    18. Indemnification
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You agree to indemnify, defend, and hold harmless
                    Foreclosure Recovery Inc., its officers, directors,
                    employees, agents, affiliates, and licensors from and
                    against any and all claims, liabilities, damages, losses,
                    costs, expenses, and fees (including reasonable attorneys'
                    fees) arising out of or related to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                    <li>
                      Your use or misuse of the Service in violation of these
                      Terms.
                    </li>
                    <li>
                      Your violation of any applicable laws or regulations,
                      including but not limited to TCPA, FDCPA, CAN-SPAM, or
                      state telemarketing laws.
                    </li>
                    <li>
                      Any claims by third parties arising from your contact or
                      communication with leads obtained through the Service.
                    </li>
                    <li>
                      Your breach of any representations, warranties, or
                      obligations under these Terms.
                    </li>
                    <li>
                      Any infringement or violation of intellectual property
                      rights, privacy rights, or other rights of third parties.
                    </li>
                  </ul>
                  <p className="text-slate-700 leading-relaxed">
                    The Company reserves the right to assume the exclusive
                    defense and control of any matter subject to
                    indemnification by you, in which case you agree to
                    cooperate fully with the Company's defense of such claims.
                  </p>
                </section>

                {/* Section 19 */}
                <section id="dispute-resolution">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    19. Dispute Resolution & Arbitration
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Any dispute, controversy, or claim arising out of or
                    relating to these Terms or the Service (collectively,
                    "Disputes") shall be resolved through binding arbitration
                    in accordance with the Commercial Arbitration Rules of the
                    American Arbitration Association (AAA).
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    <strong className="text-[#1e3a5f]">
                      Arbitration Agreement:
                    </strong>{" "}
                    You and the Company agree that all Disputes will be
                    resolved through individual arbitration and not through
                    class action, class arbitration, or any other representative
                    proceeding. You hereby waive your right to participate in a
                    class action lawsuit or class-wide arbitration.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The arbitration shall be conducted by a single arbitrator
                    appointed in accordance with AAA rules. The arbitration
                    shall take place in the State of Wyoming unless otherwise
                    agreed by both parties. The arbitrator's decision shall be
                    final and binding, and judgment on the award may be entered
                    in any court of competent jurisdiction.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Each party shall bear its own costs and attorneys' fees in
                    connection with arbitration, except that the arbitrator may
                    award costs and fees to the prevailing party if permitted
                    by law.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <strong className="text-[#1e3a5f]">
                      Exceptions to Arbitration:
                    </strong>{" "}
                    Either party may seek injunctive or equitable relief in a
                    court of competent jurisdiction to prevent actual or
                    threatened infringement, misappropriation, or violation of
                    intellectual property rights.
                  </p>
                </section>

                {/* Section 20 */}
                <section id="governing-law">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    20. Governing Law
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    These Terms and any Disputes arising out of or related to
                    the Service shall be governed by and construed in
                    accordance with the laws of the State of Wyoming, without
                    regard to its conflict of laws principles.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    To the extent that arbitration does not apply or is
                    unavailable, you agree to submit to the exclusive
                    jurisdiction of the state and federal courts located in the
                    State of Wyoming for resolution of any legal proceedings.
                  </p>
                </section>

                {/* Section 21 */}
                <section id="modifications">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    21. Modifications to Terms
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Company reserves the right to modify, amend, or update
                    these Terms at any time in its sole discretion. When
                    changes are made, the Company will update the "Last
                    Updated" date at the top of this page and may notify you
                    via email or through a notice on the Platform.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Your continued use of the Service after the effective date
                    of any changes constitutes your acceptance of the revised
                    Terms. If you do not agree to the updated Terms, you must
                    immediately discontinue use of the Service and cancel your
                    subscription.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    It is your responsibility to review these Terms
                    periodically for updates. Material changes will be
                    highlighted or communicated to active Users.
                  </p>
                </section>

                {/* Section 22 */}
                <section id="severability">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    22. Severability
                  </h2>
                  <p className="text-slate-700 leading-relaxed">
                    If any provision of these Terms is found to be unlawful,
                    void, or unenforceable by a court of competent
                    jurisdiction, that provision shall be deemed severable and
                    shall not affect the validity and enforceability of the
                    remaining provisions. The remaining Terms shall continue in
                    full force and effect.
                  </p>
                </section>

                {/* Section 23 */}
                <section id="entire-agreement">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    23. Entire Agreement
                  </h2>
                  <p className="text-slate-700 leading-relaxed">
                    These Terms, together with the Privacy Policy and any other
                    policies or agreements referenced herein, constitute the
                    entire agreement between you and Foreclosure Recovery
                    Inc. regarding the Service and supersede all prior or
                    contemporaneous communications, agreements, and
                    understandings, whether written or oral.
                  </p>
                </section>

                {/* Section 24 */}
                <section id="contact">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    24. Contact Information
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    If you have any questions, concerns, or complaints
                    regarding these Terms of Service or the Platform, please
                    contact us at:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-4">
                    <p className="text-slate-900 font-semibold mb-2">
                      Foreclosure Recovery Inc.
                    </p>
                    <p className="text-slate-700 mb-1">
                      Email:{" "}
                      <a
                        href="mailto:support@usforeclosurerecovery.com"
                        className="text-[#3b82f6] hover:underline"
                      >
                        support@usforeclosurerecovery.com
                      </a>
                    </p>
                    <p className="text-slate-700">
                      Website:{" "}
                      <a
                        href="https://usforeclosurerecovery.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3b82f6] hover:underline"
                      >
                        usforeclosurerecovery.com
                      </a>
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                    <p className="text-slate-900 font-semibold mb-2">
                      Payment Processing & Business Services:
                    </p>
                    <p className="text-slate-700 font-semibold mb-2">
                      Start My Business Incorporated
                    </p>
                    <p className="text-slate-700 mb-1">
                      Website:{" "}
                      <a
                        href="https://StartMyBusiness.us"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3b82f6] hover:underline"
                      >
                        StartMyBusiness.us
                      </a>
                    </p>
                    <p className="text-slate-700">
                      Email:{" "}
                      <a
                        href="mailto:support@startmybusiness.us"
                        className="text-[#3b82f6] hover:underline"
                      >
                        support@startmybusiness.us
                      </a>
                    </p>
                  </div>
                </section>
              </div>

              {/* Acknowledgment Box */}
              <div className="mt-12 bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] text-white rounded-lg p-6 border-2 border-[#10b981]">
                <h3 className="text-xl font-bold mb-3">
                  Acknowledgment of Terms
                </h3>
                <p className="text-sm leading-relaxed">
                  By using the Foreclosure Recovery platform, you acknowledge
                  that you have read, understood, and agree to be bound by
                  these Terms of Service. You confirm that you are legally
                  authorized to enter into this agreement and that you will
                  comply with all applicable laws and regulations in your use
                  of the Service.
                </p>
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
            Last Updated: April 27, 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
