# Foreclosure Leads Dashboard - Property Enrichment Update

## Changes Summary

### Database Schema
- **New Migration:** `database/003-add-property-image.sql`
  - Adds `property_image_url` column to `foreclosure_leads` table
  - Creates index for leads with images

### Frontend Updates

#### 1. Lead Interface (`src/app/dashboard/leads/page.tsx`)
- Added `propertyImageUrl?: string | null` to `LeadData` interface
- Imported Next.js `Image` component for optimized image loading

#### 2. Data Mapping
- Updated `mapDbRowToLead()` to include `property_image_url` from database
- Maps all enrichment columns (APN, bedrooms, bathrooms, sqft, year built, lot size, assessed value)

#### 3. Desktop Lead Card Layout
**Column 1: Image + Checkbox**
- 80x80px property thumbnail
- Falls back to home icon if no image
- Checkbox alongside image

**Column 2: Owner Info**
- Owner name
- APN in blue badge with # icon
- County name

**Column 3: Address & Property Details**
- Property address (bold)
- City, State, ZIP
- **Inline property stats:** bed/bath/sqft with icons
- **Year built + lot size:** "Built 1995 • 0.25 acres lot"
- **Assessed value:** Blue text below

**Columns 4-6:** Sale Info, Street View, Status (unchanged)

#### 4. Mobile Lead Card Layout
- Property image (80x80px) next to checkbox and name
- APN badge if available
- Full address with inline bed/bath/sqft stats
- Year built, lot size, county
- All existing mobile features preserved

### Next.js Configuration

#### Image Domains (`next.config.ts`)
Added support for property image sources:
- `*.zillow.com`
- `*.zillowstatic.com`
- `*.realtor.com`
- `*.trulia.com`
- `*.redfin.com`
- `ssl.cdn-redfin.com`
- `maps.googleapis.com`
- `streetviewpixels-pa.googleapis.com`

## Visual Improvements

### Before
- No property images
- APN shown as plain text
- Property details buried in expanded view
- Minimal visual hierarchy

### After
- Property thumbnail in every lead card
- APN in prominent blue badge
- Key stats (bed/bath/sqft) visible at a glance
- Year built, lot size, assessed value displayed inline
- Professional, real estate portal aesthetic

## Display Features

### Property Image Handling
- **Has Image:** Displays 80x80px thumbnail, object-fit cover
- **No Image:** Shows gray box with home icon placeholder
- **Optimized:** Uses Next.js Image component (lazy loading, responsive)

### Property Details Icons
- **Bed:** BedDouble icon + count
- **Bath:** Bath icon + count
- **Sqft:** Ruler icon + square footage (formatted with commas)

### Data Formatting
- Square footage: `1,850 sf`
- Lot size: `0.25 acres lot` or `10,890 sqft lot`
- Assessed value: `Assessed: $285,000`
- Year built: `Built 1995`

## Backward Compatibility

All changes are backward compatible:
- Missing property images → shows placeholder
- Missing enrichment data → skips display (graceful degradation)
- Existing leads without enrichment → display as before
- No breaking changes to API or data structure

## Performance Considerations

- Next.js Image component provides:
  - Lazy loading (images load as user scrolls)
  - Automatic image optimization
  - Responsive sizing (80px size hint)
  - WebP conversion when supported

## Testing Checklist

- [ ] Run database migration on production Supabase instance
- [ ] Verify property images display correctly
- [ ] Check mobile responsive layout
- [ ] Test fallback for leads without images
- [ ] Verify APN badge displays
- [ ] Confirm property stats show inline
- [ ] Test lead expansion (should not break)
- [ ] Verify all existing features still work

## Database Migration Commands

```bash
# Connect to Supabase/Cognabase instance
psql -h <HOST> -U postgres -d foreclosure_leads

# Run migration
\i database/003-add-property-image.sql

# Verify column added
\d foreclosure_leads
```

## Files Modified

1. `database/003-add-property-image.sql` (new)
2. `src/app/dashboard/leads/page.tsx` (updated)
3. `next.config.ts` (updated)
4. `PROPERTY-ENRICHMENT.md` (new - full documentation)
5. `DASHBOARD-UPDATE-SUMMARY.md` (this file)

## Next Steps

1. Deploy migration to Supabase instance
2. Run enrichment pipeline to populate property images
3. Test dashboard with real enriched data
4. Monitor image loading performance
5. Consider adding image gallery view in expanded details

## Enrichment Pipeline Integration

The dashboard is now ready to display enriched data. The external enrichment pipeline should:

1. Scrape property data from county assessor websites
2. Fetch property images from Zillow/Realtor/Redfin APIs
3. Update `foreclosure_leads` table with:
   - `property_image_url`
   - `apn_number`
   - `bedrooms`, `bathrooms`, `square_footage`
   - `year_built`, `lot_size`, `property_type`
   - `assessed_value`, `tax_amount`
   - `estimated_market_value`
   - `enrichment_source`, `enriched_at`

Dashboard will automatically display all enriched data as it becomes available.
