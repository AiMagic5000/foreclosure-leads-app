import { SignUp } from "@clerk/nextjs"
import { Metadata } from "next"
import Link from "next/link"
import { Building2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Asset Recovery Leads account and start your 7-day free trial.",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">Asset Recovery Leads</span>
      </Link>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl rounded-2xl",
            headerTitle: "text-2xl font-bold",
            headerSubtitle: "text-muted-foreground",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
          },
        }}
      />
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
