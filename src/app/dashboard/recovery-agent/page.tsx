// Recovery Agent offer page — the usforeclosureleads.com homepage embedded inside
// the dashboard (Business Suite). The "Recovery Agent" nav tab, sidebar upgrade
// button, and the offer-page image on the live webcast all route here.
export default function RecoveryAgentPage() {
  return (
    <div className="-m-4 lg:-m-6 h-[calc(100dvh-3.5rem)] min-h-[600px]">
      <iframe
        src="https://usforeclosureleads.com/"
        title="Recovery Agent Partnership — Foreclosure Recovery Inc."
        className="h-full w-full border-0"
        loading="eager"
      />
    </div>
  )
}
