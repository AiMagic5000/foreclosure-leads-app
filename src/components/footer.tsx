import Link from "next/link";
import Image from "next/image";
import { ApiDocsPopup } from "@/components/api-docs-popup";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 sm:py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 sm:mb-4">
              <Image
                src="/us-foreclosure-leads-logo.png"
                alt="US Foreclosure Leads"
                width={200}
                height={85}
                className="w-[200px] h-auto"
              />
            </Link>
            <p className="text-xs sm:text-sm text-gray-500">
              Daily foreclosure lead data for surplus funds recovery
              professionals.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
              Product
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
              <li>
                <Link href="/#features" className="hover:text-[#1e3a5f]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-[#1e3a5f]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/states-guide" className="hover:text-[#1e3a5f]">
                  50 States Guide
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#1e3a5f]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
              Resources
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
              <li>
                <Link href="/blog" className="hover:text-[#1e3a5f]">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/states-guide" className="hover:text-[#1e3a5f]">
                  Guides
                </Link>
              </li>
              <li>
                <ApiDocsPopup />
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
              Legal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
              <li>
                <Link href="/privacy" className="hover:text-[#1e3a5f]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#1e3a5f]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-[#1e3a5f]">
                  Compliance
                </Link>
              </li>
              <li>
                <Link href="/income-disclaimer" className="hover:text-[#1e3a5f]">
                  Income Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            &copy; 2026 Foreclosure Recovery Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
            <a
              href="https://usforeclosurerecovery.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1e3a5f] hover:text-[#3b82f6] font-medium"
            >
              USForeclosureRecovery.com
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="https://assetrecoverybusiness.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1e3a5f] hover:text-[#3b82f6] font-medium"
            >
              AssetRecoveryBusiness.com
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="https://startmybusiness.us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1e3a5f] hover:text-[#3b82f6] font-medium"
            >
              StartMyBusiness.us
            </a>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 max-w-2xl">
            Website development and management provided by Start My Business
            Incorporated (StartMyBusiness.us). Foreclosure Recovery Inc., US
            Foreclosure Recovery, and Asset Recovery Business are partner
            entities of Start My Business Incorporated. Payment processing is
            handled by Start My Business Incorporated on behalf of all
            affiliated entities.
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Data provided for informational purposes. Users are responsible for
            compliance with all applicable laws.
          </p>
        </div>
      </div>
    </footer>
  );
}
