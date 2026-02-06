FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY enrich_leads.py .

# Create log directory
RUN mkdir -p /opt/enrichment

CMD ["python", "enrich_leads.py"]
