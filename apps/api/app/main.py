from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.responses import JSONResponse

from app.api.routes.health import router as health_router
from app.api.routes.products import router as products_router
from app.api.routes.ai import router as ai_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for ReturnRadar, a mobile AI app for receipt, return, and warranty tracking.",
)

@app.middleware("http")
async def require_demo_access_key(
    request: Request,
    call_next,
):
    demo_access_key = settings.returnradar_demo_access_key

    if not demo_access_key:
        return await call_next(request)

    path = request.url.path

    public_paths = {
        f"{settings.api_prefix}/health",
        "/docs",
        "/openapi.json",
        "/redoc",
    }

    if path in public_paths or path.startswith("/uploads/"):
        return await call_next(request)

    provided_key = request.headers.get("X-ReturnRadar-Demo-Key")

    if provided_key != demo_access_key:
        return JSONResponse(
            status_code=401,
            content={
                "detail": "Valid ReturnRadar demo access key required.",
            },
        )

    return await call_next(request)

uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(products_router, prefix=settings.api_prefix)
app.include_router(ai_router, prefix=settings.api_prefix)