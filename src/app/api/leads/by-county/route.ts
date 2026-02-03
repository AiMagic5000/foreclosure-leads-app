import { NextResponse } from "next/server"

// This endpoint provides lead counts by county FIPS code
// In production, this would query the database populated by the scraping system

interface CountyLeadData {
  fips: string
  name: string
  state: string
  leadCount: number
}

// Mock data for demonstration - will be replaced by real database queries
// Format: FIPS code -> lead count
const mockLeadCounts: Record<string, number> = {
  // Georgia - high activity state
  '13121': 45,  // Fulton County, GA
  '13089': 32,  // DeKalb County, GA
  '13135': 28,  // Gwinnett County, GA
  '13067': 22,  // Cobb County, GA

  // Arizona - high activity state
  '04013': 67,  // Maricopa County, AZ
  '04019': 34,  // Pima County, AZ
  '04021': 18,  // Pinal County, AZ

  // Texas - high activity state
  '48201': 89,  // Harris County, TX
  '48113': 52,  // Dallas County, TX
  '48029': 41,  // Bexar County, TX
  '48439': 35,  // Tarrant County, TX
  '48453': 28,  // Travis County, TX

  // Florida - judicial state, high activity
  '12086': 78,  // Miami-Dade County, FL
  '12011': 56,  // Broward County, FL
  '12099': 45,  // Palm Beach County, FL
  '12057': 38,  // Hillsborough County, FL
  '12095': 29,  // Orange County, FL

  // California
  '06037': 112, // Los Angeles County, CA
  '06073': 54,  // San Diego County, CA
  '06059': 48,  // Orange County, CA
  '06065': 42,  // Riverside County, CA
  '06071': 36,  // San Bernardino County, CA

  // Colorado
  '08031': 34,  // Denver County, CO
  '08001': 28,  // Adams County, CO
  '08005': 25,  // Arapahoe County, CO
  '08035': 22,  // Douglas County, CO

  // Washington
  '53033': 41,  // King County, WA
  '53053': 25,  // Pierce County, WA
  '53061': 18,  // Snohomish County, WA

  // Oregon
  '41051': 29,  // Multnomah County, OR
  '41005': 18,  // Clackamas County, OR
  '41067': 15,  // Washington County, OR

  // Nevada
  '32003': 52,  // Clark County, NV
  '32031': 14,  // Washoe County, NV

  // New York - judicial state
  '36061': 45,  // New York County, NY
  '36047': 38,  // Kings County, NY
  '36081': 32,  // Queens County, NY
  '36005': 28,  // Bronx County, NY
  '36103': 22,  // Suffolk County, NY

  // Illinois - judicial state
  '17031': 67,  // Cook County, IL
  '17043': 18,  // DuPage County, IL
  '17097': 15,  // Lake County, IL

  // Ohio - judicial state
  '39035': 34,  // Cuyahoga County, OH
  '39049': 28,  // Franklin County, OH
  '39061': 22,  // Hamilton County, OH

  // Pennsylvania - judicial state
  '42101': 42,  // Philadelphia County, PA
  '42003': 28,  // Allegheny County, PA
  '42091': 18,  // Montgomery County, PA

  // Michigan
  '26163': 45,  // Wayne County, MI
  '26125': 22,  // Oakland County, MI
  '26099': 18,  // Macomb County, MI

  // New Jersey - judicial state
  '34013': 32,  // Essex County, NJ
  '34003': 28,  // Bergen County, NJ
  '34023': 25,  // Middlesex County, NJ

  // North Carolina
  '37119': 28,  // Mecklenburg County, NC
  '37183': 22,  // Wake County, NC
  '37081': 18,  // Guilford County, NC

  // Virginia
  '51059': 25,  // Fairfax County, VA
  '51760': 18,  // Richmond city, VA
  '51810': 15,  // Virginia Beach city, VA

  // Maryland - judicial state
  '24033': 28,  // Prince George's County, MD
  '24031': 25,  // Montgomery County, MD
  '24005': 22,  // Baltimore County, MD

  // Tennessee
  '47157': 32,  // Shelby County, TN
  '47037': 28,  // Davidson County, TN
  '47065': 18,  // Hamilton County, TN

  // Indiana - judicial state
  '18097': 28,  // Marion County, IN
  '18089': 18,  // Lake County, IN
  '18003': 15,  // Allen County, IN

  // Missouri
  '29189': 25,  // St. Louis County, MO
  '29095': 22,  // Jackson County, MO
  '29510': 18,  // St. Louis city, MO

  // Wisconsin - judicial state
  '55079': 25,  // Milwaukee County, WI
  '55025': 18,  // Dane County, WI
  '55133': 14,  // Waukesha County, WI

  // Minnesota
  '27053': 28,  // Hennepin County, MN
  '27123': 18,  // Ramsey County, MN
  '27003': 12,  // Anoka County, MN
}

// County names lookup (for mock data)
const countyNames: Record<string, string> = {
  '13121': 'Fulton', '13089': 'DeKalb', '13135': 'Gwinnett', '13067': 'Cobb',
  '04013': 'Maricopa', '04019': 'Pima', '04021': 'Pinal',
  '48201': 'Harris', '48113': 'Dallas', '48029': 'Bexar', '48439': 'Tarrant', '48453': 'Travis',
  '12086': 'Miami-Dade', '12011': 'Broward', '12099': 'Palm Beach', '12057': 'Hillsborough', '12095': 'Orange',
  '06037': 'Los Angeles', '06073': 'San Diego', '06059': 'Orange', '06065': 'Riverside', '06071': 'San Bernardino',
  '08031': 'Denver', '08001': 'Adams', '08005': 'Arapahoe', '08035': 'Douglas',
  '53033': 'King', '53053': 'Pierce', '53061': 'Snohomish',
  '41051': 'Multnomah', '41005': 'Clackamas', '41067': 'Washington',
  '32003': 'Clark', '32031': 'Washoe',
  '36061': 'New York', '36047': 'Kings', '36081': 'Queens', '36005': 'Bronx', '36103': 'Suffolk',
  '17031': 'Cook', '17043': 'DuPage', '17097': 'Lake',
  '39035': 'Cuyahoga', '39049': 'Franklin', '39061': 'Hamilton',
  '42101': 'Philadelphia', '42003': 'Allegheny', '42091': 'Montgomery',
  '26163': 'Wayne', '26125': 'Oakland', '26099': 'Macomb',
  '34013': 'Essex', '34003': 'Bergen', '34023': 'Middlesex',
  '37119': 'Mecklenburg', '37183': 'Wake', '37081': 'Guilford',
  '51059': 'Fairfax', '51760': 'Richmond city', '51810': 'Virginia Beach city',
  '24033': "Prince George's", '24031': 'Montgomery', '24005': 'Baltimore',
  '47157': 'Shelby', '47037': 'Davidson', '47065': 'Hamilton',
  '18097': 'Marion', '18089': 'Lake', '18003': 'Allen',
  '29189': 'St. Louis', '29095': 'Jackson', '29510': 'St. Louis city',
  '55079': 'Milwaukee', '55025': 'Dane', '55133': 'Waukesha',
  '27053': 'Hennepin', '27123': 'Ramsey', '27003': 'Anoka',
}

const stateFipsMap: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '12': 'FL', '13': 'GA',
  '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
  '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
  '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO',
  '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ',
  '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC',
  '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT',
  '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY'
}

export async function GET() {
  try {
    // TODO: Replace with actual database query when scraping system is connected
    // Example query structure:
    // const leads = await db.query(`
    //   SELECT county_fips, county_name, state_abbr, COUNT(*) as lead_count
    //   FROM foreclosure_leads
    //   WHERE status = 'active'
    //   GROUP BY county_fips, county_name, state_abbr
    // `)

    const leadData: CountyLeadData[] = Object.entries(mockLeadCounts).map(([fips, leadCount]) => ({
      fips,
      name: countyNames[fips] || 'Unknown',
      state: stateFipsMap[fips.substring(0, 2)] || 'Unknown',
      leadCount,
    }))

    // Calculate total leads
    const totalLeads = leadData.reduce((sum, county) => sum + county.leadCount, 0)
    const countiesWithLeads = leadData.length

    return NextResponse.json({
      success: true,
      data: leadData,
      meta: {
        totalLeads,
        countiesWithLeads,
        lastUpdated: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching lead data by county:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead data' },
      { status: 500 }
    )
  }
}
