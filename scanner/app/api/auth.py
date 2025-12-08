"""
Authentication API endpoints for scanner system.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import logging

from ..models.auth import auth_db, AuthConfig

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

# Pydantic models for request/response
class LoginRequest(BaseModel):
    password: str

class InitializeRequest(BaseModel):
    password: str

class ResetPasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str

class DemoOverrideRequest(BaseModel):
    newPassword: str

class LoginResponse(BaseModel):
    token: str

class StatusResponse(BaseModel):
    initialized: bool

class InitializeResponse(BaseModel):
    success: bool

class ResetPasswordResponse(BaseModel):
    success: bool

class DemoOverrideResponse(BaseModel):
    success: bool
    message: str

router = APIRouter()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """Verify JWT token from Authorization header"""
    token = credentials.credentials
    return auth_db.verify_token(token, AuthConfig.SECRET_KEY)

def verify_jwt_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    return auth_db.verify_token(token, AuthConfig.SECRET_KEY, return_payload=True)

@router.get("/auth/status", response_model=StatusResponse)
async def get_auth_status():
    """Check if authentication system is initialized"""
    try:
        initialized = auth_db.is_initialized()
        return StatusResponse(initialized=initialized)
    except Exception as e:
        logger.error(f"Error checking auth status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/auth/initialize", response_model=InitializeResponse)
async def initialize_auth(request: InitializeRequest):
    """Initialize admin password (only if not already initialized)"""
    try:
        if auth_db.is_initialized():
            raise HTTPException(status_code=400, detail="Already initialized")
        
        if not request.password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        success = auth_db.set_admin_password(request.password)
        if success:
            return InitializeResponse(success=True)
        else:
            raise HTTPException(status_code=500, detail="Failed to initialize")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing auth: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login with admin password"""
    try:
        if not request.password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        if auth_db.verify_password(request.password):
            token = auth_db.generate_token(AuthConfig.SECRET_KEY)
            return LoginResponse(token=token)
        else:
            raise HTTPException(status_code=401, detail="Invalid password")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest, _: bool = Depends(verify_token)):
    """Reset admin password (requires authentication)"""
    try:
        if not request.oldPassword or not request.newPassword:
            raise HTTPException(status_code=400, detail="Both old and new passwords are required")
        
        # Verify old password
        if not auth_db.verify_password(request.oldPassword):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Set new password
        success = auth_db.set_admin_password(request.newPassword)
        return ResetPasswordResponse(success=success)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/auth/demo-override-password", response_model=DemoOverrideResponse)
async def demo_override_password(request: DemoOverrideRequest):
    """Demo endpoint to override admin password without old password verification"""
    try:
        # Check if development phase is enabled
        if not AuthConfig.DEVELOPMENT_PHASE:
            raise HTTPException(status_code=403, detail="Demo password override is only available during development phase")

        if not request.newPassword:
            raise HTTPException(status_code=400, detail="New password is required")

        if len(request.newPassword) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

        # Override password directly without old password verification
        success = auth_db.set_admin_password(request.newPassword)

        if success:
            return DemoOverrideResponse(
                success=True,
                message="Password successfully overridden for demo purposes"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to override password")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error overriding password: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")