from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/app.db"

    # LLM defaults target Groq's free tier; override for Ollama or other
    # OpenAI-compatible endpoints via env vars.
    #
    # Groq's live catalog as of Aug 2026 (all Llama/Mixtral models were removed):
    #   openai/gpt-oss-120b      131K ctx · 8K TPM  · 200K TPD  → flagship, current primary
    #   openai/gpt-oss-20b       131K ctx · 8K TPM  · 200K TPD  → smaller/faster
    #   qwen/qwen3.6-27b         131K ctx · 8K TPM  · 200K TPD  → different provider, fresh pool
    #   groq/compound(-mini)     131K ctx                       → Groq proprietary bundled
    #
    # Model routing is disabled in the POC (all agents use LLM_MODEL). The
    # `_light`/`_heavy` keys are kept as env hooks for future re-enabling.
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "openai/gpt-oss-120b"
    llm_model_light: str = "openai/gpt-oss-20b"
    llm_model_heavy: str = "openai/gpt-oss-120b"
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
