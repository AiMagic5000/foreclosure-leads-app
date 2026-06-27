// Certified-letter rule: NEVER mail to the foreclosed property address.
// A certified letter only goes out when the owner has a SEPARATE mailing
// address (a different physical place than the foreclosed property).
//
// Naive string equality fails because the same place is formatted differently
// ("1950 CONCORD DRIVE" vs "1950 Concord Dr, Chicago Heights, IL 60411").
// We compare the street number + first street-name token instead.

const STREET_WORDS =
  /\b(street|st|drive|dr|avenue|ave|road|rd|lane|ln|court|ct|boulevard|blvd|circle|cir|place|pl|terrace|ter|trail|trl|way|highway|hwy|parkway|pkwy|square|sq|loop|run|pike|path|cove|cv|point|pt|n|s|e|w|north|south|east|west|ne|nw|se|sw)\b/g

function streetKey(addr: string): string {
  const n = (addr || "")
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(STREET_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim()
  // leading "<number> <firstNameToken>" if present, else first comma segment
  const m = n.match(/^(\d+)\s+([a-z0-9]+)/)
  if (m) return `${m[1]} ${m[2]}`
  return n.split(",")[0].trim()
}

/**
 * True only when `mailing` is a real, separate address from the foreclosed
 * `property` address. Empty/missing mailing => false. Same physical place
 * (same street number + street name, any formatting) => false.
 */
export function hasSeparateMailingAddress(property?: string | null, mailing?: string | null): boolean {
  const m = (mailing || "").trim()
  if (!m) return false
  const pk = streetKey(property || "")
  const mk = streetKey(m)
  if (!mk) return false
  if (!pk) return true // no property address to compare against; mailing exists
  return pk !== mk
}
