"""REST endpoints for kicking off and monitoring scans."""
from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter, HTTPException

from ..schemas import ScanProgressResponse, ScanRequest
from ..services import get_scan_job, queue_scan
from . import auth as auth_router


router = APIRouter()

# Include authentication routes
router.include_router(auth_router.router)


def _collect_targets(payload: ScanRequest) -> List[str]:
    targets: List[str] = []
    if payload.ip_addresses:
        targets.extend(payload.ip_addresses)
    if payload.endpoints:
        targets.extend(payload.endpoints)
    return targets


@router.post("/scan", response_model=Dict[str, str])
def start_scan(payload: ScanRequest):
    targets = _collect_targets(payload)
    token = queue_scan(
        targets, ai_enabled=False, gemini_summary_enabled=payload.generate_ai_summary
    )
    return {
        "token": token,
        "status_url": f"/scan/{token}",
        "message": "Scan accepted. Poll the status endpoint for results.",
    }


@router.post("/ai-agent", response_model=Dict[str, str])
def start_ai_agent_scan(payload: ScanRequest):
    targets = _collect_targets(payload)
    token = queue_scan(
        targets, ai_enabled=True, gemini_summary_enabled=payload.generate_ai_summary
    )
    return {
        "token": token,
        "status_url": f"/scan/{token}",
        "message": "AI-powered assessment started. Use the scan status endpoint to check the audit.",
    }


@router.get("/scan/{token}", response_model=ScanProgressResponse)
def get_scan_progress(token: str):
    job = get_scan_job(token)
    if not job:
        raise HTTPException(status_code=404, detail="Token not found.")
    return ScanProgressResponse(**job)
