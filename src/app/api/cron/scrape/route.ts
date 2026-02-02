import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { statesData } from "@/data/states"
import type { Database } from "@/types/database"

// This cron job runs daily to scrape new foreclosure leads
// Deployed on Vercel with cron schedule: 0 6 * * * (6 AM daily)

const CRAWL4AI_URL = process.env.CRAWL4AI_URL || "https://crawl4ai.alwaysencrypted.com"

type ScrapeRunInsert = Database["public"]["Tables"]["scrape_runs"]["Insert"]
type ScrapeRunUpdate = Database["public"]["Tables"]["scrape_runs"]["Update"]
type LeadInsert = Database["public"]["Tables"]["foreclosure_leads"]["Insert"]

interface CrawlResult {
  url: string
  success: boolean
  extracted_content?: string
  error_message?: string
}

interface ForeclosureLead {
  property_address: string
  city?: string
  state?: string
  zip_code?: string
  parcel_id?: string
  owner_name: string
  case_number?: string
  sale_date?: string
  sale_amount?: number
  mortgage_amount?: number
  lender_name?: string
  trustee_name?: string
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const startTime = Date.now()
  const results: { state: string; leadsFound: number; errors: string[] }[] = []

  try {
    // Log the start of the scrape run
    const scrapeRunData: ScrapeRunInsert = {
      batch_id: batchId,
      status: "running",
      started_at: new Date().toISOString(),
    }
    await supabaseAdmin.from("scrape_runs").insert(scrapeRunData)

    // Process each state's sources
    for (const state of statesData) {
      const stateResults: ForeclosureLead[] = []
      const errors: string[] = []

      for (const source of state.sources) {
        try {
          // Call Crawl4AI to scrape the source
          const crawlResponse = await fetch(`${CRAWL4AI_URL}/crawl`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              urls: [source.url],
              word_count_threshold: 50,
              extraction_strategy: {
                name: "LLMExtractionStrategy",
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      property_address: { type: "string" },
                      city: { type: "string" },
                      state: { type: "string" },
                      zip_code: { type: "string" },
                      parcel_id: { type: "string" },
                      owner_name: { type: "string" },
                      case_number: { type: "string" },
                      sale_date: { type: "string" },
                      sale_amount: { type: "number" },
                      mortgage_amount: { type: "number" },
                      lender_name: { type: "string" },
                      trustee_name: { type: "string" },
                    },
                    required: ["property_address", "owner_name"],
                  },
                },
                instruction:
                  "Extract all foreclosure property listings. For each property, extract the address, owner name, parcel/APN number, sale date, and any financial amounts mentioned.",
              },
            }),
          })

          if (!crawlResponse.ok) {
            errors.push(`${source.name}: HTTP ${crawlResponse.status}`)
            continue
          }

          const crawlData = await crawlResponse.json()

          // Parse extracted content
          if (crawlData.results && Array.isArray(crawlData.results)) {
            for (const result of crawlData.results as CrawlResult[]) {
              if (result.success && result.extracted_content) {
                try {
                  const parsed =
                    typeof result.extracted_content === "string"
                      ? JSON.parse(result.extracted_content)
                      : result.extracted_content

                  const leads = Array.isArray(parsed) ? parsed : parsed.items || []
                  stateResults.push(...leads)
                } catch (parseError) {
                  errors.push(`${source.name}: Parse error`)
                }
              }
            }
          }

          // Rate limit between requests
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (sourceError) {
          errors.push(
            `${source.name}: ${sourceError instanceof Error ? sourceError.message : "Unknown error"}`
          )
        }
      }

      // Insert leads into database
      const leadsToInsert: LeadInsert[] = stateResults
        .filter((lead) => lead.property_address && lead.owner_name)
        .map((lead) => ({
          id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          property_address: lead.property_address,
          city: lead.city || "",
          state: state.name,
          state_abbr: state.abbr,
          zip_code: lead.zip_code || "",
          parcel_id: lead.parcel_id || "",
          owner_name: lead.owner_name,
          case_number: lead.case_number || "",
          sale_date: lead.sale_date || "",
          sale_amount: lead.sale_amount || null,
          mortgage_amount: lead.mortgage_amount || null,
          lender_name: lead.lender_name || "",
          trustee_name: lead.trustee_name || "",
          foreclosure_type: state.foreclosureType,
          source: state.sources[0]?.name || "",
          source_type: state.sources[0]?.type || "",
          batch_id: batchId,
          status: "new",
        }))

      if (leadsToInsert.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from("foreclosure_leads")
          .upsert(leadsToInsert as LeadInsert[], { onConflict: "id", ignoreDuplicates: true })

        if (insertError) {
          errors.push(`Database insert error: ${insertError.message}`)
        }
      }

      results.push({
        state: state.abbr,
        leadsFound: leadsToInsert.length,
        errors,
      })
    }

    // Update scrape run with results
    const totalLeads = results.reduce((sum, r) => sum + r.leadsFound, 0)
    const statesScraped = results.filter((r) => r.leadsFound > 0).map((r) => r.state)

    const successUpdate: ScrapeRunUpdate = {
      status: "completed",
      states_scraped: statesScraped,
      leads_found: totalLeads,
      completed_at: new Date().toISOString(),
    }
    await supabaseAdmin
      .from("scrape_runs")
      .update(successUpdate)
      .eq("batch_id", batchId)

    return NextResponse.json({
      success: true,
      batchId,
      totalLeads,
      statesProcessed: results.length,
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      results,
    })
  } catch (error) {
    // Log failure
    const failureUpdate: ScrapeRunUpdate = {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
      completed_at: new Date().toISOString(),
    }
    await supabaseAdmin
      .from("scrape_runs")
      .update(failureUpdate)
      .eq("batch_id", batchId)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes max for cron job
