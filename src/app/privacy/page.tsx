"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";

const sections = [
  { id: "information-collected", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Information" },
  { id: "data-sources", title: "Data Sources" },
  { id: "skip-tracing", title: "Skip Tracing & Data Enrichment" },
  { id: "dnc-compliance", title: "Do Not Call Compliance" },
  { id: "tcpa-compliance", title: "TCPA Compliance" },
  { id: "data-sharing", title: "Data Sharing & Third Parties" },
  { id: "data-retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights" },
  { id: "cookies", title: "Cookies & Tracking" },
  { id: "security", title: "Security Measures" },
  { id: "children", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {/* Mobile TOC Dropdown */}
      <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-slate-900"
        >
          <span>Table of Contents</span>
          <svg
            className={`w-5 h-5 transition-transform ${
              isMobileMenuOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
          <nav className="border-t border-slate-200 bg-white max-h-96 overflow-y-auto">
            {sections.map(({ id, title }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                  activeSection === id
                    ? "bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                {title}
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 flex gap-12">
        {/* Desktop Sidebar TOC */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
              Table of Contents
            </h3>
            <nav className="space-y-1">
              {sections.map(({ id, title }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-all ${
                    activeSection === id
                      ? "bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600"
                      : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent hover:border-slate-300"
                  }`}
                >
                  {title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-slate-600">
              Last Updated: February 2026
            </p>
            <div className="mt-6 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
              <p className="text-slate-700 leading-relaxed">
                US Foreclosure Recovery Inc. ("Company," "we," "us," or "our")
                respects your privacy and is committed to protecting your
                personal information. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                use our foreclosure leads software-as-a-service platform located
                at usforeclosurerecovery.com (the "Service").
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section id="information-collected" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              1. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              1.1 Information You Provide
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We collect information that you voluntarily provide when
              registering for an account, using the Service, or contacting us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Account Information: Name, email address, phone number, company name, business address</li>
              <li>Payment Information: Billing address, credit card details (processed by third-party payment processors)</li>
              <li>Profile Information: Professional credentials, area of practice, license numbers</li>
              <li>Communications: Messages sent through contact forms, support tickets, or email correspondence</li>
              <li>User-Generated Content: Notes, tags, filters, saved searches, and other data you input into the platform</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              1.2 Information Collected Automatically
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              When you access or use our Service, we automatically collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Device Information: IP address, browser type, operating system, device identifiers</li>
              <li>Usage Data: Pages visited, features accessed, time spent on pages, click patterns, session recordings</li>
              <li>Location Data: General geographic location derived from IP address</li>
              <li>Cookies and Similar Technologies: Session identifiers, preference settings, authentication tokens</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              1.3 Information from Third-Party Sources
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We obtain foreclosure and property owner information from publicly
              available sources and data providers, as detailed in Section 3
              below.
            </p>
          </section>

          {/* Section 2 */}
          <section id="how-we-use" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              2. How We Use Your Information
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>
                <strong>Service Delivery:</strong> To provide, maintain, and
                improve the foreclosure leads platform, including generating
                leads, filtering data, and delivering search results
              </li>
              <li>
                <strong>Account Management:</strong> To create and manage your
                account, authenticate users, and process subscription payments
              </li>
              <li>
                <strong>Communication:</strong> To send transactional emails,
                service updates, billing notifications, and respond to inquiries
              </li>
              <li>
                <strong>Personalization:</strong> To customize your experience,
                save preferences, and display relevant leads based on your search
                criteria
              </li>
              <li>
                <strong>Analytics:</strong> To analyze usage patterns, measure
                platform performance, and identify areas for improvement
              </li>
              <li>
                <strong>Security:</strong> To detect and prevent fraud, abuse,
                unauthorized access, and other security incidents
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable
                laws, regulations, legal processes, and enforceable governmental
                requests
              </li>
              <li>
                <strong>Marketing:</strong> With your consent, to send
                promotional materials, newsletters, and information about new
                features (opt-out available)
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="data-sources" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              3. Data Sources
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our Service aggregates foreclosure information from various public
              and commercial sources:
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              3.1 Public Records
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>County recorder offices and clerk of court databases</li>
              <li>State and federal court filings and dockets</li>
              <li>Tax assessor and property appraiser records</li>
              <li>Notice of default (NOD) and notice of trustee sale (NOTS) filings</li>
              <li>Deed recordings, mortgage assignments, and lien documents</li>
              <li>Bankruptcy court filings (PACER system)</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              3.2 Commercial Data Providers
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We license data from reputable third-party vendors who compile
              public records and provide additional property intelligence:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>National foreclosure tracking services</li>
              <li>Property data aggregators and multiple listing services (MLS)</li>
              <li>Title companies and settlement service providers</li>
              <li>Real estate analytics platforms</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              3.3 Data Accuracy and Updates
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We strive to maintain accurate and current information. However, we
              do not guarantee the accuracy, completeness, or timeliness of data
              obtained from third-party sources. Users are responsible for
              independently verifying all information before taking any action.
            </p>
          </section>

          {/* Section 4 */}
          <section id="skip-tracing" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              4. Skip Tracing & Data Enrichment
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our Service includes skip tracing functionality to help users
              locate current contact information for property owners facing
              foreclosure.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              4.1 Skip Tracing Methods
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We employ the following techniques to locate individuals:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Searching consumer reporting agency databases (with permissible purpose under FCRA)</li>
              <li>Cross-referencing utility connection records and forwarding addresses</li>
              <li>Querying voter registration and DMV records where legally available</li>
              <li>Analyzing social media public profiles and online directories</li>
              <li>Reverse phone lookups and email append services</li>
              <li>Relative and associate searches through publicly available genealogy data</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              4.2 Permissible Use Requirements
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Skip tracing data is provided for legitimate business purposes only.
              Users agree to comply with all applicable laws, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Fair Credit Reporting Act (FCRA) permissible purpose requirements</li>
              <li>Gramm-Leach-Bliley Act (GLBA) safeguards for non-public personal information</li>
              <li>State privacy laws governing use of personal information</li>
              <li>Prohibition against stalking, harassment, or other unlawful purposes</li>
            </ul>

            <div className="mt-6 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
              <p className="text-slate-700 font-semibold mb-2">Important Notice:</p>
              <p className="text-slate-700 leading-relaxed">
                Misuse of skip tracing data may result in immediate account
                termination and potential legal liability. Users must maintain
                their own compliance programs and obtain necessary consents before
                contacting individuals.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="dnc-compliance" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              5. Do Not Call (DNC) Compliance
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We provide tools to help users comply with federal and state Do Not
              Call regulations, but ultimate compliance responsibility rests with
              the user.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              5.1 DNC Scrubbing Features
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Integration with National Do Not Call Registry scrubbing services</li>
              <li>State-specific DNC list filtering where available</li>
              <li>Internal suppression list management for user-maintained opt-outs</li>
              <li>Automated flagging of numbers on DNC registries</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              5.2 Established Business Relationship (EBR) Exception
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Users must independently determine whether an Established Business
              Relationship exists before contacting individuals on DNC lists. We
              do not make EBR determinations on behalf of users.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              5.3 User Responsibilities
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Users are solely responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Subscribing to and maintaining current DNC registry access</li>
              <li>Scrubbing phone numbers before making calls</li>
              <li>Honoring individual opt-out requests within 30 days</li>
              <li>Maintaining internal suppression lists for at least five years</li>
              <li>Training staff on DNC compliance requirements</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="tcpa-compliance" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              6. TCPA Compliance
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              The Telephone Consumer Protection Act (TCPA) restricts certain types
              of telephone communications. Users must comply with all TCPA
              requirements when using our Service.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              6.1 Prior Express Written Consent
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Before using automated telephone dialing systems, prerecorded
              messages, or SMS/text messages to contact individuals, users must
              obtain prior express written consent that includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Clear and conspicuous disclosure of telemarketing purpose</li>
              <li>Specific phone number to be called</li>
              <li>Signature authorizing calls using an autodialer or prerecorded voice</li>
              <li>Statement that consent is not a condition of purchase</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              6.2 Wireless Number Identification
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our Service includes wireless number flagging to help identify cell
              phones, which require consent before automated calling. However, we
              do not guarantee 100% accuracy of wireless indicators.
            </p>

            <h3 className="text-xl font-semibold text-tcpa-900 mb-4 mt-8">
              6.3 Time-of-Day Restrictions
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Calls to residential numbers are prohibited before 8:00 AM or after
              9:00 PM in the recipient's local time zone. Users must configure
              calling systems to respect these restrictions.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              6.4 Revocation of Consent
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Individuals may revoke consent at any time using any reasonable
              method. Users must immediately honor revocation requests and
              maintain records of such revocations.
            </p>

            <div className="mt-6 p-6 bg-red-50 border-l-4 border-red-600 rounded-r-lg">
              <p className="text-slate-700 font-semibold mb-2">TCPA Penalties:</p>
              <p className="text-slate-700 leading-relaxed">
                TCPA violations can result in statutory damages of $500 to $1,500
                per call. Users are solely liable for their own TCPA compliance
                and any resulting penalties.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="data-sharing" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              7. Data Sharing & Third Parties
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We may share your information with third parties in the following
              circumstances:
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              7.1 Service Providers
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We engage third-party companies to perform services on our behalf:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Payment processors (Stripe, PayPal)</li>
              <li>Cloud hosting and infrastructure providers (AWS, Google Cloud)</li>
              <li>Email delivery services (SendGrid, Mailgun)</li>
              <li>Analytics platforms (Google Analytics, Mixpanel)</li>
              <li>Customer support tools (Intercom, Zendesk)</li>
              <li>Data enrichment and skip tracing vendors</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-6">
              These service providers are contractually obligated to protect your
              information and use it only for the purposes we specify.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              7.2 Business Transfers
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              If we are involved in a merger, acquisition, financing, bankruptcy,
              or sale of assets, your information may be transferred as part of
              that transaction. We will notify you of any change in ownership or
              control of your personal information.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              7.3 Legal Requirements
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We may disclose your information if required by law, regulation,
              legal process, or governmental request, or to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Comply with subpoenas, court orders, or discovery requests</li>
              <li>Enforce our Terms of Service or other agreements</li>
              <li>Protect our rights, property, or safety</li>
              <li>Investigate fraud, security breaches, or policy violations</li>
              <li>Respond to emergency situations involving danger of death or serious injury</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              7.4 Aggregated Data
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We may share aggregated, de-identified, or anonymized data that
              cannot reasonably be used to identify you. This includes industry
              benchmarks, market trends, and statistical analysis.
            </p>
          </section>

          {/* Section 8 */}
          <section id="data-retention" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              8. Data Retention
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We retain your information for as long as necessary to provide the
              Service and fulfill the purposes outlined in this Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              8.1 Active Accounts
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Account information: Duration of active subscription plus 7 years for tax/audit purposes</li>
              <li>Usage logs: 24 months for analytics and security monitoring</li>
              <li>Payment records: 7 years as required by accounting regulations</li>
              <li>Support tickets: 3 years after resolution</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              8.2 Closed Accounts
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              After account closure, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Delete or anonymize personal information within 90 days, except where retention is required by law</li>
              <li>Retain transaction records for 7 years for financial compliance</li>
              <li>Maintain de-identified usage data for analytics purposes</li>
              <li>Preserve data subject to legal holds or ongoing investigations</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              8.3 Foreclosure Lead Data
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Public foreclosure records displayed through our Service are
              refreshed regularly based on source availability. Historical records
              may be retained indefinitely for trend analysis and comparative
              market studies.
            </p>
          </section>

          {/* Section 9 */}
          <section id="your-rights" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              9. Your Rights
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding
              your personal information.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              9.1 California Residents (CCPA/CPRA)
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              California residents have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li><strong>Know:</strong> Request disclosure of personal information collected, used, or sold in the past 12 months</li>
              <li><strong>Access:</strong> Obtain a copy of your personal information in a portable format</li>
              <li><strong>Delete:</strong> Request deletion of your personal information (subject to legal exceptions)</li>
              <li><strong>Correct:</strong> Request correction of inaccurate personal information</li>
              <li><strong>Opt-Out:</strong> Opt out of the sale or sharing of personal information for targeted advertising</li>
              <li><strong>Limit:</strong> Limit use and disclosure of sensitive personal information</li>
              <li><strong>Non-Discrimination:</strong> Exercise these rights without discriminatory treatment</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              9.2 Other State-Specific Rights
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Residents of Virginia, Colorado, Connecticut, Utah, and other states
              with comprehensive privacy laws have similar rights. We honor all
              applicable state privacy law requests.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              9.3 Exercising Your Rights
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              To exercise any of these rights, please submit a request to:
            </p>
            <div className="p-6 bg-slate-100 rounded-lg mb-6">
              <p className="text-slate-700 mb-2">
                <strong>Email:</strong> support@usforeclosurerecovery.com
              </p>
              <p className="text-slate-700 mb-2">
                <strong>Subject Line:</strong> Privacy Rights Request
              </p>
              <p className="text-slate-700">
                <strong>Include:</strong> Your full name, email address, account details, and specific request type
              </p>
            </div>
            <p className="text-slate-700 leading-relaxed mb-4">
              We will respond to verified requests within 45 days. We may request
              additional information to verify your identity before processing
              requests.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              9.4 Authorized Agents
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              You may designate an authorized agent to submit requests on your
              behalf. We require written authorization signed by you and proof of
              the agent's identity.
            </p>
          </section>

          {/* Section 10 */}
          <section id="cookies" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              10. Cookies & Tracking Technologies
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We use cookies, web beacons, and similar tracking technologies to
              collect information about your interaction with our Service.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              10.1 Types of Cookies We Use
            </h3>

            <div className="space-y-6 mb-6">
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Essential Cookies</h4>
                <p className="text-slate-700">
                  Required for basic site functionality, authentication, and
                  security. Cannot be disabled.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Performance Cookies</h4>
                <p className="text-slate-700">
                  Collect analytics data about site usage, page load times, and
                  error tracking to improve performance.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Functional Cookies</h4>
                <p className="text-slate-700">
                  Remember your preferences, saved searches, filter settings, and
                  interface customizations.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Advertising Cookies</h4>
                <p className="text-slate-700">
                  Track browsing activity across sites to deliver targeted
                  advertisements (third-party, opt-out available).
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              10.2 Third-Party Tracking
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our Service uses third-party analytics and advertising services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Google Analytics (web traffic analysis)</li>
              <li>Facebook Pixel (conversion tracking)</li>
              <li>LinkedIn Insight Tag (B2B advertising)</li>
              <li>Hotjar (session recordings and heatmaps)</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              10.3 Managing Cookie Preferences
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              You can control cookies through:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Browser settings to block or delete cookies</li>
              <li>Our cookie preference center (accessible in account settings)</li>
              <li>Industry opt-out tools: Digital Advertising Alliance (DAA) or Network Advertising Initiative (NAI)</li>
              <li>Global Privacy Control (GPC) signals (honored for California residents)</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-4">
              Note: Disabling essential cookies may impact site functionality.
            </p>
          </section>

          {/* Section 11 */}
          <section id="security" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              11. Security Measures
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your
              information from unauthorized access, alteration, disclosure, or
              destruction.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              11.1 Technical Safeguards
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>TLS/SSL encryption for data transmission (HTTPS)</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Multi-factor authentication (MFA) for account access</li>
              <li>Regular security audits and penetration testing</li>
              <li>Intrusion detection and prevention systems</li>
              <li>Database access controls and query logging</li>
              <li>Secure API authentication with rotating tokens</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              11.2 Organizational Safeguards
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Employee background checks and security training</li>
              <li>Role-based access controls (RBAC) limiting data exposure</li>
              <li>Confidentiality agreements with all personnel</li>
              <li>Incident response plan and breach notification procedures</li>
              <li>Regular backups with disaster recovery protocols</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              11.3 Data Breach Notification
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              In the event of a data breach affecting your personal information,
              we will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Notify affected users within 72 hours of discovery</li>
              <li>Describe the nature and scope of the breach</li>
              <li>Detail steps taken to mitigate harm</li>
              <li>Provide guidance on protective measures you can take</li>
              <li>Report to regulatory authorities as required by law</li>
            </ul>

            <div className="mt-6 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
              <p className="text-slate-700 leading-relaxed">
                <strong>Your Responsibility:</strong> You are responsible for
                maintaining the confidentiality of your account credentials. Never
                share your password, and contact us immediately if you suspect
                unauthorized access.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="children" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              12. Children's Privacy
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our Service is not intended for individuals under the age of 18. We
              do not knowingly collect personal information from children.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              If we become aware that we have inadvertently collected personal
              information from a child under 18, we will take immediate steps to
              delete such information from our systems. If you believe we have
              collected information from a child, please contact us at
              support@usforeclosurerecovery.com.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              Parents and guardians have the right to request disclosure of any
              information we may have collected about their child and to request
              deletion of such information.
            </p>
          </section>

          {/* Section 13 */}
          <section id="changes" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              13. Changes to This Privacy Policy
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, legal requirements, or other
              factors.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              13.1 Notification of Material Changes
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              If we make material changes that significantly affect your rights or
              how we handle your personal information, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-6">
              <li>Post a prominent notice on our website homepage for 30 days</li>
              <li>Send email notification to registered users</li>
              <li>Update the "Last Updated" date at the top of this policy</li>
              <li>For significant changes, obtain your affirmative consent before applying the new terms</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              13.2 Your Continued Use
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Your continued use of the Service after the effective date of a
              revised Privacy Policy constitutes your acceptance of the changes.
              If you do not agree with the updated policy, you must discontinue
              use and may request account deletion.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-8">
              13.3 Policy Archive
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Previous versions of this Privacy Policy are available upon request.
              Contact support@usforeclosurerecovery.com to review historical
              versions.
            </p>
          </section>

          {/* Section 14 */}
          <section id="contact" className="mb-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-blue-600">
              14. Contact Us
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              If you have questions, concerns, or requests regarding this Privacy
              Policy or our data practices, please contact us:
            </p>

            <div className="p-8 bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                US Foreclosure Recovery Inc.
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-900">Email</p>
                    <a href="mailto:support@usforeclosurerecovery.com" className="text-blue-600 hover:text-blue-700 underline">
                      support@usforeclosurerecovery.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-900">Website</p>
                    <a href="https://usforeclosurerecovery.com" className="text-blue-600 hover:text-blue-700 underline">
                      usforeclosurerecovery.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-900">Privacy Rights Requests</p>
                    <p className="text-slate-700">
                      Subject Line: "Privacy Rights Request"<br />
                      Include: Full name, email, account details, request type
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-200">
                <p className="text-sm text-slate-600 leading-relaxed">
                  We aim to respond to all inquiries within 3 business days.
                  Privacy rights requests will be processed within 45 days as
                  required by law.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t border-slate-300">
            <div className="text-center">
              <p className="text-slate-600 mb-4">
                This Privacy Policy was last updated on February 1, 2026.
              </p>
              <p className="text-sm text-slate-500">
                © 2026 US Foreclosure Recovery Inc. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
