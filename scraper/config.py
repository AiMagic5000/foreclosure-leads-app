"""
Scraper Configuration
Central configuration for the foreclosure lead scraping system.
"""

import os
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class DatabaseConfig:
    """PostgreSQL/Supabase connection configuration."""
    host: str = os.getenv("DB_HOST", "foreclosure-db.alwaysencrypted.com")
    port: int = int(os.getenv("DB_PORT", "5432"))
    database: str = os.getenv("DB_NAME", "postgres")
    user: str = os.getenv("DB_USER", "postgres")
    password: str = os.getenv("DB_PASSWORD", "")
    ssl_mode: str = os.getenv("DB_SSL_MODE", "require")

    @property
    def connection_string(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}?sslmode={self.ssl_mode}"

    @property
    def async_connection_string(self) -> str:
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


@dataclass
class RedisConfig:
    """Redis queue configuration."""
    host: str = os.getenv("REDIS_HOST", "localhost")
    port: int = int(os.getenv("REDIS_PORT", "6379"))
    password: Optional[str] = os.getenv("REDIS_PASSWORD")
    db: int = int(os.getenv("REDIS_DB", "0"))

    @property
    def url(self) -> str:
        if self.password:
            return f"redis://:{self.password}@{self.host}:{self.port}/{self.db}"
        return f"redis://{self.host}:{self.port}/{self.db}"


@dataclass
class ScraperConfig:
    """Global scraper settings."""
    # Concurrency
    max_concurrent_jobs: int = int(os.getenv("MAX_CONCURRENT_JOBS", "10"))
    max_concurrent_requests: int = int(os.getenv("MAX_CONCURRENT_REQUESTS", "5"))

    # Rate limiting
    default_rate_limit: int = 10  # requests per minute
    default_delay_between_requests: float = 2.0  # seconds

    # Timeouts
    request_timeout: int = 30
    page_load_timeout: int = 60

    # Retries
    max_retries: int = 3
    retry_delay: int = 60  # seconds

    # Browser settings
    headless: bool = True
    browser_type: str = "chromium"  # chromium, firefox, webkit

    # Data paths
    data_dir: str = os.getenv("DATA_DIR", "/data/scraper")
    screenshot_dir: str = os.getenv("SCREENSHOT_DIR", "/data/scraper/screenshots")
    pdf_dir: str = os.getenv("PDF_DIR", "/data/scraper/pdfs")

    # Worker identification
    worker_id: str = os.getenv("WORKER_ID", f"worker-{os.getpid()}")


@dataclass
class EmailConfig:
    """Email automation configuration."""
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.hostinger.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "465"))
    smtp_user: str = os.getenv("SMTP_USER", "data@foreclosure-leads.com")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    from_email: str = os.getenv("FROM_EMAIL", "data@foreclosure-leads.com")
    from_name: str = os.getenv("FROM_NAME", "Asset Recovery Data Services")
    use_ssl: bool = True


@dataclass
class ProxyConfig:
    """Proxy pool configuration."""
    enabled: bool = os.getenv("PROXY_ENABLED", "false").lower() == "true"
    residential_only: bool = os.getenv("PROXY_RESIDENTIAL_ONLY", "false").lower() == "true"
    rotate_on_error: bool = True
    rotate_after_requests: int = 50


@dataclass
class Config:
    """Master configuration."""
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    redis: RedisConfig = field(default_factory=RedisConfig)
    scraper: ScraperConfig = field(default_factory=ScraperConfig)
    email: EmailConfig = field(default_factory=EmailConfig)
    proxy: ProxyConfig = field(default_factory=ProxyConfig)

    # Feature flags
    enable_skip_tracing: bool = os.getenv("ENABLE_SKIP_TRACING", "true").lower() == "true"
    enable_dnc_checking: bool = os.getenv("ENABLE_DNC_CHECKING", "true").lower() == "true"
    enable_email_automation: bool = os.getenv("ENABLE_EMAIL_AUTOMATION", "true").lower() == "true"

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    sentry_dsn: Optional[str] = os.getenv("SENTRY_DSN")


# Global config instance
config = Config()
