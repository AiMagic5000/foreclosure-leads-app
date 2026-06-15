import type { Metadata } from "next"

const OG = "https://usforeclosureleads.com/usforeclosureleads-free-training-og.png"

// Scoped to /webcast/livefb only — overrides the parent webcast OG image with
// the free-live-training creative. (livefb/page.tsx is a client component and
// can't export metadata itself.)
export const metadata: Metadata = {
  title: "Free Live Training - Recover Surplus Funds From Home",
  openGraph: {
    title: "Free Live Training - How Everyday People Recover Surplus Funds From Home",
    description:
      "Watch the free live training. Up to 50 skip-traced leads a week, automated outreach built in.",
    type: "website",
    images: [
      {
        url: OG,
        width: 1200,
        height: 671,
        alt: "Free live training - how everyday people recover surplus funds from home - US Foreclosure Leads",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Live Training - Recover Surplus Funds From Home",
    images: [OG],
  },
}

export default function LiveFbLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
