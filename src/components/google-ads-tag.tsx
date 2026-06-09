'use client'

import Script from 'next/script'

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-17115352419'

// Google Ads global site tag (gtag.js). Loads site-wide so conversion events can
// fire from any page. Renders nothing if the id is unset.
export function GoogleAdsTag() {
  if (!ADS_ID) return null
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-ads-gtag"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ADS_ID}');`,
        }}
      />
    </>
  )
}
