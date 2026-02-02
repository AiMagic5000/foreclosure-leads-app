export interface StateInfo {
  name: string
  abbr: string
  foreclosureType: 'judicial' | 'non-judicial' | 'both'
  taxOverageStatute: string | null
  mortgageOverageStatute: string | null
  timelineNotes: string | null
  feeLimits: string | null
  claimWindow: string | null
  sources: { name: string; url: string; type: string }[]
}

export const statesData: StateInfo[] = [
  {
    name: 'Alabama',
    abbr: 'AL',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'Title 40-10-28',
    mortgageOverageStatute: null,
    timelineNotes: 'No mortgage overage details',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Alabama Tax Sales', url: 'https://revenue.alabama.gov/property-tax/', type: 'tax_sale' }
    ]
  },
  {
    name: 'Alaska',
    abbr: 'AK',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '29.45.480',
    mortgageOverageStatute: '09.45.380 & 09.45.400',
    timelineNotes: 'Tax overages must get claim filed within 6 months of tax sale date',
    feeLimits: null,
    claimWindow: '6 months',
    sources: [
      { name: 'Alaska DNR', url: 'https://dnr.alaska.gov/recorder', type: 'county_recorder' }
    ]
  },
  {
    name: 'Arizona',
    abbr: 'AZ',
    foreclosureType: 'non-judicial',
    taxOverageStatute: null,
    mortgageOverageStatute: '33-812',
    timelineNotes: 'No tax overages; $2,500 finder fee cap for mortgage',
    feeLimits: '$2,500 cap',
    claimWindow: null,
    sources: [
      { name: 'Maricopa County Recorder', url: 'https://recorder.maricopa.gov/recdocdata/', type: 'county_recorder' },
      { name: 'Pima County Recorder', url: 'https://www.recorder.pima.gov/', type: 'county_recorder' }
    ]
  },
  {
    name: 'Arkansas',
    abbr: 'AR',
    foreclosureType: 'both',
    taxOverageStatute: '26-37-205',
    mortgageOverageStatute: '18-50-109',
    timelineNotes: 'Fee >10% considered unconscionable for tax overages',
    feeLimits: '10% max',
    claimWindow: null,
    sources: [
      { name: 'Arkansas Land Records', url: 'https://www.ark.org/arland/index.php', type: 'state_records' }
    ]
  },
  {
    name: 'California',
    abbr: 'CA',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '4675',
    mortgageOverageStatute: '2924k',
    timelineNotes: '12-month wait before distribution; mortgage consultant restrictions apply',
    feeLimits: 'Consultant restrictions',
    claimWindow: '12 months',
    sources: [
      { name: 'Los Angeles County', url: 'https://assessor.lacounty.gov/', type: 'county_assessor' },
      { name: 'San Diego County', url: 'https://arcc.sdcounty.ca.gov/', type: 'county_recorder' }
    ]
  },
  {
    name: 'Colorado',
    abbr: 'CO',
    foreclosureType: 'non-judicial',
    taxOverageStatute: null,
    mortgageOverageStatute: '2016 Bill',
    timelineNotes: 'No tax overages; 30-month limit, 20-30% fee cap for mortgage',
    feeLimits: '20-30% cap',
    claimWindow: '30 months',
    sources: [
      { name: 'Denver Public Trustee', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Public-Trustee', type: 'public_trustee' },
      { name: 'Weld County', url: 'https://weld.realforeclose.com', type: 'auction' },
      { name: 'Arapahoe County', url: 'https://www.arapahoeco.gov/your_county/county_departments/public_trustee', type: 'public_trustee' }
    ]
  },
  {
    name: 'Connecticut',
    abbr: 'CT',
    foreclosureType: 'judicial',
    taxOverageStatute: '12-157',
    mortgageOverageStatute: 'Chapter 846 Section 49-27',
    timelineNotes: '90 days to submit tax claim, then funds go to state',
    feeLimits: null,
    claimWindow: '90 days',
    sources: [
      { name: 'CT Judicial', url: 'https://www.jud.ct.gov/foreclosure/', type: 'judicial' }
    ]
  },
  {
    name: 'Delaware',
    abbr: 'DE',
    foreclosureType: 'judicial',
    taxOverageStatute: 'Title 9 Chapter 87, 8779',
    mortgageOverageStatute: 'Title 10 Chapter 49',
    timelineNotes: 'Online lead research available',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Delaware Courts', url: 'https://courts.delaware.gov/', type: 'judicial' }
    ]
  },
  {
    name: 'District of Columbia',
    abbr: 'DC',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '47-1307',
    mortgageOverageStatute: 'Title 42 Chapter 8',
    timelineNotes: 'No surplus fund details in mortgage statute',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'DC Recorder', url: 'https://otr.cfo.dc.gov/page/recorder-deeds', type: 'recorder' }
    ]
  },
  {
    name: 'Florida',
    abbr: 'FL',
    foreclosureType: 'judicial',
    taxOverageStatute: '197.582',
    mortgageOverageStatute: '45.032 & 45.033',
    timelineNotes: '20% POA limit for tax; 12% assignment limit for mortgage',
    feeLimits: '20% tax, 12% mortgage',
    claimWindow: null,
    sources: [
      { name: 'Miami-Dade Clerk', url: 'https://www.miamidadeclerk.gov/ocs/', type: 'county_clerk' },
      { name: 'Orange County', url: 'https://www.occompt.com/', type: 'county_comptroller' }
    ]
  },
  {
    name: 'Georgia',
    abbr: 'GA',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '48-4-5 & 48-4-81',
    mortgageOverageStatute: '44-14-190',
    timelineNotes: 'Consider attorney for county relations',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Georgia Public Notice', url: 'https://www.georgiapublicnotice.com/Search?searchType=notices&category=foreclosure', type: 'legal_notice' },
      { name: 'Bid4Assets GA', url: 'https://www.bid4assets.com/resources/auctionlist.cfm?state=GA', type: 'auction' }
    ]
  },
  {
    name: 'Hawaii',
    abbr: 'HI',
    foreclosureType: 'both',
    taxOverageStatute: '246-63',
    mortgageOverageStatute: '667-3 & 31',
    timelineNotes: '1-year no-fee period; 2-year state hold before 25% fee recovery',
    feeLimits: '25% after 2 years',
    claimWindow: '1-2 years',
    sources: [
      { name: 'Hawaii BREA', url: 'https://cca.hawaii.gov/reb/', type: 'state_agency' }
    ]
  },
  {
    name: 'Idaho',
    abbr: 'ID',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '31-808',
    mortgageOverageStatute: '45-1507',
    timelineNotes: '60-day claim window after notice; 2-year state hold period',
    feeLimits: null,
    claimWindow: '60 days',
    sources: [
      { name: 'Ada County', url: 'https://adacounty.id.gov/treasurer/', type: 'county_treasurer' }
    ]
  },
  {
    name: 'Illinois',
    abbr: 'IL',
    foreclosureType: 'judicial',
    taxOverageStatute: 'See 21-215',
    mortgageOverageStatute: '735 ILCS 5/15-1512',
    timelineNotes: 'No tax overages',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Cook County Recorder', url: 'https://www.cookcountyrecorder.com/', type: 'county_recorder' }
    ]
  },
  {
    name: 'Indiana',
    abbr: 'IN',
    foreclosureType: 'judicial',
    taxOverageStatute: 'IC 6-1.1-24-6.4',
    mortgageOverageStatute: 'IC 32-30-10-14',
    timelineNotes: '10% max fee with disclosure requirements',
    feeLimits: '10% max',
    claimWindow: null,
    sources: [
      { name: 'Marion County', url: 'https://www.indy.gov/activity/treasurer', type: 'county_treasurer' }
    ]
  },
  {
    name: 'Iowa',
    abbr: 'IA',
    foreclosureType: 'judicial',
    taxOverageStatute: null,
    mortgageOverageStatute: '654.7',
    timelineNotes: 'Overages called "overplus"',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Iowa Courts', url: 'https://www.iowacourts.gov/', type: 'judicial' }
    ]
  },
  {
    name: 'Kansas',
    abbr: 'KS',
    foreclosureType: 'judicial',
    taxOverageStatute: '79-2803',
    mortgageOverageStatute: '58-213',
    timelineNotes: null,
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Kansas Courts', url: 'https://www.kscourts.org/', type: 'judicial' }
    ]
  },
  {
    name: 'Kentucky',
    abbr: 'KY',
    foreclosureType: 'judicial',
    taxOverageStatute: null,
    mortgageOverageStatute: '426.5',
    timelineNotes: null,
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Kentucky Courts', url: 'https://courts.ky.gov/', type: 'judicial' }
    ]
  },
  {
    name: 'Louisiana',
    abbr: 'LA',
    foreclosureType: 'judicial',
    taxOverageStatute: 'See 47:2211',
    mortgageOverageStatute: 'Civil Code 2373',
    timelineNotes: 'Sheriff handles mortgage overages',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Orleans Parish', url: 'https://www.opcso.org/', type: 'sheriff' }
    ]
  },
  {
    name: 'Maine',
    abbr: 'ME',
    foreclosureType: 'judicial',
    taxOverageStatute: 'Title 36, 949 & 992',
    mortgageOverageStatute: 'Title 14, Part 7, Chapter 713',
    timelineNotes: 'Tax overages newly allowed as of 2023',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Maine Courts', url: 'https://www.courts.maine.gov/', type: 'judicial' }
    ]
  },
  {
    name: 'Maryland',
    abbr: 'MD',
    foreclosureType: 'both',
    taxOverageStatute: '14-18',
    mortgageOverageStatute: '14-305-306',
    timelineNotes: 'Tax lien state; foreclosure consultant statute applies; avoid assignments',
    feeLimits: 'Consultant restrictions',
    claimWindow: null,
    sources: [
      { name: 'Maryland Land Records', url: 'https://mdlandrec.net/', type: 'state_records' }
    ]
  },
  {
    name: 'Massachusetts',
    abbr: 'MA',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'Chapter 60 Section 28',
    mortgageOverageStatute: 'Chapter 183 Section 27',
    timelineNotes: null,
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'MA Land Records', url: 'https://www.masslandrecords.com/', type: 'state_records' }
    ]
  },
  {
    name: 'Michigan',
    abbr: 'MI',
    foreclosureType: 'both',
    taxOverageStatute: null,
    mortgageOverageStatute: '211.56, .78',
    timelineNotes: 'County retains tax overages; state access possible within years',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Wayne County', url: 'https://www.waynecounty.com/treasurer/', type: 'county_treasurer' }
    ]
  },
  {
    name: 'Minnesota',
    abbr: 'MN',
    foreclosureType: 'both',
    taxOverageStatute: null,
    mortgageOverageStatute: '580.1',
    timelineNotes: null,
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Hennepin County', url: 'https://www.hennepin.us/residents/property', type: 'county_recorder' }
    ]
  },
  {
    name: 'Mississippi',
    abbr: 'MS',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'Title 27 Chapter 41',
    mortgageOverageStatute: 'Title 89 Chapter 1',
    timelineNotes: '2-year claim window from end of redemption period',
    feeLimits: null,
    claimWindow: '2 years',
    sources: [
      { name: 'MS Secretary of State', url: 'https://www.sos.ms.gov/', type: 'state_agency' }
    ]
  },
  {
    name: 'Missouri',
    abbr: 'MO',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'Chapter 140.230',
    mortgageOverageStatute: 'Statute 443',
    timelineNotes: '90-day availability window; 3-year maximum hold',
    feeLimits: null,
    claimWindow: '90 days - 3 years',
    sources: [
      { name: 'St. Louis County', url: 'https://revenue.stlouisco.com/', type: 'county_revenue' }
    ]
  },
  {
    name: 'Montana',
    abbr: 'MT',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'SB253',
    mortgageOverageStatute: '71-7-225 & 71-1-316',
    timelineNotes: '120-day claim window; 5-year unclaimed property period',
    feeLimits: null,
    claimWindow: '120 days - 5 years',
    sources: [
      { name: 'Montana Clerk', url: 'https://sosmt.gov/records/', type: 'state_records' }
    ]
  },
  {
    name: 'Nebraska',
    abbr: 'NE',
    foreclosureType: 'judicial',
    taxOverageStatute: null,
    mortgageOverageStatute: '76-1011 & 25-1540',
    timelineNotes: 'Confusion exists regarding surplus fund applicability',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Douglas County', url: 'https://www.douglascounty-ne.gov/', type: 'county_recorder' }
    ]
  },
  {
    name: 'Nevada',
    abbr: 'NV',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'NRS 361.610',
    mortgageOverageStatute: 'NRS 40.462-463',
    timelineNotes: '10% tax fee limit, 1-year deadline; $2,500 mortgage cap',
    feeLimits: '10% tax, $2,500 mortgage',
    claimWindow: '1 year',
    sources: [
      { name: 'Clark County Recorder', url: 'https://www.clarkcountynv.gov/government/elected_officials/county_recorder/index.php', type: 'county_recorder' },
      { name: 'Washoe County', url: 'https://www.washoecounty.gov/recorder/', type: 'county_recorder' }
    ]
  },
  {
    name: 'New Hampshire',
    abbr: 'NH',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'Title V, Chapter 80:88',
    mortgageOverageStatute: 'Section 479: 22-23',
    timelineNotes: 'Limited mortgage overage information',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'NH Deed Records', url: 'https://www.nhdeeds.org/', type: 'state_records' }
    ]
  },
  {
    name: 'New Jersey',
    abbr: 'NJ',
    foreclosureType: 'judicial',
    taxOverageStatute: 'Title 54',
    mortgageOverageStatute: '2A:50-37',
    timelineNotes: 'Bid-down system typically prevents overages',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'NJ Courts', url: 'https://www.njcourts.gov/', type: 'judicial' }
    ]
  },
  {
    name: 'New Mexico',
    abbr: 'NM',
    foreclosureType: 'judicial',
    taxOverageStatute: '7-38-71',
    mortgageOverageStatute: '48-10-15',
    timelineNotes: '2-year state hold before overage recovery',
    feeLimits: null,
    claimWindow: '2 years',
    sources: [
      { name: 'Bernalillo County', url: 'https://www.bernco.gov/clerk/', type: 'county_clerk' }
    ]
  },
  {
    name: 'New York',
    abbr: 'NY',
    foreclosureType: 'judicial',
    taxOverageStatute: '1194',
    mortgageOverageStatute: '1354, 1361, & 1362',
    timelineNotes: 'County-by-county variations; focus higher populations',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'NYC ACRIS', url: 'https://a836-acris.nyc.gov/CP/', type: 'city_records' }
    ]
  },
  {
    name: 'North Carolina',
    abbr: 'NC',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '105-374(q)',
    mortgageOverageStatute: '45-21.31',
    timelineNotes: '$1,000 fee cap',
    feeLimits: '$1,000 cap',
    claimWindow: null,
    sources: [
      { name: 'NC Register of Deeds', url: 'https://www.sosnc.gov/', type: 'state_records' }
    ]
  },
  {
    name: 'North Dakota',
    abbr: 'ND',
    foreclosureType: 'judicial',
    taxOverageStatute: null,
    mortgageOverageStatute: '32-10-10',
    timelineNotes: 'No tax overages; court handles mortgage; 90-day window',
    feeLimits: null,
    claimWindow: '90 days',
    sources: [
      { name: 'ND Courts', url: 'https://www.ndcourts.gov/', type: 'judicial' }
    ]
  },
  {
    name: 'Ohio',
    abbr: 'OH',
    foreclosureType: 'judicial',
    taxOverageStatute: '5721.2',
    mortgageOverageStatute: '2329.44',
    timelineNotes: '90-day claim for mortgage; 3-year window for tax',
    feeLimits: null,
    claimWindow: '90 days - 3 years',
    sources: [
      { name: 'Cuyahoga County', url: 'https://fiscalofficer.cuyahogacounty.us/', type: 'county_fiscal' }
    ]
  },
  {
    name: 'Oklahoma',
    abbr: 'OK',
    foreclosureType: 'both',
    taxOverageStatute: '68-3131',
    mortgageOverageStatute: 'Title 15 765 & 773 & 46-48',
    timelineNotes: '1-year claim window; assignments prohibited',
    feeLimits: 'No assignments',
    claimWindow: '1 year',
    sources: [
      { name: 'Oklahoma County', url: 'https://www.oklahomacounty.org/treasurer/', type: 'county_treasurer' }
    ]
  },
  {
    name: 'Oregon',
    abbr: 'OR',
    foreclosureType: 'both',
    taxOverageStatute: null,
    mortgageOverageStatute: '86.794',
    timelineNotes: 'No tax overages',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Multnomah County', url: 'https://multco.us/recording', type: 'county_recorder' },
      { name: 'Washington County', url: 'https://washcotax.co.washington.or.us', type: 'county_assessor' }
    ]
  },
  {
    name: 'Pennsylvania',
    abbr: 'PA',
    foreclosureType: 'judicial',
    taxOverageStatute: 'PA ST 72 P.S. 5971m & 5891-5895',
    mortgageOverageStatute: 'Rule 3136',
    timelineNotes: '2-5 year window for tax overages; 30-day sheriff reporting',
    feeLimits: null,
    claimWindow: '2-5 years',
    sources: [
      { name: 'Philadelphia Recorder', url: 'https://www.phila.gov/departments/department-of-records/', type: 'city_records' }
    ]
  },
  {
    name: 'Rhode Island',
    abbr: 'RI',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '44-9-37',
    mortgageOverageStatute: '34-11-22',
    timelineNotes: '5-year hold on tax overage funds',
    feeLimits: null,
    claimWindow: '5 years',
    sources: [
      { name: 'Providence Recorder', url: 'https://www.providenceri.gov/', type: 'city_records' }
    ]
  },
  {
    name: 'South Carolina',
    abbr: 'SC',
    foreclosureType: 'judicial',
    taxOverageStatute: '12-51-130',
    mortgageOverageStatute: '29-3-650',
    timelineNotes: '5-year tax overage claim window',
    feeLimits: null,
    claimWindow: '5 years',
    sources: [
      { name: 'SC Courts', url: 'https://www.sccourts.org/', type: 'judicial' }
    ]
  },
  {
    name: 'South Dakota',
    abbr: 'SD',
    foreclosureType: 'judicial',
    taxOverageStatute: '10/22/2027',
    mortgageOverageStatute: 'State Code 21-48-16',
    timelineNotes: '1-year tax claim window; CD investment option',
    feeLimits: null,
    claimWindow: '1 year',
    sources: [
      { name: 'SD Courts', url: 'https://ujs.sd.gov/', type: 'judicial' }
    ]
  },
  {
    name: 'Tennessee',
    abbr: 'TN',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'Title 67',
    mortgageOverageStatute: 'Title 35',
    timelineNotes: '10% fee limit if licensed; trustee distributes',
    feeLimits: '10% if licensed',
    claimWindow: null,
    sources: [
      { name: 'Davidson County', url: 'https://www.nashville.gov/departments/clerk/records', type: 'county_recorder' },
      { name: 'Shelby County', url: 'https://register.shelby.tn.us/', type: 'county_recorder' }
    ]
  },
  {
    name: 'Texas',
    abbr: 'TX',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '34.02-04',
    mortgageOverageStatute: '70.007',
    timelineNotes: '2-year claim window; 20% assignment fee limit',
    feeLimits: '20% assignment limit',
    claimWindow: '2 years',
    sources: [
      { name: 'Harris County', url: 'https://www.cclerk.hctx.net/', type: 'county_clerk' },
      { name: 'Dallas County', url: 'https://www.dallascounty.org/', type: 'county_clerk' }
    ]
  },
  {
    name: 'Utah',
    abbr: 'UT',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '59-2-1351.1',
    mortgageOverageStatute: '57-1-29',
    timelineNotes: '60-day response period post-claim; 24-month state hold',
    feeLimits: null,
    claimWindow: '60 days - 24 months',
    sources: [
      { name: 'Salt Lake County', url: 'https://slco.org/recorder/', type: 'county_recorder' }
    ]
  },
  {
    name: 'Vermont',
    abbr: 'VT',
    foreclosureType: 'judicial',
    taxOverageStatute: 'Title 32 Chapter 133, 5061',
    mortgageOverageStatute: 'Vt. Rules Civ. P.80.1(j)(1)',
    timelineNotes: 'Identical treatment for both overage types',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'VT Courts', url: 'https://www.vermontjudiciary.org/', type: 'judicial' }
    ]
  },
  {
    name: 'Virginia',
    abbr: 'VA',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '58.1-3967',
    mortgageOverageStatute: '55-59.4 & 8.9A-608',
    timelineNotes: '2-year tax claim window; trustee mortgage disbursement',
    feeLimits: null,
    claimWindow: '2 years',
    sources: [
      { name: 'Fairfax County', url: 'https://www.fairfaxcounty.gov/circuit/clerk/', type: 'county_clerk' }
    ]
  },
  {
    name: 'Washington',
    abbr: 'WA',
    foreclosureType: 'non-judicial',
    taxOverageStatute: 'RCW 84.64.080(10)',
    mortgageOverageStatute: 'RCW 61.24.080',
    timelineNotes: '5% maximum finder fee per RCW 63.29.350',
    feeLimits: '5% max',
    claimWindow: null,
    sources: [
      { name: 'King County', url: 'https://www.kingcounty.gov/depts/records-licensing/recorders-office.aspx', type: 'county_recorder' },
      { name: 'Snohomish County', url: 'https://snohomishcountywa.gov/220/Tax-Foreclosures', type: 'tax_foreclosure' },
      { name: 'Pierce County', url: 'https://www.piercecountywa.gov/718/Purchasing-Foreclosure-Property', type: 'foreclosure_info' }
    ]
  },
  {
    name: 'West Virginia',
    abbr: 'WV',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '11A-3-10',
    mortgageOverageStatute: '38-1-7 & 8',
    timelineNotes: '2-year claim window from redemption date',
    feeLimits: null,
    claimWindow: '2 years',
    sources: [
      { name: 'WV SOS', url: 'https://sos.wv.gov/', type: 'state_agency' }
    ]
  },
  {
    name: 'Wisconsin',
    abbr: 'WI',
    foreclosureType: 'judicial',
    taxOverageStatute: '75.521(14a)',
    mortgageOverageStatute: '846.08 & .10(3)',
    timelineNotes: 'No current tax overages; court holds mortgage funds',
    feeLimits: null,
    claimWindow: null,
    sources: [
      { name: 'Milwaukee County', url: 'https://county.milwaukee.gov/EN/Register-of-Deeds', type: 'county_recorder' }
    ]
  },
  {
    name: 'Wyoming',
    abbr: 'WY',
    foreclosureType: 'non-judicial',
    taxOverageStatute: '39-13-108(IV)',
    mortgageOverageStatute: '34-4-113',
    timelineNotes: '2-year tax claim deadline or county keeps funds',
    feeLimits: null,
    claimWindow: '2 years',
    sources: [
      { name: 'Laramie County', url: 'https://www.laramiecounty.com/', type: 'county_clerk' }
    ]
  }
]

export const getStateByAbbr = (abbr: string): StateInfo | undefined => {
  return statesData.find(s => s.abbr.toLowerCase() === abbr.toLowerCase())
}

export const getStatesByType = (type: 'judicial' | 'non-judicial' | 'both'): StateInfo[] => {
  return statesData.filter(s => s.foreclosureType === type)
}

export const getNonJudicialStates = (): StateInfo[] => {
  return statesData.filter(s => s.foreclosureType === 'non-judicial' || s.foreclosureType === 'both')
}
