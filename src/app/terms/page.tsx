"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";

const sections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "service", title: "Description of Service" },
  { id: "account", title: "Account Registration & Security" },
  { id: "billing", title: "Subscription Plans & Billing" },
  { id: "trial", title: "Free Trial" },
  { id: "cancellation", title: "Cancellation & Refunds" },
  { id: "acceptable-use", title: "Acceptable Use Policy" },
  { id: "data-accuracy", title: "Data Accuracy Disclaimer" },
  { id: "compliance", title: "Compliance Obligations" },
  { id: "intellectual-property", title: "Intellectual Property" },
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
                Last Updated: February 2, 2026
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
                    and US Foreclosure Recovery Inc. ("Company," "we," "us," or
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
                    US Foreclosure Recovery Inc. operates a software-as-a-service
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

                {/* Section 3 */}
                <section id="account">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    3. Account Registration & Security
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

                {/* Section 4 */}
                <section id="billing">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    4. Subscription Plans & Billing
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The Service is offered on a subscription basis with the
                    following pricing tiers:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-4">
                    <ul className="space-y-3 text-slate-700">
                      <li>
                        <strong className="text-[#1e3a5f]">
                          Single State Plan:
                        </strong>{" "}
                        $129.00 per month - Access to foreclosure surplus leads
                        for one (1) selected state, including skip tracing and
                        DNC scrubbing services.
                      </li>
                      <li>
                        <strong className="text-[#1e3a5f]">
                          Multi-State Plan:
                        </strong>{" "}
                        $499.00 per month - Access to foreclosure surplus leads
                        for multiple states (up to five states), including skip
                        tracing and DNC scrubbing services.
                      </li>
                      <li>
                        <strong className="text-[#1e3a5f]">
                          Voicemail Automation Add-On:
                        </strong>{" "}
                        $299.00 per month - Optional add-on for automated
                        voicemail delivery to leads.
                      </li>
                    </ul>
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    All subscription fees are billed monthly in advance on the
                    anniversary date of your initial subscription. Payment must
                    be made by credit card, debit card, or other payment method
                    approved by the Company. By providing payment information,
                    you authorize the Company to charge the applicable fees to
                    your designated payment method on a recurring basis.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Subscription fees do not include applicable sales tax,
                    value-added tax (VAT), or other governmental taxes or fees,
                    which shall be your responsibility. If your payment method
                    fails or your account becomes past due, the Company
                    reserves the right to suspend access to the Service until
                    payment is received.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    The Company reserves the right to modify subscription
                    pricing upon thirty (30) days' written notice. Price
                    changes will apply to subsequent billing cycles and will
                    not affect the current billing period.
                  </p>
                </section>

                {/* Section 5 */}
                <section id="trial">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    5. Free Trial
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    New Users may be eligible for a seven (7) day free trial of
                    the Service. During the trial period, you will have access
                    to the features of the selected subscription plan at no
                    charge.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    To activate the free trial, you must provide valid payment
                    information. If you do not cancel your subscription before
                    the end of the trial period, your payment method will
                    automatically be charged the applicable subscription fee,
                    and your subscription will continue on a monthly recurring
                    basis.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    The free trial is available only once per User or business
                    entity. The Company reserves the right to determine
                    eligibility for the free trial and may deny access if it
                    determines that a User has previously received a trial or
                    is attempting to abuse the trial offer.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    During the trial period, all Terms of Service apply in full,
                    including but not limited to acceptable use policies,
                    compliance obligations, and disclaimers.
                  </p>
                </section>

                {/* Section 6 */}
                <section id="cancellation">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    6. Cancellation & Refunds
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You may cancel your subscription at any time by accessing
                    your account settings on the Platform or by contacting
                    customer support at support@usforeclosurerecovery.com.
                    Cancellation will take effect at the end of your current
                    billing cycle, and you will retain access to the Service
                    until that date.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    <strong className="text-[#1e3a5f]">
                      No Refunds Policy:
                    </strong>{" "}
                    All subscription fees are non-refundable. If you cancel
                    your subscription during a billing cycle, you will not
                    receive a refund or credit for any unused portion of the
                    subscription period. The Company does not provide prorated
                    refunds for partial months of service.
                  </p>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    If you cancel during the free trial period, you will not be
                    charged, provided the cancellation is completed before the
                    trial period expires.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    The Company reserves the right to terminate or suspend your
                    account immediately for violation of these Terms without
                    refund or credit.
                  </p>
                </section>

                {/* Section 7 */}
                <section id="acceptable-use">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    7. Acceptable Use Policy
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

                {/* Section 8 */}
                <section id="data-accuracy">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    8. Data Accuracy Disclaimer
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

                {/* Section 9 */}
                <section id="compliance">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    9. Compliance Obligations
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

                {/* Section 10 */}
                <section id="intellectual-property">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    10. Intellectual Property
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    All content, software, code, design, graphics, logos,
                    trademarks, trade names, and other materials on the
                    Platform (collectively, "Intellectual Property") are owned
                    by or licensed to US Foreclosure Recovery Inc. and are
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

                {/* Section 11 */}
                <section id="liability">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    11. Limitation of Liability
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4 uppercase font-semibold">
                    TO THE FULLEST EXTENT PERMITTED BY LAW, US FORECLOSURE
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

                {/* Section 12 */}
                <section id="indemnification">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    12. Indemnification
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    You agree to indemnify, defend, and hold harmless US
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

                {/* Section 13 */}
                <section id="dispute-resolution">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    13. Dispute Resolution & Arbitration
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
                    shall take place in the State of Florida unless otherwise
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

                {/* Section 14 */}
                <section id="governing-law">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    14. Governing Law
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    These Terms and any Disputes arising out of or related to
                    the Service shall be governed by and construed in
                    accordance with the laws of the State of Florida, without
                    regard to its conflict of laws principles.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    To the extent that arbitration does not apply or is
                    unavailable, you agree to submit to the exclusive
                    jurisdiction of the state and federal courts located in the
                    State of Florida for resolution of any legal proceedings.
                  </p>
                </section>

                {/* Section 15 */}
                <section id="modifications">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    15. Modifications to Terms
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

                {/* Section 16 */}
                <section id="severability">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    16. Severability
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

                {/* Section 17 */}
                <section id="entire-agreement">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    17. Entire Agreement
                  </h2>
                  <p className="text-slate-700 leading-relaxed">
                    These Terms, together with the Privacy Policy and any other
                    policies or agreements referenced herein, constitute the
                    entire agreement between you and US Foreclosure Recovery
                    Inc. regarding the Service and supersede all prior or
                    contemporaneous communications, agreements, and
                    understandings, whether written or oral.
                  </p>
                </section>

                {/* Section 18 */}
                <section id="contact">
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-[#10b981] pb-2">
                    18. Contact Information
                  </h2>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    If you have any questions, concerns, or complaints
                    regarding these Terms of Service or the Platform, please
                    contact us at:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                    <p className="text-slate-900 font-semibold mb-2">
                      US Foreclosure Recovery Inc.
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
                </section>
              </div>

              {/* Acknowledgment Box */}
              <div className="mt-12 bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] text-white rounded-lg p-6 border-2 border-[#10b981]">
                <h3 className="text-xl font-bold mb-3">
                  Acknowledgment of Terms
                </h3>
                <p className="text-sm leading-relaxed">
                  By using the US Foreclosure Recovery platform, you acknowledge
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
          <p className="text-sm">
            &copy; {new Date().getFullYear()} US Foreclosure Recovery Inc. All
            rights reserved.
          </p>
          <p className="text-xs text-slate-300 mt-2">
            Last Updated: February 2, 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
