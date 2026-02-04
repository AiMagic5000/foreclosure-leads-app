export interface StateRecoveryDeadline {
  stateAbbr: string
  stateName: string
  recoveryMonths: number
  source: 'statute' | 'estimated'
  notes: string
}

export const stateRecoveryDeadlines: Record<string, StateRecoveryDeadline> = {
  AL: {
    stateAbbr: 'AL',
    stateName: 'Alabama',
    recoveryMonths: 120,
    source: 'statute',
    notes: 'Surplus held by County Treasurer up to 10 years (120 months) per Title 40-10-28. After 3 years, requires circuit court order for redemption.'
  },
  AK: {
    stateAbbr: 'AK',
    stateName: 'Alaska',
    recoveryMonths: 6,
    source: 'statute',
    notes: '6 months from tax sale date per 29.45.480. Municipality must send notice to former owner at last known address.'
  },
  AZ: {
    stateAbbr: 'AZ',
    stateName: 'Arizona',
    recoveryMonths: 24,
    source: 'statute',
    notes: 'No tax overages. Mortgage overage escheat period is 2 years per 33-812. Cannot contact homeowner within 30 days of sale. Fee cap of $2,500.'
  },
  AR: {
    stateAbbr: 'AR',
    stateName: 'Arkansas',
    recoveryMonths: 60,
    source: 'statute',
    notes: 'Funds placed in escrow for 5 years per 26-37-205. After 1 year escrow you may apply for distribution. Fee capped at 10%.'
  },
  CA: {
    stateAbbr: 'CA',
    stateName: 'California',
    recoveryMonths: 12,
    source: 'statute',
    notes: '12 months from sale date per Section 4675. Mortgage consultant restrictions apply. Cannot contract directly with homeowner.'
  },
  CO: {
    stateAbbr: 'CO',
    stateName: 'Colorado',
    recoveryMonths: 30,
    source: 'statute',
    notes: 'No tax overages. 30-month limit per HB16-1090. Cannot contract with homeowner until 2.5 years after sale. 20-30% fee cap after that period.'
  },
  CT: {
    stateAbbr: 'CT',
    stateName: 'Connecticut',
    recoveryMonths: 3,
    source: 'statute',
    notes: '90 days after sale date per 12-157. Funds escheat after 90 days. Very tight window.'
  },
  DE: {
    stateAbbr: 'DE',
    stateName: 'Delaware',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window in statute. Must hire attorney to file petition. Funds held by County Tax Collector per Title 9 Section 8779.'
  },
  DC: {
    stateAbbr: 'DC',
    stateName: 'District of Columbia',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No specific claim window in statute. Tax overages per 47-1307, mortgage per Title 42 Chapter 8. No surplus fund details in mortgage statute.'
  },
  FL: {
    stateAbbr: 'FL',
    stateName: 'Florida',
    recoveryMonths: 36,
    source: 'statute',
    notes: 'Funds held by Clerk of Court for 1 year after 2-year redemption period (3 years total from sale) per 197.582 and Chapter 717. 12% fee via assignment, 30% via consulting agreement with attorney.'
  },
  GA: {
    stateAbbr: 'GA',
    stateName: 'Georgia',
    recoveryMonths: 60,
    source: 'statute',
    notes: '5-year escheat period per 48-4-5. Cannot file claim for surplus during redemption period. Attorney required.'
  },
  HI: {
    stateAbbr: 'HI',
    stateName: 'Hawaii',
    recoveryMonths: 12,
    source: 'statute',
    notes: 'Surplus held by Treasurer for first 12 months with no fee limits. Months 13-36 no third-party finder allowed. Funds never escheat to state per 667-3/31.'
  },
  ID: {
    stateAbbr: 'ID',
    stateName: 'Idaho',
    recoveryMonths: 2,
    source: 'statute',
    notes: '60 days to respond to county after receiving notice (about 90 days after sale) per 31-808. 24-month unclaimed property period per 14-519.'
  },
  IL: {
    stateAbbr: 'IL',
    stateName: 'Illinois',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No tax overages. Mortgage surplus held by court-appointed sale conductor per 735 ILCS 5/15-1512. No explicit claim window. Homeowner must appear in court to collect.'
  },
  IN: {
    stateAbbr: 'IN',
    stateName: 'Indiana',
    recoveryMonths: 36,
    source: 'statute',
    notes: '3-year escheat period per IC 6-1.1-24-6.4. 10% max fee with disclosure requirements.'
  },
  IA: {
    stateAbbr: 'IA',
    stateName: 'Iowa',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Overages called "overplus" per 654.7. Paid to mortgagor if no other lien exists.'
  },
  KS: {
    stateAbbr: 'KS',
    stateName: 'Kansas',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Surplus ordered by court paid to owner or party entitled per 79-2803. Funds held by County Treasurer.'
  },
  KY: {
    stateAbbr: 'KY',
    stateName: 'Kentucky',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Surplus proceeds per 426.500 paid to defendant (property owner). May be held by court or sheriff.'
  },
  LA: {
    stateAbbr: 'LA',
    stateName: 'Louisiana',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Sheriff handles surplus distribution per Civil Code 2373 and 47:2211. 3-year tax lien redemption period.'
  },
  ME: {
    stateAbbr: 'ME',
    stateName: 'Maine',
    recoveryMonths: 12,
    source: 'statute',
    notes: '12-month escheat period per Title 36 Section 949. Tax overages newly allowed as of 2023. Attorney required.'
  },
  MD: {
    stateAbbr: 'MD',
    stateName: 'Maryland',
    recoveryMonths: 36,
    source: 'statute',
    notes: '36-month escheat period. Tax lien state. Foreclosure consultant statute applies per Real Property Title 7 Subtitle 3. Do not use assignments for mortgage overages.'
  },
  MA: {
    stateAbbr: 'MA',
    stateName: 'Massachusetts',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window in statute. Funds held by Tax Collector or County Treasurer per Chapter 60 Section 28. Mortgage per Chapter 183 Section 27.'
  },
  MI: {
    stateAbbr: 'MI',
    stateName: 'Michigan',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. County may retain tax overages. Mortgage surplus per 600.3252 paid to mortgagor on demand.'
  },
  MN: {
    stateAbbr: 'MN',
    stateName: 'Minnesota',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Surplus per 580.10 paid to mortgagor or legal representatives. No tax overages statute listed.'
  },
  MS: {
    stateAbbr: 'MS',
    stateName: 'Mississippi',
    recoveryMonths: 24,
    source: 'statute',
    notes: '2-year claim window from end of redemption period per Title 27 Chapter 41. Certified by chancery clerk.'
  },
  MO: {
    stateAbbr: 'MO',
    stateName: 'Missouri',
    recoveryMonths: 3,
    source: 'statute',
    notes: '90-day availability window (shorter deadline) per 140.230. Funds held up to 3 years total. Attorney required for claims.'
  },
  MT: {
    stateAbbr: 'MT',
    stateName: 'Montana',
    recoveryMonths: 4,
    source: 'statute',
    notes: '120-day claim window per SB253. Failure to meet 120-day deadline results in forfeiture. Funds become unclaimed property after 5 years.'
  },
  NE: {
    stateAbbr: 'NE',
    stateName: 'Nebraska',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Surplus per 76-1011 distributed by trustee. Trustee fees limited to amount in trust deed.'
  },
  NV: {
    stateAbbr: 'NV',
    stateName: 'Nevada',
    recoveryMonths: 12,
    source: 'statute',
    notes: '1 year from sale date per NRS 361.610. 10% fee limit for tax overages. $2,500 max fee for mortgage overages per NRS 40.462-463.'
  },
  NH: {
    stateAbbr: 'NH',
    stateName: 'New Hampshire',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Surplus per Title V Chapter 80:88 paid after back taxes, interest, costs, and penalty. Funds held by county superior court.'
  },
  NJ: {
    stateAbbr: 'NJ',
    stateName: 'New Jersey',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Surplus deposited with court per 2A:50-37. Bid-down system typically prevents overages. Must file application with court.'
  },
  NM: {
    stateAbbr: 'NM',
    stateName: 'New Mexico',
    recoveryMonths: 24,
    source: 'statute',
    notes: '2-year state hold per 7-38-71 and 48-10-15. After 2 years, funds considered abandoned property if no former owner claims them.'
  },
  NY: {
    stateAbbr: 'NY',
    stateName: 'New York',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. County-by-county variations. Must file claim with court or administering entity per 1194, 1354, 1361, 1362.'
  },
  NC: {
    stateAbbr: 'NC',
    stateName: 'North Carolina',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window in states.ts but 90-day claim deadline in foreclosure info. Tax overages subject to N.C.G.S. 116B-78. Fee cap of 20% or $1,000, whichever is less.'
  },
  ND: {
    stateAbbr: 'ND',
    stateName: 'North Dakota',
    recoveryMonths: 3,
    source: 'statute',
    notes: '90 days per 32-10-10. Officer holds surplus for 30 days then pays into district court. Must serve notice of claim within hold period.'
  },
  OH: {
    stateAbbr: 'OH',
    stateName: 'Ohio',
    recoveryMonths: 3,
    source: 'statute',
    notes: '90 days for mortgage claims, 3-year window for tax per 2329.44 / 5721.20. Using shorter 90-day mortgage deadline. After escheat, 2-year wait then 10% finder fee.'
  },
  OK: {
    stateAbbr: 'OK',
    stateName: 'Oklahoma',
    recoveryMonths: 12,
    source: 'statute',
    notes: '1 year from sale date per 68-3131. Surplus forfeited to county after 1 year. No assignment of rights allowed for tax overages.'
  },
  OR: {
    stateAbbr: 'OR',
    stateName: 'Oregon',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No tax overages. Mortgage surplus per 86.794 paid to grantor of trust deed. No explicit claim window. Trustee/attorney fee limits apply.'
  },
  PA: {
    stateAbbr: 'PA',
    stateName: 'Pennsylvania',
    recoveryMonths: 24,
    source: 'statute',
    notes: '2-5 year window for tax overages per 72 P.S. 5971m. Using shorter 2-year deadline. After 5 years, funds escheat to state with 15% finder fee limit.'
  },
  RI: {
    stateAbbr: 'RI',
    stateName: 'Rhode Island',
    recoveryMonths: 60,
    source: 'statute',
    notes: '5-year hold on tax overage funds per 44-9-37. Attorney required. Surplus held by local tax collector.'
  },
  SC: {
    stateAbbr: 'SC',
    stateName: 'South Carolina',
    recoveryMonths: 60,
    source: 'statute',
    notes: '5-year claim window from date of sale per 12-51-130. Surplus held by Delinquent Tax Collector. After 5 years, escheats to state.'
  },
  SD: {
    stateAbbr: 'SD',
    stateName: 'South Dakota',
    recoveryMonths: 12,
    source: 'statute',
    notes: '1 year per 10-22-27. If owner cannot be found within 1 year, surplus deposited in county general fund. Surplus held by County Treasurer.'
  },
  TN: {
    stateAbbr: 'TN',
    stateName: 'Tennessee',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No explicit claim window. Funds may still be recoverable after escheat. 10% fee limit for tax and mortgage overages. Must be licensed PI and Third-Party Locator.'
  },
  TX: {
    stateAbbr: 'TX',
    stateName: 'Texas',
    recoveryMonths: 24,
    source: 'statute',
    notes: '2 years from sale date per 34.02-04 and 70.007. 10% fee for tax, 20% assignment fee for mortgage. Attorney can charge 25% or $1,000 max.'
  },
  UT: {
    stateAbbr: 'UT',
    stateName: 'Utah',
    recoveryMonths: 24,
    source: 'statute',
    notes: '60-day response period after claim filed, 24-month state hold per 59-2-1351.1 and 57-1-29. State Treasurer holds funds for 3 years total (36 months).'
  },
  VT: {
    stateAbbr: 'VT',
    stateName: 'Vermont',
    recoveryMonths: 12,
    source: 'statute',
    notes: '12-month escheat period per Title 32 Chapter 133 Section 5061. Identical treatment for both tax and mortgage overage types.'
  },
  VA: {
    stateAbbr: 'VA',
    stateName: 'Virginia',
    recoveryMonths: 24,
    source: 'statute',
    notes: '2 years from sale date per 58.1-3967. Trustee must account for proceeds within 6 months. Parties must file claim within 90 days after notice.'
  },
  WA: {
    stateAbbr: 'WA',
    stateName: 'Washington',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'Escheat state with no explicit window. 5% max finder fee per RCW 63.29.350 for both tax and mortgage. Funds held by trustee or court.'
  },
  WV: {
    stateAbbr: 'WV',
    stateName: 'West Virginia',
    recoveryMonths: 24,
    source: 'statute',
    notes: '2 years from redemption date per 11A-3-10 and 11A-3-65. 18-month tax lien redemption period.'
  },
  WI: {
    stateAbbr: 'WI',
    stateName: 'Wisconsin',
    recoveryMonths: 24,
    source: 'estimated',
    notes: 'No current tax overages. Mortgage surplus held by court per 846.162. No explicit claim window. Redemption period happens before the sale.'
  },
  WY: {
    stateAbbr: 'WY',
    stateName: 'Wyoming',
    recoveryMonths: 24,
    source: 'statute',
    notes: '2-year tax claim deadline per 39-13-108(IV). County keeps funds after deadline. 4-year tax lien redemption period.'
  }
}

export const getRecoveryDeadline = (stateAbbr: string): StateRecoveryDeadline | undefined => {
  return stateRecoveryDeadlines[stateAbbr.toUpperCase()]
}

export const getStatesByDeadlineRange = (
  minMonths: number,
  maxMonths: number
): StateRecoveryDeadline[] => {
  return Object.values(stateRecoveryDeadlines).filter(
    (s) => s.recoveryMonths >= minMonths && s.recoveryMonths <= maxMonths
  )
}

export const getUrgentStates = (withinMonths: number = 6): StateRecoveryDeadline[] => {
  return Object.values(stateRecoveryDeadlines)
    .filter((s) => s.recoveryMonths <= withinMonths)
    .sort((a, b) => a.recoveryMonths - b.recoveryMonths)
}

export const getStatuteBasedStates = (): StateRecoveryDeadline[] => {
  return Object.values(stateRecoveryDeadlines).filter((s) => s.source === 'statute')
}

export const getEstimatedStates = (): StateRecoveryDeadline[] => {
  return Object.values(stateRecoveryDeadlines).filter((s) => s.source === 'estimated')
}
