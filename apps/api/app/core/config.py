from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ReturnRadar API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"

    database_url: str
    receipt_extractor_provider: Literal["mock", "openai"] = "mock"
    backend_cors_origins: str = (
        "http://localhost:8081,"
        "http://localhost:19006,"
        "http://localhost:3000"
    )
    openai_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()