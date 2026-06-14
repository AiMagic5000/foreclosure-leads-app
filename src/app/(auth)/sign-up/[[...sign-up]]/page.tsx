import { Metadata } from "next"
import { AuthExperience } from "@/components/auth/auth-experience"

export const metadata: Metadata = {
  title: "Create Your Account | Foreclosure Recovery Inc.",
  description: "Sign up for the US Foreclosure Leads platform. Access foreclosure surplus fund leads, skip tracing, and outreach tools.",
}

export default function SignUpPage() {
  return <AuthExperience defaultMode="signup" />
}
