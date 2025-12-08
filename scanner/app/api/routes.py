"""REST endpoints for kicking off and monitoring scans."""
from __future__ import annotations

from typing import Dict, List
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException

from ..schemas import ScanProgressResponse, ScanRequest
from ..services import get_scan_job, queue_scan
from . import auth as auth_router


router = APIRouter()

# Include authentication routes
router.include_router(auth_router.router)

# Pydantic models for targets
class IPAddress(BaseModel):
    id: str
    address: str
    description: str | None = None
    created_at: str
    updated_at: str

class Endpoint(BaseModel):
    id: str
    url: str
    description: str | None = None
    created_at: str
    updated_at: str

class TargetsResponse(BaseModel):
    ip_addresses: List[IPAddress]
    endpoints: List[Endpoint]


# In-memory storage for targets (in production, use a database)
TARGETS_STORE = {
    "ip_addresses": [],
    "endpoints": []
}


def _collect_targets(payload: ScanRequest) -> List[str]:
    targets: List[str] = []
    if payload.ip_addresses:
        targets.extend(payload.ip_addresses)
    if payload.endpoints:
        targets.extend(payload.endpoints)
    return targets


@router.get("/public/targets", response_model=TargetsResponse)
def get_public_targets():
    """Public endpoint to fetch all targets for guest viewing."""
    return TargetsResponse(**TARGETS_STORE)


@router.get("/public/targets/summary")
def get_targets_summary():
    """Get a summary of all configured targets."""
    ip_count = len(TARGETS_STORE["ip_addresses"])
    endpoint_count = len(TARGETS_STORE["endpoints"])
    total_count = ip_count + endpoint_count

    return {
        "total_targets": total_count,
        "ip_addresses": ip_count,
        "endpoints": endpoint_count,
        "targets": [
            *[{"type": "ip", "value": ip.address, "description": ip.description}
              for ip in TARGETS_STORE["ip_addresses"]],
            *[{"type": "endpoint", "value": ep.url, "description": ep.description}
              for ep in TARGETS_STORE["endpoints"]]
        ]
    }


@router.post("/targets/ip-addresses", response_model=IPAddress)
def add_ip_address(payload: dict):
    """Add an IP address to the target list (admin only)."""
    # Note: In production, add authentication check here
    ip_data = IPAddress(
        id=payload.get("id", str(hash(payload["address"]))),
        address=payload["address"],
        description=payload.get("description"),
        created_at=payload.get("created_at", ""),
        updated_at=payload.get("updated_at", "")
    )

    # Check if IP already exists
    for i, existing_ip in enumerate(TARGETS_STORE["ip_addresses"]):
        if existing_ip.address == ip_data.address:
            TARGETS_STORE["ip_addresses"][i] = ip_data
            return ip_data

    TARGETS_STORE["ip_addresses"].append(ip_data)
    return ip_data


@router.delete("/targets/ip-addresses/{ip_id}")
def delete_ip_address(ip_id: str):
    """Delete an IP address from the target list (admin only)."""
    # Note: In production, add authentication check here
    TARGETS_STORE["ip_addresses"] = [
        ip for ip in TARGETS_STORE["ip_addresses"]
        if ip.id != ip_id
    ]
    return {"success": True}


@router.post("/targets/endpoints", response_model=Endpoint)
def add_endpoint(payload: dict):
    """Add an endpoint to the target list (admin only)."""
    # Note: In production, add authentication check here
    endpoint_data = Endpoint(
        id=payload.get("id", str(hash(payload["url"]))),
        url=payload["url"],
        description=payload.get("description"),
        created_at=payload.get("created_at", ""),
        updated_at=payload.get("updated_at", "")
    )

    # Check if endpoint already exists
    for i, existing_ep in enumerate(TARGETS_STORE["endpoints"]):
        if existing_ep.url == endpoint_data.url:
            TARGETS_STORE["endpoints"][i] = endpoint_data
            return endpoint_data

    TARGETS_STORE["endpoints"].append(endpoint_data)
    return endpoint_data


@router.delete("/targets/endpoints/{endpoint_id}")
def delete_endpoint(endpoint_id: str):
    """Delete an endpoint from the target list (admin only)."""
    # Note: In production, add authentication check here
    TARGETS_STORE["endpoints"] = [
        ep for ep in TARGETS_STORE["endpoints"]
        if ep.id != endpoint_id
    ]
    return {"success": True}


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
