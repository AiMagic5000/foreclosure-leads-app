// Recovery Agent offer page — the full assetrecoverybusiness.com site embedded inside
// the dashboard (Business Suite). The $331 "Recovery Agent" nav tab and the offer-page
// image on the live webcast both route here.
export default function RecoveryAgentPage() {
  return (
    <div className="-m-4 lg:-m-6 h-[calc(100dvh-3.5rem)] min-h-[600px]">
      <iframe
        src="https://www.assetrecoverybusiness.com/"
        title="Recovery Agent Partnership — Foreclosure Recovery Inc."
        className="h-full w-full border-0"
        loading="eager"
      />
    </div>
  )
}
