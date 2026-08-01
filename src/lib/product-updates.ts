// Product updates shown in the dashboard notification bell. Newest first.
// Add a new entry with a HIGHER id and the bell's red dot starts blinking for
// every user again until they open the panel (read state lives in localStorage).
export type ProductUpdate = { id: number; date: string; title: string; body: string; href?: string }

export const PRODUCT_UPDATES: ProductUpdate[] = [
  {
    id: 11,
    date: "2026-07-21",
    title: "New: Skip Trace + DNC right in Import Leads",
    body: "Upload your own list, and one click gets you phone numbers. After an import, hit the new Skip Trace + DNC Check button - we trace every lead that has a name and address (numbers and emails land on your leads automatically), and every imported number is queued for a DNC check so texting and voice drops unlock. Your leads, ready to work, no waiting.",
    href: "/dashboard/import",
  },
  {
    id: 10,
    date: "2026-07-19",
    title: "New: Import Leads guide + Excel template",
    body: "Bringing in your own leads? We added a step-by-step Import Leads guide (PDF) plus a ready-to-use Excel template — just drop your leads into the columns and upload. Find both in your training under Module 12, Agent Communications & Lead Management, in the Resources section.",
    href: "/dashboard/closing-training",
  },
  {
    id: 9,
    date: "2026-07-14",
    title: "Your effort now counts — literally",
    body: "The dashboard now tracks your active time on the platform (only while you're actually here — background tabs don't count). Why it matters: when you get a contingency agreement signed, we can show exactly what your hours produced — real input-to-output numbers behind every win. Grind quietly; the numbers will speak for you.",
    href: "/dashboard/my-leads",
  },
  {
    id: 8,
    date: "2026-07-14",
    title: "County intel everywhere: search counties + click any county or address",
    body: "Three upgrades in one. (1) The Foreclosure State Map search now finds counties too — type any county name and matching county cards appear right alongside the states; click one for lead counts, county contacts, and court-filing info. (2) On My Leads, the county under a claimant's name is now clickable — same county popup, right from the lead. (3) Click any property address on a lead and it jumps straight to that lead's Map tab.",
    href: "/dashboard/states",
  },
  {
    id: 7,
    date: "2026-07-11",
    title: "Claimants can sign online — right from your email",
    body: "Your claimant email now includes a 'Review & Sign Online' button. The claimant opens their agreement on their phone — already filled in with their name, property, and surplus — and signs with a finger in about two minutes. The moment they sign, the lead shows a green SIGNED badge and we can start the claim. The attached copy stays the same, so nothing changes about how you send.",
    href: "/dashboard/my-leads",
  },
  {
    id: 6,
    date: "2026-07-07",
    title: "Live DNC check button",
    body: "Phones that haven't been Do-Not-Call verified now show a 'Run DNC check' button. Click it and we check the number against the registry live — if it's clean, voice drops and texting unlock on the spot.",
    href: "/dashboard/my-leads",
  },
  {
    id: 5,
    date: "2026-07-07",
    title: "Email any address on a lead",
    body: "Leads with more than one email now show a 'Draft to:' row. Pick any address and your personalized claimant email is drafted to that exact one.",
    href: "/dashboard/my-leads",
  },
  {
    id: 4,
    date: "2026-07-07",
    title: "Add contact info you find",
    body: "Found an email or phone for a claimant that isn't on the lead? Expand the lead and use 'Add email' / 'Add phone'. Outreach can use it immediately (new phones unlock after a DNC check).",
    href: "/dashboard/my-leads",
  },
  {
    id: 3,
    date: "2026-07-07",
    title: "Delete your imported leads",
    body: "Leads you imported yourself now have a 'Delete lead' button in the expanded view, so you can clean up and re-import. Company-provided leads stay protected.",
    href: "/dashboard/my-leads",
  },
  {
    id: 2,
    date: "2026-07-07",
    title: "Importer upgrade: bring in everything",
    body: "The lead importer now takes a full name OR first + last name, property AND mailing/current addresses, and up to 3 phones + 3 emails per lead — all of it saved on the lead.",
    href: "/dashboard/import",
  },
  {
    id: 1,
    date: "2026-07-06",
    title: "Lead notes and outreach polish",
    body: "Faster voice-drop queue, cleaner lead cards, and outreach buttons that reflect DNC status accurately across the board.",
    href: "/dashboard/my-leads",
  },
]

export const LATEST_UPDATE_ID = PRODUCT_UPDATES[0].id
