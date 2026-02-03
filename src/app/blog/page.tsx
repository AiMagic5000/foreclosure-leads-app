import { Header } from "@/components/header";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, User, Clock, Tag } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  tag: string;
  tagColor: string;
  summary: string;
  readTime: string;
  date: string;
  gradientAngle: number;
}

const blogPosts: BlogPost[] = [
  {
    slug: "martinez-family-47k-recovery",
    title: "How We Helped the Martinez Family Recover $47,000 in Surplus Funds",
    tag: "Case Study",
    tagColor: "bg-green-500",
    summary: "A Texas family lost their home to foreclosure and had no idea $47,000 in surplus funds sat unclaimed at the county courthouse. Here is how we tracked them down and got their money back.",
    readTime: "8 min",
    date: "January 28, 2026",
    gradientAngle: 135
  },
  {
    slug: "single-mother-23k-mortgage-surplus",
    title: "Single Mother Receives $23,500 Check After Mortgage Foreclosure",
    tag: "Case Study",
    tagColor: "bg-green-500",
    summary: "After losing her home in Florida, Keisha had given up hope. Our skip tracing located her in a new state, and we helped her file a successful claim for mortgage overage funds.",
    readTime: "7 min",
    date: "January 22, 2026",
    gradientAngle: 90
  },
  {
    slug: "veteran-31k-tax-deed-georgia",
    title: "Retired Veteran Recovers $31,000 in Tax Deed Surplus from Georgia County",
    tag: "Case Study",
    tagColor: "bg-green-500",
    summary: "James served 22 years in the Army. When his property was sold at a tax deed auction, the county held over $31,000 in surplus. Our team connected him with his funds within 60 days.",
    readTime: "9 min",
    date: "January 15, 2026",
    gradientAngle: 45
  },
  {
    slug: "estate-heirs-89k-foreclosure-recovery",
    title: "Estate Recovery: Heirs Collect $89,000 from Deceased Parent's Foreclosure",
    tag: "Case Study",
    tagColor: "bg-green-500",
    summary: "When Robert passed away, his children had no idea his foreclosed property generated nearly $89,000 in surplus. This is the story of how probate and surplus recovery intersected.",
    readTime: "10 min",
    date: "January 8, 2026",
    gradientAngle: 180
  },
  {
    slug: "california-couple-15k-tax-sale",
    title: "California Couple Gets $15,800 Back Two Years After Tax Sale",
    tag: "Case Study",
    tagColor: "bg-green-500",
    summary: "Mark and Lisa lost their investment property in a California tax sale. Two years later, our agents found unclaimed surplus and guided them through the state's specific claim process.",
    readTime: "6 min",
    date: "December 30, 2025",
    gradientAngle: 225
  },
  {
    slug: "3k-lead-52k-recovery-north-carolina",
    title: "How a $3,000 Lead Turned Into a $52,000 Recovery in North Carolina",
    tag: "Case Study",
    tagColor: "bg-green-500",
    summary: "Recovery agent Tamara found what looked like a small claim in our database. After deeper research, the actual surplus was over $52,000. Here is how she closed the deal.",
    readTime: "8 min",
    date: "December 22, 2025",
    gradientAngle: 270
  },
  {
    slug: "2026-finder-fee-limits-by-state",
    title: "2026 State-by-State Finder Fee Limits: What Recovery Agents Need to Know",
    tag: "Legal Update",
    tagColor: "bg-red-500",
    summary: "Finder fee caps vary dramatically from state to state. Arizona caps at $2,500 per case while Texas allows 20% via assignment. This comprehensive breakdown covers all 50 states.",
    readTime: "12 min",
    date: "January 25, 2026",
    gradientAngle: 315
  },
  {
    slug: "tcpa-regulations-2026-surplus-recovery",
    title: "New TCPA Regulations for 2026: How They Affect Surplus Fund Recovery",
    tag: "Legal Update",
    tagColor: "bg-red-500",
    summary: "The FCC issued new guidance on ringless voicemail and automated dialing. Here is what changed for surplus fund recovery agents and how to stay compliant.",
    readTime: "10 min",
    date: "January 18, 2026",
    gradientAngle: 60
  },
  {
    slug: "montana-sb253-tax-overages",
    title: "Montana Senate Bill 253: How Tax Overages Became Available for Recovery",
    tag: "Legal Update",
    tagColor: "bg-red-500",
    summary: "Montana used to keep all tax sale surplus. Senate Bill 253 changed that. This article breaks down the new 120-day claim window and what agents need to file.",
    readTime: "7 min",
    date: "January 12, 2026",
    gradientAngle: 120
  },
  {
    slug: "mortgage-foreclosure-consultant-statutes",
    title: "The Complete Guide to Mortgage Foreclosure Consultant Statutes",
    tag: "Industry Guide",
    tagColor: "bg-blue-500",
    summary: "Several states have \"foreclosure consultant\" laws that directly affect how recovery agents can operate. California, Maryland, and Florida all have specific restrictions you must understand.",
    readTime: "14 min",
    date: "January 5, 2026",
    gradientAngle: 150
  },
  {
    slug: "dnc-scrubbing-best-practices",
    title: "DNC Scrubbing Best Practices for Asset Recovery Professionals",
    tag: "Industry Guide",
    tagColor: "bg-blue-500",
    summary: "Getting hit with a TCPA violation can cost $500 to $1,500 per call. This guide covers federal and state DNC list scrubbing, safe harbor provisions, and the tools that keep you compliant.",
    readTime: "9 min",
    date: "December 28, 2025",
    gradientAngle: 200
  },
  {
    slug: "assignment-vs-poa-claim-methods",
    title: "Assignment vs. Power of Attorney: Choosing the Right Claim Method by State",
    tag: "Industry Guide",
    tagColor: "bg-blue-500",
    summary: "Some states prohibit assignments for tax overages. Others require specific language in your forms. This state-by-state breakdown helps you pick the right legal approach for every claim.",
    readTime: "11 min",
    date: "December 20, 2025",
    gradientAngle: 240
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1e3a5f] via-[#2563eb] to-[#3b82f6] text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Asset Recovery Blog
            </h1>
            <p className="text-lg md:text-xl text-blue-100 leading-relaxed">
              Industry insights, case studies, and legal updates for foreclosure surplus recovery professionals.
              Learn from real success stories and stay compliant with the latest regulations.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg flex flex-col"
              >
                {/* Image Placeholder with Gradient */}
                <div
                  className="h-48 relative flex items-center justify-center"
                  style={{
                    background: `linear-gradient(${post.gradientAngle}deg, #1e3a5f 0%, #3b82f6 100%)`
                  }}
                >
                  <Tag className="w-16 h-16 text-white opacity-30" />
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Tag Badge */}
                  <div className="mb-3">
                    <span className={`${post.tagColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                      {post.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Summary */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                    {post.summary}
                  </p>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#3b82f6] font-medium">
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-300">
              &copy; 2026 US Foreclosure Recovery Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
