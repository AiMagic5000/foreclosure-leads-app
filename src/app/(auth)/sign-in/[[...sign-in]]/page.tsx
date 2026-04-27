import { SignIn } from "@clerk/nextjs"
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your US Foreclosure Leads account.",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8">
        <Image
          src="/us-foreclosure-leads-logo.png"
          alt="US Foreclosure Leads"
          width={200}
          height={85}
          className="w-[200px] h-auto"
        />
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-[#111d33] border border-slate-700/50 rounded-xl p-6 lg:p-8">
          <SignIn
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none p-0 border-0",
                headerTitle: "text-white text-lg",
                headerSubtitle: "text-slate-400",
                formButtonPrimary: "bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white font-medium",
                formFieldLabel: "text-slate-300 text-sm",
                formFieldInput: "bg-[#0a1628] border-slate-600 text-white placeholder-slate-500 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]",
                footerAction: "text-slate-400",
                footerActionLink: "text-amber-400 hover:text-amber-300",
                identityPreview: "bg-[#0a1628] border-slate-600",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-amber-400",
                socialButtonsBlockButton: "bg-[#0a1628] border-slate-600 text-white hover:bg-slate-800",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-slate-700",
                dividerText: "text-slate-500",
                formFieldErrorText: "text-red-400",
                alert: "bg-red-900/20 border-red-500/30 text-red-300",
              },
            }}
          />
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-amber-400 hover:text-amber-300 font-medium">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-10 text-center">
        <p className="text-slate-600 text-xs">
          Foreclosure Recovery Inc. -- 30 N Gould St, Ste R, Sheridan, WY 82801
        </p>
      </div>
    </div>
  )
}
