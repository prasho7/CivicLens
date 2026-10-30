"""CivicLens FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.health import router as health_router
from app.api.reports import router as reports_router
from app.api.incidents import router as incidents_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for CivicLens — AI-assisted civic issue intelligence platform.",
)

# CORS configuration for Vite frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(reports_router)
app.include_router(incidents_router)


@app.get("/")
def root():
    """Root endpoint with basic service info and links to documentation."""
    return {
        "message": "Welcome to CivicLens API",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "reports_url": "/api/reports",
        "incidents_url": "/api/incidents",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
