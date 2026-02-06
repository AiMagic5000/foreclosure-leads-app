#!/bin/bash
# Deploy enrichment pipeline to R730
# Run from local machine: bash enrichment/deploy.sh

set -e

SERVER="admin1@10.28.28.95"
DEPLOY_DIR="/opt/enrichment"

echo "=== Deploying Enrichment Pipeline to R730 ==="

# Create directory on server
ssh $SERVER "sudo mkdir -p $DEPLOY_DIR && sudo chown admin1:admin1 $DEPLOY_DIR"

# Copy files
scp enrichment/enrich_leads.py $SERVER:$DEPLOY_DIR/enrich_leads.py
scp enrichment/requirements.txt $SERVER:$DEPLOY_DIR/requirements.txt

# Install dependencies and setup venv
ssh $SERVER "cd $DEPLOY_DIR && python3 -m venv venv && $DEPLOY_DIR/venv/bin/pip install -r requirements.txt"

# Create cron job (every 4 hours)
ssh $SERVER "crontab -l 2>/dev/null | grep -v 'enrich_leads' | { cat; echo '0 */4 * * * cd /opt/enrichment && /opt/enrichment/venv/bin/python /opt/enrichment/enrich_leads.py >> /opt/enrichment/cron.log 2>&1'; } | crontab -"

echo "=== Deployment complete ==="
echo "Enrichment runs every 4 hours via cron"
echo "Logs: $DEPLOY_DIR/enrichment.log and $DEPLOY_DIR/cron.log"
echo "Manual run: ssh $SERVER '$DEPLOY_DIR/venv/bin/python $DEPLOY_DIR/enrich_leads.py'"
