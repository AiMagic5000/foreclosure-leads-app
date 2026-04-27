import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Live Webcast - Surplus Funds Foreclosure Recovery | Foreclosure Recovery Inc.',
  description: 'Join our free 30-minute webcast and discover the highest-paying independent job most people have never heard of. Free preview account and partnership program details inside.',
  openGraph: {
    title: 'Free Live Webcast - Surplus Funds Foreclosure Recovery',
    description: 'Free 30-minute webcast. Free preview account. See real surplus fund deals and learn how the partnership program works. Limited spots.',
    type: 'website',
    images: [
      {
        url: '/assets/webcast-hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Foreclosure Recovery Inc. - Free Live Webcast',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Live Webcast - Surplus Funds Foreclosure Recovery',
    description: 'Free 30-minute webcast. Free preview account. See real surplus fund deals and learn how the partnership program works.',
    images: ['/assets/webcast-hero-bg.png'],
  },
}

export default function WebcastLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
