"use client"

import { useState, useEffect } from "react"
import { usePin } from "@/lib/pin-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface OnboardingSubmission {
  id: string
  business_name: string
  owner_first_name: string
  owner_last_name: string
  current_email: string
  status: string
  created_at: string
  website_url?: string
  ssn_last4?: string
  date_of_birth?: string
  credit_profile?: string
  business_phone?: string
  call_forwarding_phone?: string
  current_best_phone?: string
  business_address?: string
  owner_home_address?: string
  business_email_prefix?: string
  email_forwarding?: string
  terms_agreed?: boolean
}

export default function WhiteLabelPage() {
  const { isAdmin, isOwnerOperator, pinEmail, pinId } = usePin()
  const hasAccess = isAdmin || isOwnerOperator

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingSubmissions, setExistingSubmissions] = useState<OnboardingSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)

  // Form fields
  const [businessName, setBusinessName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [ownerFirstName, setOwnerFirstName] = useState("")
  const [ownerLastName, setOwnerLastName] = useState("")
  const [ssnLast4, setSsnLast4] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [creditProfile, setCreditProfile] = useState("not_sure")
  const [businessPhone, setBusinessPhone] = useState("")
  const [callForwardingPhone, setCallForwardingPhone] = useState("")
  const [currentEmail, setCurrentEmail] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [ownerHomeAddress, setOwnerHomeAddress] = useState("")
  const [businessEmailPrefix, setBusinessEmailPrefix] = useState("")
  const [emailForwarding, setEmailForwarding] = useState("")
  const [termsAgreed, setTermsAgreed] = useState("")

  useEffect(() => {
    if (pinEmail) {
      setCurrentEmail(pinEmail)
    }
  }, [pinEmail])

  useEffect(() => {
    if (!hasAccess) {
      setLoadingSubmissions(false)
      return
    }

    const fetchSubmissions = async () => {
      try {
        const url = isAdmin
          ? "/api/onboarding"
          : `/api/onboarding?email=${encodeURIComponent(pinEmail || "")}`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setExistingSubmissions(data.submissions || [])
        }
      } catch {
        // silently handle
      }
      setLoadingSubmissions(false)
    }

    fetchSubmissions()
  }, [hasAccess, isAdmin, pinEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPinId: pinId,
          email: pinEmail,
          businessName,
          websiteUrl: websiteUrl || null,
          ownerFirstName,
          ownerLastName,
          ssnLast4: ssnLast4 || null,
          dateOfBirth: dateOfBirth || null,
          creditProfile,
          businessPhone: businessPhone || null,
          callForwardingPhone: callForwardingPhone || null,
          currentBestPhone: callForwardingPhone,
          currentEmail: emailForwarding,
          businessAddress: businessAddress || null,
          ownerHomeAddress: ownerHomeAddress || null,
          businessEmailPrefix: businessEmailPrefix || null,
          emailForwarding: emailForwarding || null,
          termsAgreed: termsAgreed.toLowerCase().trim() === "i agree",
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to submit. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    }

    setSubmitting(false)
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Owner Operator Access Required</h2>
            <p className="text-muted-foreground">
              The White Label business onboarding is available to Owner Operator program members.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Onboarding Submitted</h2>
            <p className="text-muted-foreground mb-4">
              Your business onboarding form has been submitted successfully.
              Our team will review your information and begin building out your
              white-label business within 10-14 business days.
            </p>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to <strong>{currentEmail}</strong>.
              You will also receive a welcome email with next steps.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FolderKanban className="h-6 w-6" />
          Business On-boarding
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Please complete the following form to the best of your ability. Any information you provide can be modified later if needed. Your input will help us establish a solid foundation for your new venture. Once you've submitted the form, we will review it and contact you to discuss the next steps before beginning your business development.
        </p>
      </div>

      {/* Existing Submissions */}
      {isAdmin && existingSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Submissions ({existingSubmissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingSubmissions.map((sub) => {
                const isExpanded = expandedSubmission === sub.id
                const details = [
                  { label: "Business Name", value: sub.business_name },
                  { label: "Owner", value: `${sub.owner_first_name} ${sub.owner_last_name}` },
                  { label: "Email", value: sub.current_email },
                  { label: "Best Phone", value: sub.current_best_phone },
                  { label: "Business Phone", value: sub.business_phone },
                  { label: "Call Forwarding", value: sub.call_forwarding_phone },
                  { label: "Website", value: sub.website_url },
                  { label: "Business Address", value: sub.business_address },
                  { label: "Home Address", value: sub.owner_home_address },
                  { label: "Credit Profile", value: sub.credit_profile },
                  { label: "DOB", value: sub.date_of_birth },
                  { label: "SSN Last 4", value: sub.ssn_last4 ? `****${sub.ssn_last4}` : undefined },
                  { label: "Email Prefix", value: sub.business_email_prefix },
                  { label: "Email Forwarding", value: sub.email_forwarding },
                  { label: "Terms Agreed", value: sub.terms_agreed ? "Yes" : "No" },
                ].filter((d) => d.value)

                return (
                  <div key={sub.id} className="rounded-lg border bg-muted/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSubmission(isExpanded ? null : sub.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/60 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-sm">{sub.business_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.owner_first_name} {sub.owner_last_name} - {sub.current_email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            sub.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : sub.status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {sub.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t px-4 py-3 bg-muted/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {details.map((d) => (
                            <div key={d.label} className="text-sm">
                              <span className="text-muted-foreground text-xs">{d.label}</span>
                              <p className="font-medium text-foreground">{d.value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                          Submitted: {new Date(sub.created_at).toLocaleString()} | ID: {sub.id}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Current Business Name or Proposed Business Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Your Recovery Business LLC"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Businesses current website URL or desired domain name or any keywords associated with desired domain name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="www.yourbusiness.com or keywords for your domain"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Business Owner Name <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    required
                    placeholder="First Name"
                    value={ownerFirstName}
                    onChange={(e) => setOwnerFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    required
                    placeholder="Last Name"
                    value={ownerLastName}
                    onChange={(e) => setOwnerLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Business Owner SSN <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="***-**-****"
                  value={ssnLast4}
                  onChange={(e) => setSsnLast4(e.target.value.replace(/[^\d-]/g, "").slice(0, 11))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Regardless if we're using a Credit Privacy File or your SSN Credit Profile as the Personal Guarantor, the Businesses EIN will still need to be established with your (the business owners) SSN
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Business Owner Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="January 1st 1980"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Please format your date of birth like: January 1st 1980
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  The Businesses Personal Guarantors Credit Profile will be? <span className="text-red-500">*</span>
                </label>
                <select
                  value={creditProfile}
                  onChange={(e) => setCreditProfile(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="not_sure">Please choose one</option>
                  <option value="ssn">SSN (Social Security Number)</option>
                  <option value="cpf">Credit Privacy File</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Even though there will be multiple options to be able to get access to business credit & accounts without a personal guarantor we still need to understand which credit profile you will use for managing the company in the future
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Phone & Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact & Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Phone Number</label>
                <Input
                  placeholder="(555) 123-4567"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  If you have already created a business phone number please provide it. If not we will create one for you and you can leave this field blank.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What phone number do you want your business calls to be forwarded to? <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="(555) 987-6543"
                  value={callForwardingPhone}
                  onChange={(e) => setCallForwardingPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Business Address</label>
                <Input
                  placeholder="123 Main St, Suite 100, City, State ZIP"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  If you have already created a business address please provide it. If not we will create one for you and you can leave this field blank.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Business Owner Home Address <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="456 Oak Ave, City, State ZIP"
                  value={ownerHomeAddress}
                  onChange={(e) => setOwnerHomeAddress(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  This is required to establish your new business address if you haven't done so already. Additionally, when you register a new business address using your home address on your ID with the office provider we set up for you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Current business email or desired business email prefix
                </label>
                <Input
                  placeholder="info@, support@, etc."
                  value={businessEmailPrefix}
                  onChange={(e) => setBusinessEmailPrefix(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  An example of a business email prefix would be: info@, support@ and so on
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Which email address would you like your business emails to be forwarded to? <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="email"
                  placeholder="your.personal@gmail.com"
                  value={emailForwarding}
                  onChange={(e) => setEmailForwarding(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Multiple File Upload</label>
                <Input
                  type="file"
                  multiple
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Provide any files or documents you feel are necessary to help us successfully manage your new business start-up. For example when registering with Duns and Bradstreet they request the articles of organization and another document associated with the business and business owner. Provide us any business documents that can help us continue building out your business if you have already started some of the duties required for your new business.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Submit */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  I understand I am assigned an Authorized Representative as well as a Business Development Manager to help answer my questions any time I require clarity about the service or any policy or procedure. By using our website, you acknowledge that you have read, understood and agreed to our{" "}
                  <a href="https://usforeclosureleads.com/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline font-medium">Terms of Service</a>,{" "}
                  <a href="https://usforeclosureleads.com/compliance" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline font-medium">Compliance Policy</a>,{" "}
                  <a href="https://usforeclosureleads.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline font-medium">Privacy Policy</a>, posted on our website.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Type "I agree" to confirm <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder='Type "I agree"'
                    value={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.value)}
                    className={
                      termsAgreed.length > 0 && termsAgreed.toLowerCase().trim() !== "i agree"
                        ? "border-red-300 focus-visible:ring-red-500"
                        : termsAgreed.toLowerCase().trim() === "i agree"
                        ? "border-green-300 focus-visible:ring-green-500"
                        : ""
                    }
                  />
                  {termsAgreed.length > 0 && termsAgreed.toLowerCase().trim() !== "i agree" && (
                    <p className="text-xs text-red-500">Please type exactly "I agree" to continue</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || termsAgreed.toLowerCase().trim() !== "i agree" || !businessName || !ownerFirstName || !ownerLastName || !callForwardingPhone || !emailForwarding}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Submit Onboarding Form</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
