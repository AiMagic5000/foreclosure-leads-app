/**
 * Payment-methods notice shown under Stan Store checkout buttons.
 * Klarna / Afterpay / Google Pay live behind "Another way to pay" at checkout,
 * so this surfaces the pay-over-time option (full access immediately).
 */
export function PaymentMethodsNote({ compact = false }: { compact?: boolean }) {
  const pill =
    'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm'
  return (
    <div className={compact ? 'mt-3' : 'mt-4'}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className={pill}>
          <span aria-hidden>💳</span> Card <span className="font-normal text-slate-400">Visa · MC · Amex</span>
        </span>
        <span className={pill}>
          <span className="rounded border border-slate-300 px-1 text-[9px] font-bold tracking-tight">G&nbsp;Pay</span>
          Google&nbsp;Pay
        </span>
        <span className={pill}>
          <span className="rounded bg-pink-200 px-1.5 text-[10px] font-extrabold text-black">K</span> Klarna
        </span>
        <span className={pill}>
          <span className="rounded bg-emerald-300 px-1.5 text-[10px] font-extrabold text-black">$</span> Afterpay
        </span>
      </div>
      <p className={`mx-auto mt-2 max-w-md text-center ${compact ? 'text-[11px]' : 'text-xs'} leading-relaxed text-slate-500`}>
        Prefer to split it up? Pick <span className="font-semibold text-slate-700">&ldquo;Another way to pay&rdquo;</span> at
        checkout for Klarna, Afterpay or Google Pay payment plans &mdash; you get{' '}
        <span className="font-semibold text-slate-700">full program access today</span> and can start closing deals right
        away while you pay over time.
      </p>
    </div>
  )
}
