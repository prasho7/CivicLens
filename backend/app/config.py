"""Application configuration using Pydantic Settings."""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CivicLens API"
    app_version: str = "0.2.0"
    debug: bool = False

    # Allowed CORS origins for the Vite frontend development server
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Supabase PostgreSQL configuration
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    database_url: Optional[str] = None

    # AI / LLM configuration (optional)
    gemini_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    duplicate_threshold: float = 0.60

    @property
    def active_ai_key(self) -> Optional[str]:
        """Return the configured AI API key, if available."""
        key = self.gemini_api_key or self.google_api_key
        if key and not any(p in key for p in ["your-key", "placeholder"]):
            return key
        return None

    @property
    def is_database_configured(self) -> bool:
        """Check whether valid, non-placeholder Supabase credentials are provided."""
        if not self.supabase_url or not self.supabase_key:
            return False
        # Guard against placeholder values
        placeholders = ["your-project", "example.com", "your-supabase"]
        if any(p in self.supabase_url for p in placeholders):
            return False
        if any(p in self.supabase_key for p in placeholders):
            return False
        return True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
