import { TrainingCaptureForm } from "./training-capture-form";

const CURRICULUM = [
  {
    chapter: "I",
    title: "How Open Data Works",
    duration: "52 min",
    lessons: [
      "What open data is and where it comes from",
      "The three layers: national, regional, and local",
      "Reading a dataset like a primary source",
    ],
  },
  {
    chapter: "II",
    title: "Navigating Online Databases",
    duration: "1 hr 08",
    lessons: [
      "Anatomy of a searchable data portal",
      "Query syntax and search operators",
      "Exporting, citing, and preserving results",
    ],
  },
  {
    chapter: "III",
    title: "The Researcher's Workflow",
    duration: "47 min",
    lessons: [
      "Cross-referencing across three sources",
      "Building a citation log from scratch",
      "Notation systems used by professional researchers",
    ],
  },
  {
    chapter: "IV",
    title: "Tools of the Trade",
    duration: "1 hr 15",
    lessons: [
      "A spreadsheet as a research instrument",
      "Free software every researcher keeps bookmarked",
      "Patterns, templates, and repeatable method",
    ],
  },
];

const FAQS = [
  {
    q: "Is the course genuinely free to enroll?",
    a: "Yes. The full curriculum is free. No card is requested, no paywall is hidden between lessons.",
  },
  {
    q: "Do I need prior experience with databases?",
    a: "None. The first chapter assumes the reader has never opened a data portal. The pacing is deliberate.",
  },
  {
    q: "How long does the course take to complete?",
    a: "The four chapters run about four hours of video combined. Most readers pace them across a week of evenings.",
  },
  {
    q: "What will I be able to do by the end?",
    a: "Navigate any open database with confidence, read structured documents the way a librarian reads them, and keep a research log that holds up to scrutiny.",
  },
  {
    q: "Is there a certificate?",
    a: "A printable certificate is issued after the fourth chapter is completed.",
  },
];

const STATS = [
  { figure: "04", label: "Chapters" },
  { figure: "4h", label: "Total Runtime" },
  { figure: "00", label: "Cost to Enroll" },
  { figure: "01", label: "Certificate" },
];

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-[#f4ede4] text-[#0a1f3d] antialiased selection:bg-[#c89b3c]/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,700;9..144,900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        .font-body { font-family: 'EB Garamond', serif; }
        .paper {
          background-color: #f4ede4;
          background-image:
            radial-gradient(circle at 20% 15%, rgba(10,31,61,0.035) 0, transparent 35%),
            radial-gradient(circle at 85% 60%, rgba(139,46,46,0.03) 0, transparent 40%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.04 0 0 0 0 0.12 0 0 0 0 0.24 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .rule-double {
          border-top: 1px solid #0a1f3d;
          border-bottom: 1px solid #0a1f3d;
          height: 5px;
          border-left: 0;
          border-right: 0;
        }
        .rule-thick { height: 3px; background: #0a1f3d; }
        .drop-cap::first-letter {
          font-family: 'Fraunces', serif;
          float: left;
          font-size: 5.2rem;
          line-height: 0.82;
          font-weight: 900;
          padding: 0.4rem 0.6rem 0 0;
          color: #8b2e2e;
        }
        .chapter-num {
          font-family: 'Fraunces', serif;
          font-feature-settings: 'smcp', 'onum';
        }
        @keyframes fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up 1s ease-out both; }
        .fade-up-2 { animation: fade-up 1s ease-out 0.15s both; }
        .fade-up-3 { animation: fade-up 1s ease-out 0.3s both; }
        .fade-up-4 { animation: fade-up 1s ease-out 0.45s both; }
        .video-frame {
          box-shadow:
            0 0 0 1px #0a1f3d,
            0 0 0 12px #f4ede4,
            0 0 0 13px #0a1f3d,
            0 40px 80px -20px rgba(10,31,61,0.35),
            0 20px 40px -15px rgba(10,31,61,0.2);
        }
      `}</style>

      <div className="paper">
        {/* Masthead */}
        <header className="border-b border-[#0a1f3d]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border-2 border-[#0a1f3d] flex items-center justify-center font-display font-black text-[#0a1f3d] text-lg">
                U
              </div>
              <div className="font-display text-[#0a1f3d] leading-none">
                <div className="text-[10px] uppercase tracking-[0.3em] font-medium">
                  Free Online Training
                </div>
                <div className="text-lg font-bold">
                  US Foreclosure Leads
                </div>
              </div>
            </div>
            <a
              href="#enroll"
              className="font-display text-sm uppercase tracking-widest border-b-2 border-[#8b2e2e] text-[#8b2e2e] hover:text-[#0a1f3d] hover:border-[#0a1f3d] transition-colors pb-0.5"
            >
              Enroll — Gratis
            </a>
          </div>
          <div className="rule-double max-w-7xl mx-auto" />
        </header>

        {/* Hero — editorial headline + VSL video */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-20">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-8 fade-up">
              <div className="font-body italic text-[#8b2e2e] text-sm tracking-wide mb-4">
                Vol. I — No. 1 · A Free Correspondence Course
              </div>
              <h1 className="font-display font-black text-[#0a1f3d] leading-[0.88] tracking-[-0.02em] text-[clamp(2.75rem,6.5vw,5.75rem)] mb-6">
                A Classical
                <br />
                Course on
                <br />
                <em className="font-light italic text-[#8b2e2e]">Data</em>{" "}
                <em className="font-light italic text-[#8b2e2e]">Research</em>
                <br />
                Skills.
              </h1>
              <div className="h-px bg-[#0a1f3d] w-24 mb-6" />
              <p className="font-body text-xl text-[#0a1f3d]/80 leading-relaxed max-w-md">
                Four chapters, assembled in the manner of an old-world reading
                room. Open databases, structured documents, and the patient craft
                of looking things up — taught from the beginning.
              </p>
              <div className="mt-8 flex items-center gap-6 text-sm font-display uppercase tracking-[0.18em] text-[#0a1f3d]/70">
                <span>Self-Paced</span>
                <span className="w-1 h-1 rounded-full bg-[#8b2e2e]" />
                <span>Gratis</span>
                <span className="w-1 h-1 rounded-full bg-[#8b2e2e]" />
                <span>Certificate</span>
              </div>
            </div>

            {/* VSL Video */}
            <div className="lg:col-span-7 fade-up-2">
              <div className="font-display text-[10px] uppercase tracking-[0.35em] text-[#8b2e2e] mb-3 flex items-center gap-3">
                <span className="w-8 h-px bg-[#8b2e2e]" />
                Opening Lecture
                <span className="flex-1 h-px bg-[#8b2e2e]/30" />
              </div>
              <div className="rounded-sm overflow-hidden" style={{ boxShadow: '0 0 0 1px #0a1f3d, 0 0 0 12px #f4ede4, 0 0 0 13px #0a1f3d, 0 40px 80px -20px rgba(10,31,61,0.35)' }}>
                <div className="relative" style={{ aspectRatio: "16/9" }}>
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/DdQMsjlehs0?rel=0&modestbranding=1&playsinline=1"
                    title="Data Research Skills - Opening Lecture"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
              <div className="mt-4 font-body text-sm text-[#0a1f3d]/70 italic">
                Watch the opening lecture, then enroll below to receive the
                full four-chapter curriculum by email.
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y-2 border-[#0a1f3d] bg-[#0a1f3d] text-[#f4ede4] fade-up-3">
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-[#f4ede4]/15">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`px-6 ${i === 0 ? "pl-0" : ""} text-center md:text-left`}
              >
                <div className="font-display font-black text-5xl md:text-6xl text-[#c89b3c] leading-none tabular-nums">
                  {s.figure}
                </div>
                <div className="mt-2 font-display text-[10px] uppercase tracking-[0.3em] text-[#f4ede4]/70">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* From the Editor — drop-cap letter */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-3">
              <div className="font-display text-[10px] uppercase tracking-[0.35em] text-[#8b2e2e] mb-3">
                § From the Editor
              </div>
              <div className="h-px bg-[#0a1f3d] w-full mb-4" />
              <div className="font-body italic text-[#0a1f3d]/70 text-sm leading-relaxed">
                A short note on why this curriculum exists, and who it is
                written for.
              </div>
            </div>
            <div className="lg:col-span-9">
              <div className="font-body text-[#0a1f3d] text-[1.2rem] leading-[1.75] max-w-3xl drop-cap">
                Before the word <em>database</em> was invented, researchers did
                the same thing they still do now. They learned where a record
                was kept, who kept it, and the grammar of the index that led to
                it. This short course is an introduction to that same craft,
                translated for the era of the browser tab. It is written for
                the curious reader who has never opened a data portal, never
                cited a primary source, and is not ashamed to begin at the
                beginning. You will not need software, a subscription, or a
                degree. You will need patience and an evening.
              </div>
              <div className="mt-6 font-display italic text-[#8b2e2e] text-lg">
                — The Editors
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum — academic table of chapters */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-[#8b2e2e] mb-4">
              ✦ Table of Chapters ✦
            </div>
            <h2 className="font-display font-black text-5xl md:text-6xl text-[#0a1f3d] tracking-[-0.02em]">
              The Curriculum
            </h2>
            <div className="rule-double max-w-md mx-auto mt-6" />
          </div>

          <div className="space-y-0 border-t-2 border-b-2 border-[#0a1f3d]">
            {CURRICULUM.map((mod, i) => (
              <article
                key={mod.title}
                className={`grid md:grid-cols-12 gap-6 py-10 px-2 md:px-6 group ${
                  i !== CURRICULUM.length - 1
                    ? "border-b border-[#0a1f3d]/25"
                    : ""
                } hover:bg-[#0a1f3d]/[0.03] transition-colors`}
              >
                <div className="md:col-span-2">
                  <div className="chapter-num text-7xl md:text-8xl font-black text-[#8b2e2e] leading-none">
                    {mod.chapter}
                  </div>
                  <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[#0a1f3d]/60 mt-2">
                    Chapter
                  </div>
                </div>
                <div className="md:col-span-7">
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-[#0a1f3d] tracking-[-0.01em] mb-5 leading-tight">
                    {mod.title}
                  </h3>
                  <ul className="font-body space-y-2.5 text-[#0a1f3d]/85 text-lg">
                    {mod.lessons.map((lesson, j) => (
                      <li key={lesson} className="flex items-baseline gap-3">
                        <span className="font-display text-[#8b2e2e] text-sm tabular-nums">
                          {(j + 1).toString().padStart(2, "0")}.
                        </span>
                        <span className="italic">{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-3 md:text-right">
                  <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[#0a1f3d]/60 mb-1">
                    Runtime
                  </div>
                  <div className="font-display text-2xl font-bold text-[#0a1f3d] tabular-nums">
                    {mod.duration}
                  </div>
                  <div className="mt-4 font-body italic text-sm text-[#8b2e2e]">
                    ex libris ·
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Mid enrollment — inline editorial CTA */}
        <section className="bg-[#0a1f3d] text-[#f4ede4] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23c89b3c' fill-opacity='1'%3E%3Cpath d='M30 0l5 25 25 5-25 5-5 25-5-25-25-5 25-5z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <div className="max-w-5xl mx-auto px-6 py-24 text-center relative">
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-[#c89b3c] mb-6">
              ✦ Admission is Open ✦
            </div>
            <h2 className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.02em] mb-8">
              Begin the course
              <br />
              <em className="italic font-light text-[#c89b3c]">this evening.</em>
            </h2>
            <p className="font-body text-xl text-[#f4ede4]/80 max-w-2xl mx-auto mb-10 leading-relaxed italic">
              Leave your correspondence address below. The first chapter is
              dispatched immediately — no subscription, no obligation.
            </p>
            <div className="max-w-xl mx-auto" id="enroll">
              <div className="bg-[#f4ede4] p-6 border-2 border-[#c89b3c]">
                <TrainingCaptureForm source="training_hero" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — editorial columns */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-8">
                <div className="font-display text-[10px] uppercase tracking-[0.35em] text-[#8b2e2e] mb-3">
                  § Correspondence
                </div>
                <h2 className="font-display font-black text-5xl text-[#0a1f3d] leading-[0.9] tracking-[-0.02em] mb-6">
                  Letters to the Editor
                </h2>
                <div className="h-px bg-[#0a1f3d] w-20 mb-5" />
                <p className="font-body italic text-[#0a1f3d]/75 text-lg leading-relaxed">
                  Questions received most often from readers preparing to
                  enroll. If yours is not here, the first lesson will likely
                  answer it.
                </p>
              </div>
            </div>
            <div className="lg:col-span-8">
              <dl className="divide-y-2 divide-[#0a1f3d] border-y-2 border-[#0a1f3d]">
                {FAQS.map((faq, i) => (
                  <div key={faq.q} className="py-8 group">
                    <dt className="flex items-baseline gap-5 mb-3">
                      <span className="font-display text-[#8b2e2e] tabular-nums text-xl font-black">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="font-display text-2xl md:text-3xl font-bold text-[#0a1f3d] tracking-[-0.01em] leading-tight">
                        {faq.q}
                      </span>
                    </dt>
                    <dd className="font-body text-lg text-[#0a1f3d]/80 leading-relaxed pl-10 italic">
                      {faq.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Final colophon + enrollment */}
        <section className="border-t-2 border-[#0a1f3d] bg-[#f4ede4]">
          <div className="max-w-4xl mx-auto px-6 py-24 text-center">
            <div className="font-display text-xs uppercase tracking-[0.4em] text-[#8b2e2e] mb-6">
              ✦ Colophon ✦
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl text-[#0a1f3d] leading-tight mb-5 tracking-[-0.02em]">
              The course is open to all readers, without fee.
            </h2>
            <p className="font-body italic text-xl text-[#0a1f3d]/75 mb-10 leading-relaxed max-w-2xl mx-auto">
              Enter your address and the opening chapter will arrive by return
              post. No payment is requested, and enrollment may be withdrawn at
              any time.
            </p>
            <div className="max-w-xl mx-auto bg-white border-2 border-[#0a1f3d] p-6 shadow-[8px_8px_0_0_#0a1f3d]">
              <TrainingCaptureForm source="training_footer" />
            </div>
            <div className="mt-12 font-body italic text-sm text-[#0a1f3d]/60">
              Set in Fraunces and EB Garamond · Printed digitally on
              recycled pixels
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#0a1f3d]/40">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="rule-thick mb-6" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-display text-xs uppercase tracking-[0.2em] text-[#0a1f3d]/70">
              <div>
                US Foreclosure Leads · Free Training
              </div>
              <div className="flex items-center gap-6">
                <a href="/privacy" className="hover:text-[#8b2e2e]">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-[#8b2e2e]">
                  Terms
                </a>
                <a href="/" className="hover:text-[#8b2e2e]">
                  Home
                </a>
              </div>
            </div>
            <p className="mt-6 font-body italic text-xs text-[#0a1f3d]/50 text-center max-w-2xl mx-auto leading-relaxed">
              This is an educational training course. Information provided is
              for learning purposes only.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
