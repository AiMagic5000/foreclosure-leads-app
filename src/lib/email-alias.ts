// Manual account-merge aliases.
//
// Maps a secondary login email to the canonical account email so BOTH logins
// resolve to the SAME user_pins row, users row, and lead assignments. Applied
// server-side wherever a Clerk email is resolved to an account (role/tier,
// lead ownership, comms identity).
//
// 2026-07-06: Terra Givens signs in with two Google accounts. Her second login
// (tjestatemanagementllc@gmail.com) auto-created an empty duplicate pin, so she
// saw "new user / no leads". Aliasing it to her primary terrag6@gmail.com makes
// every server lookup land on her real pin (262d626b) — leads, notes, voice
// sample, partnership status all persist across both logins.
// 2026-07-30: agents kept typing their COMPANY mailbox into the platform sign-in
// and getting "Couldn't find your account" — the mailbox and the platform login
// are different systems. Rather than keep explaining that, the company address is
// now a real verified login on the Clerk account and is aliased here so both land
// on the same pin. This matters beyond sign-in: isCommsAuthorized() and
// resolveOperatorConfig() read Clerk's emailAddresses[0], which is NOT guaranteed
// to be the primary — without the alias the agent signs in fine but every email
// preview 403s with "Access required".
//
// Also folds five agents whose user_pins email differs from the address they
// actually log in with (found in the 2026-07-30 pin audit). Any of them hitting a
// comms route resolves to no pin and silently loses email/SMS until aliased.
const EMAIL_ALIASES: Record<string, string> = {
  "tjestatemanagementllc@gmail.com": "terrag6@gmail.com",
  // Charles Hill II — company mailbox -> platform account (pin 447cd7f2)
  "charleshill@usforeclosurerecovery.com": "hill1414@gmail.com",
  // login email -> the address on their user_pins row
  "nikkihcoleman@gmail.com": "nikki@arisesurplusrescue.com",
  "qhall@gavelmgmt.com": "support@taagnyc.com",
  "jonathanpleli1984@gmail.com": "plelijonathan@gmail.com",
  "jtothedizzel@gmail.com": "plelijonathan@gmail.com",
  "growthwithpaul@yahoo.com": "growthwithpaul@gmail.com",
}

/** Lowercase/trim an email and fold any known alias to its canonical account email. */
export function canonicalEmail(email?: string | null): string {
  const e = (email || "").toLowerCase().trim()
  return EMAIL_ALIASES[e] || e
}
