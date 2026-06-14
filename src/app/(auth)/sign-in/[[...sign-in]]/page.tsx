import { Metadata } from "next"
import { AuthExperience } from "@/components/auth/auth-experience"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your US Foreclosure Leads account.",
}

// Same rich page as sign-up, opened on the Sign In tab (form on top on mobile).
export default function SignInPage() {
  return <AuthExperience defaultMode="signin" />
}
