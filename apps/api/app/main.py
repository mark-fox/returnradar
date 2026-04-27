from fastapi import FastAPI

app = FastAPI(
    title="ReturnRadar API",
    version="0.1.0",
    description="Backend API for ReturnRadar, a mobile AI app for receipt, return, and warranty tracking.",
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}