from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/app.db"

    # LLM (defaults target Groq's free tier; override for Ollama locally)
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"
    llm_api_key: str = ""
    llm_timeout_seconds: int = 120

    trends_mcp_api_key: str = ""
    trends_mcp_base_url: str = "https://api.trendsmcp.ai/api"

    cors_origins: str = "http://localhost:3000"
    rate_limit_run_per_hour: int = 10

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
