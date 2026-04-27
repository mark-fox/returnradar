from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for ReturnRadar, a mobile AI app for receipt, return, and warranty tracking.",
)

app.include_router(health_router, prefix=settings.api_prefix)