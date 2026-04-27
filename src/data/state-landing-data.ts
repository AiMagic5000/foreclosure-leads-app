// Priority state data for individual landing pages
// Tier 1 (Very Easy, no fee cap, best ROI): VA, AL, MS, ID, MT, WY
// Tier 2 (Easy, no fee cap, strong ROI):   AK, MO, OR, NE, WV

export interface StateLandingData {
  abbr: string;
  name: string;
  slug: string;
  tier: 1 | 2;
  difficulty: string;
  foreclosureType: "Non-Judicial" | "Judicial" | "Both";
  feeCap: string;
  claimWindow: string;
  taxStatute: string;
  mortgageStatute: string;
  statuteNotes: string;
  avgSurplus: number;
  monthlyLeads: number;
  caseStudy: {
    amount: number;
    county: string;
    story: string;
  };
  targetKeywords: string[];
  metaDescription: string;
}

export const stateLandingData: Record<string, StateLandingData> = {
  VA: {
    abbr: "VA",
    name: "Virginia",
    slug: "virginia",
    tier: 1,
    difficulty: "Very Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "2 years",
    taxStatute: "58.1-3967",
    mortgageStatute: "55-59.4 / 8.9A-608",
    statuteNotes:
      "Tax overage claims must be filed within 2 years or funds are forfeited. For mortgage overages, the trustee may disburse funds directly to the former owner.",
    avgSurplus: 28400,
    monthlyLeads: 120,
    caseStudy: {
      amount: 41200,
      county: "Fairfax",
      story:
        "A Fairfax County homeowner lost their property to a non-judicial trustee sale and had no idea $41,200 in surplus remained after the lender was paid. A recovery agent located the family using our platform and returned the funds within 90 days -- keeping $12,360 as a 30% contingency fee.",
    },
    targetKeywords: [
      "foreclosure surplus funds Virginia",
      "Virginia overage funds recovery",
      "Virginia non-judicial foreclosure surplus",
      "finder fee Virginia surplus",
      "Virginia 55-59.4 mortgage overage",
    ],
    metaDescription:
      "Access Virginia foreclosure surplus fund leads daily. Non-judicial state, no fee cap, 2-year claim window. Avg $28K surplus. Start recovering today.",
  },

  AL: {
    abbr: "AL",
    name: "Alabama",
    slug: "alabama",
    tier: 1,
    difficulty: "Very Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "3 years",
    taxStatute: "Title 40-10-28",
    mortgageStatute: "N/A",
    statuteNotes:
      "Alabama Title 40-10-28 governs tax sale overages. Non-judicial mortgage foreclosures are handled through a trustee sale process with surplus returned to the former owner.",
    avgSurplus: 22100,
    monthlyLeads: 95,
    caseStudy: {
      amount: 33500,
      county: "Jefferson",
      story:
        "A Jefferson County, Alabama homeowner had $33,500 sitting unclaimed after a trustee sale. Our platform surfaced the lead within 24 hours of the public record filing. The agent made contact, signed a contingency agreement, and recovered the funds in 75 days.",
    },
    targetKeywords: [
      "foreclosure surplus funds Alabama",
      "Alabama overage recovery agent",
      "Alabama Title 40-10-28 surplus",
      "non-judicial foreclosure surplus Alabama",
      "finder fee Alabama surplus funds",
    ],
    metaDescription:
      "Alabama foreclosure surplus leads delivered daily. Non-judicial state, no finder fee cap, avg $22K surplus. Title 40-10-28 governs claims. Get started.",
  },

  MS: {
    abbr: "MS",
    name: "Mississippi",
    slug: "mississippi",
    tier: 1,
    difficulty: "Very Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "2 years",
    taxStatute: "Title 27, Chapter 41",
    mortgageStatute: "Title 89, Chapter 1",
    statuteNotes:
      "Mississippi tax overage claims must be filed within 2 years of the end of the redemption period. Non-judicial mortgage surplus funds are governed by Title 89.",
    avgSurplus: 19800,
    monthlyLeads: 70,
    caseStudy: {
      amount: 27000,
      county: "Hinds",
      story:
        "A Hinds County homeowner was unaware of $27,000 in surplus funds held after their property sold at a non-judicial foreclosure sale. Our platform flagged the lead on the day of recording. The agent recovered the full surplus within 60 days.",
    },
    targetKeywords: [
      "foreclosure surplus funds Mississippi",
      "Mississippi overage recovery",
      "Mississippi non-judicial surplus",
      "finder fee Mississippi",
      "Mississippi Title 27 surplus funds",
    ],
    metaDescription:
      "Mississippi foreclosure surplus leads updated daily. Non-judicial state, no fee cap, 2-year window. Avg $20K surplus. Start your recovery business today.",
  },

  ID: {
    abbr: "ID",
    name: "Idaho",
    slug: "idaho",
    tier: 1,
    difficulty: "Very Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "60 days from notice (tax), 2 years (state unclaimed)",
    taxStatute: "31-808",
    mortgageStatute: "45-1507",
    statuteNotes:
      "Idaho sends notice within 30 days of sale. Claimant then has 60 days from notice date. After that, funds transfer to the state's unclaimed property fund where they're accessible for 2 additional years under 14-536.",
    avgSurplus: 31200,
    monthlyLeads: 45,
    caseStudy: {
      amount: 48000,
      county: "Ada",
      story:
        "An Ada County homeowner received no notification that $48,000 in surplus funds existed after their trustee sale. Our platform identified the lead within hours of filing. After verifying the claim window, the agent contacted the owner and filed within the 60-day notice window.",
    },
    targetKeywords: [
      "foreclosure surplus funds Idaho",
      "Idaho overage recovery",
      "Idaho 45-1507 mortgage surplus",
      "Idaho non-judicial surplus finder",
      "foreclosure overages Boise Idaho",
    ],
    metaDescription:
      "Idaho foreclosure surplus leads delivered daily. Non-judicial state, no fee cap, 60-day claim window from notice. Avg $31K surplus. Act fast -- time-sensitive.",
  },

  MT: {
    abbr: "MT",
    name: "Montana",
    slug: "montana",
    tier: 1,
    difficulty: "Very Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "120 days from notice",
    taxStatute: "SB253 (2019)",
    mortgageStatute: "71-7-225 / 71-1-316",
    statuteNotes:
      "Montana's SB253 (2019) created a tax overage statute. Claims must be filed within 120 days of the notice sent post-sale. Mortgage overages under 71-7-225 allow surplus notice to be filed with the recorder and funds deposited into court.",
    avgSurplus: 35600,
    monthlyLeads: 38,
    caseStudy: {
      amount: 52000,
      county: "Yellowstone",
      story:
        "A Yellowstone County homeowner missed the 120-day window on a previous case because nobody told them the funds existed. Our platform surfaces Montana leads the day they're recorded. This agent found the lead with 90 days remaining and closed the claim successfully.",
    },
    targetKeywords: [
      "foreclosure surplus funds Montana",
      "Montana SB253 overage recovery",
      "Montana non-judicial surplus",
      "finder fee Montana",
      "Montana 71-7-225 mortgage surplus",
    ],
    metaDescription:
      "Montana foreclosure surplus leads daily. Non-judicial state, no fee cap, 120-day claim window. Avg $35K surplus. SB253 created new opportunities in 2019.",
  },

  WY: {
    abbr: "WY",
    name: "Wyoming",
    slug: "wyoming",
    tier: 1,
    difficulty: "Very Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "2 years from sale date",
    taxStatute: "39-13-108(IV)",
    mortgageStatute: "34-4-113",
    statuteNotes:
      "Tax overage claims must be filed within 2 years of the sale date or the county retains the funds. Wyoming's non-judicial mortgage foreclosure process (34-4-113) allows surplus to be claimed by the former owner.",
    avgSurplus: 29500,
    monthlyLeads: 32,
    caseStudy: {
      amount: 38000,
      county: "Laramie",
      story:
        "A Laramie County property sold at a non-judicial foreclosure auction and generated $38,000 in surplus. The former owners had relocated out of state and were unaware. Our platform found the lead, the agent tracked down the family, and the claim was filed within 6 months of the sale.",
    },
    targetKeywords: [
      "foreclosure surplus funds Wyoming",
      "Wyoming overage recovery agent",
      "Wyoming 34-4-113 mortgage surplus",
      "finder fee Wyoming surplus funds",
      "Wyoming non-judicial foreclosure surplus",
    ],
    metaDescription:
      "Wyoming foreclosure surplus leads updated daily. Non-judicial state, no fee cap, 2-year claim window. Avg $30K surplus. Great for new and experienced recovery agents.",
  },

  AK: {
    abbr: "AK",
    name: "Alaska",
    slug: "alaska",
    tier: 2,
    difficulty: "Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "6 months from sale (tax)",
    taxStatute: "29.45.480",
    mortgageStatute: "09.45.380 / 09.45.400",
    statuteNotes:
      "Tax overage claims must be filed within 6 months of the tax sale date. Mortgage overages under 09.45.380 allow the former owner to recover surplus from the trustee.",
    avgSurplus: 41000,
    monthlyLeads: 28,
    caseStudy: {
      amount: 55000,
      county: "Anchorage",
      story:
        "An Anchorage homeowner had $55,000 sitting unclaimed after their non-judicial foreclosure sale. The 6-month tax sale window meant speed was critical. Our platform surfaced the lead the same week as the sale, giving the agent 5 months to contact the owner and file.",
    },
    targetKeywords: [
      "foreclosure surplus funds Alaska",
      "Alaska overage recovery",
      "Alaska 09.45.380 mortgage surplus",
      "non-judicial foreclosure surplus Alaska",
      "finder fee Alaska surplus",
    ],
    metaDescription:
      "Alaska foreclosure surplus leads updated daily. Non-judicial state, no fee cap, 6-month window. Avg $41K surplus -- among the highest per-case in the country.",
  },

  MO: {
    abbr: "MO",
    name: "Missouri",
    slug: "missouri",
    tier: 2,
    difficulty: "Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "Up to 3 years",
    taxStatute: "Chapter 140.230",
    mortgageStatute: "Statute 443",
    statuteNotes:
      "Missouri 140.230 governs tax sale surplus and may also apply to mortgage overages (references 'other debt'). Funds are available for distribution 90 days after redemption and for up to 3 years before escheating to the county school fund.",
    avgSurplus: 24300,
    monthlyLeads: 88,
    caseStudy: {
      amount: 36000,
      county: "St. Louis",
      story:
        "A St. Louis County non-judicial foreclosure generated $36,000 in surplus funds. The former homeowner had no legal representation and didn't know to claim the money. Our agent found the lead, signed the homeowner within 2 weeks, and filed successfully before the 3-year window closed.",
    },
    targetKeywords: [
      "foreclosure surplus funds Missouri",
      "Missouri overage recovery agent",
      "Missouri 140.230 surplus funds",
      "Missouri non-judicial foreclosure surplus",
      "finder fee Missouri surplus",
    ],
    metaDescription:
      "Missouri foreclosure surplus leads delivered daily. Non-judicial state, no fee cap, up to 3-year window. Avg $24K surplus. High lead volume with excellent ROI.",
  },

  OR: {
    abbr: "OR",
    name: "Oregon",
    slug: "oregon",
    tier: 2,
    difficulty: "Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "Varies by county",
    taxStatute: "N/A",
    mortgageStatute: "86.794",
    statuteNotes:
      "Oregon handles mortgage overages under 86.794. There are no state-level tax overages. The trustee from the non-judicial sale holds surplus funds for the former owner's benefit.",
    avgSurplus: 47200,
    monthlyLeads: 62,
    caseStudy: {
      amount: 68000,
      county: "Multnomah",
      story:
        "A Multnomah County (Portland area) homeowner had $68,000 in surplus sitting with the trustee after a non-judicial sale. High home values in Oregon create substantial surplus opportunities. The agent found the lead within 48 hours of the public filing.",
    },
    targetKeywords: [
      "foreclosure surplus funds Oregon",
      "Oregon overage recovery",
      "Oregon 86.794 mortgage surplus",
      "Oregon non-judicial surplus funds",
      "finder fee Oregon surplus",
    ],
    metaDescription:
      "Oregon foreclosure surplus leads daily. Non-judicial state, no fee cap, avg $47K surplus -- one of the highest in the country. High home values mean bigger recoveries.",
  },

  NE: {
    abbr: "NE",
    name: "Nebraska",
    slug: "nebraska",
    tier: 2,
    difficulty: "Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "Varies by county",
    taxStatute: "N/A",
    mortgageStatute: "76-1011 / 25-1540",
    statuteNotes:
      "Nebraska's non-judicial process handles surplus under 76-1011 and 25-1540 (sheriff sale surplus). The state's bidding structure commonly generates surplus when competitive buyers exceed the debt amount.",
    avgSurplus: 21500,
    monthlyLeads: 52,
    caseStudy: {
      amount: 29500,
      county: "Douglas",
      story:
        "A Douglas County (Omaha area) homeowner missed that $29,500 in surplus existed after the sheriff's sale. Our platform flags Nebraska leads daily. The agent contacted the owner within 3 days and filed a claim within the county's timeline.",
    },
    targetKeywords: [
      "foreclosure surplus funds Nebraska",
      "Nebraska overage recovery",
      "Nebraska 76-1011 surplus",
      "Nebraska non-judicial foreclosure surplus",
      "finder fee Nebraska surplus funds",
    ],
    metaDescription:
      "Nebraska foreclosure surplus leads updated daily. Non-judicial state, no fee cap, avg $21K surplus. Douglas and Lancaster counties generate consistent lead volume.",
  },

  WV: {
    abbr: "WV",
    name: "West Virginia",
    slug: "west-virginia",
    tier: 2,
    difficulty: "Easy",
    foreclosureType: "Non-Judicial",
    feeCap: "None (30% standard)",
    claimWindow: "2 years from redemption date",
    taxStatute: "11A-3-10",
    mortgageStatute: "38-1-7 / 38-1-8",
    statuteNotes:
      "West Virginia tax overage claims must be filed within 2 years of the redemption date. Mortgage surplus under 38-1-7 and 38-1-8 governs trustee distribution of excess proceeds.",
    avgSurplus: 18900,
    monthlyLeads: 44,
    caseStudy: {
      amount: 24000,
      county: "Kanawha",
      story:
        "A Kanawha County homeowner had $24,000 in unclaimed surplus from a non-judicial foreclosure. West Virginia's 2-year window gives agents time to build trust before filing. The agent signed a contingency agreement within 3 weeks and recovered funds on the homeowner's behalf.",
    },
    targetKeywords: [
      "foreclosure surplus funds West Virginia",
      "West Virginia overage recovery",
      "West Virginia 11A-3-10 tax surplus",
      "non-judicial foreclosure surplus West Virginia",
      "finder fee West Virginia surplus",
    ],
    metaDescription:
      "West Virginia foreclosure surplus leads daily. Non-judicial state, no fee cap, 2-year window. Avg $19K surplus. Consistent lead flow from Kanawha and Cabell counties.",
  },
};

export const priorityStateSlugs = Object.values(stateLandingData).map(
  (s) => s.slug
);

export function getStateBySlug(slug: string): StateLandingData | undefined {
  return Object.values(stateLandingData).find((s) => s.slug === slug);
}
