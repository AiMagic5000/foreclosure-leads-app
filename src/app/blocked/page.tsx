import Link from 'next/link'

// Served to accounts flagged publicMetadata.blocked — they can sign in and
// browse the public site, but every dashboard route lands here.
export default function BlockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050d1a] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0b1f3a] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-3xl">
          ⛔
        </div>
        <h1 className="text-xl font-bold text-white">Account Access Restricted</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Your account&apos;s dashboard access has been suspended by the administrator. If you believe
          this is a mistake, contact our team and we&apos;ll review it.
        </p>
        <div className="mt-6 space-y-2 text-sm">
          <p className="text-slate-400">
            support@usforeclosureleads.com &middot; (888) 545-8007
          </p>
          <Link href="/" className="inline-block font-semibold text-slate-200 underline underline-offset-4">
            Back to the homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
