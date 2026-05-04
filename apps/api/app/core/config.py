from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ReturnRadar API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"

    database_url: str
    receipt_extractor_provider: str = "mock"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()