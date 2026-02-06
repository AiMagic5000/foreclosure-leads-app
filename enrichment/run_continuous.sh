#!/bin/bash
# Run enrichment continuously until all leads are processed
# Each batch does 200 leads with fast mode (skip slow crawls)
# Uses overage_calc + Nominatim only -- ~3s per lead = ~200 leads in ~10 min

cd /opt/enrichment

APIKEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDA2MjM0MCwiZXhwIjo0OTI1NzM1OTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qIVnMdQCymz03PkiJfOFo3NpndVJoEd3fmhSQjuK9fU"
DB_URL="https://foreclosure-db.alwaysencrypted.com"

get_remaining_count() {
    # Get content-range header and extract total count after the /
    local HEADER
    HEADER=$(curl -s -I "${DB_URL}/rest/v1/foreclosure_leads?enriched_at=is.null&select=id" \
      -H "apikey: ${APIKEY}" \
      -H "Authorization: Bearer ${APIKEY}" \
      -H "Prefer: count=exact" \
      -H "Range: 0-0" 2>/dev/null | grep -i "content-range")

    # Extract the number after the last /
    echo "$HEADER" | sed 's/.*\///' | tr -d '[:space:]'
}

BATCH=0
while true; do
    BATCH=$((BATCH + 1))
    echo "=== Starting batch $BATCH at $(date -u) ==="
    docker compose run --rm \
      -e BATCH_SIZE=200 \
      -e SKIP_CRAWL=true \
      -e DELAY_MIN=1 \
      -e DELAY_MAX=1.5 \
      enrichment 2>&1

    COUNT=$(get_remaining_count)
    echo "=== Batch $BATCH complete. Remaining unenriched: $COUNT ==="

    if [ -z "$COUNT" ] || [ "$COUNT" = "0" ] || [ "$COUNT" = "*" ]; then
        echo "=== ALL LEADS ENRICHED at $(date -u) ==="
        break
    fi

    # Brief pause between batches
    sleep 5
done

echo "=== CONTINUOUS ENRICHMENT COMPLETE ==="
echo "Total batches: $BATCH"
echo "Finished at: $(date -u)"
