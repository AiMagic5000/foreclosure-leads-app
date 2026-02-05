# Property Data Enrichment - Foreclosure Leads Dashboard

## Overview

The foreclosure leads dashboard now displays enriched property data including property images, detailed property characteristics, and assessment information.

## Database Schema

### New Columns (from migration 002-pin-system-and-enrichment.sql)

```sql
ALTER TABLE foreclosure_leads ADD COLUMN IF NOT EXISTS:
  - apn_number TEXT              -- Assessor's Parcel Number
  - assessed_value NUMERIC       -- County assessed value
  - tax_amount NUMERIC           -- Annual property taxes
  - lot_size TEXT                -- Lot size (e.g., "0.25 acres", "10,890 sqft")
  - year_built INTEGER           -- Year property was built
  - estimated_market_value NUMERIC  -- Estimated market value
  - property_type TEXT           -- Type (Single Family, Condo, etc.)
  - bedrooms INTEGER             -- Number of bedrooms
  - bathrooms NUMERIC            -- Number of bathrooms (can be 2.5, etc.)
  - square_footage INTEGER       -- Living area square footage
  - enrichment_source TEXT       -- Source of enrichment data
  - enriched_at TIMESTAMPTZ      -- When data was enriched
```

### Property Image Column (from migration 003-add-property-image.sql)

```sql
ALTER TABLE foreclosure_leads ADD COLUMN IF NOT EXISTS:
  - property_image_url TEXT      -- URL to property photo
```

## Dashboard Display Features

### Lead Card - Desktop View

**Column 1: Property Image**
- 80x80px thumbnail image
- Falls back to home icon if no image available
- Border and rounded corners
- Click checkbox without expanding card

**Column 2: Property Owner**
- Owner name (redacted until revealed)
- APN number in blue badge with # icon
- County name below

**Column 3: Address & Details**
- Property address (bold, truncated if long)
- City, State ZIP
- **Property Details Row:**
  - Bedrooms (bed icon + count)
  - Bathrooms (bath icon + count)
  - Square footage (ruler icon + sqft)
- **Year Built & Lot:**
  - "Built 1995 • 0.25 acres lot"
- **Assessed Value:**
  - Blue text: "Assessed: $285,000"

**Column 4: Sale Info**
- Sale amount ($)
- Market value (if available)
- Estimated surplus (green, bold)
- 25% service fee (green, bold)
- Sale date

**Column 5: Street View**
- Google Street View button

**Column 6: Status**
- Status badge
- Expand/collapse icon
- Recovery countdown timer

### Lead Card - Mobile View

- Property image (80x80px) next to checkbox
- Owner name and city/state
- APN badge if available
- Full address with property details below
- Bed/Bath/Sqft icons with counts
- Year built and lot size
- County name
- Sale info and status

### Expanded Details Tabs

#### Property Details Tab
Shows all enriched data:
- Location: Address, APN, County, Property Type
- Building: Year Built, Square Footage, Lot Size, Stories
- Features: Bedrooms, Bathrooms, Garage, Pool, Roof Type
- Financial Summary: Sale Amount, Market Value, Estimated Surplus, 25% Fee

## Data Flow

1. **Database Migration**
   ```bash
   # Run on Supabase/Cognabase instance
   psql -h <host> -U postgres -d foreclosure_leads < database/002-pin-system-and-enrichment.sql
   psql -h <host> -U postgres -d foreclosure_leads < database/003-add-property-image.sql
   ```

2. **Data Enrichment Pipeline** (external)
   - Scrapes property data from county assessor sites
   - Fetches property images from Zillow/Realtor/Redfin APIs
   - Updates `foreclosure_leads` table with enriched data
   - Sets `enriched_at` timestamp

3. **API Route** (`/api/leads/route.ts`)
   - Fetches all columns including enrichment fields
   - Returns to dashboard

4. **Dashboard Display** (`/dashboard/leads/page.tsx`)
   - Maps database rows to `LeadData` interface
   - Displays property images with Next.js Image component
   - Shows all enriched property details
   - Falls back gracefully if data missing

## Next.js Image Configuration

Configured in `next.config.ts` to allow images from:
- `*.zillow.com`
- `*.zillowstatic.com`
- `*.realtor.com`
- `*.trulia.com`
- `*.redfin.com`
- `ssl.cdn-redfin.com`
- `maps.googleapis.com`
- `streetviewpixels-pa.googleapis.com`

## Component Updates

### LeadData Interface
Added:
```typescript
interface LeadData {
  // ... existing fields
  propertyImageUrl?: string | null
}
```

### mapDbRowToLead Function
Maps database columns to interface:
```typescript
propertyImageUrl: row.property_image_url ? String(row.property_image_url) : null,
```

Property data already mapped from enrichment columns:
- `bedrooms`, `bathrooms`, `square_footage` → `property.bedrooms/bathrooms/sqft`
- `year_built`, `lot_size`, `property_type` → `property.yearBuilt/lotSize/propertyType`
- `assessed_value` → `taxData.assessedValue`
- `apn_number` → `parcelId`

## Styling Details

### Property Image
- **Desktop:** 80x80px in first column
- **Mobile:** 80x80px next to checkbox
- Rounded corners, border
- Object-fit: cover (maintains aspect ratio)
- Fallback: Gray background with home icon

### APN Badge
- Blue outline badge: `bg-blue-50 border-blue-200 text-blue-700`
- Hash icon prefix
- Small text (text-xs)

### Property Details Icons
- Bed icon (BedDouble)
- Bath icon (Bath)
- Ruler icon (Ruler) for square footage
- Small size (h-3 w-3)
- Medium font weight

### Assessed Value
- Blue text: `text-blue-600`
- Small, medium font weight
- Displayed below property details

## Benefits

1. **Visual Context:** Property photos help verify property condition
2. **Quick Assessment:** Bed/bath/sqft at a glance
3. **Value Verification:** Assessed value vs sale amount comparison
4. **Better UX:** All key data visible without expanding card
5. **Professional Look:** Images make dashboard feel more polished

## Future Enhancements

- Add property condition score (Good/Fair/Poor)
- Show property value trends (appreciation/depreciation)
- Display neighborhood comps
- Add aerial/satellite view option
- Show multiple property photos in gallery
- Add property history timeline
- Display renovation potential score
