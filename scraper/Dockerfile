# Foreclosure Lead Scraper
# Multi-stage build for optimized image

FROM python:3.12-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production image
FROM python:3.12-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    tesseract-ocr \
    poppler-utils \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright browsers
RUN pip install playwright && playwright install chromium && playwright install-deps chromium

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /data/scraper/screenshots /data/scraper/pdfs /data/scraper/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DATA_DIR=/data/scraper
ENV SCREENSHOT_DIR=/data/scraper/screenshots
ENV PDF_DIR=/data/scraper/pdfs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Default command
CMD ["python", "-m", "workers.job_worker"]
