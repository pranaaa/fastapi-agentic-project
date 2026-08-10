from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/app.db"

    # LLM (defaults target Groq's free tier; override for Ollama locally).
    #
    # Free-tier budget math (per Groq):
    #   openai/gpt-oss-120b       200K TPD · 8K TPM  → primary heavy analytical model
    #   llama-3.3-70b-versatile   100K TPD · 12K TPM → alt heavy model with more TPM headroom
    #   llama-3.1-8b-instant      500K TPD · 6K TPM  → light model for short structured tasks
    #
    # We route lightweight agents (clarifier, trend_research, brand_naming) to
    # LLM_MODEL_LIGHT so their small requests don't eat into the heavy model's
    # daily budget. Everything else uses LLM_MODEL.
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "openai/gpt-oss-120b"
    llm_model_light: str = "llama-3.1-8b-instant"
    # Used for the report_writer, which needs to consume 10 prior agent outputs
    # in one call. Llama 3.3 70B gives us 12K TPM (vs gpt-oss-120b's 8K) which
    # fits our slimmed final-report request.
    llm_model_heavy: str = "llama-3.3-70b-versatile"
    llm_api_key: str = ""
    llm_timeout_seconds: int = 180
    # Ceiling per agent output. Kept modest so we fit inside 8K TPM.
    llm_max_tokens: int = 3500
    # Temperature for analytical work — lower keeps outputs grounded.
    llm_temperature: float = 0.4

    trends_mcp_api_key: str = ""
    trends_mcp_base_url: str = "https://api.trendsmcp.ai/api"

    # Tavily free-tier web search (1,000 searches/month) — grounds trend research
    # in real data. Empty = graceful fallback to LLM-only trend estimation.
    tavily_api_key: str = ""

    cors_origins: str = "http://localhost:3000"
    rate_limit_run_per_hour: int = 10

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
