"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";

export default function CompliancePage() {
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = [
    { id: "commitment", title: "Our Compliance Commitment" },
    { id: "tcpa", title: "TCPA Compliance" },
    { id: "dnc", title: "Do Not Call Registry" },
    { id: "fdcpa", title: "Fair Debt Collection Practices Act" },
    { id: "state-regulations", title: "State-Specific Regulations" },
    { id: "data-protection", title: "Data Protection & Privacy" },
    { id: "public-records", title: "Public Records & Data Sourcing" },
    { id: "skip-tracing", title: "Skip Tracing Compliance" },
    { id: "ringless-voicemail", title: "Ringless Voicemail Compliance" },
    { id: "anti-fraud", title: "Anti-Fraud Measures" },
    { id: "record-keeping", title: "Record Keeping & Audit Trail" },
    { id: "user-requirements", title: "User Compliance Requirements" },
    { id: "reporting", title: "Reporting Violations" },
    { id: "updates-training", title: "Compliance Updates & Training" },
    { id: "contact", title: "Contact Our Compliance Team" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -35% 0px",
      }
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
      const offset = 80;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 lg:mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1e3a5f] mb-4">
              Compliance & Legal Information
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              US Foreclosure Recovery Inc. maintains the highest standards of
              legal compliance across all aspects of our foreclosure surplus
              fund recovery services. This page outlines our comprehensive
              approach to regulatory adherence and data protection.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last Updated: February 2, 2026
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Desktop Sidebar TOC */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-[#1e3a5f] mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    Table of Contents
                  </h2>
                  <nav className="space-y-1">
                    {sections.map(({ id, title }) => (
                      <button
                        key={id}
                        onClick={() => scrollToSection(id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          activeSection === id
                            ? "bg-[#1e3a5f] text-white font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {title}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Mobile TOC Dropdown */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full bg-white rounded-lg shadow-md border border-gray-200 px-4 py-3 flex items-center justify-between text-[#1e3a5f] font-medium"
              >
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
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
                <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  {sections.map(({ id, title }) => (
                    <button
                      key={id}
                      onClick={() => scrollToSection(id)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeSection === id
                          ? "bg-[#1e3a5f] text-white font-medium"
                          : "text-gray-700 hover:bg-gray-100"
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
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 lg:p-10">
                {/* Section 1: Our Compliance Commitment */}
                <section id="commitment" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Our Compliance Commitment
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      US Foreclosure Recovery Inc. is committed to operating
                      with the highest level of ethical standards and legal
                      compliance in all jurisdictions where we conduct business.
                      Our platform and services are designed from the ground up
                      to meet or exceed all applicable federal, state, and local
                      regulations governing foreclosure surplus fund recovery,
                      consumer protection, and data privacy.
                    </p>
                    <p>
                      We recognize that compliance is not a one-time achievement
                      but an ongoing commitment that requires constant vigilance,
                      regular updates, and comprehensive training. Our dedicated
                      compliance team monitors regulatory developments across all
                      50 states and works proactively to ensure our systems,
                      processes, and user practices remain fully compliant with
                      evolving legal requirements.
                    </p>
                    <p>
                      This commitment extends to every aspect of our operations,
                      including data collection and storage, communications with
                      property owners, fee structures, record keeping, and user
                      training. We maintain detailed documentation of all
                      compliance measures and undergo regular third-party audits
                      to verify our adherence to applicable regulations.
                    </p>
                  </div>
                </section>

                {/* Section 2: TCPA Compliance */}
                <section id="tcpa" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    TCPA Compliance
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      The Telephone Consumer Protection Act (TCPA) of 1991
                      regulates telephone solicitations and the use of automated
                      telephone equipment. US Foreclosure Recovery Inc. strictly
                      adheres to all TCPA requirements in our operations and
                      requires all users of our platform to maintain the same
                      standards.
                    </p>

                    <div className="bg-blue-50 border-l-4 border-[#3b82f6] p-6 my-6">
                      <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">
                        Consent Requirements
                      </h3>
                      <p className="mb-2">
                        Prior express written consent is required before making
                        any call using an automatic telephone dialing system
                        (ATDS), artificial or prerecorded voice, or sending text
                        messages to wireless numbers. Our platform includes:
                      </p>
                      <ul className="list-disc ml-6 space-y-2">
                        <li>
                          Consent tracking and documentation for all
                          communications
                        </li>
                        <li>
                          Clear opt-in mechanisms that meet FCC requirements
                        </li>
                        <li>
                          Automatic logging of consent date, time, and method
                        </li>
                        <li>
                          Easy opt-out procedures available in every
                          communication
                        </li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Permitted Calling Hours
                    </h3>
                    <p>
                      All outbound calls must be made between 8:00 AM and 9:00
                      PM in the recipient's local time zone. Our system
                      automatically enforces these restrictions and prevents
                      calls outside permitted hours. Users attempting to schedule
                      calls outside these hours will receive warnings and be
                      unable to proceed.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Identification Requirements
                    </h3>
                    <p>
                      Every communication must clearly identify the caller and
                      provide a telephone number or address where the caller may
                      be reached. Our platform requires users to configure caller
                      ID information and automatically includes contact
                      information in all automated messages and ringless
                      voicemail drops.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Call Frequency Limitations
                    </h3>
                    <p>
                      We enforce reasonable call frequency limits to prevent
                      harassment. Our system tracks all contact attempts and
                      restricts users from making excessive calls to the same
                      number within short time periods. Default settings limit
                      contact to no more than three attempts per week per
                      property owner, though users may adjust this within
                      compliant parameters.
                    </p>
                  </div>
                </section>

                {/* Section 3: Do Not Call Registry */}
                <section id="dnc" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Do Not Call (DNC) Registry Compliance
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      US Foreclosure Recovery Inc. maintains comprehensive Do Not
                      Call list management to ensure compliance with both federal
                      and state DNC registries. We implement multiple layers of
                      protection to prevent calls to numbers on these restricted
                      lists.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Federal DNC Registry
                    </h3>
                    <p>
                      We maintain current subscriptions to the National Do Not
                      Call Registry and download updates on a regular basis. All
                      phone numbers in our system are automatically scrubbed
                      against the federal DNC list before any contact is
                      permitted. Numbers on the federal registry are flagged and
                      blocked from all outbound communications except where
                      established business relationship (EBR) or prior express
                      written consent exists.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      State-Specific DNC Lists
                    </h3>
                    <p>
                      In addition to federal requirements, numerous states
                      maintain their own Do Not Call registries with additional
                      restrictions. We subscribe to and regularly update data
                      from all state-level DNC registries, including but not
                      limited to:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>California DNC list</li>
                      <li>Florida DNC list</li>
                      <li>Texas No Call list</li>
                      <li>Indiana DNC list</li>
                      <li>Missouri No Call list</li>
                      <li>All other state registries with available data</li>
                    </ul>

                    <div className="bg-green-50 border-l-4 border-[#10b981] p-6 my-6">
                      <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">
                        Scrubbing Process & Frequency
                      </h3>
                      <p className="mb-2">
                        Our DNC scrubbing process operates on the following
                        schedule:
                      </p>
                      <ul className="list-disc ml-6 space-y-2">
                        <li>
                          Federal DNC Registry: Updated monthly with full
                          re-scrub
                        </li>
                        <li>
                          State DNC Registries: Updated quarterly or more
                          frequently as data becomes available
                        </li>
                        <li>
                          Internal DNC list: Updated in real-time as opt-out
                          requests are received
                        </li>
                        <li>
                          Pre-call verification: Every number is checked
                          immediately before contact
                        </li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Internal Suppression Lists
                    </h3>
                    <p>
                      Beyond regulatory registries, we maintain internal
                      suppression lists for numbers that have requested removal
                      from our communications. These opt-out requests are honored
                      immediately and permanently across our entire platform. We
                      also maintain company-level suppression lists where users
                      can add numbers specific to their operations.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Safe Harbor Compliance
                    </h3>
                    <p>
                      To maintain safe harbor protections under TCPA, we access
                      the National Do Not Call Registry at least once every 31
                      days and document each access. Our scrubbing occurs more
                      frequently than required to provide additional protection
                      for both our company and our users.
                    </p>
                  </div>
                </section>

                {/* Section 4: FDCPA */}
                <section id="fdcpa" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Fair Debt Collection Practices Act (FDCPA)
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      While foreclosure surplus fund recovery does not constitute
                      debt collection in the traditional sense, US Foreclosure
                      Recovery Inc. recognizes that certain FDCPA principles and
                      best practices apply to our operations. We voluntarily
                      adopt FDCPA standards as a framework for ethical
                      communications with property owners.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Applicability to Surplus Recovery
                    </h3>
                    <p>
                      Foreclosure surplus funds represent money owed TO the
                      property owner by the county or court, not money owed BY
                      the property owner. Therefore, recovery specialists are not
                      collecting debts. However, we apply FDCPA-style protections
                      to ensure respectful, honest, and non-harassing
                      communications in all interactions.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Prohibited Practices
                    </h3>
                    <p>
                      Our platform prohibits users from engaging in any practices
                      that would violate FDCPA standards if they were applicable,
                      including:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        False or misleading representations about the nature of
                        surplus funds
                      </li>
                      <li>
                        Threats of action that cannot legally be taken or is not
                        intended to be taken
                      </li>
                      <li>
                        Use of obscene, profane, or abusive language in any
                        communication
                      </li>
                      <li>
                        Repeated or continuous calls intended to annoy, abuse, or
                        harass
                      </li>
                      <li>
                        Calls without meaningful disclosure of caller's identity
                      </li>
                      <li>
                        False representation of legal status or affiliation with
                        government agencies
                      </li>
                      <li>
                        Communication with third parties about the property
                        owner's financial situation
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Communication Standards
                    </h3>
                    <p>
                      All communications through our platform must be truthful,
                      professional, and respectful. Users must clearly identify
                      themselves, accurately describe the purpose of contact
                      (surplus fund recovery), and provide complete contact
                      information. We require all communications to include
                      opt-out instructions and honor such requests immediately.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Third-Party Disclosure Restrictions
                    </h3>
                    <p>
                      Users are prohibited from discussing surplus fund details
                      with anyone other than the property owner, their attorney,
                      or other authorized representatives. Our training materials
                      emphasize the importance of privacy and confidentiality in
                      all surplus recovery matters.
                    </p>
                  </div>
                </section>

                {/* Section 5: State-Specific Regulations */}
                <section id="state-regulations" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    State-Specific Regulations
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      Foreclosure surplus fund recovery is regulated at the state
                      level, with significant variation in requirements,
                      limitations, and procedures across different jurisdictions.
                      US Foreclosure Recovery Inc. maintains detailed compliance
                      documentation for all 50 states and updates our platform to
                      reflect changes in state law.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Finder Fee Limitations by State
                    </h3>
                    <p>
                      Many states impose maximum percentage limits on finder fees
                      or require specific fee structures. Our platform includes
                      state-specific fee calculators and warnings to prevent
                      users from charging fees that exceed legal limits. Key
                      state restrictions include:
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
                      <h4 className="font-bold text-[#1e3a5f] mb-3">
                        Selected State Fee Restrictions
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>Florida:</strong> Maximum 20% fee for surplus
                          recovery services
                        </li>
                        <li>
                          <strong>California:</strong> Fee limits vary by county;
                          some counties prohibit assignment of surplus claims
                        </li>
                        <li>
                          <strong>Illinois:</strong> Must comply with Assignment
                          of Claim Act requirements
                        </li>
                        <li>
                          <strong>Maryland:</strong> Limited time periods for
                          claiming surplus funds
                        </li>
                        <li>
                          <strong>New York:</strong> Specific notice requirements
                          and redemption periods
                        </li>
                        <li>
                          <strong>Texas:</strong> Surplus funds must be claimed
                          through specific county procedures
                        </li>
                        <li>
                          <strong>Ohio:</strong> Sheriff sale surplus subject to
                          county-specific rules
                        </li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-600">
                        This is a partial list. Our platform includes complete
                        fee limitation data for all states where surplus recovery
                        is permitted.
                      </p>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Licensing Requirements
                    </h3>
                    <p>
                      Some states require specific licenses to engage in surplus
                      fund recovery or claim assignment services. We track
                      licensing requirements by state and provide guidance to
                      users on obtaining necessary credentials. States with
                      specific licensing requirements include those requiring:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>Private investigator licenses for skip tracing</li>
                      <li>
                        Collection agency licenses (in states treating surplus
                        recovery as collection activity)
                      </li>
                      <li>
                        Attorney involvement or supervision for certain aspects of
                        recovery
                      </li>
                      <li>
                        Business licenses or registrations specific to surplus
                        recovery
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Assignment Restrictions
                    </h3>
                    <p>
                      Certain states prohibit or restrict the assignment of
                      surplus fund claims from property owners to third parties.
                      Our platform includes state-by-state guidance on assignment
                      legality and provides alternative service models for
                      restricted jurisdictions, such as:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Representation agreements instead of claim assignments
                      </li>
                      <li>Consulting or assistance fee structures</li>
                      <li>
                        Contingency arrangements that comply with state law
                      </li>
                      <li>
                        Attorney-supervised models where required by state bar
                        associations
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Notification Requirements
                    </h3>
                    <p>
                      Many states mandate specific notification procedures before
                      surplus funds can be claimed, including requirements for:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>Certified mail or registered mail notifications</li>
                      <li>Publication in newspapers of general circulation</li>
                      <li>
                        Specific content and language in notifications to property
                        owners
                      </li>
                      <li>Minimum waiting periods before claims can be filed</li>
                      <li>
                        Proof of delivery or receipt maintained for specified time
                        periods
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 6: Data Protection & Privacy */}
                <section id="data-protection" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Data Protection & Privacy
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      US Foreclosure Recovery Inc. implements comprehensive data
                      protection measures to safeguard personally identifiable
                      information (PII) and maintain the privacy of property
                      owners whose data is processed through our platform. We
                      comply with all applicable federal and state privacy laws,
                      including CCPA, GDPR (for any EU data subjects), and
                      state-specific privacy regulations.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Encryption Standards
                    </h3>
                    <p>
                      All data transmitted to and from our platform is encrypted
                      using industry-standard TLS 1.3 protocol. Data at rest is
                      encrypted using AES-256 encryption. Database connections
                      use encrypted tunnels, and backup data is encrypted both in
                      transit and in storage. We maintain separate encryption
                      keys for different data categories and rotate keys on a
                      regular schedule.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Access Controls
                    </h3>
                    <p>
                      Access to personally identifiable information is strictly
                      controlled through role-based access control (RBAC)
                      systems. Users can only access data necessary for their
                      specific business purposes. Our platform implements:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Multi-factor authentication (MFA) for all user accounts
                      </li>
                      <li>
                        Automatic session timeouts after periods of inactivity
                      </li>
                      <li>
                        IP address restrictions and geofencing capabilities
                      </li>
                      <li>
                        Detailed audit logs of all data access and modifications
                      </li>
                      <li>
                        Automatic alerts for suspicious access patterns
                      </li>
                      <li>
                        Regular access reviews and deprovisioning of inactive
                        accounts
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Data Minimization
                    </h3>
                    <p>
                      We collect and retain only data that is necessary for
                      legitimate foreclosure surplus recovery purposes. Personal
                      information is not used for any purpose other than
                      facilitating contact between recovery specialists and
                      property owners regarding available surplus funds. We do
                      not sell, rent, or share personal data with third parties
                      for marketing purposes.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Data Retention Policies
                    </h3>
                    <p>
                      Personal data is retained only for as long as necessary to
                      fulfill the purposes for which it was collected or as
                      required by law. Our standard retention periods are:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Active lead data: Retained while surplus funds remain
                        available
                      </li>
                      <li>
                        Communication records: 7 years (to meet regulatory
                        requirements)
                      </li>
                      <li>Contract and agreement records: 7 years after expiration</li>
                      <li>
                        Financial transaction records: 7 years (IRS requirements)
                      </li>
                      <li>
                        Opt-out and DNC records: Maintained permanently to honor
                        preferences
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      User Privacy Rights
                    </h3>
                    <p>
                      Property owners whose information is processed through our
                      platform have the right to:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Access their personal information and receive a copy
                      </li>
                      <li>
                        Request correction of inaccurate or incomplete data
                      </li>
                      <li>
                        Request deletion of their data (subject to legal retention
                        requirements)
                      </li>
                      <li>
                        Opt out of communications at any time
                      </li>
                      <li>
                        Restrict processing of their data for certain purposes
                      </li>
                    </ul>
                    <p className="mt-4">
                      Requests regarding privacy rights can be submitted to our
                      privacy team at{" "}
                      <a
                        href="mailto:privacy@usforeclosurerecovery.com"
                        className="text-[#3b82f6] hover:underline"
                      >
                        privacy@usforeclosurerecovery.com
                      </a>
                      .
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Security Incident Response
                    </h3>
                    <p>
                      In the event of a data breach or security incident, we
                      maintain a comprehensive incident response plan that
                      includes immediate containment measures, forensic
                      investigation, notification to affected parties as required
                      by law, and implementation of corrective measures to
                      prevent recurrence. We conduct regular security
                      assessments and penetration testing to identify and address
                      vulnerabilities proactively.
                    </p>
                  </div>
                </section>

                {/* Section 7: Public Records & Data Sourcing */}
                <section id="public-records" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Public Records & Data Sourcing
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      All foreclosure data provided through our platform is
                      sourced exclusively from public records maintained by
                      government entities. We do not engage in any unauthorized
                      data collection or access private databases without proper
                      authorization. Our data collection practices are designed
                      to ensure legal compliance and respect for privacy while
                      providing accurate information to recovery specialists.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Primary Data Sources
                    </h3>
                    <p>
                      Our foreclosure surplus lead data is collected from the
                      following official public sources:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        <strong>County Recorder Offices:</strong> Official land
                        records including deeds, mortgages, and foreclosure filings
                      </li>
                      <li>
                        <strong>Court Records:</strong> Judicial foreclosure
                        proceedings, judgments, and surplus fund determinations
                      </li>
                      <li>
                        <strong>Public Trustees:</strong> Non-judicial foreclosure
                        sales records and surplus distributions
                      </li>
                      <li>
                        <strong>County Treasurer Offices:</strong> Tax sale records
                        and overage calculations
                      </li>
                      <li>
                        <strong>Sheriff Sale Records:</strong> Property auction
                        results and surplus fund availability
                      </li>
                      <li>
                        <strong>State Unclaimed Property Databases:</strong> Surplus
                        funds transferred to state custody
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Data Collection Methods
                    </h3>
                    <p>
                      We employ multiple methods to collect public record data
                      while respecting the access policies of each jurisdiction:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Authorized bulk data purchases from counties offering such
                        programs
                      </li>
                      <li>
                        API access to electronic court filing systems and county
                        databases
                      </li>
                      <li>
                        Manual research and data entry from county websites and
                        portals
                      </li>
                      <li>
                        FOIA (Freedom of Information Act) requests where bulk
                        access is not available
                      </li>
                      <li>
                        Partnerships with data aggregators who maintain
                        relationships with government entities
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Data Accuracy & Verification
                    </h3>
                    <p>
                      While public records are generally reliable, errors and
                      outdated information can occur. We implement multiple
                      quality control measures:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Cross-referencing data from multiple sources to identify
                        discrepancies
                      </li>
                      <li>
                        Regular updates to capture changes in surplus fund status
                      </li>
                      <li>
                        Automated validation checks for data consistency and
                        completeness
                      </li>
                      <li>
                        User feedback mechanisms to report and correct inaccurate
                        information
                      </li>
                      <li>
                        Manual review of high-value surplus cases before release to
                        users
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Public Record Limitations
                    </h3>
                    <p>
                      Users must understand that public records have inherent
                      limitations:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Information may be outdated by the time it appears in our
                        system
                      </li>
                      <li>
                        Contact information in public records may be incomplete or
                        incorrect
                      </li>
                      <li>
                        Property owners may have already been contacted by other
                        recovery specialists
                      </li>
                      <li>
                        Surplus funds may have been claimed or may be subject to
                        liens not reflected in initial records
                      </li>
                    </ul>
                    <p className="mt-4">
                      We recommend that users independently verify all information
                      with the relevant county or court before proceeding with
                      recovery efforts.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Ethical Data Use
                    </h3>
                    <p>
                      Although foreclosure data is publicly available, we require
                      all users to treat this information with respect and
                      discretion. Property owners in foreclosure situations are
                      often experiencing financial hardship, and communications
                      should be conducted with empathy and professionalism. Users
                      are prohibited from using data obtained through our platform
                      for any purpose other than legitimate surplus fund recovery.
                    </p>
                  </div>
                </section>

                {/* Section 8: Skip Tracing Compliance */}
                <section id="skip-tracing" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Skip Tracing Compliance
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      Skip tracing services integrated into our platform are
                      provided in strict compliance with the Fair Credit
                      Reporting Act (FCRA) and other applicable consumer
                      protection laws. We partner only with licensed skip tracing
                      providers who maintain proper permissible purposes for
                      accessing consumer report information.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      FCRA Compliance
                    </h3>
                    <p>
                      The Fair Credit Reporting Act regulates the collection,
                      dissemination, and use of consumer information, including
                      consumer reports used for skip tracing purposes. Our skip
                      tracing operations maintain compliance through:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Partnerships exclusively with FCRA-compliant data providers
                      </li>
                      <li>
                        Verification of permissible purpose before accessing
                        consumer data
                      </li>
                      <li>
                        Detailed logging of all skip trace requests and results
                      </li>
                      <li>
                        User certification of legitimate business purpose for each
                        search
                      </li>
                      <li>
                        Proper handling and storage of consumer report information
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Permissible Purpose Requirements
                    </h3>
                    <p>
                      Under FCRA, consumer report information may only be accessed
                      for specific permissible purposes. In the context of
                      foreclosure surplus recovery, the permissible purpose is
                      typically based on:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Legitimate business need to contact property owners
                        regarding funds owed to them
                      </li>
                      <li>
                        Business transaction initiated by the consumer (when
                        agreement exists)
                      </li>
                      <li>
                        Collection of a debt (in states where surplus recovery may
                        be characterized as collection)
                      </li>
                    </ul>
                    <p className="mt-4">
                      Users must certify their permissible purpose before
                      conducting skip traces through our platform. Misuse of skip
                      tracing services for unauthorized purposes will result in
                      immediate account termination and may be reported to
                      regulatory authorities.
                    </p>

                    <div className="bg-blue-50 border-l-4 border-[#3b82f6] p-6 my-6">
                      <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">
                        Skip Tracing Data Categories
                      </h3>
                      <p className="mb-2">
                        Our skip tracing services may provide the following types
                        of information:
                      </p>
                      <ul className="list-disc ml-6 space-y-2">
                        <li>
                          Current and previous addresses (from public records and
                          utility connections)
                        </li>
                        <li>
                          Phone numbers (landline and mobile, when available)
                        </li>
                        <li>
                          Email addresses (from public sources and opt-in
                          databases)
                        </li>
                        <li>
                          Relatives and associates (from public records only)
                        </li>
                        <li>
                          Property ownership records (current and historical)
                        </li>
                        <li>
                          Business affiliations (from business registration
                          databases)
                        </li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-600">
                        All data is sourced from permissible databases and public
                        records. We do not provide credit information, financial
                        account data, or other protected consumer information
                        through our standard skip tracing services.
                      </p>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Privacy Protections
                    </h3>
                    <p>
                      Skip trace data must be handled with appropriate security
                      measures and used only for the stated purpose. Users are
                      prohibited from:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Sharing skip trace results with unauthorized third parties
                      </li>
                      <li>
                        Using skip trace data for purposes other than surplus fund
                        recovery
                      </li>
                      <li>
                        Retaining skip trace data longer than necessary for the
                        business purpose
                      </li>
                      <li>
                        Combining skip trace data with other databases to create
                        consumer profiles
                      </li>
                      <li>
                        Using skip trace information to harass or annoy property
                        owners
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      State Licensing Requirements
                    </h3>
                    <p>
                      Some states require private investigator licenses or other
                      credentials to conduct skip tracing activities. We provide
                      guidance on state-specific requirements and restrict access
                      to skip tracing services in states where users have not
                      demonstrated proper licensing. States with specific skip
                      tracing regulations include California, Florida, Texas, and
                      others where private investigation laws apply.
                    </p>
                  </div>
                </section>

                {/* Section 9: Ringless Voicemail Compliance */}
                <section id="ringless-voicemail" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Ringless Voicemail (RVM) Compliance
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      Ringless voicemail technology allows users to leave
                      voicemail messages without causing the recipient's phone to
                      ring. While this technology is widely used in sales and
                      marketing, its regulatory status continues to evolve. US
                      Foreclosure Recovery Inc. maintains conservative compliance
                      standards for RVM usage and monitors ongoing legal
                      developments.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      FCC Guidance and TCPA Application
                    </h3>
                    <p>
                      The Federal Communications Commission (FCC) has not issued
                      definitive guidance on whether ringless voicemail
                      constitutes a "call" under the Telephone Consumer Protection
                      Act. In the absence of clear federal rules, we apply TCPA
                      standards to RVM as a best practice, requiring:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Prior express consent before leaving RVM messages on
                        wireless numbers
                      </li>
                      <li>
                        Compliance with DNC registry requirements
                      </li>
                      <li>
                        Clear identification of caller and contact information in
                        every message
                      </li>
                      <li>
                        Opt-out instructions in every voicemail
                      </li>
                      <li>
                        Respect for reasonable hours (same as live calls: 8 AM -
                        9 PM local time)
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      State-Specific RVM Regulations
                    </h3>
                    <p>
                      Several states have enacted or proposed specific regulations
                      governing ringless voicemail. We track these state laws and
                      restrict RVM usage in states with explicit prohibitions or
                      requirements:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        <strong>Florida:</strong> Proposed regulations treating RVM
                        as equivalent to calls for TCPA purposes
                      </li>
                      <li>
                        <strong>Maryland:</strong> Telephone solicitation laws may
                        apply to RVM
                      </li>
                      <li>
                        <strong>Oregon:</strong> Specific consent requirements for
                        automated messages
                      </li>
                      <li>
                        <strong>Arizona:</strong> Consumer protection laws
                        potentially applicable to RVM
                      </li>
                    </ul>
                    <p className="mt-4">
                      Our platform includes state-by-state guidance and may
                      restrict RVM functionality in jurisdictions with unclear or
                      restrictive legal frameworks.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      RVM Content Requirements
                    </h3>
                    <p>
                      All ringless voicemail messages delivered through our
                      platform must include:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Clear identification of the caller or organization
                      </li>
                      <li>
                        Specific purpose of the message (surplus fund recovery
                        opportunity)
                      </li>
                      <li>
                        Callback number prominently stated
                      </li>
                      <li>
                        Instructions for opting out of future voicemail messages
                      </li>
                      <li>
                        Truthful and non-deceptive content
                      </li>
                    </ul>
                    <p className="mt-4">
                      Messages that misrepresent the nature of surplus funds,
                      create false urgency, or use deceptive tactics are strictly
                      prohibited and will result in account suspension.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Opt-Out Management
                    </h3>
                    <p>
                      Recipients of ringless voicemail messages must be provided
                      with a simple and effective means to opt out of future
                      messages. Our platform automatically:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Tracks opt-out requests received via phone or email
                      </li>
                      <li>
                        Suppresses numbers that opt out from all future RVM
                        campaigns
                      </li>
                      <li>
                        Honors opt-out requests within 24 hours or less
                      </li>
                      <li>
                        Maintains permanent records of opt-out requests
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Frequency Limitations
                    </h3>
                    <p>
                      To prevent abuse of RVM technology and maintain professional
                      standards, our platform limits the frequency of ringless
                      voicemail messages to the same number. Default settings
                      restrict RVM drops to no more than one per week per number,
                      though users may configure more conservative limits if
                      desired.
                    </p>

                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 my-6">
                      <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">
                        Emerging Legal Considerations
                      </h3>
                      <p>
                        The legal landscape surrounding ringless voicemail
                        continues to evolve through ongoing litigation and
                        regulatory proceedings. We recommend that users exercise
                        caution with RVM technology and maintain documented
                        consent for all communications. Class action lawsuits
                        related to ringless voicemail have been filed in multiple
                        jurisdictions, and the outcomes of these cases may
                        influence future regulatory guidance.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 10: Anti-Fraud Measures */}
                <section id="anti-fraud" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Anti-Fraud Measures
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      US Foreclosure Recovery Inc. maintains zero tolerance for
                      fraudulent activity on our platform. We implement
                      comprehensive measures to prevent fraud, protect property
                      owners from deceptive practices, and ensure that all users
                      conduct business with integrity and transparency.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Prohibited Fraudulent Activities
                    </h3>
                    <p>
                      The following activities are strictly prohibited and will
                      result in immediate account termination and potential legal
                      action:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Misrepresenting affiliation with government agencies,
                        courts, or law enforcement
                      </li>
                      <li>
                        Falsely claiming to be attorneys or legal professionals
                        without proper credentials
                      </li>
                      <li>
                        Creating false urgency or threatening consequences that do
                        not exist
                      </li>
                      <li>
                        Misrepresenting the amount of surplus funds available
                      </li>
                      <li>
                        Charging excessive fees or hiding fee structures
                      </li>
                      <li>
                        Using forged or falsified documents
                      </li>
                      <li>
                        Impersonating property owners or other parties
                      </li>
                      <li>
                        Engaging in bait-and-switch tactics regarding services or
                        fees
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      User Verification & Screening
                    </h3>
                    <p>
                      All users must complete a verification process before
                      gaining full access to our platform. This process includes:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Identity verification through government-issued ID
                      </li>
                      <li>
                        Business verification for entity accounts
                      </li>
                      <li>
                        Background screening for fraud indicators
                      </li>
                      <li>
                        Review of business practices and compliance history
                      </li>
                      <li>
                        Agreement to comply with platform terms and applicable laws
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Monitoring & Detection Systems
                    </h3>
                    <p>
                      We employ automated and manual monitoring systems to detect
                      potentially fraudulent activity:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Pattern analysis to identify suspicious communication
                        practices
                      </li>
                      <li>
                        Review of complaint patterns and negative feedback
                      </li>
                      <li>
                        Monitoring of fee structures for compliance with state
                        limits
                      </li>
                      <li>
                        Random audits of user communications and documentation
                      </li>
                      <li>
                        Analysis of success rates and claim patterns
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Transparency Requirements
                    </h3>
                    <p>
                      All users must maintain complete transparency with property
                      owners regarding:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Their role as independent recovery specialists (not
                        government officials)
                      </li>
                      <li>
                        The exact fee or percentage they will charge
                      </li>
                      <li>
                        Alternative options available to property owners (such as
                        self-filing)
                      </li>
                      <li>
                        Estimated timeline for recovery
                      </li>
                      <li>
                        Any risks or potential obstacles to successful recovery
                      </li>
                    </ul>
                    <p className="mt-4">
                      Users must provide written agreements that clearly outline
                      all terms and conditions before collecting any fees or
                      obtaining claim assignments.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Consumer Education
                    </h3>
                    <p>
                      We provide educational resources to help property owners
                      recognize legitimate surplus recovery services and avoid
                      fraudulent schemes. Our public-facing materials explain:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        How the foreclosure surplus process works
                      </li>
                      <li>
                        What information legitimate recovery specialists should
                        provide
                      </li>
                      <li>
                        Red flags indicating potential fraud
                      </li>
                      <li>
                        How to verify surplus fund availability independently
                      </li>
                      <li>
                        Where to report suspected fraudulent activity
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Enforcement Actions
                    </h3>
                    <p>
                      When fraudulent activity is detected or reported, we take
                      swift action including:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Immediate suspension of accounts under investigation
                      </li>
                      <li>
                        Permanent termination for confirmed fraudulent conduct
                      </li>
                      <li>
                        Reporting to appropriate law enforcement agencies
                      </li>
                      <li>
                        Notification to affected property owners
                      </li>
                      <li>
                        Cooperation with regulatory investigations
                      </li>
                      <li>
                        Publication of warnings about identified fraudulent
                        operators
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 11: Record Keeping & Audit Trail */}
                <section id="record-keeping" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Record Keeping & Audit Trail
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      Comprehensive record keeping is fundamental to compliance
                      and protection for both our company and our users. US
                      Foreclosure Recovery Inc. maintains detailed records of all
                      platform activities and requires users to maintain proper
                      documentation of their surplus recovery operations.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Platform-Level Record Keeping
                    </h3>
                    <p>
                      Our systems automatically capture and maintain records of:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        All user account registrations and verification activities
                      </li>
                      <li>
                        Lead data access patterns and download history
                      </li>
                      <li>
                        Communication attempts (calls, voicemails, emails) with
                        timestamps
                      </li>
                      <li>
                        Consent records and opt-out requests
                      </li>
                      <li>
                        DNC scrubbing activities and results
                      </li>
                      <li>
                        Skip tracing requests and permissible purpose
                        certifications
                      </li>
                      <li>
                        User complaints and resolution actions
                      </li>
                      <li>
                        Compliance violations and enforcement actions
                      </li>
                      <li>
                        System access logs and security events
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      User Documentation Requirements
                    </h3>
                    <p>
                      Platform users must maintain detailed records of their
                      surplus recovery activities, including:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Initial contact attempts and property owner responses
                      </li>
                      <li>
                        Written agreements or contracts with property owners
                      </li>
                      <li>
                        Proof of service or delivery for required notifications
                      </li>
                      <li>
                        Documentation of surplus fund verification with counties
                      </li>
                      <li>
                        Claim filing documentation and court submissions
                      </li>
                      <li>
                        Fee calculations and payment receipts
                      </li>
                      <li>
                        Any correspondence with government agencies
                      </li>
                      <li>
                        Records of disputes or complaints and their resolution
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Retention Periods
                    </h3>
                    <p>
                      Different types of records must be retained for specific
                      periods to meet legal and regulatory requirements:
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
                      <h4 className="font-bold text-[#1e3a5f] mb-3">
                        Minimum Retention Requirements
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <strong>TCPA Consent Records:</strong> 4 years from date
                          of consent or last contact
                        </li>
                        <li>
                          <strong>DNC Registry Downloads:</strong> 2 years
                        </li>
                        <li>
                          <strong>Communication Records:</strong> 7 years (calls,
                          emails, voicemails)
                        </li>
                        <li>
                          <strong>Contracts & Agreements:</strong> 7 years after
                          expiration or completion
                        </li>
                        <li>
                          <strong>Financial Records:</strong> 7 years (IRS
                          requirements)
                        </li>
                        <li>
                          <strong>Opt-Out Requests:</strong> Permanent (maintained
                          indefinitely)
                        </li>
                        <li>
                          <strong>Compliance Violations:</strong> 10 years
                        </li>
                        <li>
                          <strong>Skip Trace Logs:</strong> 5 years (FCRA
                          requirements)
                        </li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Audit Trail Integrity
                    </h3>
                    <p>
                      All system logs and audit trails are protected against
                      tampering through:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Write-once storage for critical compliance records
                      </li>
                      <li>
                        Cryptographic hashing to detect unauthorized modifications
                      </li>
                      <li>
                        Separate storage of audit logs from production systems
                      </li>
                      <li>
                        Restricted access to audit data limited to compliance
                        personnel
                      </li>
                      <li>
                        Regular backup of all compliance records to secure
                        off-site storage
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Third-Party Audits
                    </h3>
                    <p>
                      US Foreclosure Recovery Inc. undergoes regular third-party
                      compliance audits to verify our record keeping practices and
                      overall regulatory adherence. These audits include:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Annual TCPA compliance reviews
                      </li>
                      <li>
                        Quarterly data security assessments
                      </li>
                      <li>
                        Semi-annual DNC scrubbing procedure verification
                      </li>
                      <li>
                        Random sampling of user communications for compliance
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Record Retrieval & Production
                    </h3>
                    <p>
                      In the event of regulatory inquiries, litigation, or
                      subpoenas, we maintain the capability to quickly retrieve
                      and produce relevant records. Our document management
                      systems support rapid searching, filtering, and export of
                      compliance documentation in standard formats accepted by
                      courts and regulatory agencies.
                    </p>
                  </div>
                </section>

                {/* Section 12: User Compliance Requirements */}
                <section id="user-requirements" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    User Compliance Requirements
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      All users of the US Foreclosure Recovery platform are
                      independent business operators responsible for their own
                      compliance with applicable laws and regulations. While we
                      provide tools and guidance to facilitate compliance, users
                      bear ultimate responsibility for the legality of their
                      operations.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Pre-Registration Requirements
                    </h3>
                    <p>
                      Before gaining access to foreclosure lead data, users must:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Complete identity verification process
                      </li>
                      <li>
                        Provide business registration information (if operating as
                        entity)
                      </li>
                      <li>
                        Certify understanding of TCPA, FDCPA, and DNC requirements
                      </li>
                      <li>
                        Acknowledge state-specific regulations applicable to their
                        operations
                      </li>
                      <li>
                        Agree to platform Terms of Service and Acceptable Use
                        Policy
                      </li>
                      <li>
                        Complete mandatory compliance training modules
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Ongoing Compliance Obligations
                    </h3>
                    <p>
                      Throughout their use of the platform, users must:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Maintain all required business licenses and registrations
                      </li>
                      <li>
                        Obtain and document proper consent before making calls or
                        sending messages
                      </li>
                      <li>
                        Comply with all DNC registry requirements
                      </li>
                      <li>
                        Respect time-of-day restrictions for communications
                      </li>
                      <li>
                        Honor opt-out requests immediately
                      </li>
                      <li>
                        Maintain accurate caller ID and contact information
                      </li>
                      <li>
                        Charge only lawful fees within state-mandated limits
                      </li>
                      <li>
                        Provide truthful and non-deceptive information to property
                        owners
                      </li>
                      <li>
                        Maintain required documentation and records
                      </li>
                      <li>
                        Report any compliance incidents or violations
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Communication Standards
                    </h3>
                    <p>
                      Users must adhere to professional communication standards:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Clearly identify themselves and their business
                      </li>
                      <li>
                        Accurately explain the surplus fund recovery process
                      </li>
                      <li>
                        Disclose their role as independent recovery specialists
                        (not government agents)
                      </li>
                      <li>
                        Provide clear information about fees and services
                      </li>
                      <li>
                        Avoid high-pressure tactics or false urgency
                      </li>
                      <li>
                        Treat property owners with respect and professionalism
                      </li>
                      <li>
                        Provide accurate information about timelines and processes
                      </li>
                    </ul>

                    <div className="bg-red-50 border-l-4 border-red-500 p-6 my-6">
                      <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">
                        Prohibited Activities
                      </h3>
                      <p className="mb-2">
                        Users may not engage in the following activities:
                      </p>
                      <ul className="list-disc ml-6 space-y-2">
                        <li>
                          Impersonating government officials or agencies
                        </li>
                        <li>
                          Making false claims about legal requirements or deadlines
                        </li>
                        <li>
                          Sharing or selling lead data to third parties
                        </li>
                        <li>
                          Using automated dialing systems without proper consent
                        </li>
                        <li>
                          Contacting numbers on DNC registries without exemption
                        </li>
                        <li>
                          Charging fees in excess of state limits
                        </li>
                        <li>
                          Engaging in deceptive or fraudulent practices
                        </li>
                        <li>
                          Operating without required state licenses
                        </li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      State Licensing Verification
                    </h3>
                    <p>
                      Users operating in states with specific licensing
                      requirements must provide proof of:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Current business license or registration
                      </li>
                      <li>
                        Private investigator license (if required for skip
                        tracing)
                      </li>
                      <li>
                        Collection agency license (in applicable states)
                      </li>
                      <li>
                        Professional liability insurance (recommended minimum: $1M)
                      </li>
                      <li>
                        Any other state-specific credentials
                      </li>
                    </ul>
                    <p className="mt-4">
                      Users must update license information promptly when renewals
                      occur or when expanding operations to new states.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Consequences of Non-Compliance
                    </h3>
                    <p>
                      Failure to maintain compliance with platform requirements or
                      applicable laws may result in:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Warning notices and corrective action requirements
                      </li>
                      <li>
                        Temporary suspension of account access
                      </li>
                      <li>
                        Permanent account termination
                      </li>
                      <li>
                        Reporting to regulatory authorities
                      </li>
                      <li>
                        Loss of access to lead data and platform services
                      </li>
                      <li>
                        Potential legal action for damages caused by violations
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 13: Reporting Violations */}
                <section id="reporting" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Reporting Violations
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      US Foreclosure Recovery Inc. is committed to maintaining the
                      integrity of our platform and the foreclosure surplus
                      recovery industry. We encourage both users and property
                      owners to report suspected violations of our policies or
                      applicable laws.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      How to Report Violations
                    </h3>
                    <p>
                      Compliance violations can be reported through multiple
                      channels:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        <strong>Email:</strong>{" "}
                        <a
                          href="mailto:compliance@usforeclosurerecovery.com"
                          className="text-[#3b82f6] hover:underline"
                        >
                          compliance@usforeclosurerecovery.com
                        </a>
                      </li>
                      <li>
                        <strong>Support Portal:</strong> Submit through your
                        account dashboard under "Report an Issue"
                      </li>
                      <li>
                        <strong>Phone:</strong> Compliance Hotline available
                        during business hours
                      </li>
                      <li>
                        <strong>Mail:</strong> US Foreclosure Recovery Inc.,
                        Compliance Department, [Address]
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      What to Include in Reports
                    </h3>
                    <p>
                      When reporting a potential violation, please provide as much
                      detail as possible:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Name or username of the party engaging in potential
                        violations
                      </li>
                      <li>
                        Date and time of the incident or communication
                      </li>
                      <li>
                        Detailed description of the violation
                      </li>
                      <li>
                        Copies of relevant communications (emails, voicemails,
                        texts)
                      </li>
                      <li>
                        Phone numbers or contact information involved
                      </li>
                      <li>
                        Any documentation supporting the complaint
                      </li>
                      <li>
                        Your contact information for follow-up (if you wish to be
                        contacted)
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Types of Violations to Report
                    </h3>
                    <p>
                      We are particularly interested in reports concerning:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Harassing or excessive contact attempts
                      </li>
                      <li>
                        False or misleading representations
                      </li>
                      <li>
                        Impersonation of government officials
                      </li>
                      <li>
                        Failure to honor opt-out requests
                      </li>
                      <li>
                        Calls to numbers on Do Not Call registries
                      </li>
                      <li>
                        Calls outside permitted hours (8 AM - 9 PM local time)
                      </li>
                      <li>
                        Excessive or unlawful fees
                      </li>
                      <li>
                        Fraudulent or deceptive practices
                      </li>
                      <li>
                        Misuse of personal information
                      </li>
                      <li>
                        Operating without required licenses
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Investigation Process
                    </h3>
                    <p>
                      Upon receiving a violation report, our compliance team will:
                    </p>
                    <ol className="list-decimal ml-6 space-y-2 my-4">
                      <li>
                        Acknowledge receipt of the report within 2 business days
                      </li>
                      <li>
                        Conduct preliminary review to assess severity
                      </li>
                      <li>
                        Gather additional information from system logs and records
                      </li>
                      <li>
                        Contact the accused party for their account of events
                      </li>
                      <li>
                        Review all evidence and documentation
                      </li>
                      <li>
                        Make determination regarding violation
                      </li>
                      <li>
                        Implement appropriate enforcement actions
                      </li>
                      <li>
                        Notify reporter of outcome (if contact information provided)
                      </li>
                    </ol>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Confidentiality & Protection
                    </h3>
                    <p>
                      We treat all violation reports with appropriate
                      confidentiality. Reporters' identities are protected to the
                      extent possible, though disclosure may be necessary in
                      certain legal proceedings. Users who report violations in
                      good faith will not face retaliation or adverse action from
                      our platform.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      External Reporting Options
                    </h3>
                    <p>
                      In addition to reporting violations to our compliance team,
                      property owners and users may also file complaints with
                      relevant regulatory authorities:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        <strong>Federal Trade Commission (FTC):</strong>{" "}
                        <a
                          href="https://reportfraud.ftc.gov"
                          className="text-[#3b82f6] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          reportfraud.ftc.gov
                        </a>
                      </li>
                      <li>
                        <strong>Federal Communications Commission (FCC):</strong>{" "}
                        For TCPA violations
                      </li>
                      <li>
                        <strong>Consumer Financial Protection Bureau (CFPB):</strong>{" "}
                        For financial services complaints
                      </li>
                      <li>
                        <strong>State Attorney General:</strong> For state-specific
                        violations
                      </li>
                      <li>
                        <strong>State Licensing Boards:</strong> For professional
                        misconduct
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 14: Compliance Updates & Training */}
                <section id="updates-training" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Compliance Updates & Training
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      The regulatory landscape governing foreclosure surplus
                      recovery, telecommunications, and data privacy is constantly
                      evolving. US Foreclosure Recovery Inc. maintains a proactive
                      approach to monitoring legal developments and updating our
                      platform and user education accordingly.
                    </p>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Regulatory Monitoring
                    </h3>
                    <p>
                      Our compliance team continuously monitors:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Federal Communications Commission (FCC) rulemaking and
                        orders
                      </li>
                      <li>
                        State legislation affecting surplus fund recovery
                      </li>
                      <li>
                        Court decisions interpreting TCPA, FDCPA, and related laws
                      </li>
                      <li>
                        Changes to state Do Not Call registries and regulations
                      </li>
                      <li>
                        Data privacy legislation at state and federal levels
                      </li>
                      <li>
                        Industry best practices and compliance guidance
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Platform Updates
                    </h3>
                    <p>
                      When regulatory changes affect platform operations, we
                      implement necessary updates including:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Software modifications to enforce new requirements
                      </li>
                      <li>
                        Updated state-specific fee calculators and restrictions
                      </li>
                      <li>
                        Enhanced DNC scrubbing procedures
                      </li>
                      <li>
                        Revised consent capture mechanisms
                      </li>
                      <li>
                        New compliance warnings and user notifications
                      </li>
                      <li>
                        Updated Terms of Service and policy documents
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      User Notifications
                    </h3>
                    <p>
                      Users are notified of important compliance updates through:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Email alerts for significant regulatory changes
                      </li>
                      <li>
                        In-platform notifications upon login
                      </li>
                      <li>
                        Updated compliance documentation in the knowledge base
                      </li>
                      <li>
                        Mandatory review of changes before accessing certain
                        features
                      </li>
                      <li>
                        Quarterly compliance newsletters
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Required Training Modules
                    </h3>
                    <p>
                      All new users must complete mandatory compliance training
                      covering:
                    </p>

                    <div className="bg-blue-50 border border-[#3b82f6] rounded-lg p-6 my-6">
                      <h4 className="font-bold text-[#1e3a5f] mb-3">
                        Core Training Modules
                      </h4>
                      <ol className="list-decimal ml-6 space-y-2">
                        <li>
                          <strong>TCPA Compliance Fundamentals</strong> - Consent
                          requirements, calling hours, identification, opt-out
                          procedures
                        </li>
                        <li>
                          <strong>Do Not Call Registry Compliance</strong> -
                          Federal and state DNC requirements, scrubbing procedures
                        </li>
                        <li>
                          <strong>Communication Best Practices</strong> -
                          Professional standards, prohibited practices, proper
                          disclosures
                        </li>
                        <li>
                          <strong>State-Specific Regulations</strong> - Fee limits,
                          licensing, assignment restrictions by state
                        </li>
                        <li>
                          <strong>Data Privacy & Security</strong> - Handling PII,
                          access controls, breach prevention
                        </li>
                        <li>
                          <strong>Anti-Fraud Measures</strong> - Prohibited
                          deceptive practices, transparency requirements
                        </li>
                        <li>
                          <strong>Record Keeping Requirements</strong> -
                          Documentation standards, retention periods
                        </li>
                      </ol>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Continuing Education
                    </h3>
                    <p>
                      Beyond initial training, users are required to participate in
                      ongoing education:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Annual compliance refresher courses
                      </li>
                      <li>
                        Training on significant regulatory changes
                      </li>
                      <li>
                        State-specific updates when entering new jurisdictions
                      </li>
                      <li>
                        Optional advanced courses on specialized topics
                      </li>
                      <li>
                        Monthly compliance webinars and Q&A sessions
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Compliance Resources
                    </h3>
                    <p>
                      We provide comprehensive resources to support user
                      compliance efforts:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        State-by-state compliance guides
                      </li>
                      <li>
                        Template agreements and disclosure documents
                      </li>
                      <li>
                        Sample scripts for compliant communications
                      </li>
                      <li>
                        Compliance checklists for common scenarios
                      </li>
                      <li>
                        FAQ database addressing common compliance questions
                      </li>
                      <li>
                        Links to relevant statutes and regulations
                      </li>
                      <li>
                        Contact information for compliance support
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-6 mb-3">
                      Testing & Certification
                    </h3>
                    <p>
                      Users must pass compliance assessments to demonstrate
                      understanding:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>
                        Initial certification exam before platform access
                      </li>
                      <li>
                        Annual recertification requirements
                      </li>
                      <li>
                        Scenario-based assessments testing practical application
                      </li>
                      <li>
                        Minimum passing score of 80% on all compliance tests
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 15: Contact Our Compliance Team */}
                <section id="contact" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 pb-3 border-b-2 border-[#3b82f6]">
                    Contact Our Compliance Team
                  </h2>
                  <div className="prose max-w-none text-gray-700 space-y-4">
                    <p>
                      Our dedicated compliance team is available to answer
                      questions, provide guidance, and address concerns related to
                      regulatory requirements and platform policies. We are
                      committed to supporting our users in maintaining the highest
                      standards of legal and ethical conduct.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 my-8">
                      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#3b82f6] text-white p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">
                          General Compliance Inquiries
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <svg
                              className="w-5 h-5 mr-3 mt-1 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <div>
                              <div className="font-medium">Email</div>
                              <a
                                href="mailto:compliance@usforeclosurerecovery.com"
                                className="text-white hover:underline"
                              >
                                compliance@usforeclosurerecovery.com
                              </a>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <svg
                              className="w-5 h-5 mr-3 mt-1 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <div className="font-medium">Response Time</div>
                              <div>Within 2 business days</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">
                          Urgent Compliance Issues
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <svg
                              className="w-5 h-5 mr-3 mt-1 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <div>
                              <div className="font-medium">Priority Email</div>
                              <a
                                href="mailto:urgent@usforeclosurerecovery.com"
                                className="text-white hover:underline"
                              >
                                urgent@usforeclosurerecovery.com
                              </a>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <svg
                              className="w-5 h-5 mr-3 mt-1 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <div className="font-medium">For</div>
                              <div>
                                Subpoenas, regulatory inquiries, data breaches
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-8 mb-3">
                      Additional Contact Information
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <strong>Technical Support:</strong>{" "}
                        <a
                          href="mailto:support@usforeclosurerecovery.com"
                          className="text-[#3b82f6] hover:underline"
                        >
                          support@usforeclosurerecovery.com
                        </a>
                      </li>
                      <li>
                        <strong>Privacy Requests:</strong>{" "}
                        <a
                          href="mailto:privacy@usforeclosurerecovery.com"
                          className="text-[#3b82f6] hover:underline"
                        >
                          privacy@usforeclosurerecovery.com
                        </a>
                      </li>
                      <li>
                        <strong>Report Violations:</strong>{" "}
                        <a
                          href="mailto:compliance@usforeclosurerecovery.com"
                          className="text-[#3b82f6] hover:underline"
                        >
                          compliance@usforeclosurerecovery.com
                        </a>
                      </li>
                      <li>
                        <strong>Legal Department:</strong>{" "}
                        <a
                          href="mailto:legal@usforeclosurerecovery.com"
                          className="text-[#3b82f6] hover:underline"
                        >
                          legal@usforeclosurerecovery.com
                        </a>
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-8 mb-3">
                      Business Hours
                    </h3>
                    <p>
                      Our compliance team is available during the following hours:
                    </p>
                    <ul className="list-disc ml-6 space-y-2 my-4">
                      <li>Monday - Friday: 9:00 AM - 6:00 PM Eastern Time</li>
                      <li>
                        Saturday - Sunday: Closed (emergency emails monitored)
                      </li>
                      <li>
                        Federal Holidays: Closed (urgent matters only via email)
                      </li>
                    </ul>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-8 mb-3">
                      Mailing Address
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-4">
                      <p className="font-medium mb-2">US Foreclosure Recovery Inc.</p>
                      <p>Compliance Department</p>
                      <p>Attn: Compliance Officer</p>
                      <p>[Street Address]</p>
                      <p>[City, State ZIP]</p>
                    </div>

                    <h3 className="text-xl font-bold text-[#1e3a5f] mt-8 mb-3">
                      Online Resources
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        <a
                          href="https://usforeclosurerecovery.com/compliance"
                          className="text-[#3b82f6] hover:underline"
                        >
                          Compliance Resources Center
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://usforeclosurerecovery.com/knowledge-base"
                          className="text-[#3b82f6] hover:underline"
                        >
                          Knowledge Base & FAQs
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://usforeclosurerecovery.com/training"
                          className="text-[#3b82f6] hover:underline"
                        >
                          Compliance Training Portal
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://usforeclosurerecovery.com/state-guides"
                          className="text-[#3b82f6] hover:underline"
                        >
                          State-by-State Compliance Guides
                        </a>
                      </li>
                    </ul>

                    <div className="bg-[#3b82f6] text-white p-6 rounded-lg mt-8">
                      <h3 className="text-xl font-bold mb-3">
                        We Are Here to Help
                      </h3>
                      <p>
                        Compliance can be complex, and we understand that
                        questions and concerns will arise. Our team is dedicated
                        to providing clear, actionable guidance to help you
                        operate successfully within all legal requirements. Do not
                        hesitate to reach out with any compliance-related
                        questions, no matter how small they may seem. We would
                        rather answer questions proactively than address problems
                        after they occur.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="mb-2">
              Copyright {new Date().getFullYear()} US Foreclosure Recovery Inc.
              All rights reserved.
            </p>
            <p className="text-sm text-gray-300">
              <a
                href="mailto:support@usforeclosurerecovery.com"
                className="hover:text-[#3b82f6] transition-colors"
              >
                support@usforeclosurerecovery.com
              </a>
              {" | "}
              <a
                href="https://usforeclosurerecovery.com"
                className="hover:text-[#3b82f6] transition-colors"
              >
                usforeclosurerecovery.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
