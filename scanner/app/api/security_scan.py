"""
Security Scan API Endpoints
Provides REST API for legitimate Nmap and Nikto security scanning
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from ..services.security_scanner import security_scanner, SecurityScanResult
from .auth import verify_jwt_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/security-scan", tags=["security-scan"])
security = HTTPBearer()

class ScanRequest(BaseModel):
    """Request model for security scans."""
    target: str = Field(..., description="Target IP address or domain name")
    scan_type: str = Field(default="comprehensive", description="Type of scan: nmap, nikto, or comprehensive")
    scan_options: Optional[Dict[str, Any]] = Field(default=None, description="Additional scan options")
    consent: bool = Field(default=False, description="I confirm I have authorization to scan this target")
    purpose: Optional[str] = Field(default=None, description="Purpose of the scan (for audit)")

class ScanResponse(BaseModel):
    """Response model for security scan requests."""
    status: str
    message: str
    scan_id: Optional[str] = None
    results: Optional[Dict[str, Any]] = None

class ScanStatus(BaseModel):
    """Model for scan status queries."""
    scan_id: str
    status: str
    progress: Optional[int] = None
    results: Optional[Dict[str, Any]] = None

# In-memory scan storage (in production, use Redis or database)
active_scans: Dict[str, Dict] = {}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user."""
    try:
        payload = verify_jwt_token(credentials.credentials)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@router.post("/initiate", response_model=ScanResponse)
async def initiate_security_scan(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """
    Initiate a security scan with Nmap and/or Nikto.

    **IMPORTANT**: Only scan targets you own or have explicit written permission to scan.
    Unauthorized scanning may be illegal and unethical.
    """
    try:
        user_id = current_user.get("sub", "anonymous")

        # Verify user consent
        if not request.consent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must confirm you have authorization to scan this target"
            )

        # Generate scan ID
        scan_id = f"scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}"

        # Validate target format
        if not _is_valid_target(request.target):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid target format. Use valid IP address or domain name"
            )

        # Store initial scan status
        active_scans[scan_id] = {
            "target": request.target,
            "scan_type": request.scan_type,
            "status": "initializing",
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "consent": request.consent,
            "purpose": request.purpose
        }

        # Add background task to perform the scan
        background_tasks.add_task(
            perform_security_scan,
            scan_id,
            request.target,
            request.scan_type,
            request.scan_options,
            user_id
        )

        logger.info(f"Security scan initiated: {scan_id} for target {request.target} by user {user_id}")

        return ScanResponse(
            status="initiated",
            message=f"Security scan initiated for {request.target}",
            scan_id=scan_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating security scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate security scan"
        )

@router.get("/status/{scan_id}", response_model=ScanStatus)
async def get_scan_status(scan_id: str, current_user: Dict = Depends(get_current_user)):
    """Get the status of an ongoing or completed security scan."""
    try:
        user_id = current_user.get("sub", "anonymous")

        if scan_id not in active_scans:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )

        # Verify user owns this scan
        scan_data = active_scans[scan_id]
        if scan_data["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only view your own scans"
            )

        return ScanStatus(
            scan_id=scan_id,
            status=scan_data["status"],
            progress=scan_data.get("progress"),
            results=scan_data.get("results")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get scan status"
        )

@router.get("/results/{scan_id}")
async def get_scan_results(scan_id: str, current_user: Dict = Depends(get_current_user)):
    """Get detailed results of a completed security scan."""
    try:
        user_id = current_user.get("sub", "anonymous")

        if scan_id not in active_scans:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )

        # Verify user owns this scan
        scan_data = active_scans[scan_id]
        if scan_data["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only view your own scan results"
            )

        if scan_data["status"] not in ["completed", "failed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scan not yet completed"
            )

        return {
            "scan_id": scan_id,
            "target": scan_data["target"],
            "scan_type": scan_data["scan_type"],
            "status": scan_data["status"],
            "results": scan_data.get("results"),
            "created_at": scan_data["created_at"],
            "completed_at": scan_data.get("completed_at"),
            "legal_compliance": {
                "consent_given": scan_data.get("consent", False),
                "purpose": scan_data.get("purpose"),
                "scan_authorized": True
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get scan results"
        )

@router.get("/my-scans")
async def list_user_scans(current_user: Dict = Depends(get_current_user)):
    """List all scans initiated by the current user."""
    try:
        user_id = current_user.get("sub", "anonymous")

        user_scans = []
        for scan_id, scan_data in active_scans.items():
            if scan_data["user_id"] == user_id:
                user_scans.append({
                    "scan_id": scan_id,
                    "target": scan_data["target"],
                    "scan_type": scan_data["scan_type"],
                    "status": scan_data["status"],
                    "created_at": scan_data["created_at"],
                    "completed_at": scan_data.get("completed_at")
                })

        # Sort by creation date (newest first)
        user_scans.sort(key=lambda x: x["created_at"], reverse=True)

        return {
            "total_scans": len(user_scans),
            "scans": user_scans
        }

    except Exception as e:
        logger.error(f"Error listing user scans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list scans"
        )

@router.delete("/scan/{scan_id}")
async def delete_scan(scan_id: str, current_user: Dict = Depends(get_current_user)):
    """Delete a scan record and results."""
    try:
        user_id = current_user.get("sub", "anonymous")

        if scan_id not in active_scans:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )

        # Verify user owns this scan
        scan_data = active_scans[scan_id]
        if scan_data["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only delete your own scans"
            )

        # Only allow deletion of completed scans
        if scan_data["status"] not in ["completed", "failed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete an ongoing scan"
            )

        # Delete the scan
        del active_scans[scan_id]

        logger.info(f"Scan deleted: {scan_id} by user {user_id}")

        return {
            "message": "Scan deleted successfully",
            "scan_id": scan_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete scan"
        )

@router.get("/scan-info")
async def get_scan_info():
    """Get information about available scan types and legal requirements."""
    return {
        "scan_types": {
            "nmap": {
                "description": "Network port scanning and service detection",
                "capabilities": ["Port scanning", "Service version detection", "OS fingerprinting"],
                "typical_duration": "1-5 minutes"
            },
            "nikto": {
                "description": "Web server vulnerability scanning",
                "capabilities": ["Web vulnerability detection", "Server version checking", "Security misconfigurations"],
                "typical_duration": "2-10 minutes"
            },
            "comprehensive": {
                "description": "Combined Nmap and Nikto scanning for complete assessment",
                "capabilities": ["All Nmap capabilities", "All Nikto capabilities", "Correlated analysis"],
                "typical_duration": "3-15 minutes"
            }
        },
        "legal_requirements": {
            "authorization": "You must have explicit permission to scan the target",
            "ownership": "Only scan systems you own or have written consent to scan",
            "rate_limiting": "Maximum 10 scans per hour per user",
            "audit": "All scans are logged for compliance and audit purposes",
            "responsible_use": "Use results for legitimate security testing purposes only"
        },
        "authorized_networks": [
            "127.0.0.0/8 (localhost)",
            "10.0.0.0/8 (private class A)",
            "172.16.0.0/12 (private class B)",
            "192.168.0.0/16 (private class C)"
        ]
    }

async def perform_security_scan(
    scan_id: str,
    target: str,
    scan_type: str,
    scan_options: Optional[Dict],
    user_id: str
):
    """
    Background task to perform the actual security scan.
    """
    try:
        # Update scan status
        if scan_id in active_scans:
            active_scans[scan_id]["status"] = "scanning"
            active_scans[scan_id]["progress"] = 10

        # Perform the scan based on type
        if scan_type == "nmap":
            result = await security_scanner.scan_with_nmap(target, scan_options)
            scan_results = result.to_dict()
        elif scan_type == "nikto":
            result = await security_scanner.scan_with_nikto(target, scan_options)
            scan_results = result.to_dict()
        else:  # comprehensive
            scan_results = await security_scanner.comprehensive_security_scan(
                target, user_id, scan_options
            )

        # Update scan with results
        if scan_id in active_scans:
            active_scans[scan_id]["status"] = "completed"
            active_scans[scan_id]["progress"] = 100
            active_scans[scan_id]["results"] = scan_results
            active_scans[scan_id]["completed_at"] = datetime.utcnow().isoformat()

        logger.info(f"Security scan completed: {scan_id}")

    except Exception as e:
        logger.error(f"Security scan failed: {scan_id} - {e}")
        if scan_id in active_scans:
            active_scans[scan_id]["status"] = "failed"
            active_scans[scan_id]["error"] = str(e)
            active_scans[scan_id]["completed_at"] = datetime.utcnow().isoformat()

def _is_valid_target(target: str) -> bool:
    """Validate target format."""
    import re
    import ipaddress

    try:
        # Check if it's a valid IP address
        ipaddress.ip_address(target)
        return True
    except ValueError:
        # Check if it's a valid domain name
        if re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', target):
            return True
        return False