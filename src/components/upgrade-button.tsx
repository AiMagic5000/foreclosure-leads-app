/**
 * "Upgrade to Owner Operator" button. Opens the Owner Operator program page
 * (the first tab in Business Suite) in a new tab — the single destination for
 * every owner-operator upgrade CTA across the dashboard. The OO page holds the
 * full build-out details + the call-to-upgrade.
 * title/subtitle are accepted for backward compatibility and intentionally unused.
 */
export function UpgradeButton({
  label = "Upgrade to Owner Operator",
  className,
}: {
  label?: string
  title?: string
  className?: string
  subtitle?: string
}) {
  return (
    <a
      href="/dashboard/owner-operator"
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ||
        "inline-flex items-center justify-center rounded-lg bg-[#D82221] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
      }
    >
      {label}
    </a>
  )
}
