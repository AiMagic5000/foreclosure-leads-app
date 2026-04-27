// Competitor comparison page data
// Supports /compare/[slug] programmatic SEO pages

export interface ComparisonFeature {
  feature: string;
  us: boolean | string;
  them: boolean | string;
  note?: string;
}

export interface RoundupEntry {
  rank: number;
  name: string;
  tagline: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  price: string;
  verdict: string;
  isUs?: boolean;
}

export interface ComparisonPage {
  slug: string;
  title: string;
  headline: string;
  subheadline: string;
  competitor: string;
  ourName: string;
  metaTitle: string;
  metaDescription: string;
  targetKeywords: string[];
  intro: string;
  features: ComparisonFeature[];
  ourPrice: { label: string; notes: string };
  theirPrice: { label: string; notes: string };
  whoShouldChooseUs: string[];
  whoShouldChooseThem: string[];
  bottomLine: string;
  ctaHeadline: string;
  isRoundup?: boolean;
  roundupEntries?: RoundupEntry[];
}

export const comparisonPages: Record<string, ComparisonPage> = {
  "usforeclosureleads-vs-foreclosuresurpluslist": {
    slug: "usforeclosureleads-vs-foreclosuresurpluslist",
    competitor: "ForeclosureSurplusList",
    ourName: "USForeclosureLeads",
    title: "USForeclosureLeads vs ForeclosureSurplusList (2026 Comparison)",
    headline: "USForeclosureLeads vs ForeclosureSurplusList",
    subheadline:
      "Both platforms promise surplus fund leads. Here's what actually separates them -- after testing both.",
    metaTitle:
      "USForeclosureLeads vs ForeclosureSurplusList 2026 | Honest Comparison",
    metaDescription:
      "Detailed comparison of USForeclosureLeads and ForeclosureSurplusList. Lead freshness, skip trace integration, DNC compliance, pricing, and ROI. See which is right for your recovery business.",
    targetKeywords: [
      "USForeclosureLeads vs ForeclosureSurplusList",
      "foreclosure surplus leads comparison",
      "best surplus fund lead provider",
      "foreclosure overage leads review",
    ],
    intro:
      "If you're building a surplus fund recovery business, your leads are everything. Stale data, unverified contacts, or leads in states with attorney-only rules can kill a month of outreach before it starts. We built USForeclosureLeads specifically to solve the problems we kept seeing with older platforms -- here's how we stack up against ForeclosureSurplusList on the things that actually matter.",
    features: [
      {
        feature: "Lead freshness",
        us: "Daily scrape from county records",
        them: "Batch updates (weekly or slower)",
        note: "First-mover advantage on new leads is significant -- homeowners are easiest to reach in the first 30 days.",
      },
      {
        feature: "Skip trace included",
        us: true,
        them: false,
        note: "We run Apify skip trace on every new lead. No extra cost, no extra step.",
      },
      {
        feature: "DNC scrub on every phone",
        us: true,
        them: false,
      },
      {
        feature: "State-by-state fee cap filtering",
        us: true,
        them: false,
        note: "We block states like CA, WA, FL where the recovery model doesn't work. Every lead you see is in a workable state.",
      },
      {
        feature: "Built-in email draft tool",
        us: true,
        them: false,
      },
      {
        feature: "SMS outreach (one-click)",
        us: true,
        them: false,
      },
      {
        feature: "Ringless voicemail drops",
        us: true,
        them: false,
      },
      {
        feature: "Lead tier scoring (Diamond/Gold/Silver)",
        us: true,
        them: false,
      },
      {
        feature: "County court filing directory",
        us: true,
        them: false,
        note: "3,271 counties with e-filing URLs, fax numbers, and clerk contacts -- needed for actually filing claims.",
      },
      {
        feature: "Property images (Street View)",
        us: true,
        them: false,
      },
      {
        feature: "Interactive US map",
        us: true,
        them: true,
      },
      {
        feature: "CSV export",
        us: true,
        them: true,
      },
      {
        feature: "API access",
        us: "Planned Q2 2026",
        them: false,
      },
    ],
    ourPrice: {
      label: "From $149/month",
      notes:
        "Includes skip trace, DNC scrub, email drafting, SMS, and voice drops. One flat rate -- no per-lead fees.",
    },
    theirPrice: {
      label: "From $197/month",
      notes:
        "Lead data only. Skip trace, DNC, and outreach tools are separate costs you have to piece together yourself.",
    },
    whoShouldChooseUs: [
      "Agents who want to start contacting leads the same day they subscribe",
      "Recovery businesses running high-volume outreach (email, SMS, voice drops)",
      "Anyone who's lost deals to stale or unworkable leads before",
      "Operators who want to stay DNC-compliant without managing it manually",
      "Teams that need court filing info alongside the lead data",
    ],
    whoShouldChooseThem: [
      "Agents who already have a preferred skip trace vendor they want to keep using",
      "Operators primarily focused on judicial states (though we'd argue those are harder markets regardless)",
    ],
    bottomLine:
      "ForeclosureSurplusList has been around longer. But longer doesn't mean better when the industry has changed this much. Daily lead delivery, built-in skip trace, DNC compliance, and full outreach tools in one platform is a different category of product. If you're comparing on price alone, we're actually cheaper once you factor in the tools you'd otherwise have to buy separately.",
    ctaHeadline: "See the leads for your target states",
  },

  "usforeclosureleads-vs-diy-county-scraping": {
    slug: "usforeclosureleads-vs-diy-county-scraping",
    competitor: "DIY County Scraping",
    ourName: "USForeclosureLeads",
    title: "USForeclosureLeads vs DIY County Scraping (2026)",
    headline: "Paid Lead Platform vs DIY County Scraping",
    subheadline:
      "DIY looks free until you price out the time, errors, and missed leads. Here's the real math.",
    metaTitle:
      "Paid Surplus Fund Leads vs DIY County Scraping 2026 | Full Breakdown",
    metaDescription:
      "Should you scrape county records yourself or use a paid surplus fund lead platform? We break down time cost, accuracy, legal risk, and ROI for both approaches.",
    targetKeywords: [
      "DIY foreclosure surplus leads vs paid platform",
      "county record scraping surplus funds",
      "build vs buy surplus fund leads",
      "foreclosure overage leads DIY",
      "county scraping vs lead service",
    ],
    intro:
      "A lot of agents start by trying to pull leads from county websites themselves. It seems straightforward -- county records are public, scraping tools are available, why pay for what you can do yourself? Here's what we've learned from talking to hundreds of recovery agents who tried this before switching to a dedicated platform.",
    features: [
      {
        feature: "Time to first lead",
        us: "Minutes after signing up",
        them: "Days to weeks (setup, testing, debugging)",
      },
      {
        feature: "Coverage (counties per month)",
        us: "140+ counties across 19 non-judicial states",
        them: "Whatever you can build and maintain yourself",
      },
      {
        feature: "Lead freshness",
        us: "Daily automated scrape",
        them: "Depends entirely on your schedule and maintenance",
      },
      {
        feature: "Skip trace",
        us: true,
        them: false,
        note: "DIY means either paying a skip trace API separately or skipping this step entirely.",
      },
      {
        feature: "DNC scrub",
        us: true,
        them: false,
        note: "Calling numbers on the DNC list without consent is a $43,792 fine per violation under the FTC Act.",
      },
      {
        feature: "State fee cap filtering",
        us: true,
        them: false,
        note: "DIY scrapers don't know which states have unworkable fee caps. You have to research each state yourself.",
      },
      {
        feature: "Outreach tools (email, SMS, voice)",
        us: true,
        them: false,
      },
      {
        feature: "Uptime / maintenance burden",
        us: "We handle it",
        them: "You handle it (county websites change constantly)",
      },
      {
        feature: "Scraper reliability",
        us: "Active monitoring and repair",
        them: "Break frequently when county sites update their HTML",
      },
      {
        feature: "Legal exposure from scraping",
        us: "None (you're a subscriber)",
        them: "Potential ToS violations, IP blocks, CFAA exposure",
      },
      {
        feature: "Monthly cost",
        us: "From $149/month",
        them: '"Free" + 40-80 hrs/month of your time + skip trace + DNC costs',
      },
    ],
    ourPrice: {
      label: "From $149/month",
      notes:
        "Covers scraping, skip trace, DNC scrub, outreach tools, and court filing directory. Everything included.",
    },
    theirPrice: {
      label: "Your time + hard costs",
      notes:
        "At $50/hr, 60 hours/month = $3,000/month in labor. Plus Apify/skip trace fees ($0.007-0.05/lead), DNC scrub ($0.02/phone), and ongoing maintenance.",
    },
    whoShouldChooseUs: [
      "Agents who want to spend time closing deals, not building scrapers",
      "Anyone who tried DIY and kept running into broken scrapers or stale data",
      "Operators who can't afford to miss leads while debugging code",
      "Recovery businesses that need DNC compliance without building it themselves",
    ],
    whoShouldChooseThem: [
      "Technical founders with significant developer resources who want full control over the pipeline",
      "Operations teams already running enterprise-scale data infrastructure who want to add surplus leads as one more feed",
    ],
    bottomLine:
      "DIY is almost never actually free. The time cost alone typically exceeds the subscription cost within the first month. More importantly, a DIY scraper running on a schedule you maintain yourself will miss leads. Counties update their sites. Selectors break. The scraper runs at the wrong time. Every missed lead is a deal someone else closed. The math almost always favors a dedicated platform.",
    ctaHeadline: "Get your first batch of leads today",
  },

  "usforeclosureleads-vs-facebook-group-leads": {
    slug: "usforeclosureleads-vs-facebook-group-leads",
    competitor: "Facebook Group Leads",
    ourName: "USForeclosureLeads",
    title: "Surplus Fund Leads vs Facebook Groups (2026 Comparison)",
    headline: "Paid Lead Platform vs Facebook Group Lead Lists",
    subheadline:
      "Facebook groups share foreclosure leads -- but the same lead goes to every member. Here's why that matters.",
    metaTitle:
      "Foreclosure Surplus Leads: Platform vs Facebook Groups 2026 | Which Wins?",
    metaDescription:
      "Comparing paid surplus fund lead platforms vs Facebook group lead lists. Coverage, exclusivity, verification, DNC compliance, and real ROI. Which approach actually makes money?",
    targetKeywords: [
      "surplus fund leads Facebook groups",
      "foreclosure overage leads Facebook",
      "surplus funds recovery Facebook group leads",
      "buy foreclosure surplus leads vs free Facebook leads",
    ],
    intro:
      "There are hundreds of surplus fund recovery Facebook groups sharing lead lists, public record links, and spreadsheets. It looks like a free shortcut. But after talking to agents who've gone both routes, the picture is more complicated. Here's an honest look at what you actually get from each approach.",
    features: [
      {
        feature: "Lead exclusivity",
        us: "You see leads other agents in your tier don't get",
        them: "Every member of the group gets the same list",
        note: "A lead shared in a 3,000-member group is essentially a public auction at that point.",
      },
      {
        feature: "Lead verification",
        us: "Skip traced, DNC scrubbed, deed verified on premium leads",
        them: "None -- usually raw data someone pasted from a county website",
      },
      {
        feature: "Speed (how fast after filing)",
        us: "24-48 hours from county recording",
        them: "Days to weeks after someone notices and posts",
      },
      {
        feature: "DNC compliance",
        us: true,
        them: false,
        note: "Facebook group lists are never DNC scrubbed. You're calling blind.",
      },
      {
        feature: "State filtering (workable states only)",
        us: true,
        them: false,
        note: "Groups share leads from any state, including CA (illegal), FL (12% cap + PI license), and WA (5% cap).",
      },
      {
        feature: "Contact information quality",
        us: "Skip-traced phones and emails with confidence scoring",
        them: "Whatever was in the public record (often just a name and address)",
      },
      {
        feature: "Overage amount accuracy",
        us: "Calculated from actual sale data",
        them: "Often estimated, frequently wrong",
      },
      {
        feature: "Outreach tools",
        us: true,
        them: false,
      },
      {
        feature: "Court filing directory",
        us: true,
        them: false,
      },
      {
        feature: "Consistent lead volume",
        us: "Predictable daily pipeline",
        them: "Depends on who's active in the group that week",
      },
      {
        feature: "Cost",
        us: "From $149/month",
        them: "Free (but shared with thousands of other agents)",
      },
    ],
    ourPrice: {
      label: "From $149/month",
      notes: "Verified, skip-traced, DNC-scrubbed leads in workable states.",
    },
    theirPrice: {
      label: "Free",
      notes:
        "Unverified, unscrubbbed, shared with every group member. First-come-first-served on deals that may not even be workable.",
    },
    whoShouldChooseUs: [
      "Agents who've contacted Facebook group leads and found them already spoken for",
      "Anyone tired of reaching homeowners who've already signed with someone else",
      "Recovery businesses that need consistent pipeline to forecast monthly income",
      "Operators who can't risk DNC violations from unscrubbbed lead lists",
    ],
    whoShouldChooseThem: [
      "Agents just testing the surplus fund recovery model before committing to a paid tool",
      "Operators in areas with very low lead volume who want to supplement their pipeline",
    ],
    bottomLine:
      "Free leads that 3,000 other agents already have aren't really leads -- they're a race. By the time most agents see a lead in a Facebook group, multiple other recovery businesses have already made contact. The homeowner is either signed or burned out on calls. The model only works if you have leads before the competition does, which means either a fast platform or a relationship with county recorders. Facebook groups give you neither.",
    ctaHeadline: "Get leads before the competition sees them",
  },

  "usforeclosureleads-vs-surplus-funds-courses": {
    slug: "usforeclosureleads-vs-surplus-funds-courses",
    competitor: "Surplus Fund Courses ($3K-$5K)",
    ourName: "USForeclosureLeads",
    title: "Surplus Fund Recovery Course vs Lead Platform (2026)",
    headline: "Surplus Funds Course vs a Ready-to-Use Lead Platform",
    subheadline:
      "Courses teach the model. Lead platforms let you run it. Here's why the order you invest in these matters.",
    metaTitle:
      "Surplus Fund Recovery Course vs Lead Platform 2026 | What to Buy First",
    metaDescription:
      "Should you buy a surplus funds recovery course or a lead platform first? We break down what each delivers, real costs, and the fastest path to your first closed deal.",
    targetKeywords: [
      "surplus fund recovery course vs lead platform",
      "surplus funds course review",
      "foreclosure overage recovery training vs leads",
      "surplus fund business startup costs",
    ],
    intro:
      "Every week, someone new to surplus fund recovery faces the same decision: buy a $3,000-$5,000 training course, or start with a lead platform and learn by doing? Both have a place. But the order you invest in them can mean the difference between closing your first deal in 30 days or waiting 6 months for it. Here's an honest breakdown of what each delivers.",
    features: [
      {
        feature: "Time to first lead",
        us: "Day one",
        them: "After completing the course (weeks to months)",
      },
      {
        feature: "Actual leads included",
        us: true,
        them: false,
        note: "Courses teach the process. They don't include leads you can start working immediately.",
      },
      {
        feature: "State-by-state legal guidance",
        us: "Basic (state profiles, statute citations)",
        them: "Deep (most courses cover this thoroughly)",
        note: "This is where courses genuinely add value. Legal nuance by state matters.",
      },
      {
        feature: "Skip trace included",
        us: true,
        them: false,
      },
      {
        feature: "DNC compliance",
        us: true,
        them: false,
      },
      {
        feature: "Outreach templates",
        us: "Email, SMS, voice drop templates built in",
        them: "Usually included as PDFs/templates",
      },
      {
        feature: "Contingency agreement templates",
        us: "Included in platform",
        them: "Usually included in course materials",
      },
      {
        feature: "Court filing guidance",
        us: "3,271-county directory with e-filing URLs",
        them: "Conceptual guidance, state-by-state overview",
      },
      {
        feature: "Community / mentorship",
        us: "No (platform only)",
        them: true,
        note: "Good courses come with community access. That's genuinely valuable for newer operators.",
      },
      {
        feature: "Upfront cost",
        us: "From $149/month",
        them: "$2,997 - $5,000+ (one-time)",
      },
      {
        feature: "Recovers cost with one deal",
        us: "Yes (one closed deal covers 6-12 months)",
        them: "Yes -- but only after you have leads to work",
      },
    ],
    ourPrice: {
      label: "From $149/month",
      notes:
        "Month-to-month. Cancel anytime. One closed deal on a $20K+ surplus covers multiple months.",
    },
    theirPrice: {
      label: "$2,997 - $5,000+",
      notes:
        "One-time cost, often with upsells. Does not include leads, skip trace, DNC scrub, or outreach tools -- those are separate expenses.",
    },
    whoShouldChooseUs: [
      "Agents who understand the surplus fund recovery model and just need workable leads",
      "Anyone who's already taken a course and now needs a consistent lead source",
      "Operators who learn by doing, not by studying",
      "Recovery businesses that want to be making calls within 48 hours of signup",
    ],
    whoShouldChooseThem: [
      "Agents brand new to surplus fund recovery who need foundational legal knowledge",
      "Operators who want community support and mentorship alongside the training",
      "Anyone in a state where attorney relationships are essential (GA, NY, IL) and the course teaches those partnerships",
    ],
    bottomLine:
      "A good course is worth it -- eventually. But paying $5,000 for training before you have a single lead to practice on slows down the feedback loop. Most successful recovery agents we work with bought a platform first, closed a deal or two, then invested the commission in formal training. The lead platform is the engine. The course is the manual. Start the engine first.",
    ctaHeadline: "Start working real leads today",
  },

  "best-surplus-funds-lead-providers-2026": {
    slug: "best-surplus-funds-lead-providers-2026",
    competitor: "All Providers",
    ourName: "USForeclosureLeads",
    title: "Best Foreclosure Surplus Fund Lead Providers 2026",
    headline: "Best Surplus Fund Lead Providers in 2026",
    subheadline:
      "We ranked every viable option for sourcing foreclosure overage leads -- from paid platforms to DIY scraping to free Facebook lists.",
    metaTitle:
      "Best Foreclosure Surplus Fund Lead Providers 2026 | Ranked & Reviewed",
    metaDescription:
      "Ranked comparison of the best foreclosure surplus fund lead providers in 2026. Includes paid platforms, DIY scraping, Facebook groups, and training courses. See which is right for your recovery business.",
    targetKeywords: [
      "best surplus fund lead providers 2026",
      "foreclosure overage lead services ranked",
      "best foreclosure surplus leads",
      "surplus fund recovery leads comparison 2026",
      "top foreclosure overage platforms",
    ],
    intro:
      "The surplus fund recovery business runs on lead quality. The source of your leads determines your close rate, your compliance exposure, and ultimately whether this business works for you. We've analyzed every major approach to sourcing foreclosure overage leads -- here's our honest ranking for 2026.",
    features: [],
    ourPrice: { label: "", notes: "" },
    theirPrice: { label: "", notes: "" },
    whoShouldChooseUs: [],
    whoShouldChooseThem: [],
    bottomLine: "",
    ctaHeadline: "Start with the #1 ranked platform",
    isRoundup: true,
    roundupEntries: [
      {
        rank: 1,
        name: "USForeclosureLeads",
        tagline: "Best overall for working recovery agents",
        isUs: true,
        pros: [
          "Daily leads from 140+ counties across 19 non-judicial states",
          "Automatic skip trace on every new lead",
          "DNC scrub on all phone numbers before outreach",
          "Built-in email drafting, one-click SMS, and ringless voicemail",
          "State fee cap filtering blocks unworkable states automatically",
          "Lead tier scoring (Diamond, Gold, Silver, Bronze)",
          "3,271-county court filing directory with e-filing URLs",
        ],
        cons: [
          "No API access yet (planned Q2 2026)",
          "Coverage focused on non-judicial states -- no judicial state leads",
        ],
        bestFor:
          "Recovery agents and small teams who want to start contacting leads immediately without building their own pipeline infrastructure.",
        price: "From $149/month",
        verdict:
          "The most complete platform available for non-judicial state surplus fund recovery. Daily fresh leads, built-in outreach tools, and full compliance coverage make it the clear choice for working agents.",
      },
      {
        rank: 2,
        name: "DIY County Scraping",
        tagline: "Maximum control, significant time cost",
        pros: [
          "Full control over which counties and states you target",
          "No monthly subscription fee",
          "Can be customized for very specific lead criteria",
        ],
        cons: [
          "40-80 hours/month to build and maintain scrapers",
          "County websites change frequently -- scrapers break often",
          "No built-in skip trace, DNC scrub, or outreach tools",
          "No fee cap filtering -- easy to waste time on unworkable states",
          "Potential legal exposure from scraping county sites",
          "Missed leads while scrapers are down for maintenance",
        ],
        bestFor:
          "Technical teams at larger recovery operations who need custom data feeds and have dedicated developer resources.",
        price:
          '"Free" + significant time cost and hard costs for skip trace/DNC',
        verdict:
          "Viable for well-resourced operations with technical staff. Not practical for individual agents or small teams who need to be making calls, not debugging scrapers.",
      },
      {
        rank: 3,
        name: "Surplus Fund Recovery Courses",
        tagline: "Best for education, not for leads",
        pros: [
          "Deep legal knowledge by state",
          "Community support and mentorship",
          "Templates, scripts, and process documentation",
          "Some courses include attorney referral networks",
        ],
        cons: [
          "$2,997-$5,000+ upfront with no leads included",
          "Weeks to months before you're ready to start outreach",
          "No skip trace, DNC, or outreach tools included",
          "Quality varies widely between providers",
        ],
        bestFor:
          "Agents brand new to surplus fund recovery who need foundational legal knowledge before starting outreach.",
        price: "$2,997 - $5,000+ one-time",
        verdict:
          "Worth buying after you've started working leads, not before. Use a platform to close your first deal, then invest the commission in formal training.",
      },
      {
        rank: 4,
        name: "Facebook Group Lead Lists",
        tagline: "Free but heavily diluted",
        pros: [
          "No cost to access",
          "Can supplement paid leads in specific markets",
          "Good for learning what lead data looks like",
        ],
        cons: [
          "Same leads go to thousands of other recovery agents",
          "Unverified -- no skip trace, no DNC scrub",
          "Frequently includes leads from unworkable states",
          "Leads are days to weeks old by the time they're posted",
          "Homeowners often already contacted by multiple agents",
        ],
        bestFor:
          "Agents testing the surplus fund model before committing to a paid platform.",
        price: "Free",
        verdict:
          "A useful learning tool but not a viable lead source for a real recovery business. The exclusivity problem alone kills the conversion rate.",
      },
      {
        rank: 5,
        name: "ForeclosureSurplusList (and similar legacy platforms)",
        tagline: "Older tech, higher price",
        pros: [
          "Established platform with history in the space",
          "Basic lead data across multiple states",
          "Some agents have existing workflows built around it",
        ],
        cons: [
          "Weekly or slower lead updates (vs daily)",
          "No built-in skip trace",
          "No DNC scrub",
          "No state fee cap filtering",
          "No outreach tools -- email, SMS, and voice drops are separate costs",
          "Higher effective cost when you add necessary third-party tools",
        ],
        bestFor:
          "Agents already using the platform with existing workflows who haven't evaluated alternatives recently.",
        price:
          "From $197/month (plus skip trace, DNC, and outreach tool costs)",
        verdict:
          "Not competitive with modern platforms on data freshness or tooling. Worth re-evaluating if you're currently a subscriber.",
      },
    ],
  },
};

export const comparisonSlugs = Object.keys(comparisonPages);

export function getComparisonBySlug(slug: string): ComparisonPage | undefined {
  return comparisonPages[slug];
}
