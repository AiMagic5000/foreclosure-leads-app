import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Data Research Training Course | US Foreclosure Leads",
  description:
    "Free self-paced online training course teaching data research skills. Learn how to navigate open databases, verify data, and organize research workflows. Beginner-friendly, no prior experience required.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Free Data Research Training Course",
    description:
      "Self-paced online training course teaching data research and database navigation skills. Free enrollment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Data Research Training Course",
    description:
      "Self-paced online training course teaching data research skills. Free enrollment.",
  },
};

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
