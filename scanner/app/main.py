"""
FastAPI application that offers asynchronous-style IP intelligence scans.

Usage:
    uvicorn app.main:app --reload
"""
import logging
import os

from dotenv import load_dotenv

# Load .env before importing modules that pull credentials at import time.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router as scan_router

logger = logging.getLogger("app.main")
logging.basicConfig(level=logging.INFO)


def _log_api_config_readiness() -> None:
    """Quick debug to verify critical API env vars are readable."""
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    gemini_model = os.getenv("GEMINI_MODEL", "")
    # Mask the key except last 4 chars to avoid leaking secrets.
    masked_key = f"{'*' * max(len(gemini_key) - 4, 0)}{gemini_key[-4:]}" if gemini_key else "(missing)"
    logger.info(
        "Startup config: GEMINI_API_KEY=%s GEMINI_MODEL=%s",
        masked_key,
        gemini_model or "(default gemini-pro)",
    )


_log_api_config_readiness()


app = FastAPI(
    title="IP Intelligence Scanner",
    description=(
        "Submit one or more IP addresses or endpoints to collect metadata, "
        "accessibility information, and a lightweight risk assessment. "
        "Use the returned token to poll scan progress."
    ),
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan_router)
