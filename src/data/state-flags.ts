// State flag image URLs (Wikimedia redirect API) and Wikipedia page links
export interface StateFlagInfo {
  flagUrl: string
  wikiUrl: string
}

function flagUrl(filename: string): string {
  return `https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=45`
}

export const stateFlags: Record<string, StateFlagInfo> = {
  AL: { flagUrl: flagUrl("Flag of Alabama.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Alabama" },
  AK: { flagUrl: flagUrl("Flag of Alaska.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Alaska" },
  AZ: { flagUrl: flagUrl("Flag of Arizona.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Arizona" },
  AR: { flagUrl: flagUrl("Flag of Arkansas.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Arkansas" },
  CA: { flagUrl: flagUrl("Flag of California.svg"), wikiUrl: "https://en.wikipedia.org/wiki/California" },
  CO: { flagUrl: flagUrl("Flag of Colorado.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Colorado" },
  CT: { flagUrl: flagUrl("Flag of Connecticut.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Connecticut" },
  DE: { flagUrl: flagUrl("Flag of Delaware.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Delaware" },
  FL: { flagUrl: flagUrl("Flag of Florida.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Florida" },
  GA: { flagUrl: flagUrl("Flag of Georgia (U.S. state).svg"), wikiUrl: "https://en.wikipedia.org/wiki/Georgia_(U.S._state)" },
  HI: { flagUrl: flagUrl("Flag of Hawaii.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Hawaii" },
  ID: { flagUrl: flagUrl("Flag of Idaho.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Idaho" },
  IL: { flagUrl: flagUrl("Flag of Illinois.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Illinois" },
  IN: { flagUrl: flagUrl("Flag of Indiana.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Indiana" },
  IA: { flagUrl: flagUrl("Flag of Iowa.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Iowa" },
  KS: { flagUrl: flagUrl("Flag of Kansas.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Kansas" },
  KY: { flagUrl: flagUrl("Flag of Kentucky.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Kentucky" },
  LA: { flagUrl: flagUrl("Flag of Louisiana.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Louisiana" },
  ME: { flagUrl: flagUrl("Flag of Maine.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Maine" },
  MD: { flagUrl: flagUrl("Flag of Maryland.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Maryland" },
  MA: { flagUrl: flagUrl("Flag of Massachusetts.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Massachusetts" },
  MI: { flagUrl: flagUrl("Flag of Michigan.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Michigan" },
  MN: { flagUrl: flagUrl("Flag of Minnesota.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Minnesota" },
  MS: { flagUrl: flagUrl("Flag of Mississippi.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Mississippi" },
  MO: { flagUrl: flagUrl("Flag of Missouri.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Missouri" },
  MT: { flagUrl: flagUrl("Flag of Montana.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Montana" },
  NE: { flagUrl: flagUrl("Flag of Nebraska.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Nebraska" },
  NV: { flagUrl: flagUrl("Flag of Nevada.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Nevada" },
  NH: { flagUrl: flagUrl("Flag of New Hampshire.svg"), wikiUrl: "https://en.wikipedia.org/wiki/New_Hampshire" },
  NJ: { flagUrl: flagUrl("Flag of New Jersey.svg"), wikiUrl: "https://en.wikipedia.org/wiki/New_Jersey" },
  NM: { flagUrl: flagUrl("Flag of New Mexico.svg"), wikiUrl: "https://en.wikipedia.org/wiki/New_Mexico" },
  NY: { flagUrl: flagUrl("Flag of New York.svg"), wikiUrl: "https://en.wikipedia.org/wiki/New_York_(state)" },
  NC: { flagUrl: flagUrl("Flag of North Carolina.svg"), wikiUrl: "https://en.wikipedia.org/wiki/North_Carolina" },
  ND: { flagUrl: flagUrl("Flag of North Dakota.svg"), wikiUrl: "https://en.wikipedia.org/wiki/North_Dakota" },
  OH: { flagUrl: flagUrl("Flag of Ohio.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Ohio" },
  OK: { flagUrl: flagUrl("Flag of Oklahoma.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Oklahoma" },
  OR: { flagUrl: flagUrl("Flag of Oregon.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Oregon" },
  PA: { flagUrl: flagUrl("Flag of Pennsylvania.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Pennsylvania" },
  RI: { flagUrl: flagUrl("Flag of Rhode Island.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Rhode_Island" },
  SC: { flagUrl: flagUrl("Flag of South Carolina.svg"), wikiUrl: "https://en.wikipedia.org/wiki/South_Carolina" },
  SD: { flagUrl: flagUrl("Flag of South Dakota.svg"), wikiUrl: "https://en.wikipedia.org/wiki/South_Dakota" },
  TN: { flagUrl: flagUrl("Flag of Tennessee.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Tennessee" },
  TX: { flagUrl: flagUrl("Flag of Texas.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Texas" },
  UT: { flagUrl: flagUrl("Flag of Utah.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Utah" },
  VT: { flagUrl: flagUrl("Flag of Vermont.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Vermont" },
  VA: { flagUrl: flagUrl("Flag of Virginia.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Virginia" },
  WA: { flagUrl: flagUrl("Flag of Washington.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Washington_(state)" },
  WV: { flagUrl: flagUrl("Flag of West Virginia.svg"), wikiUrl: "https://en.wikipedia.org/wiki/West_Virginia" },
  WI: { flagUrl: flagUrl("Flag of Wisconsin.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Wisconsin" },
  WY: { flagUrl: flagUrl("Flag of Wyoming.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Wyoming" },
  DC: { flagUrl: flagUrl("Flag of the District of Columbia.svg"), wikiUrl: "https://en.wikipedia.org/wiki/Washington,_D.C." },
}
