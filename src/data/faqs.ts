export interface FAQ {
  question: string
  answer: string
  category: 'general' | 'tax-overage' | 'mortgage-overage' | 'business' | 'legal' | 'technical'
}

export const faqs: FAQ[] = [
  // General Questions
  {
    question: "What is surplus funds recovery and how does it work?",
    answer: "Surplus funds recovery involves helping former property owners claim excess money left over after a foreclosure sale. When a property sells at auction for more than the outstanding debt, the difference (surplus or overage) legally belongs to the previous owner. Recovery agents help locate these owners and assist them in claiming their funds, typically for a percentage-based fee.",
    category: "general"
  },
  {
    question: "What is the difference between tax deed surplus and mortgage foreclosure surplus?",
    answer: "Tax deed surplus occurs when a property is sold at a county tax sale for more than the owed taxes, fees, and costs. Mortgage foreclosure surplus happens when a bank-foreclosed property sells for more than the outstanding mortgage balance. Different statutes govern each type, and claim procedures vary by state and surplus type.",
    category: "general"
  },
  {
    question: "How do I become a foreclosure surplus funds recovery agent?",
    answer: "Most states don't require specific licensing to become a surplus funds recovery agent, but some states like California, Colorado, and Texas have regulations on finder fees and require specific disclosures. You'll need to understand your state's statutes, develop a system for finding leads, and learn how to help claimants navigate the legal process.",
    category: "general"
  },
  {
    question: "What states have the best opportunities for surplus funds recovery?",
    answer: "States with non-judicial foreclosure processes typically offer more opportunities due to faster timelines. Top states include Texas, Georgia, Florida, California, Arizona, and Colorado. However, each state has different fee caps and regulations that affect profitability.",
    category: "general"
  },
  {
    question: "How much can I charge as a surplus funds recovery agent?",
    answer: "Fee structures vary significantly by state. Some states like North Carolina cap fees at $1,000, while others like Texas allow up to 20% for assignments. Nevada and Arizona cap fees at $2,500 for mortgage overages. Always check your state's specific statutes before setting fees.",
    category: "business"
  },
  // Tax Overage Questions
  {
    question: "What is a tax lien surplus or tax deed overage?",
    answer: "A tax lien surplus or tax deed overage is the excess amount remaining after a property is sold at a county tax auction to satisfy delinquent property taxes. If the winning bid exceeds the total owed taxes, penalties, interest, and administrative costs, the surplus belongs to the former property owner or their heirs.",
    category: "tax-overage"
  },
  {
    question: "How long do property owners have to claim tax sale surplus funds?",
    answer: "Claim windows vary by state, ranging from 90 days (Connecticut) to 5 years (Rhode Island, South Carolina). After the deadline, unclaimed funds typically escheat to the county or state. It's critical to know your state's specific timeline.",
    category: "tax-overage"
  },
  {
    question: "Where are tax foreclosure surplus funds held?",
    answer: "Tax sale surplus funds are typically held by the county treasurer, tax collector, or clerk of court depending on the state. Some states transfer unclaimed funds to the state unclaimed property division after a certain period.",
    category: "tax-overage"
  },
  {
    question: "Can heirs claim tax sale surplus if the owner is deceased?",
    answer: "Yes, heirs can typically claim surplus funds, but they must prove their legal right to inherit. This usually requires death certificates, probate documents, and proof of heirship. Some states require the estate to be probated before funds can be claimed.",
    category: "tax-overage"
  },
  {
    question: "What documents are needed to file a tax surplus claim?",
    answer: "Common requirements include: proof of identity, proof of ownership at time of sale, claim form (often county-specific), W-9 tax form, and sometimes a notarized affidavit. If filing on behalf of someone else, you'll need a signed authorization or power of attorney.",
    category: "tax-overage"
  },
  // Mortgage Overage Questions
  {
    question: "What happens to excess funds after a mortgage foreclosure sale?",
    answer: "After a mortgage foreclosure, excess proceeds first pay off any junior liens (second mortgages, HOA liens, judgment liens). Any remaining surplus belongs to the former homeowner. The trustee or court holds these funds until claimed or the statutory period expires.",
    category: "mortgage-overage"
  },
  {
    question: "How do I find mortgage foreclosure surplus funds?",
    answer: "Sources include county recorder offices (notices of trustee sale), court records (judicial foreclosure states), public trustee offices, auction websites, and legal notice publications. Our platform aggregates data from multiple sources across all 50 states.",
    category: "mortgage-overage"
  },
  {
    question: "Who can claim mortgage foreclosure surplus funds?",
    answer: "The former homeowner (borrower) listed on the deed of trust or mortgage has first claim. If there were multiple owners, all must typically sign the claim. Junior lienholders may also have claims if their liens weren't fully satisfied.",
    category: "mortgage-overage"
  },
  {
    question: "What is the timeline for claiming mortgage surplus funds?",
    answer: "Timelines vary by state. For example, Texas allows 2 years, Colorado has a 30-month limit, and some states have no specific deadline but the trustee may petition the court to dispose of unclaimed funds after a certain period.",
    category: "mortgage-overage"
  },
  {
    question: "Are mortgage overage funds taxable income?",
    answer: "Generally, surplus funds from a foreclosure sale are not taxable income because they represent a return of equity you already owned. However, you may receive a 1099-S and should consult a tax professional for your specific situation.",
    category: "mortgage-overage"
  },
  // Business & Operations Questions
  {
    question: "How do I find foreclosure leads in my area?",
    answer: "Lead sources include county recorder websites, public trustee offices, court records, legal notice newspapers, auction platforms like Bid4Assets, and specialized data services. Our platform automates lead collection from over 100 sources across all 50 states, updated daily.",
    category: "business"
  },
  {
    question: "What is skip tracing and why is it important for surplus recovery?",
    answer: "Skip tracing is the process of locating people who have moved or are difficult to find. Since foreclosure leads often involve property owners who have relocated, skip tracing helps you find current contact information (phone numbers, addresses, emails) to reach potential clients.",
    category: "business"
  },
  {
    question: "Should I use ringless voicemail to contact foreclosure leads?",
    answer: "Ringless voicemail (RVM) can be effective but requires careful compliance with TCPA regulations. You must honor Do Not Call lists, avoid calling cell phones without consent for marketing, and follow time restrictions. Some states have additional telemarketing restrictions.",
    category: "business"
  },
  {
    question: "What CRM or software should I use for surplus funds recovery?",
    answer: "Essential features include lead management, skip tracing integration, document generation, task tracking, and compliance tools. Our platform includes built-in CRM features, automated skip tracing, DNC scrubbing, and voicemail delivery integration.",
    category: "business"
  },
  {
    question: "How do I scale my surplus recovery business?",
    answer: "Scaling involves: automating lead generation, implementing systematic follow-up, building a team of sub-agents, expanding to multiple states, and using technology to handle more volume. Our automation add-on handles lead scraping, skip tracing, DNC compliance, and voicemail delivery automatically.",
    category: "business"
  },
  // Legal & Compliance Questions
  {
    question: "Do I need a license to recover surplus funds for others?",
    answer: "Most states don't require a specific license, but some have regulations. California requires registration as a foreclosure consultant. Some states require you to be a licensed attorney or work under one for certain claim types. Always verify requirements in your target state.",
    category: "legal"
  },
  {
    question: "What is a surplus funds assignment agreement?",
    answer: "An assignment agreement transfers the owner's right to claim surplus funds to you in exchange for a percentage of the recovered amount. Some states like Oklahoma prohibit assignments, while others like Texas cap assignment fees at 20%. Always use state-compliant contracts.",
    category: "legal"
  },
  {
    question: "Can I charge an upfront fee for surplus recovery services?",
    answer: "This varies by state and is often restricted. Many states prohibit upfront fees for foreclosure-related services. Contingency-based fees (paid only upon successful recovery) are generally safer and more common in the industry.",
    category: "legal"
  },
  {
    question: "What is the TCPA and how does it affect my outreach?",
    answer: "The Telephone Consumer Protection Act (TCPA) regulates telemarketing calls, texts, and faxes. Key requirements include: obtaining consent before calling cell phones, honoring the Do Not Call registry, limiting call times to 8 AM - 9 PM local time, and identifying yourself on calls.",
    category: "legal"
  },
  {
    question: "What disclosure requirements exist for surplus recovery agents?",
    answer: "Many states require specific disclosures including: your fee structure, the claimant's right to claim funds themselves, any potential conflicts of interest, and your relationship to the claim. Some states require these disclosures in writing before signing any agreement.",
    category: "legal"
  },
  // Technical & Platform Questions
  {
    question: "How often is the foreclosure lead data updated?",
    answer: "Our platform updates lead data every 24 hours. We scrape county recorder websites, public trustee offices, auction platforms, and legal notice publications across all 50 states. New leads are automatically processed, skip traced, and made available in your dashboard.",
    category: "technical"
  },
  {
    question: "What data fields are included with each foreclosure lead?",
    answer: "Each lead includes: property address, owner name(s), parcel/APN number, sale date, sale amount, mortgage amount, lender name, trustee name, case number, foreclosure type, and source. Premium features add skip-traced phone numbers, emails, and mailing addresses.",
    category: "technical"
  },
  {
    question: "How does the automation add-on work?",
    answer: "The automation add-on handles the entire lead pipeline: scraping leads daily, running skip traces to find contact info, checking numbers against DNC registries, generating personalized voicemail scripts, converting scripts to audio via AI text-to-speech, and delivering ringless voicemails via SlyBroadcast.",
    category: "technical"
  },
  {
    question: "Can I export leads to my own CRM or spreadsheet?",
    answer: "Yes, all subscription tiers include CSV export functionality. You can export leads filtered by state, date range, foreclosure type, or status. The data includes all available fields including any skip-traced contact information.",
    category: "technical"
  },
  {
    question: "What integrations are available with the platform?",
    answer: "Current integrations include: Stripe for payments, Clerk for authentication, n8n for workflow automation, SlyBroadcast for voicemail delivery, FastPeopleSearch for skip tracing, and various DNC verification APIs. API access is available on multi-state plans.",
    category: "technical"
  }
]

export const getFAQsByCategory = (category: FAQ['category']): FAQ[] => {
  return faqs.filter(faq => faq.category === category)
}

export const getAllCategories = (): FAQ['category'][] => {
  return ['general', 'tax-overage', 'mortgage-overage', 'business', 'legal', 'technical']
}

export const getCategoryLabel = (category: FAQ['category']): string => {
  const labels: Record<FAQ['category'], string> = {
    'general': 'General Questions',
    'tax-overage': 'Tax Sale Surplus',
    'mortgage-overage': 'Mortgage Foreclosure',
    'business': 'Business Operations',
    'legal': 'Legal & Compliance',
    'technical': 'Platform & Technical'
  }
  return labels[category]
}
