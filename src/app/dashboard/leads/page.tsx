"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Ruler,
  BedDouble,
  Bath,
  Car,
  TreePine,
  Building,
  FileText,
  UserSearch,
  Users,
  Globe,
  Clock,
  Hash,
  Landmark,
  Receipt,
  Scale,
  Gavel,
  Database,
  Eye,
  EyeOff,
  ShieldAlert,
  TrendingUp,
  Printer,
  Lock,
  CreditCard,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { usePin } from "@/lib/pin-context"
import { supabase } from "@/lib/supabase"
import { RecoveryCountdown } from "@/components/recovery-countdown"

interface LeadData {
  id: string
  ownerName: string
  propertyAddress: string
  city: string
  state: string
  stateAbbr: string
  zipCode: string
  county: string
  parcelId: string
  saleDate: string
  saleAmount: number
  mortgageAmount: number
  lenderName: string
  foreclosureType: string
  primaryPhone: string
  secondaryPhone: string | null
  primaryEmail: string | null
  secondaryEmail: string | null
  status: string
  source: string
  scrapedAt: string
  lat: number
  lng: number
  propertyImageUrl?: string | null
  skipTrace: {
    fullName: string
    aliases: string[]
    age: number
    dob: string
    ssn_last4: string
    currentAddress: string
    previousAddresses: string[]
    phones: { number: string; type: string; carrier: string }[]
    emails: string[]
    relatives: string[]
    employer: string | null
    bankruptcyFlag: boolean
    liensFlag: boolean
    judgmentsFlag: boolean
  }
  property: {
    propertyType: string
    yearBuilt: number
    sqft: number
    lotSize: string
    bedrooms: number
    bathrooms: number
    stories: number
    garage: string
    pool: boolean
    roofType: string
    hvac: string
    foundation: string
    construction: string
    zoning: string
    subdivision: string
    legalDescription: string
  }
  taxData: {
    assessedValue: number
    marketValue: number
    taxYear: number
    annualTaxes: number
    taxStatus: string
    exemptions: string[]
    lastTaxPayment: string
    taxDelinquent: boolean
    delinquentAmount: number
  }
  saleHistory: {
    date: string
    price: number
    type: string
    buyer: string
    seller: string
  }[]
  mortgageInfo: {
    lender: string
    originalAmount: number
    originationDate: string
    interestRate: number
    loanType: string
    maturityDate: string
    secondMortgage: boolean
    secondAmount: number | null
  }
  foreclosureDetails: {
    filingDate: string
    caseNumber: string
    courtName: string
    trustee: string
    auctionDate: string
    auctionLocation: string
    openingBid: number
    estimatedSurplus: number
    defaultAmount: number
    noticeType: string
  }
}

const mockLeads: LeadData[] = [
  {
    id: "lead_001",
    ownerName: "John Michael Stanton",
    propertyAddress: "3841 Habersham Road NW",
    city: "Atlanta",
    state: "Georgia",
    stateAbbr: "GA",
    zipCode: "30305",
    county: "Fulton",
    parcelId: "17-0042-0011-078",
    saleDate: "2026-03-15",
    saleAmount: 285000,
    mortgageAmount: 220000,
    lenderName: "Bank of America",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(404) 555-1234",
    secondaryPhone: "(678) 555-8901",
    primaryEmail: "jsmith@email.com",
    secondaryEmail: null,
    status: "new",
    source: "Georgia Superior Court - Fulton County",
    scrapedAt: "2026-02-01T06:00:00Z",
    lat: 33.7490,
    lng: -84.3880,
    skipTrace: {
      fullName: "John Michael Stanton",
      aliases: ["J.M. Stanton", "Johnny Stanton"],
      age: 54,
      dob: "1971-08-14",
      ssn_last4: "4532",
      currentAddress: "3841 Habersham Road NW, Atlanta, GA 30305",
      previousAddresses: ["456 Peach St, Decatur, GA 30030", "789 MLK Blvd, Atlanta, GA 30312"],
      phones: [
        { number: "(404) 555-1234", type: "Mobile", carrier: "Verizon" },
        { number: "(678) 555-8901", type: "Landline", carrier: "AT&T" },
      ],
      emails: ["jsmith@email.com", "john.smith71@gmail.com"],
      relatives: ["Mary A. Stanton (Spouse)", "James T. Stanton (Son)", "Dorothy Stanton (Mother)"],
      employer: "Delta Air Lines",
      bankruptcyFlag: false,
      liensFlag: true,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 1998,
      sqft: 2450,
      lotSize: "0.34 acres",
      bedrooms: 4,
      bathrooms: 2.5,
      stories: 2,
      garage: "2-Car Attached",
      pool: false,
      roofType: "Composition Shingle",
      hvac: "Central A/C & Forced Air",
      foundation: "Slab",
      construction: "Brick Veneer",
      zoning: "R-4 Single Family",
      subdivision: "Buckhead Estates",
      legalDescription: "LOT 34, BLOCK B, BUCKHEAD ESTATES, UNIT 2",
    },
    taxData: {
      assessedValue: 248000,
      marketValue: 312000,
      taxYear: 2025,
      annualTaxes: 4856,
      taxStatus: "Delinquent",
      exemptions: ["Homestead"],
      lastTaxPayment: "2024-12-15",
      taxDelinquent: true,
      delinquentAmount: 9712,
    },
    saleHistory: [
      { date: "2012-06-15", price: 185000, type: "Warranty Deed", buyer: "John M. Stanton", seller: "Robert Davis" },
      { date: "2005-03-20", price: 142000, type: "Warranty Deed", buyer: "Robert Davis", seller: "Peachtree Homes LLC" },
      { date: "1998-11-01", price: 95000, type: "New Construction", buyer: "Peachtree Homes LLC", seller: "Developer" },
    ],
    mortgageInfo: {
      lender: "Bank of America",
      originalAmount: 220000,
      originationDate: "2012-06-15",
      interestRate: 4.25,
      loanType: "Conventional 30yr Fixed",
      maturityDate: "2042-06-15",
      secondMortgage: true,
      secondAmount: 45000,
    },
    foreclosureDetails: {
      filingDate: "2025-11-20",
      caseNumber: "2025-CV-34567",
      courtName: "Fulton County Superior Court",
      trustee: "McCalla Raymer Leibert Pierce, LLC",
      auctionDate: "2026-03-15",
      auctionLocation: "Fulton County Courthouse Steps",
      openingBid: 235000,
      estimatedSurplus: 50000,
      defaultAmount: 38500,
      noticeType: "Notice of Sale Under Power",
    },
  },
  {
    id: "lead_002",
    ownerName: "Maria Elena Garcia",
    propertyAddress: "456 Oak Avenue",
    city: "Phoenix",
    state: "Arizona",
    stateAbbr: "AZ",
    zipCode: "85001",
    county: "Maricopa",
    parcelId: "123-45-678",
    saleDate: "2026-03-18",
    saleAmount: 342000,
    mortgageAmount: 275000,
    lenderName: "Wells Fargo",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(602) 555-5678",
    secondaryPhone: null,
    primaryEmail: null,
    secondaryEmail: null,
    status: "contacted",
    source: "Maricopa County Recorder's Office",
    scrapedAt: "2026-02-01T06:00:00Z",
    lat: 33.4484,
    lng: -112.0740,
    skipTrace: {
      fullName: "Maria Elena Garcia",
      aliases: ["M.E. Garcia", "Maria Hernandez-Garcia"],
      age: 47,
      dob: "1978-05-22",
      ssn_last4: "7891",
      currentAddress: "456 Oak Avenue, Phoenix, AZ 85001",
      previousAddresses: ["1234 Desert Bloom Rd, Tempe, AZ 85281"],
      phones: [
        { number: "(602) 555-5678", type: "Mobile", carrier: "T-Mobile" },
        { number: "(480) 555-2222", type: "Mobile", carrier: "Cricket" },
      ],
      emails: ["mgarcia78@hotmail.com"],
      relatives: ["Carlos Garcia (Spouse)", "Sofia Garcia (Daughter)", "Isabella Garcia (Daughter)"],
      employer: "Banner Health",
      bankruptcyFlag: false,
      liensFlag: false,
      judgmentsFlag: true,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 2004,
      sqft: 1890,
      lotSize: "0.18 acres",
      bedrooms: 3,
      bathrooms: 2,
      stories: 1,
      garage: "2-Car Attached",
      pool: true,
      roofType: "Clay Tile",
      hvac: "Central A/C & Heat Pump",
      foundation: "Slab on Grade",
      construction: "Stucco",
      zoning: "R1-6 Single Family",
      subdivision: "Desert Ridge Phase 3",
      legalDescription: "LOT 78, DESERT RIDGE PHASE 3, MCR 2004-0012345",
    },
    taxData: {
      assessedValue: 298000,
      marketValue: 365000,
      taxYear: 2025,
      annualTaxes: 3156,
      taxStatus: "Current",
      exemptions: [],
      lastTaxPayment: "2025-10-01",
      taxDelinquent: false,
      delinquentAmount: 0,
    },
    saleHistory: [
      { date: "2016-09-10", price: 225000, type: "Warranty Deed", buyer: "Maria E. Garcia", seller: "David & Janet Kim" },
      { date: "2004-05-15", price: 165000, type: "New Construction", buyer: "David & Janet Kim", seller: "Fulton Homes" },
    ],
    mortgageInfo: {
      lender: "Wells Fargo",
      originalAmount: 275000,
      originationDate: "2016-09-10",
      interestRate: 3.75,
      loanType: "FHA 30yr Fixed",
      maturityDate: "2046-09-10",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-12-01",
      caseNumber: "T-2025-0098765",
      courtName: "Maricopa County",
      trustee: "Quality Loan Service Corp",
      auctionDate: "2026-03-18",
      auctionLocation: "Maricopa County Courthouse - 201 W Jefferson St",
      openingBid: 282000,
      estimatedSurplus: 60000,
      defaultAmount: 42000,
      noticeType: "Notice of Trustee's Sale",
    },
  },
  {
    id: "lead_003",
    ownerName: "Robert James Johnson",
    propertyAddress: "789 Pine Road",
    city: "Denver",
    state: "Colorado",
    stateAbbr: "CO",
    zipCode: "80201",
    county: "Denver",
    parcelId: "2024-0045-00123",
    saleDate: "2026-03-20",
    saleAmount: 425000,
    mortgageAmount: 350000,
    lenderName: "Chase Bank",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(303) 555-9012",
    secondaryPhone: "(720) 555-3344",
    primaryEmail: "rjohnson@gmail.com",
    secondaryEmail: "r.johnson@outlook.com",
    status: "callback",
    source: "Denver County Public Trustee",
    scrapedAt: "2026-02-01T06:00:00Z",
    lat: 39.7392,
    lng: -104.9903,
    skipTrace: {
      fullName: "Robert James Johnson",
      aliases: ["Rob Johnson", "R.J. Johnson"],
      age: 61,
      dob: "1964-11-03",
      ssn_last4: "2245",
      currentAddress: "789 Pine Road, Denver, CO 80201",
      previousAddresses: ["321 Colfax Ave, Denver, CO 80204", "555 Broadway, Boulder, CO 80302"],
      phones: [
        { number: "(303) 555-9012", type: "Mobile", carrier: "AT&T" },
        { number: "(720) 555-3344", type: "Landline", carrier: "CenturyLink" },
      ],
      emails: ["rjohnson@gmail.com", "r.johnson@outlook.com"],
      relatives: ["Patricia Johnson (Spouse)", "Michael Johnson (Son)", "Jennifer Johnson-Wells (Daughter)"],
      employer: "Retired - Former Xcel Energy",
      bankruptcyFlag: true,
      liensFlag: true,
      judgmentsFlag: true,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 1965,
      sqft: 3100,
      lotSize: "0.42 acres",
      bedrooms: 5,
      bathrooms: 3,
      stories: 2,
      garage: "2-Car Detached",
      pool: false,
      roofType: "Asphalt Shingle",
      hvac: "Central A/C & Gas Furnace",
      foundation: "Full Basement",
      construction: "Wood Frame / Vinyl Siding",
      zoning: "U-SU-C Single Unit",
      subdivision: "Park Hill",
      legalDescription: "LOT 123, BLOCK 45, PARK HILL FILING 6",
    },
    taxData: {
      assessedValue: 385000,
      marketValue: 478000,
      taxYear: 2025,
      annualTaxes: 5245,
      taxStatus: "Delinquent",
      exemptions: ["Senior Homestead"],
      lastTaxPayment: "2024-04-30",
      taxDelinquent: true,
      delinquentAmount: 15735,
    },
    saleHistory: [
      { date: "1995-08-20", price: 125000, type: "Warranty Deed", buyer: "Robert J. Johnson", seller: "Estate of Helen Parks" },
      { date: "1982-03-15", price: 68000, type: "Warranty Deed", buyer: "Helen Parks", seller: "Thomas & Alice Green" },
    ],
    mortgageInfo: {
      lender: "Chase Bank",
      originalAmount: 350000,
      originationDate: "2020-01-15",
      interestRate: 3.25,
      loanType: "Conventional 30yr Fixed (Cash-Out Refi)",
      maturityDate: "2050-01-15",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-10-15",
      caseNumber: "D-2025-078901",
      courtName: "Denver County District Court",
      trustee: "Public Trustee of Denver County",
      auctionDate: "2026-03-20",
      auctionLocation: "Denver City & County Building - 1437 Bannock St",
      openingBid: 362000,
      estimatedSurplus: 63000,
      defaultAmount: 52000,
      noticeType: "Notice of Election and Demand",
    },
  },
  {
    id: "lead_004",
    ownerName: "Sarah Ann Williams",
    propertyAddress: "321 Elm Street",
    city: "Portland",
    state: "Oregon",
    stateAbbr: "OR",
    zipCode: "97201",
    county: "Multnomah",
    parcelId: "R123456",
    saleDate: "2026-03-22",
    saleAmount: 380000,
    mortgageAmount: 310000,
    lenderName: "US Bank",
    foreclosureType: "Judicial",
    primaryPhone: "(503) 555-3456",
    secondaryPhone: null,
    primaryEmail: "swilliams@yahoo.com",
    secondaryEmail: null,
    status: "new",
    source: "Multnomah County Circuit Court",
    scrapedAt: "2026-02-01T06:00:00Z",
    lat: 45.5152,
    lng: -122.6784,
    skipTrace: {
      fullName: "Sarah Ann Williams",
      aliases: ["S.A. Williams"],
      age: 39,
      dob: "1986-02-28",
      ssn_last4: "6678",
      currentAddress: "321 Elm Street, Portland, OR 97201",
      previousAddresses: ["888 Hawthorne Blvd, Portland, OR 97214"],
      phones: [
        { number: "(503) 555-3456", type: "Mobile", carrier: "Mint Mobile" },
      ],
      emails: ["swilliams@yahoo.com"],
      relatives: ["David Williams (Ex-Spouse)", "Emma Williams (Daughter)"],
      employer: "Nike Inc.",
      bankruptcyFlag: false,
      liensFlag: false,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Townhouse",
      yearBuilt: 2012,
      sqft: 1650,
      lotSize: "0.08 acres",
      bedrooms: 3,
      bathrooms: 2.5,
      stories: 3,
      garage: "1-Car Attached",
      pool: false,
      roofType: "Metal Standing Seam",
      hvac: "Ductless Mini-Split",
      foundation: "Slab",
      construction: "Fiber Cement Siding",
      zoning: "RM2 Medium Density Residential",
      subdivision: "Pearl District Lofts",
      legalDescription: "UNIT 14, PEARL DISTRICT LOFTS, PLAT 2012-045678",
    },
    taxData: {
      assessedValue: 325000,
      marketValue: 405000,
      taxYear: 2025,
      annualTaxes: 4890,
      taxStatus: "Current",
      exemptions: [],
      lastTaxPayment: "2025-11-15",
      taxDelinquent: false,
      delinquentAmount: 0,
    },
    saleHistory: [
      { date: "2018-04-12", price: 295000, type: "Warranty Deed", buyer: "Sarah A. Williams", seller: "Pearl Development Corp" },
    ],
    mortgageInfo: {
      lender: "US Bank",
      originalAmount: 310000,
      originationDate: "2018-04-12",
      interestRate: 4.50,
      loanType: "Conventional 30yr Fixed",
      maturityDate: "2048-04-12",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-12-10",
      caseNumber: "25CV-12345",
      courtName: "Multnomah County Circuit Court",
      trustee: "McCarthy & Holthus LLP",
      auctionDate: "2026-03-22",
      auctionLocation: "Multnomah County Courthouse - 1021 SW 4th Ave",
      openingBid: 318000,
      estimatedSurplus: 62000,
      defaultAmount: 28000,
      noticeType: "Lis Pendens",
    },
  },
  {
    id: "lead_005",
    ownerName: "Michael David Brown",
    propertyAddress: "654 Cedar Lane",
    city: "Seattle",
    state: "Washington",
    stateAbbr: "WA",
    zipCode: "98101",
    county: "King",
    parcelId: "7890123456",
    saleDate: "2026-03-25",
    saleAmount: 510000,
    mortgageAmount: 420000,
    lenderName: "KeyBank",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(206) 555-7890",
    secondaryPhone: "(425) 555-1122",
    primaryEmail: "mbrown@outlook.com",
    secondaryEmail: "mike.brown.wa@gmail.com",
    status: "skip_traced",
    source: "King County Recorder's Office",
    scrapedAt: "2026-02-01T06:00:00Z",
    lat: 47.6062,
    lng: -122.3321,
    skipTrace: {
      fullName: "Michael David Brown",
      aliases: ["Mike Brown", "M.D. Brown"],
      age: 58,
      dob: "1967-07-19",
      ssn_last4: "3390",
      currentAddress: "654 Cedar Lane, Seattle, WA 98101",
      previousAddresses: ["222 Pike St, Seattle, WA 98101", "1500 Eastlake Ave, Seattle, WA 98102"],
      phones: [
        { number: "(206) 555-7890", type: "Mobile", carrier: "T-Mobile" },
        { number: "(425) 555-1122", type: "Work", carrier: "Comcast Business" },
      ],
      emails: ["mbrown@outlook.com", "mike.brown.wa@gmail.com"],
      relatives: ["Linda Brown (Spouse)", "Tyler Brown (Son)", "Ashley Brown (Daughter)"],
      employer: "Self-Employed - Brown Consulting Group",
      bankruptcyFlag: false,
      liensFlag: true,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 1978,
      sqft: 2800,
      lotSize: "0.28 acres",
      bedrooms: 4,
      bathrooms: 3,
      stories: 2,
      garage: "2-Car Attached",
      pool: false,
      roofType: "Composition Shingle",
      hvac: "Central A/C & Gas Furnace",
      foundation: "Crawl Space",
      construction: "Wood Frame / Cedar Siding",
      zoning: "SF 5000 Single Family",
      subdivision: "Capitol Hill",
      legalDescription: "LOT 56, BLOCK 12, CAPITOL HILL ADDITION",
    },
    taxData: {
      assessedValue: 465000,
      marketValue: 545000,
      taxYear: 2025,
      annualTaxes: 6120,
      taxStatus: "Delinquent",
      exemptions: [],
      lastTaxPayment: "2024-10-31",
      taxDelinquent: true,
      delinquentAmount: 12240,
    },
    saleHistory: [
      { date: "2008-07-20", price: 310000, type: "Warranty Deed", buyer: "Michael D. Brown", seller: "Northwest Properties LLC" },
      { date: "2001-11-05", price: 215000, type: "Warranty Deed", buyer: "Northwest Properties LLC", seller: "James & Helen Carter" },
      { date: "1978-06-01", price: 45000, type: "New Construction", buyer: "James & Helen Carter", seller: "Capitol Hill Builders" },
    ],
    mortgageInfo: {
      lender: "KeyBank",
      originalAmount: 420000,
      originationDate: "2021-03-15",
      interestRate: 2.875,
      loanType: "Conventional 30yr Fixed (Cash-Out Refi)",
      maturityDate: "2051-03-15",
      secondMortgage: true,
      secondAmount: 65000,
    },
    foreclosureDetails: {
      filingDate: "2025-11-01",
      caseNumber: "25-2-34567-KNT",
      courtName: "King County",
      trustee: "Northwest Trustee Services Inc.",
      auctionDate: "2026-03-25",
      auctionLocation: "King County Courthouse - 516 3rd Ave, Seattle",
      openingBid: 435000,
      estimatedSurplus: 75000,
      defaultAmount: 48000,
      noticeType: "Notice of Trustee's Sale",
    },
  },
  {
    id: "lead_006",
    ownerName: "Patricia Anne Henderson",
    propertyAddress: "2847 Magnolia Drive",
    city: "Nashville",
    state: "Tennessee",
    stateAbbr: "TN",
    zipCode: "37209",
    county: "Davidson",
    parcelId: "09211003400",
    saleDate: "2026-03-28",
    saleAmount: 318000,
    mortgageAmount: 260000,
    lenderName: "Regions Bank",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(615) 555-4421",
    secondaryPhone: null,
    primaryEmail: "pat.henderson@gmail.com",
    secondaryEmail: null,
    status: "new",
    source: "Davidson County Register of Deeds",
    scrapedAt: "2026-02-01T08:30:00Z",
    lat: 36.1427,
    lng: -86.8385,
    skipTrace: {
      fullName: "Patricia Anne Henderson",
      aliases: ["Patty Henderson", "P.A. Henderson"],
      age: 52,
      dob: "1973-04-09",
      ssn_last4: "5587",
      currentAddress: "2847 Magnolia Drive, Nashville, TN 37209",
      previousAddresses: ["1102 West End Ave, Nashville, TN 37203"],
      phones: [{ number: "(615) 555-4421", type: "Mobile", carrier: "AT&T" }],
      emails: ["pat.henderson@gmail.com"],
      relatives: ["Gerald Henderson (Spouse)", "Laura Henderson (Daughter)"],
      employer: "Vanderbilt University Medical Center",
      bankruptcyFlag: false,
      liensFlag: false,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 2001,
      sqft: 2180,
      lotSize: "0.25 acres",
      bedrooms: 4,
      bathrooms: 2.5,
      stories: 2,
      garage: "2-Car Attached",
      pool: false,
      roofType: "Architectural Shingle",
      hvac: "Central A/C & Gas Furnace",
      foundation: "Crawl Space",
      construction: "Vinyl Siding",
      zoning: "RS10 Single Family",
      subdivision: "Richland Park",
      legalDescription: "LOT 18, RICHLAND PARK PHASE 2, DB 4521 PG 112",
    },
    taxData: {
      assessedValue: 275000,
      marketValue: 340000,
      taxYear: 2025,
      annualTaxes: 3850,
      taxStatus: "Current",
      exemptions: [],
      lastTaxPayment: "2025-02-28",
      taxDelinquent: false,
      delinquentAmount: 0,
    },
    saleHistory: [
      { date: "2009-03-15", price: 198000, type: "Warranty Deed", buyer: "Patricia A. Henderson", seller: "Richland Homes Inc." },
    ],
    mortgageInfo: {
      lender: "Regions Bank",
      originalAmount: 260000,
      originationDate: "2019-06-01",
      interestRate: 3.99,
      loanType: "Conventional 30yr Fixed (Refi)",
      maturityDate: "2049-06-01",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-12-18",
      caseNumber: "TN-2025-FC-08821",
      courtName: "Davidson County Chancery Court",
      trustee: "Shapiro & Ingle LLP",
      auctionDate: "2026-03-28",
      auctionLocation: "Davidson County Courthouse - 1 Public Square",
      openingBid: 268000,
      estimatedSurplus: 50000,
      defaultAmount: 31000,
      noticeType: "Notice of Substitute Trustee's Sale",
    },
  },
  {
    id: "lead_007",
    ownerName: "David Wayne Thornton",
    propertyAddress: "5614 Sunburst Lane",
    city: "Henderson",
    state: "Nevada",
    stateAbbr: "NV",
    zipCode: "89052",
    county: "Clark",
    parcelId: "178-21-610-045",
    saleDate: "2026-04-01",
    saleAmount: 395000,
    mortgageAmount: 340000,
    lenderName: "Nevada State Bank",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(702) 555-8834",
    secondaryPhone: "(702) 555-1190",
    primaryEmail: "dthornton@yahoo.com",
    secondaryEmail: null,
    status: "skip_traced",
    source: "Clark County Recorder's Office",
    scrapedAt: "2026-02-01T09:15:00Z",
    lat: 36.0395,
    lng: -115.0117,
    skipTrace: {
      fullName: "David Wayne Thornton",
      aliases: ["Dave Thornton"],
      age: 63,
      dob: "1962-10-21",
      ssn_last4: "8812",
      currentAddress: "5614 Sunburst Lane, Henderson, NV 89052",
      previousAddresses: ["3322 Paradise Rd, Las Vegas, NV 89169", "8801 Flamingo Rd #2045, Las Vegas, NV 89147"],
      phones: [
        { number: "(702) 555-8834", type: "Mobile", carrier: "T-Mobile" },
        { number: "(702) 555-1190", type: "Landline", carrier: "Cox" },
      ],
      emails: ["dthornton@yahoo.com", "dave.thornton62@gmail.com"],
      relatives: ["Karen Thornton (Spouse)", "Ryan Thornton (Son)", "Jessica Thornton-Mills (Daughter)"],
      employer: "Retired - Former MGM Resorts International",
      bankruptcyFlag: true,
      liensFlag: true,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 2006,
      sqft: 2650,
      lotSize: "0.19 acres",
      bedrooms: 4,
      bathrooms: 3,
      stories: 2,
      garage: "3-Car Attached",
      pool: true,
      roofType: "Clay Tile",
      hvac: "Central A/C & Heat Pump",
      foundation: "Slab on Grade",
      construction: "Stucco / Block",
      zoning: "R-2 Single Family",
      subdivision: "Anthem Highlands",
      legalDescription: "LOT 45, BLOCK 6, ANTHEM HIGHLANDS UNIT 4, BOOK 102, PAGE 34",
    },
    taxData: {
      assessedValue: 348000,
      marketValue: 425000,
      taxYear: 2025,
      annualTaxes: 4180,
      taxStatus: "Delinquent",
      exemptions: ["Veteran"],
      lastTaxPayment: "2024-08-15",
      taxDelinquent: true,
      delinquentAmount: 8360,
    },
    saleHistory: [
      { date: "2014-05-20", price: 280000, type: "Warranty Deed", buyer: "David W. Thornton", seller: "Bank of America (REO)" },
      { date: "2006-09-01", price: 385000, type: "New Construction", buyer: "Original Owner", seller: "Pulte Homes" },
    ],
    mortgageInfo: {
      lender: "Nevada State Bank",
      originalAmount: 340000,
      originationDate: "2020-08-10",
      interestRate: 3.125,
      loanType: "VA 30yr Fixed (Cash-Out Refi)",
      maturityDate: "2050-08-10",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-11-05",
      caseNumber: "NV-FT-2025-34891",
      courtName: "Clark County",
      trustee: "National Default Servicing Corp",
      auctionDate: "2026-04-01",
      auctionLocation: "Clark County Government Center - 500 S Grand Central Pkwy",
      openingBid: 352000,
      estimatedSurplus: 43000,
      defaultAmount: 45000,
      noticeType: "Notice of Default and Election to Sell",
    },
  },
  {
    id: "lead_008",
    ownerName: "Angela Marie Fitzgerald",
    propertyAddress: "1823 Pecan Grove Circle",
    city: "San Antonio",
    state: "Texas",
    stateAbbr: "TX",
    zipCode: "78258",
    county: "Bexar",
    parcelId: "05076-004-0120",
    saleDate: "2026-04-05",
    saleAmount: 298000,
    mortgageAmount: 245000,
    lenderName: "Frost Bank",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(210) 555-6732",
    secondaryPhone: null,
    primaryEmail: "angela.fitz@outlook.com",
    secondaryEmail: null,
    status: "contacted",
    source: "Bexar County Clerk's Office",
    scrapedAt: "2026-02-01T07:45:00Z",
    lat: 29.6105,
    lng: -98.5214,
    skipTrace: {
      fullName: "Angela Marie Fitzgerald",
      aliases: ["Angie Fitzgerald"],
      age: 44,
      dob: "1981-07-15",
      ssn_last4: "3304",
      currentAddress: "1823 Pecan Grove Circle, San Antonio, TX 78258",
      previousAddresses: ["4401 Fredericksburg Rd #204, San Antonio, TX 78201"],
      phones: [{ number: "(210) 555-6732", type: "Mobile", carrier: "Verizon" }],
      emails: ["angela.fitz@outlook.com"],
      relatives: ["Marcus Fitzgerald (Ex-Spouse)", "Aiden Fitzgerald (Son)"],
      employer: "USAA Federal Savings Bank",
      bankruptcyFlag: false,
      liensFlag: true,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 2010,
      sqft: 2020,
      lotSize: "0.15 acres",
      bedrooms: 3,
      bathrooms: 2.5,
      stories: 2,
      garage: "2-Car Attached",
      pool: false,
      roofType: "Composition Shingle",
      hvac: "Central A/C & Forced Air",
      foundation: "Slab on Grade",
      construction: "Brick / Stone Veneer",
      zoning: "R-6 Single Family",
      subdivision: "Stone Oak Ranch",
      legalDescription: "LOT 120, BLK 4, STONE OAK RANCH SECTION 3",
    },
    taxData: {
      assessedValue: 262000,
      marketValue: 315000,
      taxYear: 2025,
      annualTaxes: 5890,
      taxStatus: "Delinquent",
      exemptions: ["Homestead"],
      lastTaxPayment: "2024-11-30",
      taxDelinquent: true,
      delinquentAmount: 11780,
    },
    saleHistory: [
      { date: "2015-10-22", price: 215000, type: "Warranty Deed", buyer: "Angela M. Fitzgerald", seller: "William & Rose Torres" },
      { date: "2010-04-10", price: 178000, type: "New Construction", buyer: "William & Rose Torres", seller: "D.R. Horton Inc." },
    ],
    mortgageInfo: {
      lender: "Frost Bank",
      originalAmount: 245000,
      originationDate: "2015-10-22",
      interestRate: 4.125,
      loanType: "FHA 30yr Fixed",
      maturityDate: "2045-10-22",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-12-20",
      caseNumber: "TX-2025-NJ-56712",
      courtName: "Bexar County",
      trustee: "Barrett Daffin Frappier Turner & Engel LLP",
      auctionDate: "2026-04-05",
      auctionLocation: "Bexar County Courthouse - 100 Dolorosa",
      openingBid: 253000,
      estimatedSurplus: 45000,
      defaultAmount: 36000,
      noticeType: "Notice of Substitute Trustee's Sale",
    },
  },
  {
    id: "lead_009",
    ownerName: "Christopher Lee Vasquez",
    propertyAddress: "9472 Coral Springs Way",
    city: "Jacksonville",
    state: "Florida",
    stateAbbr: "FL",
    zipCode: "32256",
    county: "Duval",
    parcelId: "042890-0120",
    saleDate: "2026-04-08",
    saleAmount: 275000,
    mortgageAmount: 230000,
    lenderName: "Fifth Third Bank",
    foreclosureType: "Judicial",
    primaryPhone: "(904) 555-2198",
    secondaryPhone: "(904) 555-7744",
    primaryEmail: "cvasquez@protonmail.com",
    secondaryEmail: null,
    status: "callback",
    source: "Duval County Clerk of Courts",
    scrapedAt: "2026-02-01T06:30:00Z",
    lat: 30.1801,
    lng: -81.5422,
    skipTrace: {
      fullName: "Christopher Lee Vasquez",
      aliases: ["Chris Vasquez", "C.L. Vasquez"],
      age: 41,
      dob: "1984-12-03",
      ssn_last4: "9921",
      currentAddress: "9472 Coral Springs Way, Jacksonville, FL 32256",
      previousAddresses: ["2215 Beach Blvd #118, Jacksonville, FL 32246", "744 A1A Beach Blvd, St. Augustine, FL 32080"],
      phones: [
        { number: "(904) 555-2198", type: "Mobile", carrier: "Verizon" },
        { number: "(904) 555-7744", type: "Work", carrier: "Comcast Business" },
      ],
      emails: ["cvasquez@protonmail.com", "chris.vasquez84@gmail.com"],
      relatives: ["Daniella Vasquez (Spouse)", "Sophia Vasquez (Daughter)", "Mateo Vasquez (Son)"],
      employer: "Baptist Health System",
      bankruptcyFlag: false,
      liensFlag: false,
      judgmentsFlag: true,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 2015,
      sqft: 1920,
      lotSize: "0.13 acres",
      bedrooms: 4,
      bathrooms: 2,
      stories: 1,
      garage: "2-Car Attached",
      pool: true,
      roofType: "Concrete Tile",
      hvac: "Central A/C & Heat Pump",
      foundation: "Slab on Grade",
      construction: "Concrete Block / Stucco",
      zoning: "RLD-60 Residential",
      subdivision: "Eagle Harbor",
      legalDescription: "LOT 120, EAGLE HARBOR VILLAGE 4, PB 65 PG 14",
    },
    taxData: {
      assessedValue: 238000,
      marketValue: 295000,
      taxYear: 2025,
      annualTaxes: 3980,
      taxStatus: "Current",
      exemptions: ["Homestead"],
      lastTaxPayment: "2025-11-30",
      taxDelinquent: false,
      delinquentAmount: 0,
    },
    saleHistory: [
      { date: "2017-08-15", price: 228000, type: "Warranty Deed", buyer: "Christopher L. Vasquez", seller: "Lennar Corporation" },
    ],
    mortgageInfo: {
      lender: "Fifth Third Bank",
      originalAmount: 230000,
      originationDate: "2017-08-15",
      interestRate: 4.375,
      loanType: "Conventional 30yr Fixed",
      maturityDate: "2047-08-15",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-10-28",
      caseNumber: "2025-CA-012345",
      courtName: "Duval County Circuit Court",
      trustee: "Albertelli Law",
      auctionDate: "2026-04-08",
      auctionLocation: "Duval County Courthouse - 501 W Adams St",
      openingBid: 238000,
      estimatedSurplus: 37000,
      defaultAmount: 29000,
      noticeType: "Lis Pendens",
    },
  },
  {
    id: "lead_010",
    ownerName: "Thomas Richard Mercer",
    propertyAddress: "7381 Willow Creek Drive",
    city: "Sacramento",
    state: "California",
    stateAbbr: "CA",
    zipCode: "95831",
    county: "Sacramento",
    parcelId: "063-0245-010-0000",
    saleDate: "2026-04-10",
    saleAmount: 485000,
    mortgageAmount: 410000,
    lenderName: "Golden 1 Credit Union",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(916) 555-3892",
    secondaryPhone: null,
    primaryEmail: "tmercer67@gmail.com",
    secondaryEmail: null,
    status: "new",
    source: "Sacramento County Recorder",
    scrapedAt: "2026-02-01T10:00:00Z",
    lat: 38.4959,
    lng: -121.5154,
    skipTrace: {
      fullName: "Thomas Richard Mercer",
      aliases: ["Tom Mercer", "T.R. Mercer"],
      age: 58,
      dob: "1967-03-28",
      ssn_last4: "1178",
      currentAddress: "7381 Willow Creek Drive, Sacramento, CA 95831",
      previousAddresses: ["2240 Fair Oaks Blvd, Sacramento, CA 95825"],
      phones: [{ number: "(916) 555-3892", type: "Mobile", carrier: "Verizon" }],
      emails: ["tmercer67@gmail.com"],
      relatives: ["Sharon Mercer (Spouse)", "Brian Mercer (Son)"],
      employer: "State of California - CalPERS (Retired)",
      bankruptcyFlag: false,
      liensFlag: true,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 1988,
      sqft: 2340,
      lotSize: "0.22 acres",
      bedrooms: 4,
      bathrooms: 2.5,
      stories: 2,
      garage: "2-Car Attached",
      pool: true,
      roofType: "Composition Shingle",
      hvac: "Central A/C & Forced Air",
      foundation: "Raised Foundation",
      construction: "Stucco",
      zoning: "R-1 Single Family",
      subdivision: "Pocket Area Estates",
      legalDescription: "LOT 10, BLOCK 24, POCKET AREA ESTATES UNIT 5",
    },
    taxData: {
      assessedValue: 420000,
      marketValue: 520000,
      taxYear: 2025,
      annualTaxes: 5460,
      taxStatus: "Delinquent",
      exemptions: ["Homeowner"],
      lastTaxPayment: "2024-12-10",
      taxDelinquent: true,
      delinquentAmount: 10920,
    },
    saleHistory: [
      { date: "2003-11-14", price: 289000, type: "Warranty Deed", buyer: "Thomas R. Mercer", seller: "James & Nancy Cooper" },
      { date: "1988-07-20", price: 142000, type: "New Construction", buyer: "James & Nancy Cooper", seller: "Sacramento Home Builders" },
    ],
    mortgageInfo: {
      lender: "Golden 1 Credit Union",
      originalAmount: 410000,
      originationDate: "2021-01-20",
      interestRate: 2.75,
      loanType: "Conventional 30yr Fixed (Cash-Out Refi)",
      maturityDate: "2051-01-20",
      secondMortgage: true,
      secondAmount: 55000,
    },
    foreclosureDetails: {
      filingDate: "2025-12-05",
      caseNumber: "CA-TS-2025-91234",
      courtName: "Sacramento County",
      trustee: "Clear Recon Corp",
      auctionDate: "2026-04-10",
      auctionLocation: "Sacramento County Courthouse - 720 9th St",
      openingBid: 420000,
      estimatedSurplus: 65000,
      defaultAmount: 55000,
      noticeType: "Notice of Trustee's Sale",
    },
  },
  {
    id: "lead_011",
    ownerName: "Michelle Denise Crawford",
    propertyAddress: "4215 Brookstone Parkway",
    city: "Marietta",
    state: "Georgia",
    stateAbbr: "GA",
    zipCode: "30066",
    county: "Cobb",
    parcelId: "16-0340-0-078-0",
    saleDate: "2026-04-12",
    saleAmount: 365000,
    mortgageAmount: 298000,
    lenderName: "SunTrust (Truist)",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(770) 555-9102",
    secondaryPhone: null,
    primaryEmail: "mcrawford@icloud.com",
    secondaryEmail: null,
    status: "contacted",
    source: "Cobb County Superior Court",
    scrapedAt: "2026-02-01T06:00:00Z",
    lat: 34.0234,
    lng: -84.5499,
    skipTrace: {
      fullName: "Michelle Denise Crawford",
      aliases: ["M.D. Crawford"],
      age: 48,
      dob: "1977-09-12",
      ssn_last4: "4409",
      currentAddress: "4215 Brookstone Parkway, Marietta, GA 30066",
      previousAddresses: ["1800 Roswell Rd #204, Marietta, GA 30062"],
      phones: [{ number: "(770) 555-9102", type: "Mobile", carrier: "AT&T" }],
      emails: ["mcrawford@icloud.com"],
      relatives: ["Darren Crawford (Spouse)", "Jasmine Crawford (Daughter)", "Darren Crawford Jr. (Son)"],
      employer: "WellStar Health System",
      bankruptcyFlag: false,
      liensFlag: false,
      judgmentsFlag: false,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 2003,
      sqft: 2580,
      lotSize: "0.31 acres",
      bedrooms: 5,
      bathrooms: 3,
      stories: 2,
      garage: "2-Car Attached",
      pool: false,
      roofType: "Architectural Shingle",
      hvac: "Central A/C & Gas Furnace",
      foundation: "Crawl Space",
      construction: "Brick / HardiPlank",
      zoning: "R-20 Single Family",
      subdivision: "Brookstone Manor",
      legalDescription: "LOT 78, BROOKSTONE MANOR PHASE 3, PB 142 PG 45, COBB COUNTY",
    },
    taxData: {
      assessedValue: 318000,
      marketValue: 398000,
      taxYear: 2025,
      annualTaxes: 4120,
      taxStatus: "Current",
      exemptions: ["Homestead"],
      lastTaxPayment: "2025-10-15",
      taxDelinquent: false,
      delinquentAmount: 0,
    },
    saleHistory: [
      { date: "2011-04-30", price: 245000, type: "Warranty Deed", buyer: "Michelle D. Crawford", seller: "Toll Brothers Inc." },
    ],
    mortgageInfo: {
      lender: "SunTrust (Truist)",
      originalAmount: 298000,
      originationDate: "2019-03-15",
      interestRate: 4.0,
      loanType: "Conventional 30yr Fixed (Refi)",
      maturityDate: "2049-03-15",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "2025-12-28",
      caseNumber: "2025-CV-CC-78901",
      courtName: "Cobb County Superior Court",
      trustee: "McCurdy & Candler LLC",
      auctionDate: "2026-04-12",
      auctionLocation: "Cobb County Courthouse - 70 Haynes St, Marietta",
      openingBid: 305000,
      estimatedSurplus: 60000,
      defaultAmount: 34000,
      noticeType: "Notice of Sale Under Power",
    },
  },
  {
    id: "lead_012",
    ownerName: "Kenneth Wayne Prescott",
    propertyAddress: "11204 Thunderbird Trail",
    city: "Scottsdale",
    state: "Arizona",
    stateAbbr: "AZ",
    zipCode: "85259",
    county: "Maricopa",
    parcelId: "217-42-189",
    saleDate: "2026-04-15",
    saleAmount: 620000,
    mortgageAmount: 530000,
    lenderName: "Arizona Federal Credit Union",
    foreclosureType: "Non-Judicial",
    primaryPhone: "(480) 555-6601",
    secondaryPhone: "(602) 555-8847",
    primaryEmail: "kprescott@cox.net",
    secondaryEmail: "ken.prescott@gmail.com",
    status: "new",
    source: "Maricopa County Recorder's Office",
    scrapedAt: "2026-02-01T09:00:00Z",
    lat: 33.5684,
    lng: -111.8981,
    skipTrace: {
      fullName: "Kenneth Wayne Prescott",
      aliases: ["Ken Prescott", "K.W. Prescott"],
      age: 66,
      dob: "1959-06-30",
      ssn_last4: "7742",
      currentAddress: "11204 Thunderbird Trail, Scottsdale, AZ 85259",
      previousAddresses: ["5540 E Shea Blvd #1025, Scottsdale, AZ 85254", "2380 W Camelback Rd, Phoenix, AZ 85015"],
      phones: [
        { number: "(480) 555-6601", type: "Mobile", carrier: "Verizon" },
        { number: "(602) 555-8847", type: "Landline", carrier: "Cox" },
      ],
      emails: ["kprescott@cox.net", "ken.prescott@gmail.com"],
      relatives: ["Linda Prescott (Spouse)", "Kevin Prescott (Son)", "Katherine Prescott-Yang (Daughter)"],
      employer: "Retired - Former Honeywell Aerospace",
      bankruptcyFlag: false,
      liensFlag: true,
      judgmentsFlag: true,
    },
    property: {
      propertyType: "Single Family Residence",
      yearBuilt: 2000,
      sqft: 3450,
      lotSize: "0.38 acres",
      bedrooms: 5,
      bathrooms: 3.5,
      stories: 1,
      garage: "3-Car Attached",
      pool: true,
      roofType: "Clay Tile",
      hvac: "Central A/C & Heat Pump (Dual Zone)",
      foundation: "Slab on Grade",
      construction: "Stucco / Stone Accents",
      zoning: "R-43 Single Family",
      subdivision: "DC Ranch",
      legalDescription: "LOT 189, DC RANCH PARCEL 4.2, MCR 2000-0891245",
    },
    taxData: {
      assessedValue: 545000,
      marketValue: 680000,
      taxYear: 2025,
      annualTaxes: 5780,
      taxStatus: "Delinquent",
      exemptions: [],
      lastTaxPayment: "2024-10-01",
      taxDelinquent: true,
      delinquentAmount: 17340,
    },
    saleHistory: [
      { date: "2008-02-28", price: 475000, type: "Warranty Deed", buyer: "Kenneth W. Prescott", seller: "Richard & Barbara Collins" },
      { date: "2000-08-15", price: 345000, type: "New Construction", buyer: "Richard & Barbara Collins", seller: "Shea Homes" },
    ],
    mortgageInfo: {
      lender: "Arizona Federal Credit Union",
      originalAmount: 530000,
      originationDate: "2021-05-01",
      interestRate: 2.99,
      loanType: "Conventional 30yr Fixed (Cash-Out Refi)",
      maturityDate: "2051-05-01",
      secondMortgage: true,
      secondAmount: 80000,
    },
    foreclosureDetails: {
      filingDate: "2025-11-15",
      caseNumber: "T-2025-0123456",
      courtName: "Maricopa County",
      trustee: "Tiffany & Bosco PA",
      auctionDate: "2026-04-15",
      auctionLocation: "Maricopa County Courthouse - 201 W Jefferson St",
      openingBid: 545000,
      estimatedSurplus: 75000,
      defaultAmount: 62000,
      noticeType: "Notice of Trustee's Sale",
    },
  },
]

const states = [
  "All States",
  "Georgia",
  "Arizona",
  "Colorado",
  "Oregon",
  "Washington",
  "Tennessee",
  "Nevada",
  "Texas",
  "Florida",
  "California",
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "skip_traced", label: "Skip Traced" },
  { value: "contacted", label: "Contacted" },
  { value: "callback", label: "Callback" },
  { value: "converted", label: "Converted" },
]

function BlurredText({ children, className = "", revealed = false }: { children: React.ReactNode; className?: string; revealed?: boolean }) {
  if (revealed) {
    return <span className={className}>{children}</span>
  }
  return (
    <span className={cn("select-none", className)} style={{ filter: "blur(5px)", WebkitFilter: "blur(5px)" }}>
      {children}
    </span>
  )
}

function DataRow({ label, value, icon: Icon, blurred = false, revealed = false }: { label: string; value: string | number; icon?: React.ElementType; blurred?: boolean; revealed?: boolean }) {
  return (
    <div className="flex justify-between items-start py-1.5 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      {blurred && !revealed ? (
        <BlurredText className="font-medium text-right max-w-[60%]">{value}</BlurredText>
      ) : (
        <span className="font-medium text-right max-w-[60%]">{value}</span>
      )}
    </div>
  )
}

function formatOwnerName(name: string, revealed = false) {
  const parts = name.split(" ")
  if (parts.length <= 1) return name
  const firstName = parts[0]
  const middleParts = parts.slice(1, -1)
  const lastName = parts[parts.length - 1]
  return (
    <>
      {firstName} {middleParts.map(m => m + " ")}
      <BlurredText revealed={revealed}>{lastName}</BlurredText>
    </>
  )
}

function formatPhone(phone: string, revealed = false) {
  if (revealed) return <>{phone}</>
  const clean = phone.replace(/\D/g, "")
  if (clean.length >= 10) {
    const visible = phone.slice(0, -4)
    const blurred = phone.slice(-4)
    return (
      <>
        {visible}<BlurredText>{blurred}</BlurredText>
      </>
    )
  }
  return <>{phone}</>
}

function formatEmail(email: string, revealed = false) {
  if (revealed) return <>{email}</>
  const atIndex = email.indexOf("@")
  if (atIndex === -1) return <>{email}</>
  const username = email.slice(0, atIndex + 1)
  const provider = email.slice(atIndex + 1)
  return (
    <>
      {username}<BlurredText>{provider}</BlurredText>
    </>
  )
}

// Google Street View URL helpers (no API key required - uses direct links)
function getStreetViewLink(lat: number, lng: number) {
  if (!lat || !lng) return null
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
}

function getGoogleMapsLink(lat: number, lng: number) {
  if (!lat || !lng) return null
  return `https://www.google.com/maps?q=${lat},${lng}&t=k&z=19`
}

function StreetViewButton({ lat, lng, className = "", compact = false }: { lat: number; lng: number; className?: string; compact?: boolean }) {
  const streetViewUrl = getStreetViewLink(lat, lng)
  const mapsUrl = getGoogleMapsLink(lat, lng)

  if (!lat || !lng) {
    return (
      <div className={cn("bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-muted-foreground", className)}>
        <Home className="h-5 w-5 opacity-40" />
      </div>
    )
  }

  if (compact) {
    return (
      <a
        href={streetViewUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn("bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 flex items-center justify-center gap-1.5 text-white font-medium rounded transition-all shadow-sm hover:shadow", className)}
        title="Open Google Street View"
      >
        <Eye className="h-4 w-4" />
        <span className="text-xs">Street View</span>
      </a>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <a
        href={streetViewUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 flex items-center justify-center gap-2 text-white font-medium py-2 px-3 rounded transition-all shadow-sm hover:shadow"
        title="Open Google Street View"
      >
        <Eye className="h-4 w-4" />
        <span className="text-sm">Street View</span>
      </a>
      <a
        href={mapsUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 flex items-center justify-center gap-2 text-white font-medium py-1.5 px-3 rounded text-xs transition-all shadow-sm hover:shadow"
        title="Open Google Maps Satellite"
      >
        <MapPin className="h-3 w-3" />
        <span>Satellite Map</span>
      </a>
    </div>
  )
}

function FlagBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <Badge className={active ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}>
      {label}: {active ? "Yes" : "No"}
    </Badge>
  )
}

function printLead(lead: LeadData) {
  const surplus = lead.foreclosureDetails.estimatedSurplus
  const serviceFee = surplus * 0.25
  const closerFee = serviceFee * 0.10
  const adminFee = serviceFee * 0.05
  const netRevenue = serviceFee - closerFee - adminFee
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const html = `<!DOCTYPE html>
<html><head><title>Lead Report - ${lead.ownerName}</title>
<style>
@page { size: letter; margin: 0.75in; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.5; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
.header h1 { font-size: 20pt; color: #059669; font-weight: 700; }
.header .meta { text-align: right; font-size: 9pt; color: #6b7280; }
.section { margin-bottom: 16px; }
.section-title { font-size: 12pt; font-weight: 700; color: #059669; border-bottom: 1.5px solid #d1d5db; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
table { width: 100%; border-collapse: collapse; font-size: 10pt; }
table td { padding: 4px 8px; vertical-align: top; }
table td:first-child { font-weight: 600; color: #374151; width: 180px; }
table td:nth-child(2) { color: #1a1a1a; }
.two-col { display: flex; gap: 24px; }
.two-col > div { flex: 1; }
.highlight-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; margin: 12px 0; }
.highlight-box h3 { color: #059669; font-size: 11pt; margin-bottom: 6px; }
.highlight-box table td:first-child { width: 160px; }
.financial-row { font-size: 13pt; font-weight: 700; color: #059669; }
.sale-table { width: 100%; border: 1px solid #d1d5db; }
.sale-table th { background: #f3f4f6; padding: 6px 8px; text-align: left; font-size: 9pt; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #d1d5db; }
.sale-table td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
.notes-header { text-align: center; margin-bottom: 24px; }
.notes-header h1 { font-size: 18pt; color: #059669; }
.notes-header p { font-size: 10pt; color: #6b7280; }
.call-entry { border: 1px solid #d1d5db; border-radius: 6px; padding: 16px; margin-bottom: 16px; min-height: 140px; }
.call-entry .call-header { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
.call-entry .call-header span { font-size: 9pt; color: #6b7280; }
.call-line { border-bottom: 1px dotted #d1d5db; height: 28px; }
.footer { text-align: center; font-size: 8pt; color: #9ca3af; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
.confidential { text-align: center; font-size: 8pt; color: #ef4444; font-weight: 600; margin-bottom: 8px; letter-spacing: 1px; }
</style></head><body>

<!-- PAGE 1: Lead Report -->
<div class="page">
<div class="confidential">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</div>
<div class="header">
  <h1>Lead Report</h1>
  <div class="meta">
    <div>Report Generated: ${today}</div>
    <div>Case #: ${lead.foreclosureDetails.caseNumber}</div>
    <div>APN: ${lead.parcelId}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Property Owner</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Full Name</td><td>${lead.skipTrace.fullName}</td></tr>
        <tr><td>Also Known As</td><td>${lead.skipTrace.aliases.join(", ")}</td></tr>
        <tr><td>Age / DOB</td><td>${lead.skipTrace.age} / ${lead.skipTrace.dob}</td></tr>
        <tr><td>SSN (Last 4)</td><td>***-**-${lead.skipTrace.ssn_last4}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Primary Phone</td><td>${lead.primaryPhone || "N/A"}</td></tr>
        <tr><td>Secondary Phone</td><td>${lead.secondaryPhone || "N/A"}</td></tr>
        <tr><td>Primary Email</td><td>${lead.primaryEmail || "N/A"}</td></tr>
        <tr><td>Secondary Email</td><td>${lead.secondaryEmail || "N/A"}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Property Details</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Address</td><td>${lead.propertyAddress}</td></tr>
        <tr><td>City / State / ZIP</td><td>${lead.city}, ${lead.stateAbbr} ${lead.zipCode}</td></tr>
        <tr><td>County</td><td>${lead.county}</td></tr>
        <tr><td>Property Type</td><td>${lead.property.propertyType}</td></tr>
        <tr><td>Year Built</td><td>${lead.property.yearBuilt}</td></tr>
        <tr><td>Square Footage</td><td>${lead.property.sqft.toLocaleString()} sq ft</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Bedrooms / Baths</td><td>${lead.property.bedrooms} BD / ${lead.property.bathrooms} BA</td></tr>
        <tr><td>Lot Size</td><td>${lead.property.lotSize}</td></tr>
        <tr><td>Stories</td><td>${lead.property.stories}</td></tr>
        <tr><td>Garage</td><td>${lead.property.garage}</td></tr>
        <tr><td>Construction</td><td>${lead.property.construction}</td></tr>
        <tr><td>Zoning</td><td>${lead.property.zoning}</td></tr>
      </table>
    </div>
  </div>
  <table style="margin-top:8px">
    <tr><td>Legal Description</td><td style="font-size:9pt">${lead.property.legalDescription}</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">Foreclosure Details</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Filing Date</td><td>${new Date(lead.foreclosureDetails.filingDate).toLocaleDateString()}</td></tr>
        <tr><td>Case Number</td><td>${lead.foreclosureDetails.caseNumber}</td></tr>
        <tr><td>Court</td><td>${lead.foreclosureDetails.courtName}</td></tr>
        <tr><td>Trustee</td><td>${lead.foreclosureDetails.trustee}</td></tr>
        <tr><td>Notice Type</td><td>${lead.foreclosureDetails.noticeType}</td></tr>
        <tr><td>Foreclosure Type</td><td>${lead.foreclosureType}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Auction Date</td><td style="font-weight:700;color:#dc2626">${new Date(lead.foreclosureDetails.auctionDate).toLocaleDateString()}</td></tr>
        <tr><td>Auction Location</td><td>${lead.foreclosureDetails.auctionLocation}</td></tr>
        <tr><td>Opening Bid</td><td>$${lead.foreclosureDetails.openingBid.toLocaleString()}</td></tr>
        <tr><td>Default Amount</td><td>$${lead.foreclosureDetails.defaultAmount.toLocaleString()}</td></tr>
        <tr><td>Lender</td><td>${lead.lenderName}</td></tr>
        <tr><td>Mortgage Amount</td><td>$${lead.mortgageAmount.toLocaleString()}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="highlight-box">
  <h3>Recovery Opportunity Analysis</h3>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Sale Amount</td><td>$${lead.saleAmount.toLocaleString()}</td></tr>
        <tr><td>Estimated Surplus</td><td>$${surplus.toLocaleString()}</td></tr>
        <tr><td>Service Fee (25%)</td><td class="financial-row">$${serviceFee.toLocaleString()}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Closer Fee (10%)</td><td>-$${closerFee.toLocaleString()}</td></tr>
        <tr><td>Admin Fee (5%)</td><td>-$${adminFee.toLocaleString()}</td></tr>
        <tr><td>Net Revenue</td><td class="financial-row">$${netRevenue.toLocaleString()}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Tax Assessment</div>
  <div class="two-col">
    <div>
      <table>
        <tr><td>Assessed Value</td><td>$${lead.taxData.assessedValue.toLocaleString()}</td></tr>
        <tr><td>Market Value</td><td>$${lead.taxData.marketValue.toLocaleString()}</td></tr>
        <tr><td>Annual Taxes</td><td>$${lead.taxData.annualTaxes.toLocaleString()}</td></tr>
      </table>
    </div>
    <div>
      <table>
        <tr><td>Tax Year</td><td>${lead.taxData.taxYear}</td></tr>
        <tr><td>Tax Status</td><td>${lead.taxData.taxDelinquent ? "DELINQUENT - $" + lead.taxData.delinquentAmount.toLocaleString() : "Current"}</td></tr>
        <tr><td>Exemptions</td><td>${lead.taxData.exemptions.join(", ") || "None"}</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Sale History</div>
  <table class="sale-table">
    <thead><tr><th>Date</th><th>Price</th><th>Type</th><th>Buyer</th><th>Seller</th></tr></thead>
    <tbody>
      ${lead.saleHistory.map(s => `<tr><td>${new Date(s.date).toLocaleDateString()}</td><td>$${s.price.toLocaleString()}</td><td>${s.type}</td><td>${s.buyer}</td><td>${s.seller}</td></tr>`).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Mortgage Information</div>
  <table>
    <tr><td>Lender</td><td>${lead.mortgageInfo.lender}</td></tr>
    <tr><td>Original Amount</td><td>$${lead.mortgageInfo.originalAmount.toLocaleString()}</td></tr>
    <tr><td>Origination Date</td><td>${new Date(lead.mortgageInfo.originationDate).toLocaleDateString()}</td></tr>
    <tr><td>Interest Rate</td><td>${lead.mortgageInfo.interestRate}%</td></tr>
    <tr><td>Loan Type</td><td>${lead.mortgageInfo.loanType}</td></tr>
    <tr><td>Maturity Date</td><td>${new Date(lead.mortgageInfo.maturityDate).toLocaleDateString()}</td></tr>
    ${lead.mortgageInfo.secondMortgage ? `<tr><td>Second Mortgage</td><td>$${(lead.mortgageInfo.secondAmount || 0).toLocaleString()}</td></tr>` : ""}
  </table>
</div>

<div class="section">
  <div class="section-title">Skip Trace - Additional Details</div>
  <table>
    <tr><td>Current Address</td><td>${lead.skipTrace.currentAddress}</td></tr>
    <tr><td>Previous Addresses</td><td>${lead.skipTrace.previousAddresses.join("; ")}</td></tr>
    <tr><td>Known Relatives</td><td>${lead.skipTrace.relatives.join(", ")}</td></tr>
    <tr><td>Employer</td><td>${lead.skipTrace.employer || "Unknown"}</td></tr>
    <tr><td>Phone Records</td><td>${lead.skipTrace.phones.map(p => p.number + " (" + p.type + " - " + p.carrier + ")").join("; ")}</td></tr>
    <tr><td>Email Addresses</td><td>${lead.skipTrace.emails.join("; ")}</td></tr>
  </table>
  <table style="margin-top:8px">
    <tr><td>Public Records</td><td>
      Bankruptcy: ${lead.skipTrace.bankruptcyFlag ? "YES" : "No"} |
      Liens: ${lead.skipTrace.liensFlag ? "YES" : "No"} |
      Judgments: ${lead.skipTrace.judgmentsFlag ? "YES" : "No"}
    </td></tr>
  </table>
</div>

<div class="footer">
  Source: ${lead.source} | APN: ${lead.parcelId} | Scraped: ${new Date(lead.scrapedAt).toLocaleDateString()}
</div>
</div>

<!-- PAGE 2: Call Notes -->
<div class="page">
<div class="confidential">CONFIDENTIAL - FOR AUTHORIZED USE ONLY</div>
<div class="notes-header">
  <h1>Call Notes & Contact Log</h1>
  <p>${lead.skipTrace.fullName} | ${lead.propertyAddress}, ${lead.city}, ${lead.stateAbbr} ${lead.zipCode}</p>
  <p>Case #: ${lead.foreclosureDetails.caseNumber} | Primary: ${lead.primaryPhone || "N/A"}</p>
</div>

${[1,2,3,4,5].map(n => `
<div class="call-entry">
  <div class="call-header">
    <span><strong>Call #${n}</strong></span>
    <span>Date: _____________ &nbsp;&nbsp; Time: _____________ &nbsp;&nbsp; Duration: _____________</span>
  </div>
  <table style="margin-bottom:8px">
    <tr><td style="width:120px">Spoke With</td><td style="border-bottom:1px dotted #d1d5db">&#160;</td></tr>
    <tr><td>Phone Used</td><td style="border-bottom:1px dotted #d1d5db">&#160;</td></tr>
    <tr><td>Outcome</td><td style="border-bottom:1px dotted #d1d5db">&#160;</td></tr>
  </table>
  <div style="font-size:9pt;font-weight:600;color:#6b7280;margin-bottom:4px">Notes:</div>
  <div class="call-line"></div>
  <div class="call-line"></div>
  <div class="call-line"></div>
  <div style="margin-top:6px">
    <span style="font-size:9pt;color:#6b7280">Follow-up Required: &#9633; Yes &#9633; No &nbsp;&nbsp;&nbsp; Next Action: _________________________________</span>
  </div>
</div>
`).join("")}

<div class="footer">
  US Foreclosure Leads - Lead Report for ${lead.skipTrace.fullName} | Generated ${today}
</div>
</div>

</body></html>`

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }
}

function LeadDropdown({ lead, revealed, onReveal }: { lead: LeadData; revealed: boolean; onReveal: () => void }) {
  const [activeTab, setActiveTab] = useState<"property" | "skipTrace" | "tax" | "foreclosure" | "map">("property")

  const tabs = [
    { id: "property" as const, label: "Property Details", icon: Home },
    { id: "foreclosure" as const, label: "Foreclosure", icon: Gavel },
    { id: "skipTrace" as const, label: "Skip Trace", icon: UserSearch },
    { id: "tax" as const, label: "Tax & Sales", icon: Receipt },
    { id: "map" as const, label: "Map", icon: MapPin },
  ]

  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      {/* Recovery Countdown Timer */}
      <RecoveryCountdown
        saleDate={lead.saleDate || null}
        stateAbbr={lead.stateAbbr}
        scrapedAt={lead.scrapedAt}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}

        {/* Print & Reveal Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => printLead(lead)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700 shadow-sm transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
          <button
            onClick={onReveal}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
              revealed
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            )}
          >
            {revealed ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide Sensitive Data
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Reveal Sensitive Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Property Details Tab */}
      {activeTab === "property" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Location</h4>
            <DataRow label="Address" value={lead.propertyAddress} icon={MapPin} />
            <DataRow label="City" value={`${lead.city}, ${lead.stateAbbr} ${lead.zipCode}`} />
            {lead.parcelId && <DataRow label="APN" value={lead.parcelId} icon={Hash} />}
            {lead.county && <DataRow label="County" value={lead.county} icon={Globe} />}
            <DataRow label="Type" value={lead.property.propertyType} icon={Building} />
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Building</h4>
            <DataRow label="Year Built" value={lead.property.yearBuilt || "---"} icon={Calendar} />
            <DataRow label="Sq Ft" value={lead.property.sqft > 0 ? lead.property.sqft.toLocaleString() : "---"} icon={Ruler} />
            <DataRow label="Lot Size" value={lead.property.lotSize || "---"} icon={TreePine} />
            <DataRow label="Stories" value={lead.property.stories || "---"} />
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Features</h4>
            <DataRow label="Bedrooms" value={lead.property.bedrooms || "---"} icon={BedDouble} />
            <DataRow label="Bathrooms" value={lead.property.bathrooms || "---"} icon={Bath} />
            <DataRow label="Garage" value={lead.property.garage || "---"} icon={Car} />
            <DataRow label="Pool" value={lead.property.pool ? "Yes" : "---"} />
            <DataRow label="Roof" value={lead.property.roofType || "---"} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Financial Summary</h4>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">${lead.saleAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Sale Amount</p>
              </div>
              {lead.taxData.marketValue > 0 && (
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">${lead.taxData.marketValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Est. Market Value</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600">${lead.foreclosureDetails.estimatedSurplus.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Est. Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-700">${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">25% Service Fee</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip Trace Tab */}
      {activeTab === "skipTrace" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Identity</h4>
            <DataRow label="Full Name" value={lead.skipTrace.fullName} icon={UserSearch} blurred revealed={revealed} />
            <DataRow label="Age" value={lead.skipTrace.age} />
            <DataRow label="DOB" value={new Date(lead.skipTrace.dob).toLocaleDateString()} blurred revealed={revealed} />
            <DataRow label="SSN Last 4" value={`***-**-${lead.skipTrace.ssn_last4}`} blurred revealed={revealed} />
            {lead.skipTrace.aliases.length > 0 && (
              <DataRow label="Aliases" value={lead.skipTrace.aliases.join(", ")} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact Info</h4>
            {lead.skipTrace.phones.map((phone, i) => (
              <DataRow key={i} label={phone.type} value={`${phone.number} (${phone.carrier})`} icon={Phone} blurred revealed={revealed} />
            ))}
            {lead.skipTrace.emails.map((email, i) => (
              <DataRow key={i} label={i === 0 ? "Primary Email" : "Alt Email"} value={email} icon={Mail} blurred revealed={revealed} />
            ))}
            {lead.skipTrace.employer && (
              <DataRow label="Employer" value={lead.skipTrace.employer} icon={Building} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Addresses</h4>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Current:</span>
                <p className="font-medium">{lead.skipTrace.currentAddress}</p>
              </div>
              {lead.skipTrace.previousAddresses.map((addr, i) => (
                <div key={i}>
                  <span className="text-xs text-muted-foreground">Previous {i + 1}:</span>
                  <p>{addr}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Relatives</h4>
            <div className="space-y-1">
              {lead.skipTrace.relatives.map((rel, i) => (
                <p key={i} className="text-sm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {rel}
                </p>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Public Records Flags</h4>
            <div className="flex flex-wrap gap-2">
              <FlagBadge label="Bankruptcy" active={lead.skipTrace.bankruptcyFlag} />
              <FlagBadge label="Liens" active={lead.skipTrace.liensFlag} />
              <FlagBadge label="Judgments" active={lead.skipTrace.judgmentsFlag} />
            </div>
          </div>
        </div>
      )}

      {/* Tax & Sales Tab */}
      {activeTab === "tax" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tax Assessment ({lead.taxData.taxYear})</h4>
            <DataRow label="Assessed Value" value={`$${lead.taxData.assessedValue.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Market Value" value={`$${lead.taxData.marketValue.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Annual Taxes" value={`$${lead.taxData.annualTaxes.toLocaleString()}`} icon={Receipt} />
            <DataRow label="Tax Status" value={lead.taxData.taxStatus} />
            <DataRow label="Last Payment" value={new Date(lead.taxData.lastTaxPayment).toLocaleDateString()} icon={Calendar} />
            {lead.taxData.taxDelinquent && (
              <DataRow label="Delinquent Amount" value={`$${lead.taxData.delinquentAmount.toLocaleString()}`} />
            )}
            {lead.taxData.exemptions.length > 0 && (
              <DataRow label="Exemptions" value={lead.taxData.exemptions.join(", ")} />
            )}
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mortgage Info</h4>
            <DataRow label="Lender" value={lead.mortgageInfo.lender} icon={Landmark} />
            <DataRow label="Original Amount" value={`$${lead.mortgageInfo.originalAmount.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Origination" value={new Date(lead.mortgageInfo.originationDate).toLocaleDateString()} icon={Calendar} />
            <DataRow label="Interest Rate" value={`${lead.mortgageInfo.interestRate}%`} />
            <DataRow label="Loan Type" value={lead.mortgageInfo.loanType} />
            <DataRow label="Maturity" value={new Date(lead.mortgageInfo.maturityDate).toLocaleDateString()} />
            {lead.mortgageInfo.secondMortgage && (
              <DataRow label="2nd Mortgage" value={`$${(lead.mortgageInfo.secondAmount || 0).toLocaleString()}`} />
            )}
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sale History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Price</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Buyer</th>
                    <th className="text-left py-2 font-medium">Seller</th>
                  </tr>
                </thead>
                <tbody>
                  {lead.saleHistory.map((sale, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="py-2 font-medium">${sale.price.toLocaleString()}</td>
                      <td className="py-2">{sale.type}</td>
                      <td className="py-2">{sale.buyer}</td>
                      <td className="py-2">{sale.seller}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Foreclosure Tab */}
      {activeTab === "foreclosure" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Filing Details</h4>
            <DataRow label="Case Number" value={lead.foreclosureDetails.caseNumber} icon={FileText} />
            <DataRow label="Filing Date" value={new Date(lead.foreclosureDetails.filingDate).toLocaleDateString()} icon={Calendar} />
            <DataRow label="Notice Type" value={lead.foreclosureDetails.noticeType} icon={Gavel} />
            <DataRow label="Court" value={lead.foreclosureDetails.courtName} icon={Scale} />
            <DataRow label="Trustee" value={lead.foreclosureDetails.trustee} />
            <DataRow label="Foreclosure Type" value={lead.foreclosureType} />
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auction & Financials</h4>
            <DataRow label="Auction Date" value={new Date(lead.foreclosureDetails.auctionDate).toLocaleDateString()} icon={Calendar} />
            <DataRow label="Auction Location" value={lead.foreclosureDetails.auctionLocation} icon={MapPin} />
            <DataRow label="Opening Bid" value={`$${lead.foreclosureDetails.openingBid.toLocaleString()}`} icon={DollarSign} />
            <DataRow label="Default Amount" value={`$${lead.foreclosureDetails.defaultAmount.toLocaleString()}`} icon={DollarSign} />
            <div className="pt-2 mt-2 border-t">
              <DataRow
                label="Estimated Surplus"
                value={`$${lead.foreclosureDetails.estimatedSurplus.toLocaleString()}`}
                icon={DollarSign}
              />
            </div>
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Recovery Opportunity</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${lead.foreclosureDetails.estimatedSurplus.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Estimated Surplus</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">25% Service Fee</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">${(lead.foreclosureDetails.estimatedSurplus * 0.25 * 0.85).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Net (After Closer + Admin)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === "map" && (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border" style={{ height: 400 }}>
            <iframe
              title={`Map - ${lead.propertyAddress}`}
              src={
                lead.lat && lead.lng
                  ? `https://maps.google.com/maps?q=${lead.lat},${lead.lng}&z=17&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(`${lead.propertyAddress}, ${lead.city}, ${lead.stateAbbr} ${lead.zipCode}`)}&z=17&output=embed`
              }
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{lead.propertyAddress}, {lead.city}, {lead.stateAbbr} {lead.zipCode}</span>
            </div>
            {lead.parcelId && (
              <div className="flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>APN: {lead.parcelId}</span>
              </div>
            )}
            {lead.county && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{lead.county} County</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span>Source: {lead.source}</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          <span>Source: {lead.source}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Scraped: {new Date(lead.scrapedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5" />
          <span>APN: {lead.parcelId}</span>
        </div>
      </div>
    </div>
  )
}

// Map a Supabase DB row to the LeadData interface
function mapDbRowToLead(row: Record<string, unknown>): LeadData {
  const saleAmount = Number(row.sale_amount) || 0
  const mortgageAmount = Number(row.mortgage_amount) || 0
  const marketValue = Number(row.estimated_market_value) || 0
  const dbOverage = Number(row.overage_amount) || 0

  // Use DB-calculated overage if available, otherwise calculate
  let estimatedSurplus = dbOverage
  if (!estimatedSurplus && saleAmount > 0) {
    if (mortgageAmount > 0 && saleAmount > mortgageAmount) {
      estimatedSurplus = saleAmount - mortgageAmount
    } else if (marketValue > 0 && saleAmount > marketValue * 0.8) {
      estimatedSurplus = Math.round(saleAmount - marketValue * 0.8)
    }
  }

  // Use apn_number as primary, parcel_id as fallback
  const apn = String(row.apn_number || row.parcel_id || "")

  return {
    id: String(row.id || ""),
    ownerName: String(row.owner_name || "Unknown Owner"),
    propertyAddress: String(row.property_address || ""),
    city: String(row.city || ""),
    state: String(row.state || ""),
    stateAbbr: String(row.state_abbr || ""),
    zipCode: String(row.zip_code || ""),
    county: String(row.county || ""),
    parcelId: apn,
    saleDate: String(row.sale_date || ""),
    saleAmount,
    mortgageAmount,
    lenderName: String(row.lender_name || ""),
    foreclosureType: String(row.foreclosure_type || "foreclosure"),
    primaryPhone: String(row.primary_phone || ""),
    secondaryPhone: row.secondary_phone ? String(row.secondary_phone) : null,
    primaryEmail: row.primary_email ? String(row.primary_email) : null,
    secondaryEmail: null,
    status: String(row.status || "new"),
    source: String(row.source || ""),
    scrapedAt: String(row.scraped_at || new Date().toISOString()),
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    propertyImageUrl: row.property_image_url ? String(row.property_image_url) : null,
    skipTrace: {
      fullName: String(row.owner_name || ""),
      aliases: [],
      age: 0,
      dob: "",
      ssn_last4: "",
      currentAddress: String(row.mailing_address || row.property_address || ""),
      previousAddresses: [],
      phones: row.primary_phone ? [{ number: String(row.primary_phone), type: "Mobile", carrier: "" }] : [],
      emails: row.primary_email ? [String(row.primary_email)] : [],
      relatives: (row.associated_names as string[]) || [],
      employer: null,
      bankruptcyFlag: false,
      liensFlag: false,
      judgmentsFlag: false,
    },
    property: {
      propertyType: String(row.property_type || "Single Family Residence"),
      yearBuilt: Number(row.year_built) || 0,
      sqft: Number(row.square_footage) || 0,
      lotSize: String(row.lot_size || ""),
      bedrooms: Number(row.bedrooms) || 0,
      bathrooms: Number(row.bathrooms) || 0,
      stories: Number(row.stories) || 0,
      garage: "",
      pool: false,
      roofType: "",
      hvac: "",
      foundation: "",
      construction: "",
      zoning: "",
      subdivision: "",
      legalDescription: "",
    },
    taxData: {
      assessedValue: Number(row.assessed_value) || 0,
      marketValue,
      taxYear: 2025,
      annualTaxes: Number(row.tax_amount) || 0,
      taxStatus: "Unknown",
      exemptions: [],
      lastTaxPayment: "",
      taxDelinquent: false,
      delinquentAmount: 0,
    },
    saleHistory: [],
    mortgageInfo: {
      lender: String(row.lender_name || ""),
      originalAmount: mortgageAmount,
      originationDate: "",
      interestRate: 0,
      loanType: "",
      maturityDate: "",
      secondMortgage: false,
      secondAmount: null,
    },
    foreclosureDetails: {
      filingDate: "",
      caseNumber: String(row.case_number || ""),
      courtName: "",
      trustee: String(row.trustee_name || ""),
      auctionDate: String(row.sale_date || ""),
      auctionLocation: "",
      openingBid: saleAmount,
      estimatedSurplus,
      defaultAmount: 0,
      noticeType: "",
    },
  }
}

function LeadsPageContent() {
  const searchParams = useSearchParams()
  const stateParam = searchParams.get("state")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState(stateParam || "All States")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [expandedLeads, setExpandedLeads] = useState<string[]>([])
  const [revealedLeads, setRevealedLeads] = useState<string[]>([])
  const [dbLeads, setDbLeads] = useState<LeadData[]>([])
  const [dbStates, setDbStates] = useState<string[]>(["All States"])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const { isVerified, statesAccess, isAdmin, isLoading } = usePin()

  // Property placeholder colors based on property type
  const getPropertyPlaceholderStyle = (propertyType: string) => {
    const typeColors: Record<string, string> = {
      "Single Family Residence": "from-blue-500 to-blue-700",
      "Multi-Family": "from-purple-500 to-purple-700",
      "Condo": "from-cyan-500 to-cyan-700",
      "Townhouse": "from-teal-500 to-teal-700",
      "Commercial": "from-orange-500 to-orange-700",
      "Land": "from-green-500 to-green-700",
    }
    return typeColors[propertyType] || "from-slate-500 to-slate-700"
  }

  // Sync URL state param with dropdown
  useEffect(() => {
    if (stateParam && stateParam !== selectedState) {
      setSelectedState(stateParam)
    }
  }, [stateParam])

  // Fetch leads from Supabase
  useEffect(() => {
    async function fetchLeads() {
      setLeadsLoading(true)
      const { data, error } = await supabase
        .from("foreclosure_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500) as { data: Record<string, unknown>[] | null; error: unknown }

      if (!error && data) {
        const mapped = data.map(mapDbRowToLead)
        setDbLeads(mapped)

        // Build unique states list
        const stateSet = new Set<string>()
        for (const lead of mapped) {
          if (lead.state) stateSet.add(lead.state)
        }
        setDbStates(["All States", ...Array.from(stateSet).sort()])
      }
      setLeadsLoading(false)
    }
    fetchLeads()
  }, [])

  const toggleRevealed = (id: string) => {
    setRevealedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Paywall: if not verified, show PIN access prompt
  if (!isLoading && !isVerified && !isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foreclosure Leads</h1>
          <p className="text-muted-foreground">Enter your access PIN to view leads</p>
        </div>

        {/* Blurred preview of leads behind paywall */}
        <div className="relative">
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
            <div className="text-center max-w-md p-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">PIN Access Required</h2>
              <p className="text-muted-foreground mb-4">
                Enter the 8-character PIN sent to your email after purchase to access skip-traced foreclosure leads with property data, contact info, and surplus recovery analysis.
              </p>
              <div className="space-y-3">
                <Link href="https://startmybusinessinc.gumroad.com/l/vzqbhs" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full" size="lg">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase 5-State Access - $495
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Already Have a PIN? Go to Settings
                  </Button>
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                {[
                  "Daily updated leads",
                  "Skip-traced contacts",
                  "Property & tax data",
                  "Surplus calculations",
                  "Google Maps view",
                  "Print-ready reports",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blurred lead cards behind the paywall */}
          <div className="space-y-4 filter blur-sm pointer-events-none select-none" aria-hidden="true">
            {dbLeads.slice(0, 3).map((lead) => (
              <Card key={lead.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">{lead.ownerName}</div>
                      <div className="text-sm text-muted-foreground">{lead.city}, {lead.stateAbbr}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${lead.saleAmount.toLocaleString()}</div>
                      {lead.foreclosureDetails.estimatedSurplus > 0 && (
                        <div className="text-xs text-emerald-600">${lead.foreclosureDetails.estimatedSurplus.toLocaleString()} surplus</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statusColors = {
    new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    skip_traced: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    contacted: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    callback: "bg-green-500/10 text-green-600 dark:text-green-400",
    converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  } as const

  const filteredLeads = dbLeads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.parcelId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesState =
      selectedState === "All States" || lead.state === selectedState

    const matchesStatus =
      selectedStatus === "all" || lead.status === selectedStatus

    return matchesSearch && matchesState && matchesStatus
  })

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id))
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foreclosure Leads</h1>
          <p className="text-muted-foreground">
            {leadsLoading ? "Loading leads..." : `${filteredLeads.length} leads found`} -- Click any lead to view full property data, skip trace, tax records & map
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled={selectedLeads.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export ({selectedLeads.length})
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, city, or APN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {dbStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table Header */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
              onChange={toggleAllLeads}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-xs">Photo</span>
          </div>
          <div className="col-span-3">Property Owner</div>
          <div className="col-span-3">Address & Details</div>
          <div className="col-span-2">Sale Info</div>
          <div className="col-span-2">Street View</div>
          <div className="col-span-1">Status</div>
        </div>
      </div>

      {/* Leads */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => {
          const isExpanded = expandedLeads.includes(lead.id)
          const isRevealed = revealedLeads.includes(lead.id)
          return (
            <Card
              key={lead.id}
              className={cn(
                "transition-colors",
                selectedLeads.includes(lead.id) && "border-primary bg-primary/5",
                isExpanded && "ring-1 ring-emerald-500/30"
              )}
            >
              <CardContent className="p-4">
                {/* Desktop Row */}
                <div
                  className="hidden lg:grid grid-cols-12 gap-4 items-center cursor-pointer"
                  onClick={() => toggleExpanded(lead.id)}
                >
                  <div className="col-span-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleLeadSelection(lead.id)}
                      className="h-4 w-4 rounded border-gray-300 flex-shrink-0"
                    />
                    <div
                      className={cn(
                        "relative w-20 h-20 rounded overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center bg-gradient-to-br",
                        getPropertyPlaceholderStyle(lead.property.propertyType)
                      )}
                      title={lead.property.propertyType || "Property"}
                    >
                      <Home className="h-8 w-8 text-white/80" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[8px] text-white text-center py-0.5 truncate px-1">
                        {lead.property.propertyType?.split(" ")[0] || "Home"}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{formatOwnerName(lead.ownerName, isRevealed)}</div>
                        {lead.parcelId && (
                          <Badge variant="outline" className="text-xs mt-1 bg-blue-50 border-blue-200 text-blue-700">
                            <Hash className="h-3 w-3 mr-1" />
                            {lead.parcelId}
                          </Badge>
                        )}
                        {lead.county && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {lead.county} County
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{lead.propertyAddress}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.city}, {lead.stateAbbr} {lead.zipCode}
                        </div>
                        {(lead.property.sqft > 0 || lead.property.bedrooms > 0) && (
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-1">
                            {lead.property.bedrooms > 0 && (
                              <span className="flex items-center gap-0.5">
                                <BedDouble className="h-3 w-3" />
                                {lead.property.bedrooms}
                              </span>
                            )}
                            {lead.property.bathrooms > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Bath className="h-3 w-3" />
                                {lead.property.bathrooms}
                              </span>
                            )}
                            {lead.property.sqft > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Ruler className="h-3 w-3" />
                                {lead.property.sqft.toLocaleString()} sf
                              </span>
                            )}
                          </div>
                        )}
                        {lead.property.yearBuilt > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Built {lead.property.yearBuilt}
                            {lead.property.lotSize && ` • ${lead.property.lotSize} lot`}
                          </div>
                        )}
                        {lead.taxData.assessedValue > 0 && (
                          <div className="text-xs font-medium text-blue-600 mt-1">
                            Assessed: ${lead.taxData.assessedValue.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        ${lead.saleAmount.toLocaleString()}
                      </span>
                    </div>
                    {lead.taxData.marketValue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-3 w-3" />
                        MV: ${lead.taxData.marketValue.toLocaleString()}
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <DollarSign className="h-3 w-3" />
                        ${lead.foreclosureDetails.estimatedSurplus.toLocaleString()} surplus
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <TrendingUp className="h-3 w-3" />
                        ${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()} fee
                      </div>
                    )}
                    {lead.saleDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(lead.saleDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                    <StreetViewButton
                      lat={lead.lat}
                      lng={lead.lng}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-1 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                        {lead.status.replace("_", " ")}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <RecoveryCountdown
                      saleDate={lead.saleDate || null}
                      stateAbbr={lead.stateAbbr}
                      scrapedAt={lead.scrapedAt}
                      compact
                    />
                  </div>
                </div>

                {/* Mobile Card */}
                <div className="lg:hidden space-y-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpanded(lead.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="h-4 w-4 rounded border-gray-300 mt-1"
                        />
                      </div>
                      <div
                        className={cn(
                          "relative w-20 h-20 rounded overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center bg-gradient-to-br",
                          getPropertyPlaceholderStyle(lead.property.propertyType)
                        )}
                        title={lead.property.propertyType || "Property"}
                      >
                        <Home className="h-8 w-8 text-white/80" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[8px] text-white text-center py-0.5 truncate px-1">
                          {lead.property.propertyType?.split(" ")[0] || "Home"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{formatOwnerName(lead.ownerName, isRevealed)}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.city}, {lead.stateAbbr}
                        </div>
                        {lead.parcelId && (
                          <Badge variant="outline" className="text-xs mt-1 bg-blue-50 border-blue-200 text-blue-700">
                            <Hash className="h-3 w-3 mr-1" />
                            {lead.parcelId}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                        {lead.status.replace("_", " ")}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{lead.propertyAddress}</div>
                      <div className="text-muted-foreground">{lead.city}, {lead.stateAbbr} {lead.zipCode}</div>
                      {(lead.property.sqft > 0 || lead.property.bedrooms > 0) && (
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600 mt-1">
                          {lead.property.bedrooms > 0 && (
                            <span className="flex items-center gap-1">
                              <BedDouble className="h-3 w-3" />
                              {lead.property.bedrooms}
                            </span>
                          )}
                          {lead.property.bathrooms > 0 && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {lead.property.bathrooms}
                            </span>
                          )}
                          {lead.property.sqft > 0 && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              {lead.property.sqft.toLocaleString()} sf
                            </span>
                          )}
                        </div>
                      )}
                      {lead.property.yearBuilt > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Built {lead.property.yearBuilt}
                          {lead.property.lotSize && ` • ${lead.property.lotSize} lot`}
                        </div>
                      )}
                      {lead.county && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {lead.county} County
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm items-center">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${lead.saleAmount.toLocaleString()}</span>
                    </div>
                    {lead.taxData.marketValue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-3 w-3" />
                        MV: ${lead.taxData.marketValue.toLocaleString()}
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <DollarSign className="h-3 w-3" />
                        ${lead.foreclosureDetails.estimatedSurplus.toLocaleString()} surplus
                      </div>
                    )}
                    {lead.foreclosureDetails.estimatedSurplus > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <TrendingUp className="h-3 w-3" />
                        ${(lead.foreclosureDetails.estimatedSurplus * 0.25).toLocaleString()} fee
                      </div>
                    )}
                    {lead.saleDate && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(lead.saleDate).toLocaleDateString()}
                      </div>
                    )}
                    <RecoveryCountdown
                      saleDate={lead.saleDate || null}
                      stateAbbr={lead.stateAbbr}
                      scrapedAt={lead.scrapedAt}
                      compact
                    />
                  </div>

                  {/* Mobile Street View */}
                  <div className="border-t pt-3" onClick={(e) => e.stopPropagation()}>
                    <StreetViewButton
                      lat={lead.lat}
                      lng={lead.lng}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Expandable Detail Dropdown */}
                {isExpanded && <LeadDropdown lead={lead} revealed={isRevealed} onReveal={() => toggleRevealed(lead.id)} />}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Source note */}
      {filteredLeads.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          All lead data sourced from county recorder offices, court filings, and public notice databases.
        </p>
      )}

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No leads found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading leads...</div>}>
      <LeadsPageContent />
    </Suspense>
  )
}
